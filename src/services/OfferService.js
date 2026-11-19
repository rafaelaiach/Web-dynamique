// Offers (sale listings) and rental applications (rent listings).
// Accepting one is a single transaction: accept it, reject every other pending one,
// move the property to Under Offer and write the status history.

import { getDb } from '../db/database';
import { applyStatusChange } from './ListingLifecycle';

// Both tables have the same shape for decisions, so one helper handles both.
const TABLES = { offer: 'offers', application: 'rental_applications' };

async function getPropertyOrThrow(db, propertyId) {
  const p = await db.getFirstAsync('SELECT id, status, listing_type, seller_id, agent_id FROM properties WHERE id = ?', propertyId);
  if (!p) throw new Error('Property not found');
  return p;
}

/** Only the owner (seller) or the managing agent can decide on offers. */
function assertCanDecide(property, user) {
  const ok = (user.role === 'seller' && property.seller_id === user.id)
    || (user.role === 'agent' && property.agent_id === user.id);
  if (!ok) throw new Error('Only the seller or the managing agent can do this');
}

// ---------------------------------------------------------------
// Buyer side (used by the buyer screens)
// ---------------------------------------------------------------

/** A buyer can make several offers, but only on an Active sale listing. */
export async function makeOffer(buyerId, propertyId, amount, message = '') {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) throw new Error('Enter an offer amount above £0');
  const db = await getDb();
  const p = await getPropertyOrThrow(db, propertyId);
  if (p.listing_type !== 'sale') throw new Error('Offers are only for properties for sale');
  if (p.status !== 'active') throw new Error('This property is not accepting offers');
  const r = await db.runAsync('INSERT INTO offers (property_id, buyer_id, amount, message) VALUES (?, ?, ?, ?)',
    propertyId, buyerId, value, message.trim() || null);
  return r.lastInsertRowId;
}

/** moveInDate must be YYYY-MM-DD. Notes are optional. */
export async function applyToRent(buyerId, propertyId, moveInDate, notes = '') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(moveInDate || '') || Number.isNaN(Date.parse(moveInDate))) {
    throw new Error('Move-in date must be in the format YYYY-MM-DD');
  }
  const db = await getDb();
  const p = await getPropertyOrThrow(db, propertyId);
  if (p.listing_type !== 'rent') throw new Error('Applications are only for properties to rent');
  if (p.status !== 'active') throw new Error('This property is not accepting applications');
  const r = await db.runAsync('INSERT INTO rental_applications (property_id, buyer_id, move_in_date, notes) VALUES (?, ?, ?, ?)',
    propertyId, buyerId, moveInDate, notes.trim() || null);
  return r.lastInsertRowId;
}

// ---------------------------------------------------------------
// Seller / agent side
// ---------------------------------------------------------------

/** Offers or applications for one property, newest first, with the buyer's name. */
export async function getDecisionsForProperty(propertyId) {
  const db = await getDb();
  const p = await getPropertyOrThrow(db, propertyId);
  if (p.listing_type === 'sale') {
    const rows = await db.getAllAsync(
      `SELECT o.*, u.full_name AS buyer_name, u.email AS buyer_email FROM offers o
       JOIN users u ON u.id = o.buyer_id WHERE o.property_id = ? ORDER BY o.status = 'pending' DESC, o.id DESC`, propertyId);
    return { kind: 'offer', items: rows };
  }
  const rows = await db.getAllAsync(
    `SELECT a.*, u.full_name AS buyer_name, u.email AS buyer_email FROM rental_applications a
     JOIN users u ON u.id = a.buyer_id WHERE a.property_id = ? ORDER BY a.status = 'pending' DESC, a.id DESC`, propertyId);
  return { kind: 'application', items: rows };
}

async function accept(kind, id, user) {
  const table = TABLES[kind];
  const db = await getDb();
  const row = await db.getFirstAsync(`SELECT * FROM ${table} WHERE id = ?`, id);
  if (!row) throw new Error('Not found');
  if (row.status !== 'pending') throw new Error('Only pending items can be accepted');
  const p = await getPropertyOrThrow(db, row.property_id);
  assertCanDecide(p, user);
  if (p.status !== 'active') throw new Error('The property must be Active to accept');

  await db.withTransactionAsync(async () => {
    await db.runAsync(`UPDATE ${table} SET status = 'accepted', decided_by = ?, decided_at = datetime('now') WHERE id = ?`, user.id, id);
    await db.runAsync(
      `UPDATE ${table} SET status = 'rejected', decided_by = ?, decided_at = datetime('now')
       WHERE property_id = ? AND status = 'pending' AND id <> ?`, user.id, row.property_id, id);
    await applyStatusChange(db, row.property_id, 'under_offer', user.id,
      kind === 'offer' ? `Offer of £${Math.round(row.amount).toLocaleString('en-GB')} accepted` : 'Rental application accepted');
  });
}

async function reject(kind, id, user) {
  const table = TABLES[kind];
  const db = await getDb();
  const row = await db.getFirstAsync(`SELECT * FROM ${table} WHERE id = ?`, id);
  if (!row) throw new Error('Not found');
  if (row.status !== 'pending') throw new Error('Only pending items can be rejected');
  assertCanDecide(await getPropertyOrThrow(db, row.property_id), user);
  await db.runAsync(`UPDATE ${table} SET status = 'rejected', decided_by = ?, decided_at = datetime('now') WHERE id = ?`, user.id, id);
}

export const acceptOffer = (id, user) => accept('offer', id, user);
export const rejectOffer = (id, user) => reject('offer', id, user);
export const acceptApplication = (id, user) => accept('application', id, user);
export const rejectApplication = (id, user) => reject('application', id, user);

/** Under Offer -> Sold (sale) or Rented (rent). */
export async function completeDeal(propertyId, user) {
  const db = await getDb();
  const p = await getPropertyOrThrow(db, propertyId);
  assertCanDecide(p, user);
  const to = p.listing_type === 'sale' ? 'sold' : 'rented';
  await db.withTransactionAsync(async () => {
    await applyStatusChange(db, propertyId, to, user.id, to === 'sold' ? 'Sale completed' : 'Tenancy agreed');
  });
  return to;
}

/** The deal fell through: the accepted offer is withdrawn and the listing goes back to Active. */
export async function cancelDeal(propertyId, user) {
  const db = await getDb();
  const p = await getPropertyOrThrow(db, propertyId);
  assertCanDecide(p, user);
  const table = p.listing_type === 'sale' ? 'offers' : 'rental_applications';
  await db.withTransactionAsync(async () => {
    await db.runAsync(`UPDATE ${table} SET status = 'withdrawn', decided_by = ?, decided_at = datetime('now')
                       WHERE property_id = ? AND status = 'accepted'`, user.id, propertyId);
    await applyStatusChange(db, propertyId, 'active', user.id, 'Deal fell through, back on the market');
  });
}

/** Buyer withdraws one of their own pending offers or applications. */
export async function withdraw(kind, id, buyer) {
  const table = TABLES[kind];
  const db = await getDb();
  const row = await db.getFirstAsync(`SELECT * FROM ${table} WHERE id = ?`, id);
  if (!row || row.buyer_id !== buyer.id) throw new Error('Not found');
  if (row.status !== 'pending') throw new Error('Only pending items can be withdrawn');
  await db.runAsync(`UPDATE ${table} SET status = 'withdrawn', decided_at = datetime('now') WHERE id = ?`, id);
}

/** Everything a buyer has sent, for the My activity screen. */
export async function getBuyerActivity(buyerId) {
  const db = await getDb();
  const [offers, applications] = await Promise.all([
    db.getAllAsync(`SELECT o.*, p.title, p.status AS property_status FROM offers o
                    JOIN properties p ON p.id = o.property_id WHERE o.buyer_id = ? ORDER BY o.id DESC`, buyerId),
    db.getAllAsync(`SELECT a.*, p.title, p.status AS property_status FROM rental_applications a
                    JOIN properties p ON p.id = a.property_id WHERE a.buyer_id = ? ORDER BY a.id DESC`, buyerId),
  ]);
  return { offers, applications };
}

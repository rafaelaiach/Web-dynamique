// Buyer questions about a property, answered by the seller or the managing agent.

import { getDb } from '../db/database';

const SELECT = `
  SELECT e.*, p.title AS property_title, b.full_name AS buyer_name, r.full_name AS replied_by_name
  FROM enquiries e
  JOIN properties p ON p.id = e.property_id
  JOIN users b ON b.id = e.buyer_id
  LEFT JOIN users r ON r.id = e.replied_by`;

export async function sendEnquiry(buyer, propertyId, message) {
  if (buyer.role !== 'buyer') throw new Error('Only buyers can send questions');
  const text = (message || '').trim();
  if (text.length < 5) throw new Error('Write at least 5 characters');
  const db = await getDb();
  const p = await db.getFirstAsync('SELECT status FROM properties WHERE id = ?', propertyId);
  if (!p || p.status === 'draft') throw new Error('This property is not published');
  const r = await db.runAsync('INSERT INTO enquiries (property_id, buyer_id, message) VALUES (?, ?, ?)', propertyId, buyer.id, text);
  return r.lastInsertRowId;
}

export async function getEnquiriesForBuyer(buyerId) {
  const db = await getDb();
  return db.getAllAsync(`${SELECT} WHERE e.buyer_id = ? ORDER BY e.id DESC`, buyerId);
}

/** Questions on properties the user owns (seller) or manages (agent). Open ones first. */
export async function getEnquiriesForStaff(user) {
  const db = await getDb();
  return db.getAllAsync(
    `${SELECT} WHERE (p.seller_id = ? OR p.agent_id = ?)
     ORDER BY e.status = 'open' DESC, e.id DESC`, user.id, user.id);
}

async function getForStaff(db, id, user) {
  const e = await db.getFirstAsync(
    'SELECT e.*, p.seller_id, p.agent_id FROM enquiries e JOIN properties p ON p.id = e.property_id WHERE e.id = ?', id);
  if (!e) throw new Error('Question not found');
  if (e.seller_id !== user.id && e.agent_id !== user.id) throw new Error('Only the seller or the managing agent can answer');
  return e;
}

export async function replyEnquiry(id, user, reply) {
  const text = (reply || '').trim();
  if (text.length < 2) throw new Error('Write a reply first');
  const db = await getDb();
  const e = await getForStaff(db, id, user);
  if (e.status === 'closed') throw new Error('This question is closed');
  await db.runAsync(
    "UPDATE enquiries SET reply = ?, replied_by = ?, replied_at = datetime('now'), status = 'answered' WHERE id = ?",
    text, user.id, id);
}

export async function closeEnquiry(id, user) {
  const db = await getDb();
  await getForStaff(db, id, user);
  await db.runAsync("UPDATE enquiries SET status = 'closed' WHERE id = ?", id);
}

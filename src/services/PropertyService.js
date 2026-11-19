// Reading properties for the three roles, plus create / edit / delete for sellers (Week 3).

import { getDb } from '../db/database';
import { canDelete, isFieldLocked, LOCKED_FIELDS } from './ListingLifecycle';
import { PROPERTY_TYPES } from '../theme';

const BASE_SELECT = `
  SELECT p.*,
         (SELECT uri FROM property_images i WHERE i.property_id = p.id ORDER BY sort_order LIMIT 1) AS image,
         -- pending offers (sale) or pending rental applications (rent)
         CASE WHEN p.listing_type = 'sale'
              THEN (SELECT COUNT(*) FROM offers o WHERE o.property_id = p.id AND o.status = 'pending')
              ELSE (SELECT COUNT(*) FROM rental_applications r WHERE r.property_id = p.id AND r.status = 'pending')
         END AS pending_offers,
         s.full_name AS seller_name,
         a.full_name AS agent_name
  FROM properties p
  JOIN users s ON s.id = p.seller_id
  LEFT JOIN users a ON a.id = p.agent_id`;

/**
 * Buyer search. Only Active and Under Offer listings are visible.
 * filters: { listingType: 'sale'|'rent'|null, minPrice, maxPrice, city, propertyType }
 */
export async function searchProperties(filters = {}) {
  const where = ["p.status IN ('active','under_offer')"];
  const params = [];
  if (filters.listingType) { where.push('p.listing_type = ?'); params.push(filters.listingType); }
  if (filters.minPrice != null && filters.minPrice !== '') { where.push('p.price >= ?'); params.push(Number(filters.minPrice)); }
  if (filters.maxPrice != null && filters.maxPrice !== '') { where.push('p.price <= ?'); params.push(Number(filters.maxPrice)); }
  if (filters.city && filters.city.trim()) {
    where.push('(p.city LIKE ? OR p.postcode LIKE ?)');
    const q = `%${filters.city.trim()}%`;
    params.push(q, q);
  }
  if (filters.propertyType) { where.push('p.property_type = ?'); params.push(filters.propertyType); }
  const db = await getDb();
  return db.getAllAsync(`${BASE_SELECT} WHERE ${where.join(' AND ')} ORDER BY p.status = 'under_offer', p.created_at DESC`, ...params);
}

export async function getPropertiesForSeller(sellerId) {
  const db = await getDb();
  return db.getAllAsync(`${BASE_SELECT} WHERE p.seller_id = ? ORDER BY p.updated_at DESC`, sellerId);
}

export async function getPropertiesForAgent(agentId) {
  const db = await getDb();
  return db.getAllAsync(`${BASE_SELECT} WHERE p.agent_id = ? ORDER BY p.updated_at DESC`, agentId);
}

export async function getPropertyById(id) {
  const db = await getDb();
  const property = await db.getFirstAsync(`${BASE_SELECT} WHERE p.id = ?`, id);
  if (!property) return null;
  property.history = await db.getAllAsync(
    `SELECT h.*, u.full_name AS changed_by_name FROM status_history h
     JOIN users u ON u.id = h.changed_by WHERE h.property_id = ? ORDER BY h.id`, id
  );
  return property;
}

export async function isFavourite(userId, propertyId) {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT 1 AS yes FROM favourites WHERE user_id = ? AND property_id = ?', userId, propertyId);
  return !!row;
}

/** Adds or removes a favourite. Returns the new state (true = saved). */
export async function toggleFavourite(userId, propertyId) {
  const db = await getDb();
  if (await isFavourite(userId, propertyId)) {
    await db.runAsync('DELETE FROM favourites WHERE user_id = ? AND property_id = ?', userId, propertyId);
    return false;
  }
  await db.runAsync('INSERT INTO favourites (user_id, property_id) VALUES (?, ?)', userId, propertyId);
  return true;
}

// ---------------------------------------------------------------
// Seller: create / edit / delete (Week 3)
// ---------------------------------------------------------------

const EDITABLE_FIELDS = ['title', 'description', 'price', 'listing_type', 'property_type',
  'address_line', 'city', 'postcode', 'bedrooms', 'bathrooms'];

/** Returns { field: message } for every problem. Empty object = valid. */
export function validateListing(v) {
  const e = {};
  if (!v.title || v.title.trim().length < 3) e.title = 'Title must be at least 3 characters';
  const price = Number(v.price);
  if (v.price === '' || v.price == null || !Number.isFinite(price) || price <= 0) e.price = 'Enter a price above 0';
  if (!['sale', 'rent'].includes(v.listing_type)) e.listing_type = 'Choose For sale or To rent';
  if (!PROPERTY_TYPES.includes(v.property_type)) e.property_type = 'Choose a property type';
  if (!v.address_line || !v.address_line.trim()) e.address_line = 'Address is required';
  if (!v.city || !v.city.trim()) e.city = 'City is required';
  if (!v.postcode || !/^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/.test(v.postcode.trim())) e.postcode = 'Enter a UK postcode, e.g. E1 6AN';
  for (const f of ['bedrooms', 'bathrooms']) {
    const n = Number(v[f]);
    if (v[f] === '' || v[f] == null || !Number.isInteger(n) || n < 0 || n > 20) e[f] = 'Enter a whole number from 0 to 20';
  }
  return e;
}

function clean(v) {
  return {
    title: v.title.trim(),
    description: (v.description || '').trim(),
    price: Number(v.price),
    listing_type: v.listing_type,
    property_type: v.property_type,
    address_line: v.address_line.trim(),
    city: v.city.trim(),
    postcode: v.postcode.trim().toUpperCase(),
    bedrooms: Number(v.bedrooms),
    bathrooms: Number(v.bathrooms),
  };
}

async function getOwnedProperty(db, propertyId, user) {
  const p = await db.getFirstAsync('SELECT * FROM properties WHERE id = ?', propertyId);
  if (!p) throw new Error('Property not found');
  if (!(p.seller_id === user.id || (user.role === 'agent' && p.agent_id === user.id))) {
    throw new Error('You can only change your own listings');
  }
  return p;
}

/** New listings always start as Draft, with a history row and a placeholder image. */
export async function createListing(seller, values) {
  if (seller.role !== 'seller') throw new Error('Only sellers can create listings');
  const errors = validateListing(values);
  if (Object.keys(errors).length) throw Object.assign(new Error('Please fix the highlighted fields'), { errors });
  const v = clean(values);
  const db = await getDb();
  let id;
  await db.withTransactionAsync(async () => {
    const r = await db.runAsync(
      `INSERT INTO properties (seller_id, title, description, price, listing_type, property_type,
         address_line, city, postcode, bedrooms, bathrooms, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
      seller.id, v.title, v.description, v.price, v.listing_type, v.property_type,
      v.address_line, v.city, v.postcode, v.bedrooms, v.bathrooms
    );
    id = r.lastInsertRowId;
    // Images can be mocked (brief): no real upload, the card shows the "No image" frame.
    await db.runAsync('INSERT INTO property_images (property_id, uri, sort_order) VALUES (?, ?, 0)', id, 'placeholder');
    await db.runAsync(
      "INSERT INTO status_history (property_id, from_status, to_status, changed_by, note) VALUES (?, NULL, 'draft', ?, 'Listing created')",
      id, seller.id
    );
  });
  return id;
}

/**
 * Saves the changed fields. Locked fields (price, type, location) are refused
 * once the property is Under Offer; the database trigger blocks them too.
 */
export async function updateListing(user, propertyId, values) {
  const db = await getDb();
  const p = await getOwnedProperty(db, propertyId, user);
  const errors = validateListing({ ...p, price: String(p.price), ...values });
  if (Object.keys(errors).length) throw Object.assign(new Error('Please fix the highlighted fields'), { errors });
  const v = clean({ ...p, ...values });
  const changed = EDITABLE_FIELDS.filter((f) => v[f] !== p[f]);
  const locked = changed.filter((f) => isFieldLocked(p.status, f));
  if (locked.length) throw new Error(`These fields are locked once under offer: ${locked.join(', ')}`);
  if (!changed.length) return false;
  await db.runAsync(
    `UPDATE properties SET ${changed.map((f) => `${f} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`,
    ...changed.map((f) => v[f]), propertyId
  );
  return true;
}

/** Only Draft and Active listings can be deleted. */
export async function deleteListing(user, propertyId) {
  const db = await getDb();
  const p = await getOwnedProperty(db, propertyId, user);
  if (!canDelete(p.status)) throw new Error('Listings under offer, sold or rented cannot be deleted');
  await db.runAsync('DELETE FROM properties WHERE id = ?', propertyId);
}

export { LOCKED_FIELDS };

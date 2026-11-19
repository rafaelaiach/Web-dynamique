// Reading properties for the three roles. Week 3 adds create / edit / delete.

import { getDb } from '../db/database';

const BASE_SELECT = `
  SELECT p.*,
         (SELECT uri FROM property_images i WHERE i.property_id = p.id ORDER BY sort_order LIMIT 1) AS image,
         (SELECT COUNT(*) FROM offers o WHERE o.property_id = p.id AND o.status = 'pending') AS pending_offers,
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

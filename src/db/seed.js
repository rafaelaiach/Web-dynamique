// Demo data, inserted only the first time the app runs (when the users table is empty).
// Demo logins (password for all: password123):
//   buyer@cityestate.com   seller@cityestate.com   agent@cityestate.com

import { hashPassword } from '../services/AuthService';

export const DEMO_PASSWORD = 'password123';

const USERS = [
  { name: 'Amira Khan', email: 'buyer@cityestate.com', role: 'buyer', phone: '07700 900111' },
  { name: 'Rob Ahmed', email: 'seller@cityestate.com', role: 'seller', phone: '07700 900222' },
  { name: 'Jaya Patel', email: 'agent@cityestate.com', role: 'agent', phone: '07700 900333' },
  { name: 'Lena Moore', email: 'lena@cityestate.com', role: 'seller', phone: '07700 900444' },
];

// seller / agent refer to the emails above
const PROPERTIES = [
  { title: 'Jackson Avenue', description: 'Bright three-bedroom family house with a south-facing garden and off-street parking.',
    price: 450000, listing_type: 'sale', property_type: 'house', address_line: '14 Jackson Avenue', city: 'London', postcode: 'E1 6AN',
    bedrooms: 3, bathrooms: 2, status: 'active', seller: 'seller@cityestate.com', agent: 'agent@cityestate.com', image: 'house1' },
  { title: 'Riverside Flat', description: 'Modern one-bedroom flat overlooking the river, five minutes from the station.',
    price: 1150, listing_type: 'rent', property_type: 'flat', address_line: '3 Wharf Street, Apt 12', city: 'Leeds', postcode: 'LS1 4BR',
    bedrooms: 1, bathrooms: 1, status: 'active', seller: 'lena@cityestate.com', agent: 'agent@cityestate.com', image: 'flat1' },
  { title: 'Elm Road', description: 'Semi-detached house close to schools, recently renovated kitchen.',
    price: 315000, listing_type: 'sale', property_type: 'house', address_line: '82 Elm Road', city: 'Bristol', postcode: 'BS6 5AA',
    bedrooms: 3, bathrooms: 1, status: 'active', seller: 'seller@cityestate.com', agent: 'agent@cityestate.com', image: 'house2' },
  { title: 'Oak Lane Studio', description: 'Compact studio in the city centre, ideal first purchase.',
    price: 210000, listing_type: 'sale', property_type: 'studio', address_line: '7 Oak Lane', city: 'Manchester', postcode: 'M1 2HF',
    bedrooms: 0, bathrooms: 1, status: 'under_offer', seller: 'lena@cityestate.com', agent: null, image: 'studio1' },
  { title: 'Meadow Bungalow', description: 'Single-storey bungalow with a large garden on a quiet street.',
    price: 1450, listing_type: 'rent', property_type: 'bungalow', address_line: '21 Meadow Close', city: 'Leeds', postcode: 'LS8 2QT',
    bedrooms: 2, bathrooms: 1, status: 'active', seller: 'seller@cityestate.com', agent: null, image: 'bungalow1' },
  { title: 'Mill Cottage', description: 'Two-bedroom flat in a converted mill. Listing still being prepared.',
    price: 275000, listing_type: 'sale', property_type: 'flat', address_line: '2 Mill Yard', city: 'London', postcode: 'SE1 9PX',
    bedrooms: 2, bathrooms: 1, status: 'draft', seller: 'seller@cityestate.com', agent: 'agent@cityestate.com', image: 'flat2' },
];

export async function seedDatabase(db) {
  const existing = await db.getFirstAsync('SELECT COUNT(*) AS n FROM users');
  if (existing && existing.n > 0) return false;

  await db.withTransactionAsync(async () => {
    const ids = {};
    for (const u of USERS) {
      const hash = await hashPassword(u.email, DEMO_PASSWORD);
      const r = await db.runAsync(
        'INSERT INTO users (full_name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
        u.name, u.email, hash, u.role, u.phone
      );
      ids[u.email] = r.lastInsertRowId;
    }

    for (const p of PROPERTIES) {
      // Every listing starts as a draft, then moves through the allowed statuses.
      const r = await db.runAsync(
        `INSERT INTO properties (seller_id, agent_id, title, description, price, listing_type, property_type,
           address_line, city, postcode, bedrooms, bathrooms, status, is_approved)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)`,
        ids[p.seller], p.agent ? ids[p.agent] : null, p.title, p.description, p.price, p.listing_type,
        p.property_type, p.address_line, p.city, p.postcode, p.bedrooms, p.bathrooms, p.status === 'draft' ? 0 : 1
      );
      const pid = r.lastInsertRowId;
      await db.runAsync('INSERT INTO property_images (property_id, uri, sort_order) VALUES (?, ?, 0)', pid, p.image);
      await db.runAsync(
        "INSERT INTO status_history (property_id, from_status, to_status, changed_by, note) VALUES (?, NULL, 'draft', ?, 'Listing created')",
        pid, ids[p.seller]
      );

      const path = { draft: [], active: ['active'], under_offer: ['active', 'under_offer'] }[p.status];
      let from = 'draft';
      for (const to of path) {
        await db.runAsync("UPDATE properties SET status = ?, updated_at = datetime('now') WHERE id = ?", to, pid);
        await db.runAsync(
          'INSERT INTO status_history (property_id, from_status, to_status, changed_by) VALUES (?, ?, ?, ?)',
          pid, from, to, p.agent ? ids[p.agent] : ids[p.seller]
        );
        from = to;
      }
      p.id = pid;
    }

    // A few offers so the agent statistics are not empty.
    const buyer = ids['buyer@cityestate.com'];
    const byTitle = Object.fromEntries(PROPERTIES.map((p) => [p.title, p.id]));
    await db.runAsync('INSERT INTO offers (property_id, buyer_id, amount, message) VALUES (?, ?, ?, ?)',
      byTitle['Jackson Avenue'], buyer, 440000, 'Chain-free buyer, can move quickly.');
    await db.runAsync('INSERT INTO offers (property_id, buyer_id, amount) VALUES (?, ?, ?)',
      byTitle['Elm Road'], buyer, 300000);
    await db.runAsync(
      "INSERT INTO offers (property_id, buyer_id, amount, status, decided_at) VALUES (?, ?, ?, 'accepted', datetime('now'))",
      byTitle['Oak Lane Studio'], buyer, 205000
    );
    await db.runAsync('INSERT INTO favourites (user_id, property_id) VALUES (?, ?)', buyer, byTitle['Riverside Flat']);
  });
  return true;
}

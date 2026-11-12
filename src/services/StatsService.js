// The three agent statistics required by the brief, read from database views.

import { getDb } from '../db/database';

export async function getAgentStats() {
  const db = await getDb();
  const [activePerUser, averagePrice, offerCounts, pendingReview] = await Promise.all([
    db.getAllAsync('SELECT * FROM v_active_listings_per_user ORDER BY active_listings DESC, full_name'),
    db.getAllAsync('SELECT * FROM v_average_price ORDER BY listing_type'),
    db.getAllAsync('SELECT * FROM v_offer_counts ORDER BY total_offers DESC, title'),
    db.getFirstAsync("SELECT COUNT(*) AS n FROM properties WHERE status = 'draft'"),
  ]);
  const totalActive = activePerUser
    .filter((u) => u.role === 'seller')
    .reduce((sum, u) => sum + u.active_listings, 0);
  return { activePerUser, averagePrice, offerCounts, totalActive, awaitingReview: pendingReview.n };
}

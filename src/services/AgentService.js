// Agent: review draft listings (approve and publish, or send back to the seller)
// and change the status of the properties they manage.

import { getDb } from '../db/database';
import { applyStatusChange } from './ListingLifecycle';

function assertAgent(user) {
  if (user.role !== 'agent') throw new Error('Only agents can do this');
}

/** Drafts the agent manages, plus drafts with no agent yet. */
export async function getDraftsForReview(agent) {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT p.*, s.full_name AS seller_name,
            (SELECT uri FROM property_images i WHERE i.property_id = p.id ORDER BY sort_order LIMIT 1) AS image,
            (SELECT note FROM status_history h WHERE h.property_id = p.id ORDER BY h.id DESC LIMIT 1) AS last_note
     FROM properties p JOIN users s ON s.id = p.seller_id
     WHERE p.status = 'draft' AND (p.agent_id = ? OR p.agent_id IS NULL)
     ORDER BY p.updated_at`, agent.id);
}

/** Approve: the agent takes the listing, it is marked approved and goes Active. */
export async function approveListing(propertyId, agent) {
  assertAgent(agent);
  const db = await getDb();
  const p = await db.getFirstAsync('SELECT status, agent_id FROM properties WHERE id = ?', propertyId);
  if (!p) throw new Error('Property not found');
  if (p.status !== 'draft') throw new Error('Only drafts can be approved');
  if (p.agent_id && p.agent_id !== agent.id) throw new Error('Another agent manages this property');
  await db.withTransactionAsync(async () => {
    await db.runAsync("UPDATE properties SET is_approved = 1, agent_id = ?, updated_at = datetime('now') WHERE id = ?", agent.id, propertyId);
    await applyStatusChange(db, propertyId, 'active', agent.id, 'Approved by agent');
  });
}

/** Send back: the listing stays a draft and the reason is kept in the history. */
export async function returnListing(propertyId, agent, reason) {
  assertAgent(agent);
  const text = (reason || '').trim();
  if (text.length < 3) throw new Error('Give the seller a reason');
  const db = await getDb();
  const p = await db.getFirstAsync('SELECT status, agent_id FROM properties WHERE id = ?', propertyId);
  if (!p) throw new Error('Property not found');
  if (p.status !== 'draft') throw new Error('Only drafts can be sent back');
  if (p.agent_id && p.agent_id !== agent.id) throw new Error('Another agent manages this property');
  await db.withTransactionAsync(async () => {
    await db.runAsync("UPDATE properties SET is_approved = 0, agent_id = ?, updated_at = datetime('now') WHERE id = ?", agent.id, propertyId);
    await db.runAsync(
      "INSERT INTO status_history (property_id, from_status, to_status, changed_by, note) VALUES (?, 'draft', 'draft', ?, ?)",
      propertyId, agent.id, `Sent back: ${text}`);
  });
}

/** Manual status change by the managing agent (e.g. take a listing off the market). */
export async function agentChangeStatus(propertyId, agent, toStatus) {
  assertAgent(agent);
  const db = await getDb();
  const p = await db.getFirstAsync('SELECT agent_id FROM properties WHERE id = ?', propertyId);
  if (!p) throw new Error('Property not found');
  if (p.agent_id !== agent.id) throw new Error('You do not manage this property');
  await db.withTransactionAsync(async () => {
    await applyStatusChange(db, propertyId, toStatus, agent.id, 'Changed by agent');
  });
}

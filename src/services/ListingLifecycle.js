// Listing lifecycle: Draft -> Active -> Under Offer -> Sold / Rented.
// The database triggers are the final guard; this service gives the screens
// clear rules to show (which buttons, which fields are locked) and always
// writes the status history in the same transaction as the change.

import { getDb } from '../db/database';

// Same transitions as trg_status_transition in schema.js.
export const TRANSITIONS = {
  draft: ['active'],
  active: ['draft', 'under_offer'],
  under_offer: ['active', 'sold', 'rented'],
  sold: [],
  rented: [],
};

// Same fields as trg_lock_fields in schema.js.
export const LOCKED_FIELDS = ['price', 'listing_type', 'property_type', 'address_line', 'city', 'postcode'];
const LOCKED_STATUSES = ['under_offer', 'sold', 'rented'];

/** Statuses this property can move to next (respecting sale vs rent). */
export function allowedTransitions(status, listingType) {
  return (TRANSITIONS[status] || []).filter((to) =>
    !(listingType === 'sale' && to === 'rented') && !(listingType === 'rent' && to === 'sold'));
}

export function canTransition(from, to, listingType) {
  return allowedTransitions(from, listingType).includes(to);
}

/** True when this field can no longer be edited at this status. */
export function isFieldLocked(status, field) {
  return LOCKED_STATUSES.includes(status) && LOCKED_FIELDS.includes(field);
}

/** Only drafts and active listings can be deleted (history of real deals is kept). */
export function canDelete(status) {
  return status === 'draft' || status === 'active';
}

/**
 * Writes the status change and its history row. Must be called inside a transaction
 * (used by changeStatus and by OfferService.acceptOffer).
 */
export async function applyStatusChange(db, propertyId, toStatus, userId, note = null) {
  const p = await db.getFirstAsync('SELECT status, listing_type FROM properties WHERE id = ?', propertyId);
  if (!p) throw new Error('Property not found');
  if (p.status === toStatus) return p.status;
  if (!canTransition(p.status, toStatus, p.listing_type)) {
    throw new Error(`Invalid status transition: ${p.status} → ${toStatus}`);
  }
  await db.runAsync("UPDATE properties SET status = ?, updated_at = datetime('now') WHERE id = ?", toStatus, propertyId);
  await db.runAsync(
    'INSERT INTO status_history (property_id, from_status, to_status, changed_by, note) VALUES (?, ?, ?, ?, ?)',
    propertyId, p.status, toStatus, userId, note
  );
  return toStatus;
}

/** Changes a listing's status and records it in the history. */
export async function changeStatus(propertyId, toStatus, userId, note = null) {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await applyStatusChange(db, propertyId, toStatus, userId, note);
  });
  return toStatus;
}

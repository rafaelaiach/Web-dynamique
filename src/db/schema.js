// City Estate database schema (SQLite).
// Same rules as the Week 1 database diagram: status transitions and field locks
// are enforced by triggers, so no screen can break them.

export const SCHEMA_SQL = `
-- City Estate — local SQLite schema (expo-sqlite)
-- Week 1 database design. Run once on first launch.

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------
-- Users: one table, role column. Buyer / Seller / Agent share login.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name     TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL CHECK (role IN ('buyer','seller','agent')),
  phone         TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------
-- Properties
-- seller_id: owner.  agent_id: agent managing it (nullable).
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS properties (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title         TEXT    NOT NULL,
  description   TEXT    NOT NULL DEFAULT '',
  price         REAL    NOT NULL CHECK (price > 0),          -- sale price, or monthly rent
  listing_type  TEXT    NOT NULL CHECK (listing_type IN ('sale','rent')),
  property_type TEXT    NOT NULL CHECK (property_type IN ('house','flat','bungalow','studio','maisonette')),
  address_line  TEXT    NOT NULL,
  city          TEXT    NOT NULL,
  postcode      TEXT    NOT NULL,
  bedrooms      INTEGER NOT NULL DEFAULT 0 CHECK (bedrooms >= 0),
  bathrooms     INTEGER NOT NULL DEFAULT 0 CHECK (bathrooms >= 0),
  status        TEXT    NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','active','under_offer','sold','rented')),
  is_approved   INTEGER NOT NULL DEFAULT 0 CHECK (is_approved IN (0,1)),  -- agent moderation
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  -- a rental can never be 'sold' and a sale can never be 'rented'
  CHECK (NOT (listing_type = 'sale' AND status = 'rented')),
  CHECK (NOT (listing_type = 'rent' AND status = 'sold'))
);

CREATE INDEX IF NOT EXISTS ix_properties_filter
  ON properties (status, listing_type, property_type, city, price);
CREATE INDEX IF NOT EXISTS ix_properties_seller ON properties (seller_id);
CREATE INDEX IF NOT EXISTS ix_properties_agent  ON properties (agent_id);

-- Images (mocked: bundled asset name or URI)
CREATE TABLE IF NOT EXISTS property_images (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  uri         TEXT    NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------
-- Status history: one row per transition (spec: "must track")
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS status_history (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  from_status TEXT,                        -- NULL for the initial 'draft'
  to_status   TEXT    NOT NULL,
  changed_by  INTEGER NOT NULL REFERENCES users(id),
  note        TEXT,
  changed_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------
-- Lifecycle guards enforced by the database itself.
-- Allowed: draft->active, active->draft, active->under_offer,
--          under_offer->active (fell through), under_offer->sold|rented
-- ---------------------------------------------------------------
CREATE TRIGGER IF NOT EXISTS trg_status_transition
BEFORE UPDATE OF status ON properties
WHEN NEW.status <> OLD.status AND NOT (
     (OLD.status = 'draft'       AND NEW.status = 'active')
  OR (OLD.status = 'active'      AND NEW.status IN ('draft','under_offer'))
  OR (OLD.status = 'under_offer' AND NEW.status IN ('active','sold','rented'))
)
BEGIN
  SELECT RAISE(ABORT, 'Invalid status transition');
END;

-- Price, type, property type and location are frozen from Under Offer on.
CREATE TRIGGER IF NOT EXISTS trg_lock_fields
BEFORE UPDATE OF price, listing_type, property_type, address_line, city, postcode ON properties
WHEN OLD.status IN ('under_offer','sold','rented') AND (
     NEW.price         IS NOT OLD.price
  OR NEW.listing_type  IS NOT OLD.listing_type
  OR NEW.property_type IS NOT OLD.property_type
  OR NEW.address_line  IS NOT OLD.address_line
  OR NEW.city          IS NOT OLD.city
  OR NEW.postcode      IS NOT OLD.postcode
)
BEGIN
  SELECT RAISE(ABORT, 'This field cannot be changed once the property is under offer');
END;

-- ---------------------------------------------------------------
-- Buyer activity
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS favourites (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, property_id)
);

CREATE TABLE IF NOT EXISTS enquiries (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  buyer_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message     TEXT    NOT NULL,
  reply       TEXT,
  replied_by  INTEGER REFERENCES users(id),
  status      TEXT    NOT NULL DEFAULT 'open' CHECK (status IN ('open','answered','closed')),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  replied_at  TEXT
);

-- Offers (sale only — checked in OfferService before insert)
CREATE TABLE IF NOT EXISTS offers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  buyer_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount      REAL    NOT NULL CHECK (amount > 0),
  message     TEXT,
  status      TEXT    NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','accepted','rejected','withdrawn')),
  decided_by  INTEGER REFERENCES users(id),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  decided_at  TEXT
);
-- At most ONE accepted offer per property, guaranteed by the database.
CREATE UNIQUE INDEX IF NOT EXISTS ux_one_accepted_offer
  ON offers (property_id) WHERE status = 'accepted';
CREATE INDEX IF NOT EXISTS ix_offers_property ON offers (property_id, status);
CREATE INDEX IF NOT EXISTS ix_offers_buyer    ON offers (buyer_id);

-- Rental applications (rent only)
CREATE TABLE IF NOT EXISTS rental_applications (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id   INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  buyer_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  move_in_date  TEXT    NOT NULL,               -- ISO date YYYY-MM-DD
  notes         TEXT,
  status        TEXT    NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','accepted','rejected','withdrawn')),
  decided_by    INTEGER REFERENCES users(id),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  decided_at    TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_one_accepted_application
  ON rental_applications (property_id) WHERE status = 'accepted';
CREATE INDEX IF NOT EXISTS ix_apps_buyer ON rental_applications (buyer_id);

-- Viewings (advanced feature)
CREATE TABLE IF NOT EXISTS viewings (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id  INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  buyer_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id     INTEGER REFERENCES users(id),
  scheduled_at TEXT    NOT NULL,
  status       TEXT    NOT NULL DEFAULT 'requested'
               CHECK (status IN ('requested','confirmed','cancelled','completed')),
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------
-- Agent statistics (spec: active listings per user, average price,
-- offer counts per property)
-- ---------------------------------------------------------------
CREATE VIEW IF NOT EXISTS v_active_listings_per_user AS
  SELECT u.id AS user_id, u.full_name, u.role,
         COUNT(p.id) AS active_listings
  FROM users u
  LEFT JOIN properties p
    ON p.status = 'active' AND (p.seller_id = u.id OR p.agent_id = u.id)
  WHERE u.role IN ('seller','agent')
  GROUP BY u.id;

CREATE VIEW IF NOT EXISTS v_average_price AS
  SELECT listing_type, ROUND(AVG(price), 2) AS avg_price, COUNT(*) AS listings
  FROM properties
  WHERE status <> 'draft'
  GROUP BY listing_type;

CREATE VIEW IF NOT EXISTS v_offer_counts AS
  SELECT p.id AS property_id, p.title,
         COUNT(o.id) AS total_offers,
         SUM(o.status = 'pending') AS pending_offers
  FROM properties p
  LEFT JOIN offers o ON o.property_id = p.id
  WHERE p.listing_type = 'sale'
  GROUP BY p.id;
`;

// Checks the database, login and property services against a real SQLite engine.
// Run with: npm test   (needs Node 22.13+ for the built-in node:sqlite module)
import assert from 'node:assert/strict';
const R = new URL('../src/', import.meta.url).href;
const { getDb, getDatabaseInfo } = await import(R + 'db/database.js');
const Auth = await import(R + 'services/AuthService.js');
const Prop = await import(R + 'services/PropertyService.js');
const Stats = await import(R + 'services/StatsService.js');
let n = 0; const ok = (m) => console.log(`✓ ${++n}. ${m}`);

const info = await getDatabaseInfo();
assert.equal(info.tables.length, 9); assert.equal(info.users, 4); assert.equal(info.properties, 6); ok(`DB opens: ${info.tables.length} tables, ${info.users} users, ${info.properties} properties, ${info.offers} offers`);
const db = await getDb();
await (await import(R + 'db/seed.js')).seedDatabase(db);
assert.equal((await getDatabaseInfo()).users, 4); ok('Seed does not run twice');

assert.deepEqual(Object.keys(Auth.validateLogin({ email: '', password: '' })).sort(), ['email', 'password']); ok('Empty login shows both errors');
assert.ok(Auth.validateLogin({ email: 'bad', password: 'x' }).email); ok('Bad email format rejected');
const reg = Auth.validateRegister({ fullName: 'A', email: 'a@b.co', password: '123', confirmPassword: '124', role: 'x' });
assert.deepEqual(Object.keys(reg).sort(), ['confirmPassword', 'fullName', 'password', 'role']); ok('Register validation: name, short password, mismatch, role');

for (const role of ['buyer', 'seller', 'agent']) { const u = await Auth.login(`${role}@cityestate.com`, 'password123'); assert.equal(u.role, role); }
ok('Demo buyer / seller / agent can log in');
await assert.rejects(Auth.login('buyer@cityestate.com', 'nope'), /Wrong password/); ok('Wrong password refused');
await assert.rejects(Auth.login('ghost@x.com', 'password123'), /No account/); ok('Unknown email refused');
const row = await db.getFirstAsync("SELECT password_hash FROM users WHERE email='buyer@cityestate.com'");
assert.notEqual(row.password_hash, 'password123'); assert.equal(row.password_hash.length, 64); ok('Passwords stored as SHA-256 hash');
const nu = await Auth.register({ fullName: 'New Person', email: 'New@Test.com', password: 'secret1', role: 'seller' });
assert.equal(nu.role, 'seller'); assert.equal((await Auth.login('new@test.com', 'secret1')).id, nu.id); ok('Register then log in (email case-insensitive)');
await assert.rejects(Auth.register({ fullName: 'X', email: 'new@test.com', password: 'secret1', role: 'buyer' }), /already uses/); ok('Duplicate email refused');

const all = await Prop.searchProperties({});
assert.equal(all.length, 5); assert.ok(all.every((p) => ['active', 'under_offer'].includes(p.status))); ok('Buyer browse hides drafts (5 of 6 visible)');
assert.equal((await Prop.searchProperties({ listingType: 'rent' })).length, 2); ok('Filter sale vs rent');
assert.equal((await Prop.searchProperties({ city: 'leeds' })).length, 2); ok('Filter by location');
assert.equal((await Prop.searchProperties({ propertyType: 'house' })).length, 2); ok('Filter by property type');
assert.deepEqual((await Prop.searchProperties({ listingType: 'sale', minPrice: '300000', maxPrice: '460000' })).map((p) => p.title).sort(), ['Elm Road', 'Jackson Avenue']); ok('Filter by price range');
assert.equal(all.at(-1).status, 'under_offer'); ok('Under Offer listings sorted last');
assert.ok(all.every((p) => p.image)); ok('Every listing has a mock image');

const seller = await Auth.login('seller@cityestate.com', 'password123');
const mine = await Prop.getPropertiesForSeller(seller.id);
assert.equal(mine.length, 4); assert.equal(mine.find((p) => p.title === 'Jackson Avenue').pending_offers, 1); ok('Seller sees own 4 listings with pending offers');
const agent = await Auth.login('agent@cityestate.com', 'password123');
assert.equal((await Prop.getPropertiesForAgent(agent.id)).length, 4); ok('Agent sees the 4 properties they manage');

const oak = all.find((p) => p.title === 'Oak Lane Studio');
const det = await Prop.getPropertyById(oak.id);
assert.deepEqual(det.history.map((h) => h.to_status), ['draft', 'active', 'under_offer']); ok('Status history recorded: draft → active → under offer');
const buyer = await Auth.login('buyer@cityestate.com', 'password123');
const jack = all.find((p) => p.title === 'Jackson Avenue');
assert.equal(await Prop.isFavourite(buyer.id, jack.id), false);
assert.equal(await Prop.toggleFavourite(buyer.id, jack.id), true);
assert.equal(await Prop.toggleFavourite(buyer.id, jack.id), false); ok('Favourite toggles on and off');

const s = await Stats.getAgentStats();
assert.equal(s.totalActive, 4); assert.equal(s.awaitingReview, 1);
assert.equal(s.averagePrice.find((a) => a.listing_type === 'sale').avg_price, Math.round((450000 + 315000 + 210000) / 3 * 100) / 100);
assert.equal(s.offerCounts.find((o) => o.title === 'Jackson Avenue').total_offers, 1); ok('Agent stats: active listings, average price, offer counts');

await db.runAsync("UPDATE properties SET status='under_offer' WHERE id=?", jack.id);
await assert.rejects(db.runAsync('UPDATE properties SET price=1 WHERE id=?', jack.id), /cannot be changed/); ok('Database blocks price change after Under Offer');
await db.runAsync("UPDATE properties SET description='Updated' WHERE id=?", jack.id); ok('Description still editable when Under Offer');
await db.runAsync("UPDATE properties SET status='sold' WHERE id=?", jack.id);
await assert.rejects(db.runAsync("UPDATE properties SET status='active' WHERE id=?", jack.id), /Invalid status transition/); ok('Database blocks Sold → Active');
await assert.rejects(db.runAsync("UPDATE properties SET status='rented' WHERE id=?", oak.id), /Invalid status transition|CHECK/); ok('Sale listing can never become Rented');
console.log(`\nAll ${n} checks passed.`);

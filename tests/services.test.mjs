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

// ---------------- Week 3: seller features + lifecycle / offer services ----------------
const Life = await import(R + 'services/ListingLifecycle.js');
const Offer = await import(R + 'services/OfferService.js');

assert.deepEqual(Life.allowedTransitions('under_offer', 'sale'), ['active', 'sold']);
assert.deepEqual(Life.allowedTransitions('sold', 'sale'), []);
assert.equal(Life.isFieldLocked('under_offer', 'price'), true); assert.equal(Life.isFieldLocked('under_offer', 'description'), false); ok('Lifecycle rules: transitions and locked fields');

const form = { title: 'Canal View', description: 'Two-bed flat by the canal.', price: '1300', listing_type: 'rent', property_type: 'flat',
  address_line: '9 Canal Street', city: 'Manchester', postcode: 'm1 3hz', bedrooms: '2', bathrooms: '1' };
assert.deepEqual(Object.keys(Prop.validateListing({ ...form, title: '', price: '-5', postcode: 'nope', bedrooms: '1.5' })).sort(), ['bedrooms', 'postcode', 'price', 'title']); ok('Listing form validation');
await assert.rejects(Prop.createListing(buyer, form), /Only sellers/); ok('Buyer cannot create a listing');
const newId = await Prop.createListing(seller, form);
let created = await Prop.getPropertyById(newId);
assert.equal(created.status, 'draft'); assert.equal(created.postcode, 'M1 3HZ'); assert.deepEqual(created.history.map((h) => h.to_status), ['draft']); ok('Seller creates a listing: starts as Draft with history');
assert.equal((await Prop.getPropertiesForSeller(seller.id)).length, 5); ok('New listing appears in My listings');
assert.equal(await Prop.updateListing(seller, newId, { price: '1250', description: 'Updated text' }), true);
assert.equal((await Prop.getPropertyById(newId)).price, 1250); ok('Seller edits price and description');
const lena = await Auth.login('lena@cityestate.com', 'password123');
await assert.rejects(Prop.updateListing(lena, newId, { title: 'Hijack' }), /your own/); ok("Seller cannot edit someone else's listing");
await Life.changeStatus(newId, 'active', seller.id, 'Published');
assert.equal((await Prop.getPropertyById(newId)).history.at(-1).to_status, 'active'); ok('Publish Draft → Active writes history');
await assert.rejects(Life.changeStatus(newId, 'sold', seller.id), /Invalid status transition/); ok('Service refuses Active → Sold');

// Offers on Elm Road (sale, active, 1 pending offer from the seed)
const elm = (await Prop.getPropertiesForSeller(seller.id)).find((p) => p.title === 'Elm Road');
const o2 = await Offer.makeOffer(buyer.id, elm.id, 305000, 'Higher offer');
const nb = await Auth.register({ fullName: 'Second Buyer', email: 'b2@test.com', password: 'secret1', role: 'buyer' });
const o3 = await Offer.makeOffer(nb.id, elm.id, 310000);
await assert.rejects(Offer.makeOffer(buyer.id, elm.id, 0), /above/); ok('Buyer can make several offers; zero refused');
let d = await Offer.getDecisionsForProperty(elm.id);
assert.equal(d.kind, 'offer'); assert.equal(d.items.length, 3); ok('Seller sees all offers for a property');
await assert.rejects(Offer.acceptOffer(o3, lena), /Only the seller or the managing agent/); ok('Another seller cannot accept');
await Offer.acceptOffer(o3, seller);
d = await Offer.getDecisionsForProperty(elm.id);
assert.deepEqual(d.items.map((o) => o.status).sort(), ['accepted', 'rejected', 'rejected']);
let elmNow = await Prop.getPropertyById(elm.id);
assert.equal(elmNow.status, 'under_offer'); assert.match(elmNow.history.at(-1).note, /310,000/); ok('Accept offer: others rejected, status Under Offer, history written');
await assert.rejects(Offer.acceptOffer(o2, seller), /pending/);
await assert.rejects(db.runAsync("UPDATE offers SET status='accepted' WHERE id=?", o2), /UNIQUE/); ok('Second accepted offer impossible (service and database)');
await assert.rejects(Offer.makeOffer(buyer.id, elm.id, 320000), /not accepting/); ok('No new offers once Under Offer');
await assert.rejects(Prop.updateListing(seller, elm.id, { price: '1' }), /locked/);
assert.equal(await Prop.updateListing(seller, elm.id, { description: 'Still editable' }), true); ok('Edit form: price locked, description editable when Under Offer');
await assert.rejects(Prop.deleteListing(seller, elm.id), /cannot be deleted/); ok('Cannot delete a listing under offer');
await Offer.cancelDeal(elm.id, seller);
elmNow = await Prop.getPropertyById(elm.id);
assert.equal(elmNow.status, 'active'); assert.equal((await Offer.getDecisionsForProperty(elm.id)).items.find((o) => o.id === o3).status, 'withdrawn'); ok('Deal falls through: back to Active, accepted offer withdrawn');
const o4 = await Offer.makeOffer(buyer.id, elm.id, 312000);
await Offer.acceptOffer(o4, seller);
assert.equal(await Offer.completeDeal(elm.id, seller), 'sold');
assert.deepEqual((await Prop.getPropertyById(elm.id)).history.map((h) => h.to_status).slice(-4), ['under_offer', 'active', 'under_offer', 'sold']); ok('Re-accept then mark Sold, full history kept');

// Rental applications on Meadow Bungalow (rent, active)
const meadow = (await Prop.getPropertiesForSeller(seller.id)).find((p) => p.title === 'Meadow Bungalow');
await assert.rejects(Offer.makeOffer(buyer.id, meadow.id, 1000), /only for properties for sale/);
await assert.rejects(Offer.applyToRent(buyer.id, meadow.id, '12/01/2027'), /YYYY-MM-DD/); ok('Rental: no offers, date format checked');
const a1 = await Offer.applyToRent(buyer.id, meadow.id, '2027-01-15', 'Two adults, no pets');
const a2 = await Offer.applyToRent(nb.id, meadow.id, '2027-02-01');
await Offer.rejectApplication(a2, seller);
assert.equal((await Offer.getDecisionsForProperty(meadow.id)).items.find((a) => a.id === a2).status, 'rejected'); ok('Seller rejects an application');
await Offer.acceptApplication(a1, seller);
assert.equal((await Prop.getPropertyById(meadow.id)).status, 'under_offer');
assert.equal(await Offer.completeDeal(meadow.id, seller), 'rented'); ok('Accept application → Under Offer → Rented');

// Delete
await Life.changeStatus(newId, 'draft', seller.id);
await Prop.deleteListing(seller, newId);
assert.equal(await Prop.getPropertyById(newId), null); ok('Seller deletes a listing');
console.log(`\nAll ${n} checks passed.`);

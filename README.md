# City Estate (realEstate)

React Native (Expo SDK 58) app for buyers, sellers and agents, with a local SQLite database.

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone (Android or iOS), or press `a` for an Android emulator.
The first launch creates the database `cityestate.db` on the device and fills it with demo data.

### Demo accounts (password `password123`)

| Role   | Email                   |
|--------|-------------------------|
| Buyer  | buyer@cityestate.com    |
| Seller | seller@cityestate.com   |
| Agent  | agent@cityestate.com    |

The login screen has buttons that fill these in.

## Week 2 checklist

| Requirement | Where |
|---|---|
| First user input (email + password) | `src/screens/LoginScreen.js`, `src/screens/RegisterScreen.js` (validation in `src/services/AuthService.js`) |
| Three GUI screens besides login | Buyer **Browse** (`HomeScreen.js`), Seller **My listings** (`MyListingsScreen.js`), Agent **Dashboard** (`AgentDashboardScreen.js`), plus Property detail and Profile |
| Database connection | `src/db/database.js` (expo-sqlite). The login screen shows "Connected to cityestate.db · 9 tables" |

## Week 3 (seller + data services, by Rafael)

Seller features, log in as `seller@cityestate.com`:

1. **Create a listing**: "+ New listing" on My listings. Saved as Draft, with validation (title, price, UK postcode, rooms).
2. **Edit / publish / delete**: open a listing → Manage listing. Publish (Draft → Active), unpublish, edit, delete (Draft or Active only). From Under Offer on, price, type and location are shown as locked.
3. **Review offers / applications**: accept or reject. Accepting one rejects the others and moves the property to Under Offer, in one transaction. Then mark it Sold / Rented, or "Deal fell through" (back to Active).

Shared services the buyer and agent screens can reuse:

- `services/ListingLifecycle.js`: `allowedTransitions`, `isFieldLocked`, `canDelete`, `changeStatus` (always writes the status history).
- `services/OfferService.js`: `makeOffer`, `applyToRent` (ready for the buyer buttons), `getDecisionsForProperty`, `acceptOffer` / `rejectOffer`, `acceptApplication` / `rejectApplication`, `completeDeal`, `cancelDeal`. Accept / reject work for the seller **or the managing agent**.

Still to do (Pierre): buyer "Make an offer" / "Apply to rent" screens, enquiries, My activity; agent status changes and listing validation.

## Folder structure

```
App.js                 opens the database, then shows the navigator
src/
  assets/              photos.js: real property photos (Unsplash, free licence)
  components/          PropertyCard, StatusPill, TextField, PrimaryButton, Chip, EmptyState, PropertyPhoto, NoImage (shown if a photo can't load)
  context/             AuthContext (logged-in user)
  db/                  database.js, schema.js (tables, triggers, views), seed.js (demo data)
  navigation/          RootNavigator: login stack, then tabs for the user's role
  screens/             one file per screen
  services/            AuthService, PropertyService, StatsService (all SQL lives here)
  theme.js             colours, spacing, price formatting
tests/                 npm test: 50 checks against a real SQLite database
```

## Database rules (enforced by SQLite itself)

- Status can only move Draft → Active → Under Offer → Sold / Rented (Under Offer → Active if a deal falls through). Sold → Active is blocked.
- Price, sale/rent, property type and address cannot change once a property is Under Offer.
- Only one accepted offer per property.
- Every status change is written to `status_history`.

To reset the demo data, delete the app from the phone (or clear Expo Go's data) and open it again.

## Photos

Property photos come from [Unsplash](https://unsplash.com) and are free to use under the
[Unsplash License](https://unsplash.com/license). They load from the internet, so the phone needs a
connection; without one, a grey "No image" box is shown. Photographers are credited under each
property's photos and in `src/assets/photos.js`.

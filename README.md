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

## Week 3 checklist (at least 3 features per role)

| Role | Features | Screens |
|---|---|---|
| Buyer | 1. Browse with filters and favourites · 2. Make an offer / apply to rent · 3. Ask a question · 4. My activity (offers, applications, answers, favourites, withdraw) | Browse, Property, Make an offer, Activity |
| Seller | 1. Create a listing · 2. Edit / publish / unpublish / delete · 3. Review offers and applications (accept, reject, sold / rented, deal fell through) · 4. Answer questions | Listings, Listing form, Offers, Questions |
| Agent | 1. Statistics dashboard · 2. Review drafts (approve and publish, or send back with a reason) · 3. Change the status of managed properties and decide on their offers · 4. Answer questions | Dashboard, Review, Property, Offers, Questions |

Rules that always apply (services + database triggers):

- Accepting an offer or application rejects the others and puts the property Under Offer, in one transaction.
- Price, type and location are locked from Under Offer on. Sold / Rented cannot go back to Active.
- Every status change is written to the status history (shown on the property page, with notes).

Services: `ListingLifecycle`, `OfferService`, `EnquiryService`, `AgentService`, `PropertyService`, `StatsService`.

### Interface

One minimal black and white style for every screen: black text on white, thin black lines, black buttons
(white with a black border for secondary actions), text-only tabs. All screens are built from
`src/components/ui.js` (Screen, Section, Item, KeyValue...) and the sizes in `src/theme.js`.

## Folder structure

```
App.js                 opens the database, then shows the navigator
src/
  assets/              photos.js: real property photos (Unsplash, free licence)
  components/          ui.js (shared layout pieces), PropertyCard, TextField, PrimaryButton, Chip, EmptyState, PropertyPhoto, NoImage
  context/             AuthContext (logged-in user)
  db/                  database.js, schema.js (tables, triggers, views), seed.js (demo data)
  navigation/          RootNavigator: login stack, then tabs for the user's role
  screens/             one file per screen
  services/            Auth, Property, Stats, ListingLifecycle, Offer, Enquiry, Agent (all SQL lives here)
  theme.js             black / white colours, spacing, font sizes, price formatting
tests/                 npm test: 63 checks against a real SQLite database
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

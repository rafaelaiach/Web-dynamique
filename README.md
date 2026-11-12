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

## Folder structure

```
App.js                 opens the database, then shows the navigator
src/
  assets/              mock property photos + images.js
  components/          PropertyCard, StatusPill, TextField, PrimaryButton, Chip, EmptyState
  context/             AuthContext (logged-in user)
  db/                  database.js, schema.js (tables, triggers, views), seed.js (demo data)
  navigation/          RootNavigator: login stack, then tabs for the user's role
  screens/             one file per screen
  services/            AuthService, PropertyService, StatsService (all SQL lives here)
  theme.js             colours, spacing, price formatting
tests/                 npm test: 27 checks against a real SQLite database
```

## Database rules (enforced by SQLite itself)

- Status can only move Draft → Active → Under Offer → Sold / Rented (Under Offer → Active if a deal falls through). Sold → Active is blocked.
- Price, sale/rent, property type and address cannot change once a property is Under Offer.
- Only one accepted offer per property.
- Every status change is written to `status_history`.

To reset the demo data, delete the app from the phone (or clear Expo Go's data) and open it again.

// Logged out: Login + Register.
// Logged in: the tab bar for the user's role, plus the shared screens (property, forms).

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import AgentDashboardScreen from '../screens/AgentDashboardScreen';
import EditListingScreen from '../screens/EditListingScreen';
import EnquiriesScreen from '../screens/EnquiriesScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import MakeOfferScreen from '../screens/MakeOfferScreen';
import MyActivityScreen from '../screens/MyActivityScreen';
import MyListingsScreen from '../screens/MyListingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PropertyDetailScreen from '../screens/PropertyDetailScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ReviewListingsScreen from '../screens/ReviewListingsScreen';
import ReviewOffersScreen from '../screens/ReviewOffersScreen';
import { colors, font } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// The tabs of each role, as in the Week 1 wireframes.
const TABS_BY_ROLE = {
  buyer: [
    { name: 'Browse', component: HomeScreen },
    { name: 'Activity', component: MyActivityScreen },
  ],
  seller: [
    { name: 'Listings', component: MyListingsScreen },
    { name: 'Questions', component: EnquiriesScreen },
  ],
  agent: [
    { name: 'Dashboard', component: AgentDashboardScreen },
    { name: 'Review', component: ReviewListingsScreen },
    { name: 'Questions', component: EnquiriesScreen },
  ],
};

// Same header everywhere: white, black text, thin line, no shadow.
const header = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '400', fontSize: font.body + 2 },
  headerShadowVisible: true,
};

function RoleTabs() {
  const { user } = useAuth();
  return (
    <Tab.Navigator
      screenOptions={{
        ...header,
        // Text-only tabs: the active one is black and underlined.
        tabBarIcon: () => null,
        tabBarIconStyle: { display: 'none' },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: font.body },
        tabBarStyle: { borderTopColor: colors.line, borderTopWidth: 1 },
        tabBarItemStyle: { justifyContent: 'center' },
      }}
    >
      {[...TABS_BY_ROLE[user.role], { name: 'Profile', component: ProfileScreen }].map((t) => (
        <Tab.Screen key={t.name} name={t.name} component={t.component} />
      ))}
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user } = useAuth();
  return (
    <Stack.Navigator screenOptions={{ ...header, headerBackButtonDisplayMode: 'minimal' }}>
      {user ? (
        <>
          <Stack.Screen name="Main" component={RoleTabs} options={{ headerShown: false }} />
          <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} options={{ title: 'Property' }} />
          <Stack.Screen name="EditListing" component={EditListingScreen} options={{ title: 'Listing' }} />
          <Stack.Screen name="ReviewOffers" component={ReviewOffersScreen} options={{ title: 'Offers' }} />
          <Stack.Screen name="MakeOffer" component={MakeOfferScreen} options={{ title: 'Make an offer' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create account' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

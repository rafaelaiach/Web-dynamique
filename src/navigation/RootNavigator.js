// Logged out: Login + Register.
// Logged in: the tab bar for the user's role, plus the shared Property detail screen.

import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import AgentDashboardScreen from '../screens/AgentDashboardScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import MyListingsScreen from '../screens/MyListingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PropertyDetailScreen from '../screens/PropertyDetailScreen';
import RegisterScreen from '../screens/RegisterScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();

// Simple text icon for the tab bar, so we don't need an icon library.
function tabIcon(glyph) {
  function TabIcon({ color }) {
    return <Text style={{ color, fontSize: 20 }}>{glyph}</Text>;
  }
  return TabIcon;
}
const Tab = createBottomTabNavigator();

// One home screen per role, as in the Week 1 wireframes.
const HOME_BY_ROLE = {
  buyer: { name: 'Browse', component: HomeScreen, icon: '⌂' },
  seller: { name: 'My listings', component: MyListingsScreen, icon: '▤' },
  agent: { name: 'Dashboard', component: AgentDashboardScreen, icon: '▥' },
};

function RoleTabs() {
  const { user } = useAuth();
  const home = HOME_BY_ROLE[user.role];
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tab.Screen name={home.name} component={home.component} options={{ tabBarIcon: tabIcon(home.icon) }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: tabIcon('◉') }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user } = useAuth();
  return (
    <Stack.Navigator>
      {user ? (
        <>
          <Stack.Screen name="Main" component={RoleTabs} options={{ headerShown: false }} />
          <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} options={{ title: 'Property' }} />
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

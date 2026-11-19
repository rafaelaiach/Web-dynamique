// Shared by all roles: who is logged in, and the log-out button.

import PrimaryButton from '../components/PrimaryButton';
import { KeyValue, Screen, Title } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { capitalise } from '../theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  return (
    <Screen>
      <Title>{user.fullName}</Title>
      <KeyValue label="Account" value={capitalise(user.role)} />
      <KeyValue label="Email" value={user.email} />
      {user.phone ? <KeyValue label="Phone" value={user.phone} /> : null}
      <PrimaryButton title="Log out" variant="outline" onPress={logout} />
    </Screen>
  );
}

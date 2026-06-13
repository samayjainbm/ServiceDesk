import React from 'react';
import MenuScaffold from '../../components/MenuScaffold';
import { clearSession } from '../../hooks/useAuth';

export default function UserHomeScreen({ navigation }) {
  const logout = async () => {
    await clearSession();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const items = [
    {
      key: 'register',
      title: 'Register Complaint',
      desc: 'Raise a new campus service request',
      icon: 'plus',
      onPress: () => navigation.navigate('UserRegisterComplaintScreen'),
    },
    {
      key: 'my',
      title: 'My Complaints',
      desc: 'Track status and history',
      icon: 'clipboard',
      onPress: () => navigation.navigate('UserComplaintsScreen'),
    },
  ];

  return (
    <MenuScaffold
      role="user"
      title="User Dashboard"
      subtitle="MANIT ServiceDesk"
      heroTitle="Welcome"
      heroSubtitle="Manage your campus complaints"
      heroIcon="user"
      items={items}
      onLogout={logout}
    />
  );
}

// src/screens/pa/PAHomeScreen.js
import React from 'react';
import MenuScaffold from '../../components/MenuScaffold';
import { clearSession } from '../../hooks/useAuth';

export default function PaHomeScreen({ navigation }) {
  const logout = async () => {
    await clearSession();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const items = [
    { key: 'user', title: 'Users', desc: 'Create and manage user accounts', icon: 'user', onPress: () => navigation.navigate('PAUserScreen') },
    { key: 'worker', title: 'Workers', desc: 'Create and manage worker accounts', icon: 'users', onPress: () => navigation.navigate('PAWorkerScreen') },
    { key: 'records', title: 'Records', desc: 'Reports and activity records', icon: 'clipboard', onPress: () => navigation.navigate('PARecordsScreen') },
    { key: 'inv', title: 'Inventory Required', desc: 'Pending material requirements', icon: 'box', onPress: () => navigation.navigate('InventoryRequiredScreen') },
  ];

  return (
    <MenuScaffold
      role="pa"
      title="PA Dashboard"
      subtitle="Administration"
      heroTitle="Administrator"
      heroSubtitle="Manage users, workers and records"
      heroIcon="users"
      items={items}
      onLogout={logout}
    />
  );
}

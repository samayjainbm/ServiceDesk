// src/screens/inventory/InventoryMenuScreen.js
import React from 'react';
import MenuScaffold from '../../components/MenuScaffold';
import { clearSession } from '../../hooks/useAuth';

export default function InventoryMenuScreen({ navigation }) {
  const logout = async () => {
    await clearSession();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const items = [
    { key: 'complaints', title: 'Complaints', desc: 'Assigned and unassigned complaints', icon: 'clipboard', onPress: () => navigation.navigate('ComplaintsMenuScreen') },
    { key: 'demanded', title: 'Demanded Items', desc: 'Material requests from workers', icon: 'list', onPress: () => navigation.navigate('DemandIdsScreen') },
    { key: 'storage', title: 'Inventory Storage', desc: 'Browse and manage stock', icon: 'box', onPress: () => navigation.navigate('ItemDisplayScreen') },
  ];

  return (
    <MenuScaffold
      role="inventory"
      title="Inventory Dashboard"
      subtitle="Store & Stock"
      heroTitle="Inventory"
      heroSubtitle="Store, stock and demand management"
      heroIcon="box"
      items={items}
      onLogout={logout}
    />
  );
}

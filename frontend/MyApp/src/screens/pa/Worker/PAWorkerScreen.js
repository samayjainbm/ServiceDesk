// src/screens/pa/PAWorkerScreen.js
import React from 'react';
import MenuScaffold from '../../../components/MenuScaffold';

export default function PAWorkerScreen({ navigation }) {
  const items = [
    { key: 'create', title: 'Create Worker', desc: 'Add a new worker account', icon: 'plus', onPress: () => navigation.navigate('PAWorkerCreateScreen') },
    { key: 'list', title: 'View / Update / Delete', desc: 'Manage existing workers', icon: 'users', onPress: () => navigation.navigate('PAWorkerListScreen') },
    { key: 'creds', title: 'Worker Credentials', desc: 'Set or reset login credentials', icon: 'lock', onPress: () => navigation.navigate('PAWorkerCredentialsScreen') },
  ];

  return (
    <MenuScaffold
      role="pa"
      title="Worker Management"
      subtitle="Administration"
      items={items}
      onBack={() => navigation.goBack()}
    />
  );
}

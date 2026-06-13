import React from 'react';
import MenuScaffold from '../../../components/MenuScaffold';

export default function PAUserScreen({ navigation }) {
  const items = [
    { key: 'create', title: 'Create User', desc: 'Add a new user account', icon: 'plus', onPress: () => navigation.navigate('PAUserCreateScreen') },
    { key: 'list', title: 'View All Users', desc: 'Browse, edit and manage users', icon: 'users', onPress: () => navigation.navigate('PAUserListScreen') },
  ];

  return (
    <MenuScaffold
      role="pa"
      title="User Management"
      subtitle="Administration"
      items={items}
      onBack={() => navigation.goBack()}
    />
  );
}

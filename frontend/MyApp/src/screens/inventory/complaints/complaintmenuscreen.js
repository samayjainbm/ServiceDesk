// ComplaintsMenuScreen.js
import React from 'react';
import MenuScaffold from '../../../components/MenuScaffold';

export default function ComplaintsMenuScreen({ navigation }) {
  const items = [
    {
      key: 'notAssigned',
      title: 'Not Assigned',
      desc: 'Booked complaints awaiting a worker',
      icon: 'alert',
      onPress: () => navigation.navigate('bookedIds'),
    },
    {
      key: 'assigned',
      title: 'Assigned',
      desc: 'Ongoing and delayed complaints',
      icon: 'checkCircle',
      onPress: () => navigation.navigate('AssignedComplaints'),
    },
  ];

  return (
    <MenuScaffold
      role="inventory"
      title="Complaints"
      subtitle="Inventory"
      items={items}
      onBack={() => navigation.goBack()}
    />
  );
}

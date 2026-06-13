import React, { useState } from 'react';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, TOKEN_KEY } from '../../../../config';
import { useTheme } from '../../../theme';
import { Screen, AppBar, Card, Input, Button, Badge, useToast } from '../../../components/ui';

export default function AddItems({ navigation }) {
  const { colors } = useTheme();
  const toast = useToast();
  const [newItemName, setNewItemName] = useState('');
  const [newItemCount, setNewItemCount] = useState('');
  const [loadingNewItem, setLoadingNewItem] = useState(false);

  const handleAddNewItem = async () => {
    const item_name = String(newItemName || '').trim().toLowerCase();
    const count = String(newItemCount || '').trim();

    if (!item_name) { return toast.warning('Item name is required'); }
    if (count === '') { return toast.warning('Count is required'); }
    const n = Number(count);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) { return toast.warning('Count must be an integer ≥ 0'); }

    try {
      setLoadingNewItem(true);
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) { return toast.warning('Token missing. Please login again.'); }

      const res = await fetch(`${BASE_URL}/api/inventory/add_new_item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ item_name, count }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { return toast.error(data?.message || 'Failed to add new item'); }

      toast.success(data?.message || 'Item created successfully');
      setNewItemName('');
      setNewItemCount('');
    } catch (e) {
      console.log('Add new item error:', e);
      toast.error('Network/server error');
    } finally {
      setLoadingNewItem(false);
    }
  };

  return (
    <Screen
      header={<AppBar title="Add New Item" subtitle="Inventory" role="inventory" onBack={() => navigation.goBack()} />}
      scroll
      keyboardAvoiding
    >
      <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 14 }}>
        Create a brand new item type in the inventory. The name is stored in lowercase.
      </Text>

      <Card>
        <Input label="Item Name" leftIcon="tag" placeholder="e.g. wire" value={newItemName} onChangeText={setNewItemName} editable={!loadingNewItem} />
        <Input
          label="Count"
          leftIcon="box"
          placeholder="e.g. 10"
          value={newItemCount}
          onChangeText={(t) => setNewItemCount(String(t ?? '').replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
          editable={!loadingNewItem}
        />
        <Button title="Add New Item" icon="plus" onPress={handleAddNewItem} loading={loadingNewItem} style={{ marginTop: 4 }} />
      </Card>
    </Screen>
  );
}

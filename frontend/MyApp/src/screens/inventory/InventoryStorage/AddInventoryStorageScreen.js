// screens/AddInventoryStorageScreen.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { BASE_URL } from '../../../../config';
import { View, Text, FlatList, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../theme';
import { Screen, AppBar, Card, Button, SkeletonList, EmptyState, useToast } from '../../../components/ui';

export default function AddInventoryStorageScreen({ navigation }) {
  const { colors, radius } = useTheme();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const initializeRows = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const [namesRes, countsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/get_item_names`, { method: 'GET', headers }),
        fetch(`${BASE_URL}/api/item_display`, { method: 'GET', headers }),
      ]);

      const namesData = await namesRes.json();
      const countsData = await countsRes.json();

      if (!namesRes.ok || !namesData.success || !Array.isArray(namesData.data)) {
        throw new Error(namesData.message || namesData.error || 'Failed to fetch item names');
      }

      const itemNames = namesData.data
        .map((it) => (typeof it === 'string' ? String(it).toLowerCase() : String(it.item_name || '').toLowerCase()))
        .filter(Boolean);

      const countMap = new Map();
      if (countsRes.ok && countsData.success && Array.isArray(countsData.data)) {
        countsData.data.forEach((it) => {
          const name = String(it.item_name || '').toLowerCase();
          const count = Number(it.count ?? it.item_count ?? 0);
          if (name) countMap.set(name, count);
        });
      }

      setRows(itemNames.map((name) => ({ item_name: name, current_count: countMap.get(name) ?? 0, added_item_count: '' })));
    } catch (err) {
      console.error('initializeRows error:', err);
      setRows([]);
      toast.error(err.message || 'Could not fetch inventory items.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { initializeRows(); }, [initializeRows]);

  const updateCount = (itemName, value) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    setRows((prev) => prev.map((row) => (row.item_name === itemName ? { ...row, added_item_count: cleaned } : row)));
  };

  const payload = useMemo(
    () => rows.map((row) => ({ item_name: row.item_name, added_item_count: row.added_item_count === '' ? 0 : Number(row.added_item_count) })),
    [rows]
  );
  const totalAdded = useMemo(() => payload.reduce((sum, row) => sum + (Number(row.added_item_count) || 0), 0), [payload]);

  const handleSubmit = async () => {
    try {
      if (!Array.isArray(rows) || rows.length === 0) { return toast.warning('No items available to submit.'); }
      for (const row of payload) {
        if (!String(row.item_name).trim()) { return toast.warning('Invalid item name found.'); }
        if (!Number.isInteger(row.added_item_count) || row.added_item_count < 0) {
          return toast.warning(`Invalid count for item ${row.item_name}`);
        }
      }

      setSubmitting(true);
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/add_items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { throw new Error(data.message || data.error || 'Failed to add items'); }

      toast.success(data.message || 'Items added successfully.');
      setRows((prev) => prev.map((r) => ({ ...r, added_item_count: '' })));
      initializeRows();
    } catch (err) {
      console.error('handleSubmit error:', err);
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFillZero = () => setRows((prev) => prev.map((r) => ({ ...r, added_item_count: '0' })));
  const handleClearAll = () => setRows((prev) => prev.map((r) => ({ ...r, added_item_count: '' })));

  const renderRow = ({ item }) => (
    <Card style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: colors.textPrimary, textTransform: 'capitalize' }}>{item.item_name}</Text>
          <Text style={{ marginTop: 2, fontSize: 13, color: colors.textMuted }}>Current: {item.current_count ?? 0}</Text>
        </View>
        <TextInput
          style={{
            width: 88, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
            paddingHorizontal: 10, paddingVertical: 9, textAlign: 'center',
            backgroundColor: colors.inputBg, fontWeight: '800', color: colors.textPrimary, fontSize: 16,
          }}
          value={item.added_item_count ?? ''}
          onChangeText={(text) => updateCount(item.item_name, text)}
          placeholder="0"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          maxLength={6}
        />
      </View>
    </Card>
  );

  const header = <AppBar title="Add Stock" subtitle="Inventory storage" role="inventory" onBack={() => navigation.goBack()} />;

  if (loading) {
    return (
      <Screen header={header}>
        <View style={{ padding: 16 }}>
          <SkeletonList count={6} />
        </View>
      </Screen>
    );
  }

  const Head = (
    <View style={{ marginBottom: 14 }}>
      <Card style={{ marginBottom: 12 }} accentBar={colors.primary}>
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 10 }}>Enter the quantity to add for each item.</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '700' }}>Total to add</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '900' }}>{totalAdded}</Text>
        </View>
      </Card>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button title="Fill 0" variant="secondary" size="sm" fullWidth={false} onPress={handleFillZero} style={{ flex: 1 }} />
        <Button title="Clear All" variant="ghost" size="sm" fullWidth={false} onPress={handleClearAll} style={{ flex: 1 }} />
      </View>
    </View>
  );

  return (
    <Screen
      header={header}
      padded={false}
      scroll={false}
      footer={
        rows.length > 0 ? (
          <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface }}>
            <Button title="Submit Added Items" icon="check" onPress={handleSubmit} loading={submitting} />
          </View>
        ) : null
      }
    >
      <FlatList
        data={rows}
        keyExtractor={(item, index) => `${item.item_name}-${index}`}
        renderItem={renderRow}
        ListHeaderComponent={Head}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<EmptyState icon="box" title="No item names found" />}
      />
    </Screen>
  );
}

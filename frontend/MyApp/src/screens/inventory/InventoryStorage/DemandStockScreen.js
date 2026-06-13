// src/screens/DemandStockScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, TOKEN_KEY } from '../../../../config';
import { useTheme } from '../../../theme';
import { Screen, AppBar, Card, Button, SkeletonList, EmptyState, useToast } from '../../../components/ui';

export default function DemandStockScreen({ navigation }) {
  const { colors, radius } = useTheme();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [demandValues, setDemandValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const getToken = async () => {
    const possibleKeys = [TOKEN_KEY, 'token', 'admin_token', 'auth_token'].filter(Boolean);
    for (const key of possibleKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) return value;
    }
    return null;
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/api/item_display`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();
      if (!res.ok || !data.success) { throw new Error(data.message || data.error || 'Failed to fetch items'); }
      const fetchedItems = Array.isArray(data.data) ? data.data : [];
      setItems(fetchedItems);
      const initialValues = {};
      fetchedItems.forEach((item) => { initialValues[item.item_name] = ''; });
      setDemandValues(initialValues);
    } catch (err) {
      console.log('fetchItems error:', err);
      toast.error(err.message || 'Unable to fetch items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const updateDemandValue = (itemName, value) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    setDemandValues((prev) => ({ ...prev, [itemName]: cleaned }));
  };

  const payloadItems = useMemo(() => items
    .map((item) => ({ item_name: String(item.item_name || '').trim().toLowerCase(), count: Number(demandValues[item.item_name] || 0) }))
    .filter((item) => item.item_name && item.count > 0), [items, demandValues]);

  const handleSubmit = async () => {
    try {
      if (payloadItems.length === 0) { return toast.warning('At least one item count must be greater than 0'); }
      setSubmitting(true);
      const token = await getToken();
      if (!token) { throw new Error('Not logged in'); }

      const res = await fetch(`${BASE_URL}/api/demandstock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items: payloadItems }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { throw new Error(data.error || data.message || 'Failed to save demand stock'); }

      toast.success(data.message || 'Demand stock saved successfully');
      const cleared = {};
      items.forEach((item) => { cleared[item.item_name] = ''; });
      setDemandValues(cleared);
      navigation.goBack();
    } catch (err) {
      console.log('handleSubmit error:', err);
      toast.error(err.message || 'Unable to save demand stock');
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }) => {
    const availableCount = item.count ?? item.item_count ?? 0;
    return (
      <Card style={{ marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: colors.textPrimary, textTransform: 'capitalize' }}>{item.item_name}</Text>
            <Text style={{ marginTop: 2, fontSize: 13, color: colors.textMuted }}>Available: {availableCount}</Text>
          </View>
          <TextInput
            style={{ width: 88, height: 44, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.inputBg, textAlign: 'center', fontSize: 16, fontWeight: '800', color: colors.textPrimary }}
            value={demandValues[item.item_name] ?? ''}
            onChangeText={(text) => updateDemandValue(item.item_name, text)}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            maxLength={6}
          />
        </View>
      </Card>
    );
  };

  const header = <AppBar title="Demand Stock" subtitle="Inventory" role="inventory" onBack={() => navigation.goBack()} />;

  if (loading) {
    return (
      <Screen header={header}>
        <View style={{ padding: 16 }}>
          <SkeletonList count={6} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      header={header}
      padded={false}
      scroll={false}
      keyboardAvoiding
      footer={
        <View style={{ flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface }}>
          <Button title="Refresh" variant="secondary" icon="refresh" onPress={fetchItems} disabled={submitting} fullWidth={false} style={{ flex: 1 }} />
          <Button title="Submit Demand" icon="send" onPress={handleSubmit} loading={submitting} accent={colors.accent} fullWidth={false} style={{ flex: 1.4 }} />
        </View>
      }
    >
      <FlatList
        data={items}
        keyExtractor={(item, index) => `${item.item_name}-${index}`}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={<Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12 }}>Enter the required quantity for each item to demand more stock.</Text>}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<EmptyState icon="box" title="No items found" />}
      />
    </Screen>
  );
}

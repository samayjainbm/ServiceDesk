import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BASE_URL, TOKEN_KEY } from '../../../config';
import { View, Text, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme';
import { Screen, AppBar, Card, Button, SkeletonList, EmptyState, useToast } from '../../components/ui';

export default function WorkerDemandItemsScreen({ route, navigation }) {
  const complaintId = route?.params?.complaint_id ?? route?.params?.complaintId;
  const { colors, radius } = useTheme();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [quantities, setQuantities] = useState({});

  const buildInitialQuantities = (itemsArray) => {
    const obj = {};
    for (const it of itemsArray) {
      const key = String(it?.item_name ?? '').trim().toLowerCase();
      if (key) obj[key] = '0';
    }
    return obj;
  };

  const fetchItems = useCallback(async (isRefresh = false) => {
    try {
      if (!complaintId) throw new Error('complaint_id not provided');
      if (isRefresh) setRefreshing(true); else setLoading(true);

      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${BASE_URL}/api/worker/show_items`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        throw new Error(json.message || 'Failed to fetch items');
      }

      const list = Array.isArray(json.data) ? json.data : [];
      setItems(list);
      setQuantities((prev) => {
        const base = buildInitialQuantities(list);
        for (const key of Object.keys(base)) {
          if (prev[key] !== undefined) base[key] = prev[key];
        }
        return base;
      });
    } catch (err) {
      console.log('worker/show_items error:', err);
      toast.error(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [complaintId, toast]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const onChangeQty = (itemName, text) => {
    const cleaned = String(text).replace(/[^0-9]/g, '');
    const key = String(itemName).trim().toLowerCase();
    setQuantities((prev) => ({ ...prev, [key]: cleaned === '' ? '' : cleaned }));
  };

  const demandedMaterials = useMemo(() => {
    const out = [];
    for (const it of items) {
      const name = String(it?.item_name ?? '').trim().toLowerCase();
      if (!name) continue;
      const raw = quantities[name];
      const num = raw === '' || raw === undefined ? 0 : Number(raw);
      if (!Number.isFinite(num)) continue;
      const intQty = Math.trunc(num);
      if (intQty > 0) out.push({ item_name: name, count: intQty });
    }
    return out;
  }, [items, quantities]);

  const totalDemand = useMemo(() => demandedMaterials.reduce((s, r) => s + r.count, 0), [demandedMaterials]);

  const handleSubmitDemand = useCallback(() => {
    if (!complaintId) { toast.error('Complaint ID not found'); return; }
    if (demandedMaterials.length === 0) { toast.warning('At least one item quantity should be greater than 0'); return; }

    Alert.alert('Submit Demand', `Send material request for complaint #${complaintId}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Submit',
        onPress: async () => {
          try {
            setSubmitLoading(true);
            const token = await AsyncStorage.getItem(TOKEN_KEY);
            const res = await fetch(`${BASE_URL}/api/material_req/${complaintId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({ materials: demandedMaterials }),
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok || json.success === false) {
              throw new Error(json.message || 'Failed to submit material request');
            }
            toast.success('Material demand request submitted successfully');
            navigation.goBack();
          } catch (err) {
            console.log('material_req submit error:', err);
            toast.error(err?.message || 'Failed to submit demand');
          } finally {
            setSubmitLoading(false);
          }
        },
      },
    ]);
  }, [complaintId, demandedMaterials, navigation, toast]);

  const header = <AppBar title="Demand Items" subtitle={`Complaint #${complaintId ?? '-'}`} role="worker" onBack={() => navigation.goBack()} />;

  if (loading) {
    return (
      <Screen header={header}>
        <View style={{ padding: 16 }}>
          <SkeletonList count={5} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      header={header}
      scroll
      keyboardAvoiding
      onRefresh={() => fetchItems(true)}
      refreshing={refreshing}
      footer={
        <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface }}>
          <Button title="Submit Demand" icon="send" onPress={handleSubmitDemand} loading={submitLoading} disabled={items.length === 0} />
        </View>
      }
    >
      <Card style={{ marginBottom: 14 }} accentBar={colors.accent}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>TOTAL QUANTITY</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: '900', marginTop: 2 }}>{totalDemand}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '700' }}>{demandedMaterials.length} item(s)</Text>
          </View>
        </View>
      </Card>

      {items.length === 0 ? (
        <EmptyState icon="box" title="No items found" subtitle="There are no inventory items to demand." />
      ) : (
        <Card>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 10 }}>Items & Quantity</Text>
          {items.map((it, index) => {
            const itemName = String(it?.item_name ?? '').trim().toLowerCase();
            return (
              <View
                key={`${itemName}-${index}`}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingVertical: 10, borderBottomWidth: index === items.length - 1 ? 0 : 1, borderBottomColor: colors.border,
                }}
              >
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: colors.textPrimary, textTransform: 'capitalize' }}>{itemName}</Text>
                  <Text style={{ marginTop: 2, color: colors.textMuted, fontSize: 12 }}>Enter required quantity</Text>
                </View>
                <TextInput
                  style={{
                    width: 78, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
                    paddingHorizontal: 10, paddingVertical: 8, textAlign: 'center',
                    backgroundColor: colors.inputBg, fontWeight: '800', color: colors.textPrimary, fontSize: 16,
                  }}
                  value={quantities[itemName] ?? '0'}
                  onChangeText={(text) => onChangeQty(itemName, text)}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  maxLength={6}
                />
              </View>
            );
          })}
        </Card>
      )}
    </Screen>
  );
}

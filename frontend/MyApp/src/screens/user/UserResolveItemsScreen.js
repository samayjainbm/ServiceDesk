// src/screens/user/UserResolveItemsScreen.js
import { BASE_URL, TOKEN_KEY } from '../../../config';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme';
import { Screen, AppBar, Card, Button, Icon, SkeletonList, EmptyState, useToast } from '../../components/ui';

function Stepper({ value, max, onInc, onDec }) {
  const { colors, radius } = useTheme();
  const minusDisabled = value <= 0;
  const plusDisabled = value >= max;
  const round = (disabled, bg) => ({
    width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: bg, opacity: disabled ? 0.4 : 1,
  });
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Pressable onPress={onDec} disabled={minusDisabled} style={round(minusDisabled, colors.surfaceAlt)}>
        <Icon name="minus" size={18} color={colors.textPrimary} />
      </Pressable>
      <Text style={{ width: 34, textAlign: 'center', fontSize: 17, fontWeight: '900', color: colors.textPrimary }}>
        {value}
      </Text>
      <Pressable onPress={onInc} disabled={plusDisabled} style={round(plusDisabled, colors.primary)}>
        <Icon name="plus" size={18} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

export default function UserResolveItemsScreen({ route, navigation }) {
  const complaintId = route?.params?.complaintId ? String(route.params.complaintId) : '';
  const { colors } = useTheme();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState([]);

  const authHeaders = useCallback(async () => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const parseJson = async (res) => {
    const raw = await res.text();
    let data = null;
    try { data = raw ? JSON.parse(raw) : {}; } catch { data = null; }
    return { raw, data };
  };

  const normalizeItemsFromResponse = (data) => {
    const arr = Array.isArray(data?.used_items_list) ? data.used_items_list : [];
    return arr
      .map((row) => {
        const item_name = String(row?.item_name || '').trim();
        const max_count = Number(row?.used_count ?? 0);
        if (!item_name) { return null; }
        if (!Number.isFinite(max_count) || max_count <= 0) { return null; }
        return { item_name, max_count: Math.max(0, Math.trunc(max_count)), selected_count: 0 };
      })
      .filter(Boolean);
  };

  const fetchMaxItems = useCallback(async () => {
    if (!complaintId) {
      toast.error('complaintId missing');
      navigation.goBack();
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/complaints/used-items/${complaintId}`, {
        method: 'GET',
        headers: await authHeaders(),
      });
      const { raw, data } = await parseJson(res);
      if (!data) { throw new Error(`Non-JSON response (HTTP ${res.status})`); }
      if (!res.ok || data?.success === false) { throw new Error(data?.message || raw || `HTTP ${res.status}`); }
      setItems(normalizeItemsFromResponse(data));
    } catch (e) {
      toast.error(e?.message || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [complaintId, navigation, authHeaders, toast]);

  useEffect(() => { fetchMaxItems(); }, [fetchMaxItems]);

  const inc = (item_name) =>
    setItems((prev) => prev.map((item) =>
      item.item_name !== item_name ? item : item.selected_count >= item.max_count ? item : { ...item, selected_count: item.selected_count + 1 }));

  const dec = (item_name) =>
    setItems((prev) => prev.map((item) =>
      item.item_name !== item_name ? item : item.selected_count <= 0 ? item : { ...item, selected_count: item.selected_count - 1 }));

  const selectedItems = useMemo(
    () => items.filter((it) => Number(it.selected_count) > 0).map((it) => ({ item_name: it.item_name, count: it.selected_count })),
    [items]
  );
  const canSubmit = useMemo(() => selectedItems.length > 0, [selectedItems]);

  const onSubmitResolve = async () => {
    if (!canSubmit) { return toast.warning('Select at least one item with count > 0'); }
    try {
      setSubmitting(true);
      const used_items = selectedItems;
      const res = await fetch(`${BASE_URL}/api/resolved/${complaintId}`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ used_items }),
      });
      const { raw, data } = await parseJson(res);
      if (!data) { throw new Error(`Non-JSON response (HTTP ${res.status})`); }
      if (!res.ok || data?.success === false) { throw new Error(data?.message || raw || `HTTP ${res.status}`); }
      toast.success(data?.message || 'Resolved successfully');
      navigation.navigate('UserComplaintsScreen');
    } catch (e) {
      toast.error(e?.message || 'Resolve failed');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRow = ({ item }) => (
    <Card style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary, textTransform: 'capitalize' }}>
            {item.item_name}
          </Text>
          <Text style={{ marginTop: 2, color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>
            Max: {item.max_count ?? 0}
          </Text>
        </View>
        <Stepper
          value={item.selected_count ?? 0}
          max={item.max_count ?? 0}
          onInc={() => inc(item.item_name)}
          onDec={() => dec(item.item_name)}
        />
      </View>
    </Card>
  );

  const header = <AppBar title="Resolve Complaint" subtitle={`Complaint #${complaintId}`} role="user" onBack={() => navigation.goBack()} />;

  if (loading) {
    return (
      <Screen header={header}>
        <View style={{ padding: 16 }}>
          <SkeletonList count={4} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      header={header}
      padded={false}
      scroll={false}
      footer={
        <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface }}>
          <Button
            title="Submit & Resolve"
            icon="checkCircle"
            onPress={onSubmitResolve}
            loading={submitting}
            disabled={!canSubmit}
            accent={colors.success}
          />
        </View>
      }
    >
      <FlatList
        data={items}
        keyExtractor={(item) => item.item_name}
        renderItem={renderRow}
        contentContainerStyle={items.length === 0 ? { flexGrow: 1, justifyContent: 'center' } : { padding: 16 }}
        ListHeaderComponent={
          items.length ? (
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12 }}>
              Select the quantity of each item used to resolve this complaint.
            </Text>
          ) : null
        }
        ListEmptyComponent={<EmptyState icon="box" title="No allotted items" subtitle="There are no items to select for this complaint." />}
      />
    </Screen>
  );
}

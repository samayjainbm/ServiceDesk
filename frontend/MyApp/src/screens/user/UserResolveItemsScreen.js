// src/screens/user/UserResolveItemsScreen.js
import { BASE_URL, TOKEN_KEY } from "../../../config";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function UserResolveItemsScreen({ route, navigation }) {
  const complaintId = route?.params?.complaintId ? String(route.params.complaintId) : '';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // each item: { item_name, max_count, selected_count }
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
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = null;
    }
    return { raw, data };
  };

  const normalizeItemsFromResponse = (data) => {
    // expected:
    // {
    //   success: true,
    //   complaint_id: 5240,
    //   used_items: { a:10, b:10, c:20 },
    //   used_items_list: [
    //     { item_name: "a", used_count: 10 },
    //     { item_name: "b", used_count: 10 },
    //     { item_name: "c", used_count: 20 }
    //   ]
    // }

    const arr = Array.isArray(data?.used_items_list) ? data.used_items_list : [];

    return arr
      .map((row) => {
        const item_name = String(row?.item_name || '').trim();
        const max_count = Number(row?.used_count ?? 0);

        if (!item_name) {return null;}
        if (!Number.isFinite(max_count) || max_count <= 0) {return null;}

        return {
          item_name,
          max_count: Math.max(0, Math.trunc(max_count)),
          selected_count: 0,
        };
      })
      .filter(Boolean);
  };

  const fetchMaxItems = useCallback(async () => {
    if (!complaintId) {
      Alert.alert('Error', 'complaintId missing');
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
      if (!data) {throw new Error(`Non-JSON response (HTTP ${res.status})`);}

      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || raw || `HTTP ${res.status}`);
      }

      const normalizedItems = normalizeItemsFromResponse(data);
      setItems(normalizedItems);
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [complaintId, navigation, authHeaders]);

  useEffect(() => {
    fetchMaxItems();
  }, [fetchMaxItems]);

  const inc = (item_name) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.item_name !== item_name) {return item;}
        if (item.selected_count >= item.max_count) {return item;}
        return { ...item, selected_count: item.selected_count + 1 };
      })
    );
  };

  const dec = (item_name) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.item_name !== item_name) {return item;}
        if (item.selected_count <= 0) {return item;}
        return { ...item, selected_count: item.selected_count - 1 };
      })
    );
  };

  const selectedItems = useMemo(() => {
    return items
      .filter((item) => Number(item.selected_count) > 0)
      .map((item) => ({
        item_name: item.item_name,
        count: item.selected_count,
      }));
  }, [items]);

  const canSubmit = useMemo(() => {
    return selectedItems.length > 0;
  }, [selectedItems]);

  const onSubmitResolve = async () => {
    if (!canSubmit) {
      Alert.alert('Error', 'Select at least one item with count > 0');
      return;
    }

    try {
      setSubmitting(true);

      // ✅ only selected items with count > 0
      const used_items = selectedItems;

      const res = await fetch(`${BASE_URL}/api/resolved/${complaintId}`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ used_items }),
      });

      const { raw, data } = await parseJson(res);
      if (!data) {throw new Error(`Non-JSON response (HTTP ${res.status})`);}

      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || raw || `HTTP ${res.status}`);
      }

      Alert.alert('Done', data?.message || 'Resolved successfully');
      navigation.navigate('UserComplaintsScreen');
    } catch (e) {
      Alert.alert('Error', e?.message || 'Resolve failed');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRow = ({ item }) => {
    const mx = item.max_count ?? 0;
    const cur = item.selected_count ?? 0;

    const minusDisabled = cur <= 0;
    const plusDisabled = cur >= mx;

    return (
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemKey}>{item.item_name}</Text>
          <Text style={styles.itemMeta}>Max: {mx}</Text>
        </View>

        <View style={styles.counterWrap}>
          <TouchableOpacity
            style={[styles.btnSmall, styles.btnMinus, minusDisabled && styles.btnDisabled]}
            onPress={() => dec(item.item_name)}
            disabled={minusDisabled}
          >
            <Text style={styles.btnSmallText}>-</Text>
          </TouchableOpacity>

          <Text style={styles.count}>{cur}</Text>

          <TouchableOpacity
            style={[styles.btnSmall, styles.btnPlus, plusDisabled && styles.btnDisabled]}
            onPress={() => inc(item.item_name)}
            disabled={plusDisabled}
          >
            <Text style={styles.btnSmallText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.muted}>Loading items...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Used Items</Text>
      <Text style={styles.sub}>Complaint ID: {complaintId}</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.item_name}
        renderItem={renderRow}
        ListEmptyComponent={
          <View style={styles.centerEmpty}>
            <Text style={styles.muted}>No allotted items found</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 18, flexGrow: 1 }}
      />

      <TouchableOpacity
        style={[
          styles.submitBtn,
          (!canSubmit || submitting) && styles.btnDisabled,
        ]}
        onPress={onSubmitResolve}
        disabled={!canSubmit || submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Submit & Resolve</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  centerEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { marginTop: 8, color: '#6b7280' },

  container: { flex: 1, backgroundColor: '#fff', padding: 14 },
  title: { fontSize: 22, fontWeight: '900', color: '#111827' },
  sub: { marginTop: 6, marginBottom: 12, color: '#6b7280', fontWeight: '700' },

  row: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemKey: { fontSize: 16, fontWeight: '900', color: '#111827', textTransform: 'capitalize' },
  itemMeta: { marginTop: 2, color: '#6b7280', fontSize: 12, fontWeight: '700' },

  counterWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btnSmall: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnMinus: { backgroundColor: '#111827' },
  btnPlus: { backgroundColor: '#2563eb' },
  btnSmallText: { color: '#fff', fontSize: 20, fontWeight: '900' },
  count: { width: 40, textAlign: 'center', fontSize: 18, fontWeight: '900', color: '#111827' },
  btnDisabled: { opacity: 0.5 },

  submitBtn: { backgroundColor: '#16a34a', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
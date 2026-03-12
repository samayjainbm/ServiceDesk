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

// const BASE_URL = 'http://192.168.0.111:3000';
// const TOKEN_KEY = 'token'; // ✅ same token everywhere
const KEYS = 'abcdefghijklmnop'.split('');

export default function UserResolveItemsScreen({ route, navigation }) {
  const complaintId = route?.params?.complaintId ? String(route.params.complaintId) : '';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // max allowed from GET
  const [maxMap, setMaxMap] = useState(() =>
    Object.fromEntries(KEYS.map((k) => [k, 0]))
  );
  // current selected by user
  const [curMap, setCurMap] = useState(() =>
    Object.fromEntries(KEYS.map((k) => [k, 0]))
  );

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

      // ⚠️ API can return directly {a:1...} OR {used_items:{...}} OR {data:{...}}
      const maybe =
        data?.used_items ||
        data?.data ||
        data;

      const nextMax = {};
      for (const k of KEYS) {
        const v = maybe?.[k];
        nextMax[k] = Number(v ?? 0);
      }

      setMaxMap(nextMax);
      // start with all 0 (as you want)
      setCurMap(Object.fromEntries(KEYS.map((k) => [k, 0])));
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [complaintId, navigation, authHeaders]);

  useEffect(() => {
    fetchMaxItems();
  }, [fetchMaxItems]);

  const inc = (k) => {
    setCurMap((prev) => {
      const cur = prev[k] ?? 0;
      const mx = maxMap[k] ?? 0;
      if (cur >= mx) {return prev;}
      return { ...prev, [k]: cur + 1 };
    });
  };

  const dec = (k) => {
    setCurMap((prev) => {
      const cur = prev[k] ?? 0;
      if (cur <= 0) {return prev;}
      return { ...prev, [k]: cur - 1 };
    });
  };

  const canSubmit = useMemo(() => {
    // allow submit even if all 0 (your backend might accept)
    return true;
  }, []);

  const onSubmitResolve = async () => {
    if (!canSubmit) {return;}

    try {
      setSubmitting(true);

      // body must be strings
      const used_items = {};
      for (const k of KEYS) {used_items[k] = String(curMap[k] ?? 0);}

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

  const renderRow = ({ item: k }) => {
    const mx = maxMap[k] ?? 0;
    const cur = curMap[k] ?? 0;

    const minusDisabled = cur <= 0;
    const plusDisabled = cur >= mx;

    return (
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemKey}>{k.toUpperCase()}</Text>
          <Text style={styles.itemMeta}>Max: {mx}</Text>
        </View>

        <View style={styles.counterWrap}>
          <TouchableOpacity
            style={[styles.btnSmall, styles.btnMinus, minusDisabled && styles.btnDisabled]}
            onPress={() => dec(k)}
            disabled={minusDisabled}
          >
            <Text style={styles.btnSmallText}>-</Text>
          </TouchableOpacity>

          <Text style={styles.count}>{cur}</Text>

          <TouchableOpacity
            style={[styles.btnSmall, styles.btnPlus, plusDisabled && styles.btnDisabled]}
            onPress={() => inc(k)}
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
        data={KEYS}
        keyExtractor={(k) => k}
        renderItem={renderRow}
        contentContainerStyle={{ paddingBottom: 18 }}
      />

      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.btnDisabled]}
        onPress={onSubmitResolve}
        disabled={submitting}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit & Resolve</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
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
  itemKey: { fontSize: 16, fontWeight: '900', color: '#111827' },
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

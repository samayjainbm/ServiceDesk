// screens/ReturnItemsScreen.js
import React, { useCallback, useMemo, useState } from 'react';
import { BASE_URL } from '../../../../config';
import { View, Text, TextInput, Pressable, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../theme';
import { Screen, AppBar, Card, Button, Icon, EmptyState, useToast } from '../../../components/ui';

function Stepper({ value, max, onInc, onDec, disabled }) {
  const { colors, radius } = useTheme();
  const minusDisabled = value <= 0 || disabled;
  const plusDisabled = value >= max || disabled;
  const round = (d, bg) => ({ width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: bg, opacity: d ? 0.4 : 1 });
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Pressable onPress={onDec} disabled={minusDisabled} style={round(minusDisabled, colors.surfaceAlt)}>
        <Icon name="minus" size={16} color={colors.textPrimary} />
      </Pressable>
      <Text style={{ width: 30, textAlign: 'center', fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>{value}</Text>
      <Pressable onPress={onInc} disabled={plusDisabled} style={round(plusDisabled, colors.primary)}>
        <Icon name="plus" size={16} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

export default function ReturnItemsScreen({ route, navigation }) {
  const prefilledWorkerId = route?.params?.workerId ? String(route.params.workerId) : '';
  const { colors, radius } = useTheme();
  const toast = useToast();

  const [workerId, setWorkerId] = useState(prefilledWorkerId);
  const [workerData, setWorkerData] = useState(null);
  const [rows, setRows] = useState([]);
  const [loadingDebt, setLoadingDebt] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchWorkerDebt = useCallback(async () => {
    try {
      const parsedWorkerId = Number(workerId);
      if (!Number.isInteger(parsedWorkerId) || parsedWorkerId <= 0) { return toast.warning('Enter a valid Worker ID'); }

      setLoadingDebt(true);
      setWorkerData(null);
      setRows([]);

      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/returned/worker-debt?worker_id=${parsedWorkerId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();
      if (!res.ok || !data.success) { throw new Error(data.message || 'Failed to fetch worker debt'); }

      setWorkerData({
        worker_id: data.worker_id,
        worker_name: data.worker_name,
        total_debt_item_units: data.total_debt_item_units,
        total_material_types_in_debt: data.total_material_types_in_debt,
      });
      setRows(Array.isArray(data.data) ? data.data.map((row) => ({
        item_name: String(row.item_name || '').toLowerCase(),
        max_debt_count: Number(row.max_debt_count ?? 0),
        selected_return_count: Number(row.selected_return_count ?? 0),
      })) : []);
    } catch (err) {
      console.error('fetchWorkerDebt error:', err);
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoadingDebt(false);
    }
  }, [workerId, toast]);

  const incrementCount = (itemName) => setRows((prev) => prev.map((row) => {
    if (row.item_name !== itemName) return row;
    const current = Number(row.selected_return_count ?? 0); const max = Number(row.max_debt_count ?? 0);
    return current >= max ? row : { ...row, selected_return_count: current + 1 };
  }));
  const decrementCount = (itemName) => setRows((prev) => prev.map((row) => {
    if (row.item_name !== itemName) return row;
    const current = Number(row.selected_return_count ?? 0);
    return current <= 0 ? row : { ...row, selected_return_count: current - 1 };
  }));
  const setAllMax = () => setRows((prev) => prev.map((row) => ({ ...row, selected_return_count: Number(row.max_debt_count ?? 0) })));
  const setAllZero = () => setRows((prev) => prev.map((row) => ({ ...row, selected_return_count: 0 })));

  const payload = useMemo(() => rows.map((row) => ({ item_name: row.item_name, return_count: Number(row.selected_return_count ?? 0) })), [rows]);
  const totalSelectedReturn = useMemo(() => payload.reduce((sum, row) => sum + (Number(row.return_count) || 0), 0), [payload]);
  const nonZeroSelectedMaterials = useMemo(() => payload.filter((row) => row.return_count > 0).length, [payload]);

  const handleReturnItems = async () => {
    try {
      const parsedWorkerId = Number(workerId);
      if (!Number.isInteger(parsedWorkerId) || parsedWorkerId <= 0) { return toast.warning('Enter a valid Worker ID'); }
      if (!Array.isArray(rows) || rows.length === 0) { return toast.warning('Fetch worker debt first.'); }
      if (totalSelectedReturn <= 0) { return toast.warning('At least one item should have return count > 0.'); }
      for (const row of rows) {
        const selected = Number(row.selected_return_count ?? 0); const max = Number(row.max_debt_count ?? 0);
        if (!Number.isInteger(selected) || selected < 0) { return toast.warning(`Invalid return count for ${row.item_name}`); }
        if (selected > max) { return toast.warning(`Return count exceeds debt for ${row.item_name}`); }
      }

      setSubmitting(true);
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/returned/bulk?worker_id=${parsedWorkerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { throw new Error(data.message || 'Failed to return items'); }
      toast.success(data.message || 'Items returned successfully.');
      fetchWorkerDebt();
    } catch (err) {
      console.error('handleReturnItems error:', err);
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRow = ({ item }) => {
    const max = Number(item.max_debt_count ?? 0);
    return (
      <Card style={{ marginBottom: 10, opacity: max === 0 ? 0.6 : 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: colors.textPrimary, textTransform: 'capitalize' }}>{item.item_name}</Text>
            <Text style={{ marginTop: 2, fontSize: 12, color: colors.textMuted, fontWeight: '700' }}>Max debt: {max}</Text>
          </View>
          <Stepper value={Number(item.selected_return_count ?? 0)} max={max} disabled={submitting} onInc={() => incrementCount(item.item_name)} onDec={() => decrementCount(item.item_name)} />
        </View>
      </Card>
    );
  };

  const Head = (
    <View style={{ marginBottom: 14 }}>
      <Card style={{ marginBottom: 12 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 10 }}>Enter a Worker ID and load their material debt.</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput
            style={{ flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.inputBg, color: colors.textPrimary, fontWeight: '700', fontSize: 16 }}
            value={workerId}
            onChangeText={(t) => setWorkerId(t.replace(/[^0-9]/g, ''))}
            placeholder="e.g. 201"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            editable={!loadingDebt && !submitting}
          />
          <Button title="Load" onPress={fetchWorkerDebt} loading={loadingDebt} fullWidth={false} style={{ width: 100 }} />
        </View>
      </Card>

      {workerData && (
        <>
          <Card style={{ marginBottom: 12 }} accentBar={colors.accent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>{workerData.worker_name || 'Unknown Worker'}</Text>
                <Text style={{ marginTop: 2, fontSize: 13, color: colors.textSecondary }}>ID: {workerData.worker_id}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '700' }}>Types: {workerData.total_material_types_in_debt}</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '700', marginTop: 2 }}>Units: {workerData.total_debt_item_units}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
              <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '700' }}>Selected: {nonZeroSelectedMaterials} · Units: {totalSelectedReturn}</Text>
            </View>
          </Card>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title="All = Max" variant="secondary" size="sm" fullWidth={false} onPress={setAllMax} style={{ flex: 1 }} />
            <Button title="All = 0" variant="ghost" size="sm" fullWidth={false} onPress={setAllZero} style={{ flex: 1 }} />
          </View>
        </>
      )}
    </View>
  );

  return (
    <Screen
      header={<AppBar title="Return Items" subtitle="Inventory" role="inventory" onBack={() => navigation.goBack()} />}
      padded={false}
      scroll={false}
      keyboardAvoiding
      footer={
        rows.length > 0 ? (
          <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface }}>
            <Button title="Return" icon="check" onPress={handleReturnItems} loading={submitting} accent={colors.success} />
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
        ListEmptyComponent={!loadingDebt ? <EmptyState icon="box" title="Load a worker" subtitle="Enter a Worker ID above to see item-wise debt." compact /> : null}
      />
    </Screen>
  );
}

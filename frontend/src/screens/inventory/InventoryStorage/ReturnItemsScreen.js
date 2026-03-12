// screens/ReturnItemsScreen.js
import React, { useCallback, useMemo, useState } from 'react';
import { BASE_URL, TOKEN_KEY } from "../../../../config";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ If adb reverse is set
// const BASE_URL = 'http://localhost:3000';

// ✅ Or your Wi-Fi IP
// const BASE_URL = 'http://192.168.0.111:3000';

export default function ReturnItemsScreen({ route }) {
  const prefilledWorkerId = route?.params?.workerId
    ? String(route.params.workerId)
    : '';

  const [workerId, setWorkerId] = useState(prefilledWorkerId);
  const [workerData, setWorkerData] = useState(null);
  const [rows, setRows] = useState([]);
  const [loadingDebt, setLoadingDebt] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchWorkerDebt = useCallback(async () => {
    try {
      const parsedWorkerId = Number(workerId);

      if (!Number.isInteger(parsedWorkerId) || parsedWorkerId <= 0) {
        return Alert.alert('Validation', 'Enter a valid Worker ID');
      }

      setLoadingDebt(true);
      setWorkerData(null);
      setRows([]);

      const token = await AsyncStorage.getItem('token');

      const res = await fetch(
        `${BASE_URL}/api/returned/worker-debt?worker_id=${parsedWorkerId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch worker debt');
      }

      setWorkerData({
        worker_id: data.worker_id,
        worker_name: data.worker_name,
        total_debt_item_units: data.total_debt_item_units,
        total_material_types_in_debt: data.total_material_types_in_debt,
      });

      const safeRows = Array.isArray(data.data)
        ? data.data.map((row) => ({
            item_name: String(row.item_name || '').toLowerCase(),
            max_debt_count: Number(row.max_debt_count ?? 0),
            selected_return_count: Number(row.selected_return_count ?? 0),
          }))
        : [];

      setRows(safeRows);
    } catch (err) {
      console.error('fetchWorkerDebt error:', err);
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setLoadingDebt(false);
    }
  }, [workerId]);

  const incrementCount = (itemName) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.item_name !== itemName) return row;
        const current = Number(row.selected_return_count ?? 0);
        const max = Number(row.max_debt_count ?? 0);
        if (current >= max) return row;
        return { ...row, selected_return_count: current + 1 };
      })
    );
  };

  const decrementCount = (itemName) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.item_name !== itemName) return row;
        const current = Number(row.selected_return_count ?? 0);
        if (current <= 0) return row;
        return { ...row, selected_return_count: current - 1 };
      })
    );
  };

  const setAllMax = () => {
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        selected_return_count: Number(row.max_debt_count ?? 0),
      }))
    );
  };

  const setAllZero = () => {
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        selected_return_count: 0,
      }))
    );
  };

  const payload = useMemo(() => {
    return rows.map((row) => ({
      item_name: row.item_name,
      return_count: Number(row.selected_return_count ?? 0),
    }));
  }, [rows]);

  const totalSelectedReturn = useMemo(() => {
    return payload.reduce((sum, row) => sum + (Number(row.return_count) || 0), 0);
  }, [payload]);

  const nonZeroSelectedMaterials = useMemo(() => {
    return payload.filter((row) => row.return_count > 0).length;
  }, [payload]);

  // ✅ NEEche wale Return button se ye API call hoti hai:
  // PUT /api/returned/bulk?worker_id=...
  const handleReturnItems = async () => {
    try {
      const parsedWorkerId = Number(workerId);

      if (!Number.isInteger(parsedWorkerId) || parsedWorkerId <= 0) {
        return Alert.alert('Validation', 'Enter a valid Worker ID');
      }

      if (!Array.isArray(rows) || rows.length === 0) {
        return Alert.alert('Validation', 'Fetch worker debt first.');
      }

      if (totalSelectedReturn <= 0) {
        return Alert.alert(
          'Validation',
          'At least one item should have return count > 0.'
        );
      }

      for (const row of rows) {
        const selected = Number(row.selected_return_count ?? 0);
        const max = Number(row.max_debt_count ?? 0);

        if (!Number.isInteger(selected) || selected < 0) {
          return Alert.alert(
            'Validation',
            `Invalid selected return count for item ${row.item_name}`
          );
        }

        if (selected > max) {
          return Alert.alert(
            'Validation',
            `Selected return count exceeds debt for item ${row.item_name}`
          );
        }
      }

      setSubmitting(true);

      const token = await AsyncStorage.getItem('token');

      const res = await fetch(
        `${BASE_URL}/api/returned/bulk?worker_id=${parsedWorkerId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to return items');
      }

      Alert.alert('Success', data.message || 'Items returned successfully.', [
        {
          text: 'OK',
          onPress: () => {
            fetchWorkerDebt(); // latest debt reload
          },
        },
      ]);
    } catch (err) {
      console.error('handleReturnItems error:', err);
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRow = ({ item }) => {
    const selected = Number(item.selected_return_count ?? 0);
    const max = Number(item.max_debt_count ?? 0);

    const minusDisabled = selected <= 0 || submitting;
    const plusDisabled = selected >= max || submitting;
    const noDebt = max === 0;

    return (
      <View style={[styles.itemRow, noDebt && styles.itemRowNoDebt]}>
        <View style={styles.itemLeft}>
          <Text style={styles.itemName}>{String(item.item_name).toUpperCase()}</Text>
          <Text style={styles.itemMeta}>Max Debt: {max}</Text>
        </View>

        <View style={styles.counterWrap}>
          <TouchableOpacity
            style={[styles.counterBtn, minusDisabled && styles.counterBtnDisabled]}
            onPress={() => decrementCount(item.item_name)}
            disabled={minusDisabled}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.counterBtnText,
                minusDisabled && styles.counterBtnTextDisabled,
              ]}
            >
              -
            </Text>
          </TouchableOpacity>

          <View style={styles.counterValueBox}>
            <Text style={styles.counterValue}>{selected}</Text>
          </View>

          <TouchableOpacity
            style={[styles.counterBtn, plusDisabled && styles.counterBtnDisabled]}
            onPress={() => incrementCount(item.item_name)}
            disabled={plusDisabled}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.counterBtnText,
                plusDisabled && styles.counterBtnTextDisabled,
              ]}
            >
              +
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={rows}
          keyExtractor={(item, index) => `${item.item_name}-${index}`}
          renderItem={renderRow}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <View style={styles.topCard}>
                <Text style={styles.title}>Return Items</Text>
                <Text style={styles.subtitle}>
                  Enter Worker ID and load debt. Use +/- to set return quantities.
                </Text>

                <Text style={styles.inputLabel}>Worker ID</Text>
                <View style={styles.searchRow}>
                  <TextInput
                    style={styles.input}
                    value={workerId}
                    onChangeText={(text) => setWorkerId(text.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 201"
                    keyboardType="numeric"
                    editable={!loadingDebt && !submitting}
                  />

                  <TouchableOpacity
                    style={[
                      styles.loadBtn,
                      (loadingDebt || submitting) && styles.loadBtnDisabled,
                    ]}
                    onPress={fetchWorkerDebt}
                    disabled={loadingDebt || submitting}
                    activeOpacity={0.85}
                  >
                    {loadingDebt ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.loadBtnText}>Load</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {workerData && (
                <>
                  <View style={styles.workerCard}>
                    <View style={styles.workerLeft}>
                      <Text style={styles.workerName}>
                        {workerData.worker_name || 'Unknown Worker'}
                      </Text>
                      <Text style={styles.workerId}>ID: {workerData.worker_id}</Text>
                    </View>

                    <View style={styles.workerStatsRight}>
                      <Text style={styles.workerStatText}>
                        Types: {workerData.total_material_types_in_debt}
                      </Text>
                      <Text style={styles.workerStatText}>
                        Units: {workerData.total_debt_item_units}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.summaryBox}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Selected Materials</Text>
                      <Text style={styles.summaryValue}>{nonZeroSelectedMaterials}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Total Return Units</Text>
                      <Text style={styles.summaryValue}>{totalSelectedReturn}</Text>
                    </View>
                  </View>

                  <View style={styles.quickActions}>
                    <TouchableOpacity
                      style={styles.secondaryBtn}
                      onPress={setAllMax}
                      disabled={submitting}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.secondaryBtnText}>Set All = Max Debt</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.secondaryBtn}
                      onPress={setAllZero}
                      disabled={submitting}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.secondaryBtnText}>Set All = 0</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.sectionTitle}>Material-wise Return Counters</Text>
                </>
              )}
            </>
          }
          ListEmptyComponent={
            !loadingDebt ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>
                  Load a worker to see item-wise debt counters.
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            rows.length > 0 ? (
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (submitting || loadingDebt) && styles.submitBtnDisabled,
                ]}
                onPress={handleReturnItems} // ✅ THIS calls /api/returned/bulk
                disabled={submitting || loadingDebt}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Return</Text>
                )}
              </TouchableOpacity>
            ) : null
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  listContent: {
    paddingBottom: 24,
  },

  topCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },

  inputLabel: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  loadBtn: {
    minWidth: 90,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadBtnDisabled: {
    opacity: 0.7,
  },
  loadBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  workerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  workerLeft: {
    flex: 1,
    paddingRight: 10,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  workerId: {
    marginTop: 4,
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  workerStatsRight: {
    alignItems: 'flex-end',
  },
  workerStatText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '700',
    marginTop: 2,
  },

  summaryBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  summaryLabel: {
    color: '#4b5563',
    fontWeight: '600',
  },
  summaryValue: {
    color: '#111827',
    fontWeight: '800',
  },

  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryBtnText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 12,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 10,
  },

  itemRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  itemRowNoDebt: {
    opacity: 0.75,
  },
  itemLeft: {
    flex: 1,
    paddingRight: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  itemMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },

  counterWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  counterBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnDisabled: {
    backgroundColor: '#f3f4f6',
  },
  counterBtnText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 22,
  },
  counterBtnTextDisabled: {
    color: '#9ca3af',
  },
  counterValueBox: {
    minWidth: 42,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1f2937',
  },

  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 2,
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
  },

  submitBtn: {
    marginTop: 14,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
// frontend/screens/worker/workerDebtScreen.js
import React, { useCallback, useEffect, useState } from "react";
import { BASE_URL } from "../../../config";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = BASE_URL; // ✅ works with adb reverse

export default function WorkerDebtScreen({ route, navigation }) {
  const workerIdFromParams = route?.params?.worker_id;
  const [workerId, setWorkerId] = useState(workerIdFromParams);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const fetchDebt = useCallback(
    async ({ isRefresh = false } = {}) => {
      try {
        setError("");
        if (!workerId) {
          setError("worker_id missing. Pass it in navigation params.");
          setData(null);
          return;
        }

        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const token = await AsyncStorage.getItem("token"); // adjust key if different
        if (!token) {
          setError("Token missing. Please login again.");
          setData(null);
          return;
        }

        const res = await fetch(`${API_BASE}/api/worker/debt/${workerId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();

        if (!res.ok) {
          setError(json?.message || "Failed to fetch debt");
          setData(null);
          return;
        }

        setData(json);
      } catch (e) {
        setError(e?.message || "Something went wrong");
        setData(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [workerId]
  );

  useEffect(() => {
    setWorkerId(workerIdFromParams);
  }, [workerIdFromParams]);

  useEffect(() => {
    fetchDebt();
  }, [fetchDebt]);

  const onRefresh = () => fetchDebt({ isRefresh: true });

  const renderItem = ({ item }) => {
    return (
      <View style={styles.row}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{String(item.item_name).toUpperCase()}</Text>
        </View>

        <Text style={styles.itemText}>Item {item.item_name}</Text>

        <View style={styles.countPill}>
          <Text style={styles.countText}>{item.count}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.helperText}>Loading worker debt...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Worker Debt</Text>

      {!!error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchDebt()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {data && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Worker ID</Text>
            <Text style={styles.summaryValue}>{data.worker_id}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Non-zero items</Text>
            <Text style={styles.summaryValue}>{data.total_non_zero_items}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total count</Text>
            <Text style={styles.summaryValue}>{data.total_count}</Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Items</Text>

      <FlatList
        data={data?.items || []}
        keyExtractor={(item, idx) => `${item.item_name}-${idx}`}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No pending debt 🎉</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#0b0b0b" },
  title: { fontSize: 22, fontWeight: "700", color: "white", marginBottom: 12 },

  sectionTitle: { fontSize: 16, fontWeight: "700", color: "white", marginTop: 8, marginBottom: 8 },

  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16 },
  helperText: { marginTop: 10, color: "#bdbdbd" },

  summaryCard: {
    backgroundColor: "#151515",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#232323",
    marginBottom: 12,
  },
  summaryTitle: { color: "white", fontSize: 16, fontWeight: "700", marginBottom: 10 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  summaryLabel: { color: "#bdbdbd" },
  summaryValue: { color: "white", fontWeight: "700" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#121212",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#232323",
    marginBottom: 10,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#1f1f1f",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#2c2c2c",
  },
  badgeText: { color: "white", fontWeight: "800" },
  itemText: { flex: 1, color: "white", fontSize: 14, fontWeight: "600" },
  countPill: {
    minWidth: 46,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#1f1f1f",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2c2c2c",
  },
  countText: { color: "white", fontWeight: "800" },

  emptyBox: { padding: 18, backgroundColor: "#121212", borderRadius: 12, borderWidth: 1, borderColor: "#232323" },
  emptyText: { color: "#bdbdbd", textAlign: "center" },

  errorBox: {
    backgroundColor: "#2a1212",
    borderColor: "#4a1f1f",
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: { color: "#ffb4b4", marginBottom: 10 },
  retryBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#3a1a1a",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#5a2a2a",
  },
  retryText: { color: "white", fontWeight: "700" },
});
// AssignWorkerScreen.js (NO red line warning)
import React, { useEffect, useState } from "react";
import { BASE_URL, TOKEN_KEY } from "../../../../../config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

// const BASE_URL = "http://192.168.0.111:3000";

export default function AssignWorkerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { complaint_id } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const [workers, setWorkers] = useState([]);
  const [selected, setSelected] = useState(null);

  // ✅ ONLY assign API outside (no dependency issues)
  const assignWorker = async () => {
    try {
      if (!selected?.worker_id) {
        Alert.alert("Select Worker", "Please select a worker first.");
        return;
      }

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Login required", "Token missing. Please login again.");
        return;
      }

      setAssigning(true);

      const url = `${BASE_URL}/api/assign_worker/${complaint_id}/confirm/${selected.worker_id}`;

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || json?.success === false) {
        Alert.alert("Failed", json?.message || "Could not assign worker");
        return;
      }

      Alert.alert("Success", json?.message || "Worker assigned successfully!");
      navigation.goBack();
    } catch (e) {
      console.log("assignWorker error:", e);
      Alert.alert("Network Error", "Backend not reachable");
    } finally {
      setAssigning(false);
    }
  };

  // ✅ fetchWorkers INSIDE useEffect => no lint warning
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        if (!complaint_id) {
          Alert.alert("Error", "complaint_id missing");
          setLoading(false);
          return;
        }

        const token = await AsyncStorage.getItem("token");
        if (!token) {
          Alert.alert("Login required", "Token missing. Please login again.");
          setLoading(false);
          return;
        }

        const res = await fetch(`${BASE_URL}/api/show_worker_to_assign`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();

        if (!res.ok || json?.success === false) {
          Alert.alert("Error", json?.message || "Failed to fetch workers");
          setLoading(false);
          return;
        }

        setWorkers(Array.isArray(json.data) ? json.data : []);
      } catch (e) {
        console.log("fetchWorkers error:", e);
        Alert.alert("Network Error", "Backend not reachable");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    fetchWorkers();
  }, [complaint_id]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Login required", "Token missing. Please login again.");
        return;
      }

      const res = await fetch(`${BASE_URL}/api/show_worker_to_assign`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();

      if (!res.ok || json?.success === false) {
        Alert.alert("Error", json?.message || "Failed to fetch workers");
        return;
      }

      setWorkers(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      console.log("refresh error:", e);
      Alert.alert("Network Error", "Backend not reachable");
    } finally {
      setRefreshing(false);
    }
  };

  const renderItem = ({ item }) => {
    const isSelected = selected?.worker_id === item.worker_id;
    const name = item.worker?.name || "—";
    const designation = item.worker?.designation || "—";
    const tasks = item.alloted_task ?? 0;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.rowCard, isSelected && styles.rowCardSelected]}
        onPress={() => setSelected(item)}
      >
        <View style={styles.left}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.designation}>{designation}</Text>
        </View>

        <View style={styles.right}>
          <Text style={styles.taskLabel}>Assigned</Text>
          <Text style={styles.taskCount}>{tasks}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Worker</Text>
        <Text style={styles.subtitle}>Complaint #{complaint_id}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading workers…</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={workers}
            keyExtractor={(it) => String(it.worker_id)}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.empty}>No workers found</Text>
              </View>
            }
          />

          <View style={styles.bottomBar}>
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedTitle}>
                {selected
                  ? `Selected: ${selected.worker?.name} (${selected.worker?.designation})`
                  : "Select a worker"}
              </Text>
              {selected && (
                <Text style={styles.selectedSub}>
                  Assigned tasks: {selected.alloted_task ?? 0} • Worker ID: {selected.worker_id}
                </Text>
              )}
            </View>

            <TouchableOpacity
              disabled={!selected || assigning}
              onPress={assignWorker}
              activeOpacity={0.85}
              style={[styles.assignBtn, (!selected || assigning) && styles.assignBtnDisabled]}
            >
              <Text style={styles.assignBtnText}>{assigning ? "Assigning..." : "Assign Task"}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f3f3" },

  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  title: { fontSize: 28, fontWeight: "800", color: "#1f2937" },
  subtitle: { marginTop: 4, fontSize: 14, color: "#6b7280" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  loadingText: { marginTop: 10, fontSize: 14, color: "#6b7280" },
  empty: { fontSize: 16, color: "#6b7280", textAlign: "center" },

  rowCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "transparent",
  },
  rowCardSelected: { borderColor: "#77aebe", shadowOpacity: 0.14, elevation: 4 },

  left: { flex: 1, paddingRight: 12 },
  name: { fontSize: 18, fontWeight: "800", color: "#111827" },
  designation: { marginTop: 4, fontSize: 14, fontWeight: "700", color: "#6b7280" },

  right: {
    width: 86,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 10,
    backgroundColor: "#eef6f8",
  },
  taskLabel: { fontSize: 12, fontWeight: "800", color: "#374151" },
  taskCount: { marginTop: 2, fontSize: 20, fontWeight: "900", color: "#111827" },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  selectedTitle: { fontSize: 14, fontWeight: "800", color: "#111827" },
  selectedSub: { marginTop: 2, fontSize: 12, color: "#6b7280" },

  assignBtn: {
    backgroundColor: "#77aebe",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
  },
  assignBtnDisabled: { opacity: 0.5 },
  assignBtnText: { color: "#eaf3f6", fontWeight: "900" },
});
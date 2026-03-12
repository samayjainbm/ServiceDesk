// ComplaintDetails.js (Details + Toggle Delayed/Ongoing button)
import React, { useCallback, useEffect, useState } from "react";
import { BASE_URL, TOKEN_KEY } from "../../../../../config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";

// ✅ Prefer localhost if using adb reverse tcp:3000 tcp:3000
// const BASE_URL = "http://localhost:3000";

// ✅ Otherwise use your laptop IP
// const BASE_URL = "http://192.168.0.111:3000";

export default function ComplaintDetailsScreenForOngoing_Delayed() {
  const route = useRoute();
  const navigation = useNavigation();
  const complaint_id = route?.params?.complaint_id;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [item, setItem] = useState(null);
  const [toggling, setToggling] = useState(false);

  const fetchDetails = useCallback(async () => {
    try {
      if (!complaint_id) {
        Alert.alert("Error", "complaint_id missing");
        return;
      }

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Login required", "Token missing. Please login again.");
        return;
      }

      const res = await fetch(`${BASE_URL}/api/assigned_details/${complaint_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      let json = {};
      try {
        json = await res.json();
      } catch {
        json = {};
      }

      if (!res.ok || json?.success === false) {
        Alert.alert("Error", json?.message || "Failed to load complaint details");
        return;
      }

      setItem(json?.data || null);
    } catch (e) {
      console.log("fetchDetails error:", e);
      Alert.alert("Network Error", "Backend not reachable");
    }
  }, [complaint_id]);

  useEffect(() => {
    (async () => {
      try {
        await fetchDetails();
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchDetails]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchDetails();
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusStyle = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "ongoing") return styles.badgeOngoing;
    if (s === "delayed") return styles.badgeDelayed;
    if (s === "completed") return styles.badgeCompleted;
    return styles.badgeDefault;
  };

  const isToggleAllowed = (status) => {
    const s = String(status || "").toLowerCase();
    return s === "ongoing" || s === "delayed";
  };

  const getToggleButtonLabel = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "delayed") return "Change to Ongoing";
    if (s === "ongoing") return "Change to Delayed";
    return "Status Toggle Not Allowed";
  };

  const toggleComplaintStatus = async () => {
    try {
      if (!item?.complaint_id) {
        Alert.alert("Error", "Complaint ID not found");
        return;
      }

      if (!isToggleAllowed(item.status)) {
        Alert.alert("Not Allowed", "Only ongoing/delayed complaints can be toggled.");
        return;
      }

      if (toggling) return;
      setToggling(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Login required", "Token missing. Please login again.");
        return;
      }

      const res = await fetch(`${BASE_URL}/api/toggle_complaint_status/${item.complaint_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      let json = {};
      try {
        json = await res.json();
      } catch {
        json = {};
      }

      if (!res.ok || json?.success === false) {
        Alert.alert("Error", json?.message || "Failed to toggle complaint status");
        return;
      }

      // ✅ Try backend status from common response shapes
      const backendStatus =
        json?.data?.status ??
        json?.status ??
        json?.data?.complaint?.status ??
        null;

      setItem((prev) => {
        if (!prev) return prev;

        const current = String(prev.status || "").toLowerCase();
        const fallbackNext =
          current === "delayed"
            ? "ongoing"
            : current === "ongoing"
            ? "delayed"
            : current;

        return {
          ...prev,
          status: backendStatus || fallbackNext,
        };
      });

      // Optional:
      // Alert.alert("Success", json?.message || "Status toggled");

      // If backend sends extra updated fields and you want exact data, uncomment:
      // await fetchDetails();
    } catch (e) {
      console.log("toggleComplaintStatus error:", e);
      Alert.alert("Network Error", "Could not toggle complaint status");
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading complaint details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>No complaint details found.</Text>

          <TouchableOpacity style={styles.retryBtn} onPress={fetchDetails} activeOpacity={0.85}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const canToggle = isToggleAllowed(item.status);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Complaint Detail</Text>

        <View style={styles.card}>
          <View style={styles.topRow}>
            <Text style={styles.complaintId}>#{item.complaint_id}</Text>
            <View style={[styles.badge, getStatusStyle(item.status)]}>
              <Text style={styles.badgeText}>
                {String(item.status || "unknown").toUpperCase()}
              </Text>
            </View>
          </View>

          {/* ✅ Toggle status button */}
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              !canToggle && styles.toggleBtnDisabled,
              toggling && styles.toggleBtnDisabled,
            ]}
            activeOpacity={0.85}
            disabled={!canToggle || toggling}
            onPress={toggleComplaintStatus}
          >
            <Text style={styles.toggleBtnText}>
              {toggling ? "Changing..." : getToggleButtonLabel(item.status)}
            </Text>
          </TouchableOpacity>

          {!canToggle ? (
            <Text style={styles.toggleHint}>
              Only ongoing/delayed complaints can be toggled.
            </Text>
          ) : null}

          <Field label="Phone Number" value={item.phone_number} />
          <Field label="Address" value={item.address} />
          <Field label="Description" value={item.description} multiline />
          <Field label="Worker ID" value={item.worker_id != null ? String(item.worker_id) : "—"} />
        </View>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, multiline = false }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, multiline && styles.valueMultiline]}>
        {value != null && String(value).trim() !== "" ? String(value) : "—"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f3f3" },

  scrollContent: {
    padding: 16,
    paddingBottom: 28,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  loadingText: {
    marginTop: 10,
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "600",
  },

  emptyText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 14,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1f2937",
    marginBottom: 14,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },

  complaintId: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111827",
    flex: 1,
  },

  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.6,
  },
  badgeOngoing: { backgroundColor: "#2e7d32" },
  badgeDelayed: { backgroundColor: "#b45309" },
  badgeCompleted: { backgroundColor: "#2563eb" },
  badgeDefault: { backgroundColor: "#6b7280" },

  // ✅ New toggle button styles
  toggleBtn: {
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: "#77aebe",
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  toggleBtnDisabled: {
    backgroundColor: "#cbd5e1",
  },
  toggleBtnText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  toggleHint: {
    marginBottom: 4,
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "700",
  },

  fieldWrap: {
    marginTop: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  label: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: 0.4,
  },

  value: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "700",
  },

  valueMultiline: {
    lineHeight: 21,
  },

  retryBtn: {
    backgroundColor: "#77aebe",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    color: "#eaf3f6",
    fontWeight: "900",
  },

  backBtn: {
    marginTop: 14,
    backgroundColor: "#9ca3af",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  backBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
  },
});
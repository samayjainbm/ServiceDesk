// AssignedComplaintsScreen.js (NO DateTimePicker, manual date inputs + toggle status API)



import { BASE_URL, TOKEN_KEY } from "../../../../../config";
import React, { useEffect, useMemo, useState } from "react";
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
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

// ✅ Prefer localhost with adb reverse tcp:3000 tcp:3000
// const BASE_URL = "http://localhost:3000";

// ✅ If localhost not working, use Wi-Fi IP
// const BASE_URL = "http://192.168.0.111:3000";

export default function AssignedComplaintsScreen() {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [rawItems, setRawItems] = useState([]); // [{ complaint_id, status, start_date }]
  const [statusFilter, setStatusFilter] = useState("all"); // all | ongoing | delayed

  // manual input strings: YYYY-MM-DD
  const [fromDateText, setFromDateText] = useState("");
  const [toDateText, setToDateText] = useState("");

  // prevent repeated taps while toggling
  const [togglingIds, setTogglingIds] = useState({}); // { [complaint_id]: true/false }

  const fetchAssigned = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Login required", "Token missing. Please login again.");
        return;
      }

      const res = await fetch(`${BASE_URL}/api/assigned_ids`, {
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
        Alert.alert("Error", json?.message || "Failed to load assigned complaints");
        return;
      }

      setRawItems(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      console.log("fetchAssigned error:", e);
      Alert.alert("Network Error", "Backend not reachable");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await fetchAssigned();
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    })();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchAssigned();
    } finally {
      setRefreshing(false);
    }
  };

  const statusStyle = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "ongoing") return styles.badgeOngoing;
    if (s === "delayed") return styles.badgeDelayed;
    return styles.badgeDefault;
  };

  const parseBackendDate = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  // Strict parser for YYYY-MM-DD (returns Date at local midnight)
  const parseInputDate = (text) => {
    const t = (text || "").trim();
    if (!t) return null; // empty is allowed = no filter

    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
    if (!m) return "INVALID";

    const year = Number(m[1]);
    const month = Number(m[2]); // 1-12
    const day = Number(m[3]); // 1-31

    const d = new Date(year, month - 1, day);

    // validate actual date (e.g. 2025-02-31 should fail)
    if (
      d.getFullYear() !== year ||
      d.getMonth() !== month - 1 ||
      d.getDate() !== day
    ) {
      return "INVALID";
    }

    d.setHours(0, 0, 0, 0);
    return d;
  };

  const parsedFrom = useMemo(() => parseInputDate(fromDateText), [fromDateText]);
  const parsedTo = useMemo(() => parseInputDate(toDateText), [toDateText]);

  const hasInvalidDateInput = parsedFrom === "INVALID" || parsedTo === "INVALID";

  const filteredItems = useMemo(() => {
    let list = [...rawItems];

    // status filter
    if (statusFilter !== "all") {
      list = list.filter((it) => (it.status || "").toLowerCase() === statusFilter);
    }

    // if invalid input, don't apply date filter (show status-filtered list)
    if (hasInvalidDateInput) {
      return list;
    }

    // date range filter (based on start_date)
    if (parsedFrom || parsedTo) {
      const fromT = parsedFrom ? startOfDay(parsedFrom).getTime() : null;
      const toT = parsedTo ? endOfDay(parsedTo).getTime() : null;

      list = list.filter((it) => {
        const d = parseBackendDate(it.start_date);
        if (!d) return false;
        const t = d.getTime();

        if (fromT !== null && t < fromT) return false;
        if (toT !== null && t > toT) return false;

        return true;
      });
    }

    return list;
  }, [rawItems, statusFilter, parsedFrom, parsedTo, hasInvalidDateInput]);

  const applyDateFilters = () => {
    if (parsedFrom === "INVALID" || parsedTo === "INVALID") {
      Alert.alert("Invalid Date", "Use YYYY-MM-DD format (example: 2026-02-24)");
      return;
    }

    if (parsedFrom && parsedTo && parsedFrom.getTime() > parsedTo.getTime()) {
      Alert.alert("Invalid Range", "'From' date cannot be after 'To' date");
      return;
    }

    // filtering already live via useMemo
    Alert.alert("Filters Applied", "Date filters applied successfully.");
  };

  const toggleComplaintStatus = async (complaintId) => {
    try {
      // prevent double tap spam
      if (togglingIds[complaintId]) return;

      setTogglingIds((prev) => ({ ...prev, [complaintId]: true }));

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Login required", "Token missing. Please login again.");
        return;
      }

      const res = await fetch(`${BASE_URL}/api/toggle_complaint_status/${complaintId}`, {
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

      // backend se new status aaya ho to use karo, warna local toggle
      setRawItems((prev) =>
        prev.map((it) => {
          if (it.complaint_id !== complaintId) return it;

          const current = String(it.status || "").toLowerCase();
          const fallbackNext =
            current === "delayed"
              ? "ongoing"
              : current === "ongoing"
              ? "delayed"
              : current;

          // try to read backend status from common keys
          const backendStatus =
            json?.data?.status ??
            json?.status ??
            json?.data?.complaint?.status ??
            null;

          return {
            ...it,
            status: backendStatus || fallbackNext,
          };
        })
      );

      // If you want exact fresh list from backend every toggle, uncomment:
      // await fetchAssigned();
    } catch (e) {
      console.log("toggleComplaintStatus error:", e);
      Alert.alert("Network Error", "Could not toggle complaint status");
    } finally {
      setTogglingIds((prev) => ({ ...prev, [complaintId]: false }));
    }
  };

  const renderCard = ({ item }) => {
    const d = parseBackendDate(item.start_date);
    const currentStatus = String(item.status || "").toLowerCase();
    const isToggleAllowed = currentStatus === "ongoing" || currentStatus === "delayed";
    const isToggling = !!togglingIds[item.complaint_id];

    return (
      <TouchableOpacity
        activeOpacity={0.86}
        style={styles.card}
        onPress={() =>
          navigation.navigate("ComplaintDetailsForOngoing_Delayed", {
            complaint_id: item.complaint_id,
          })
        }
      >
        <View style={styles.row}>
          <Text style={styles.idText}>Complaint #{item.complaint_id}</Text>

          {/* ✅ Tap badge to toggle delayed <-> ongoing */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.badge,
              statusStyle(item.status),
              (!isToggleAllowed || isToggling) && styles.badgeDisabled,
            ]}
            disabled={!isToggleAllowed || isToggling}
            onPress={(e) => {
              // parent card navigation stop
              e?.stopPropagation?.();

              if (!isToggleAllowed) {
                Alert.alert("Not Allowed", "Only ongoing/delayed complaints can be toggled.");
                return;
              }

              toggleComplaintStatus(item.complaint_id);
            }}
          >
            <Text style={styles.badgeText}>
              {isToggling ? "..." : String(item.status || "—").toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.dateText}>Start Date: {d ? d.toDateString() : "—"}</Text>
        <Text style={styles.subText}>Tap card for details • Tap status badge to toggle</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Assigned Complaints</Text>
      </View>

      {/* Filters */}
      <View style={styles.filterWrap}>
        <View style={styles.filterRow}>
          <FilterBtn
            label="All"
            active={statusFilter === "all"}
            onPress={() => setStatusFilter("all")}
          />
          <FilterBtn
            label="Ongoing"
            active={statusFilter === "ongoing"}
            onPress={() => setStatusFilter("ongoing")}
          />
          <FilterBtn
            label="Delayed"
            active={statusFilter === "delayed"}
            onPress={() => setStatusFilter("delayed")}
          />
        </View>

        {/* Manual Date Inputs */}
        <View style={styles.dateInputWrap}>
          <TextInput
            style={[styles.input, parsedFrom === "INVALID" && styles.inputError]}
            placeholder="From (YYYY-MM-DD)"
            placeholderTextColor="#9ca3af"
            value={fromDateText}
            onChangeText={setFromDateText}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={[styles.input, parsedTo === "INVALID" && styles.inputError]}
            placeholder="To (YYYY-MM-DD)"
            placeholderTextColor="#9ca3af"
            value={toDateText}
            onChangeText={setToDateText}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.dateRow}>
          <TouchableOpacity
            style={[styles.dateBtn, styles.applyBtn]}
            onPress={applyDateFilters}
            activeOpacity={0.85}
          >
            <Text style={[styles.dateBtnText, styles.applyBtnText]}>Apply Dates</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dateBtn, styles.clearBtn]}
            onPress={() => {
              setFromDateText("");
              setToDateText("");
            }}
            activeOpacity={0.85}
          >
            <Text style={[styles.dateBtnText, { color: "#fff", fontWeight: "900" }]}>
              Clear Dates
            </Text>
          </TouchableOpacity>
        </View>

        {hasInvalidDateInput ? (
          <Text style={styles.validationText}>
            Invalid date format. Use YYYY-MM-DD (example: 2026-02-24)
          </Text>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(it) => String(it.complaint_id)}
          renderItem={renderCard}
          contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>No complaints match filters</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function FilterBtn({ label, active, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.filterBtn, active && styles.filterBtnActive]}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f3f3" },

  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: "800", color: "#1f2937" },

  filterWrap: { paddingHorizontal: 16, paddingBottom: 10 },

  filterRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  filterBtn: {
    flex: 1,
    backgroundColor: "#e5e7eb",
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  filterBtnActive: { backgroundColor: "#77aebe" },
  filterText: { fontWeight: "800", color: "#111827" },
  filterTextActive: { color: "#eaf3f6" },

  dateInputWrap: {
    gap: 10,
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    fontWeight: "700",
  },
  inputError: {
    borderColor: "#dc2626",
    backgroundColor: "#fef2f2",
  },

  dateRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  applyBtn: {
    backgroundColor: "#77aebe",
    borderColor: "#77aebe",
  },
  applyBtnText: {
    color: "#eaf3f6",
    fontWeight: "900",
  },
  clearBtn: {
    backgroundColor: "#9ca3af",
    borderColor: "#9ca3af",
  },
  dateBtnText: { fontSize: 12, fontWeight: "800", color: "#111827" },

  validationText: {
    marginTop: 8,
    fontSize: 12,
    color: "#b91c1c",
    fontWeight: "700",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  loadingText: { marginTop: 10, fontSize: 14, color: "#6b7280" },
  empty: { fontSize: 16, color: "#6b7280", textAlign: "center" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },

  idText: { fontSize: 18, fontWeight: "900", color: "#111827", flex: 1 },

  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  badgeText: { color: "#fff", fontWeight: "900", fontSize: 12, letterSpacing: 0.6 },

  badgeOngoing: { backgroundColor: "#2e7d32" },
  badgeDelayed: { backgroundColor: "#b45309" },
  badgeDefault: { backgroundColor: "#6b7280" },

  badgeDisabled: {
    opacity: 0.75,
  },

  dateText: { marginTop: 8, fontSize: 12, color: "#374151", fontWeight: "700" },
  subText: { marginTop: 10, fontSize: 13, color: "#6b7280" },
});
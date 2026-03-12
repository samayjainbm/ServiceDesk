// ComplaintDetailsScreen.js (with Assign Worker button)
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL, TOKEN_KEY } from "../../../../../config";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

// const BASE_URL = "http://192.168.0.111:3000";

export default function ComplaintDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const { complaint_id } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [complaint, setComplaint] = useState(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchDetails = async () => {
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

        // ✅ your endpoint
        const res = await fetch(`${BASE_URL}/api/booked_details/${complaint_id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();

        if (!res.ok || json?.success === false) {
          Alert.alert("Error", json?.message || "Failed to load complaint details");
          setLoading(false);
          return;
        }

        setComplaint(json.data || null);
        setUserName(json.user_details?.user_name || "");
      } catch (e) {
        console.log("ComplaintDetails error:", e);
        Alert.alert("Network Error", "Backend not reachable");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [complaint_id]);

  const formatDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toDateString();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading details…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!complaint) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.empty}>No details found for #{complaint_id}</Text>
          <TouchableOpacity style={styles.backBtnSingle} onPress={() => navigation.goBack()}>
            <Text style={styles.btnText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Complaint #{complaint.complaint_id}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{(complaint.status || "—").toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>User</Text>
          <Row label="User Name" value={userName || "—"} />
          <Row label="User ID" value={String(complaint.user_id ?? "—")} />
          <Row label="Phone" value={String(complaint.phone_number ?? "—")} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Complaint Info</Text>
          <Row label="Complaint ID" value={String(complaint.complaint_id ?? "—")} />
          <Row label="Start Date" value={formatDate(complaint.start_date)} />
          <Row label="Address" value={complaint.address || "—"} multiline />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.desc}>{complaint.description || "—"}</Text>
        </View>

        {/* ✅ Buttons Row: Assign Worker + Back */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.assignBtn]}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate("AssignWorker", { complaint_id: complaint.complaint_id })
            }
          >
            <Text style={styles.btnText}>Assign Worker</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.backBtn]}
            activeOpacity={0.85}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.btnText}>Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, multiline }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[styles.rowValue, multiline && { textAlign: "right" }]}
        numberOfLines={multiline ? 3 : 1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f3f3" },

  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: "800", color: "#1f2937" },
  badge: {
    backgroundColor: "#77aebe",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { color: "#eaf3f6", fontWeight: "800", letterSpacing: 0.6 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  loadingText: { marginTop: 10, fontSize: 14, color: "#6b7280" },
  empty: { fontSize: 16, color: "#6b7280", textAlign: "center", marginBottom: 14 },

  scroll: { padding: 16, paddingBottom: 28 },

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

  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 8 },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7",
  },
  rowLabel: { fontSize: 13, fontWeight: "700", color: "#6b7280" },
  rowValue: { fontSize: 14, fontWeight: "700", color: "#111827", flex: 1, textAlign: "right" },

  desc: { fontSize: 14, color: "#374151", lineHeight: 20 },

  // ✅ Buttons
  btnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    justifyContent: "center",
  },
  actionBtn: {
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  assignBtn: {
    backgroundColor: "#77aebe",
    flex: 1,
    paddingHorizontal: 16,
  },
  backBtn: {
    backgroundColor: "#9ca3af",
    width: 110,
  },
  backBtnSingle: {
    marginTop: 8,
    backgroundColor: "#9ca3af",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },

  btnText: { color: "#fff", fontWeight: "800" },
});
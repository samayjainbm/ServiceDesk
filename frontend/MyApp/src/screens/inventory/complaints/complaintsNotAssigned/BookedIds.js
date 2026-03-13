import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL, TOKEN_KEY } from "../../../../../config";
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
import { useNavigation } from "@react-navigation/native";

export default function BookedIdsScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);

  const fetchBookedIds = async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      console.log("BOOKED_IDS TOKEN:", token);

      if (!token) {
        Alert.alert("Login required", "Token missing. Please login again.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const res = await fetch(`${BASE_URL}/api/booked_ids`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json().catch(() => ({}));

      console.log("BOOKED_IDS STATUS:", res.status);
      console.log("BOOKED_IDS RESPONSE:", json);

      if (!res.ok || json?.success === false) {
        Alert.alert("Error", json?.message || "Failed to load booked ids");
        setItems([]);
        return;
      }

      setItems(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      console.log("fetchBookedIds error:", e);
      Alert.alert("Network Error", "Backend not reachable");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookedIds();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookedIds();
  };

  const renderCard = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.86}
      style={styles.card}
      onPress={() =>
        navigation.navigate("ComplaintDetails", {
          complaint_id: item.complaint_id,
        })
      }
    >
      <View style={styles.row}>
        <Text style={styles.idText}>Complaint #{item.complaint_id}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>BOOKED</Text>
        </View>
      </View>

      <Text style={styles.subText}>Tap to open details</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Booked Complaints</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.complaint_id)}
          renderItem={renderCard}
          contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>No booked complaints</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f3f3" },

  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: "700", color: "#1f2937" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 14, color: "#6b7280" },
  empty: { fontSize: 16, color: "#6b7280" },

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
  },

  idText: { fontSize: 18, fontWeight: "800", color: "#111827" },

  badge: {
    backgroundColor: "#77aebe",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { color: "#eaf3f6", fontWeight: "800", letterSpacing: 0.6 },

  subText: { marginTop: 10, fontSize: 13, color: "#6b7280" },
});
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL, TOKEN_KEY } from "../../../../config"; // adjust path if needed

export default function AddItems({ navigation }) {
  const [newItemName, setNewItemName] = useState("");
  const [newItemCount, setNewItemCount] = useState("");
  const [loadingNewItem, setLoadingNewItem] = useState(false);

  const handleAddNewItem = async () => {
    const item_name = String(newItemName || "").trim().toLowerCase();
    const count = String(newItemCount || "").trim(); // keep string (backend Number() kar lega)

    if (!item_name) {
      Alert.alert("Validation Error", "item_name is required");
      return;
    }

    if (count === "") {
      Alert.alert("Validation Error", "count is required");
      return;
    }

    const n = Number(count);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
      Alert.alert("Validation Error", "count must be an integer >= 0");
      return;
    }

    try {
      setLoadingNewItem(true);

      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        Alert.alert("Auth Error", "Token missing. Please login again.");
        return;
      }

      const res = await fetch(`${BASE_URL}/api/inventory/add_new_item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          item_name,
          count, // string ok
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        Alert.alert("Error", data?.message || "Failed to add new item");
        return;
      }

      Alert.alert("Success", data?.message || "Item created successfully");

      setNewItemName("");
      setNewItemCount("");
    } catch (e) {
      console.log("Add new item error:", e);
      Alert.alert("Error", "Network/server error");
    } finally {
      setLoadingNewItem(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#F3F4F6" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Inventory</Text>
          <Text style={styles.subtitle}>Add new items to your stock</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Add New Item</Text>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Admin</Text>
            </View>
          </View>

          <Text style={styles.label}>Item Name</Text>
          <TextInput
            value={newItemName}
            onChangeText={setNewItemName}
            placeholder="e.g. q or wire"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            selectionColor="#111827"
          />

          <Text style={styles.label}>Count</Text>
          <TextInput
            value={newItemCount}
            onChangeText={(t) => {
              // keep old functionality intact; just helps user type clean numbers
              const cleaned = String(t ?? "").replace(/[^0-9]/g, "");
              setNewItemCount(cleaned);
            }}
            placeholder="e.g. 10"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            keyboardType="numeric"
            selectionColor="#111827"
          />

          <TouchableOpacity
            style={[styles.button, loadingNewItem && styles.buttonDisabled]}
            onPress={handleAddNewItem}
            disabled={loadingNewItem}
            activeOpacity={0.85}
          >
            {loadingNewItem ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={styles.buttonText}>Adding...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Add New Item</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.helper}>
            Tip: Item name auto-lowercase ho jayega, count integer hona chahiye.
          </Text>
        </View>

        {/* Your existing UI for bulk add items etc can remain below */}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 28,
  },

  header: {
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 4,
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "500",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },

  pill: {
    backgroundColor: "#EEF2FF",
    borderColor: "#E0E7FF",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: {
    color: "#3730A3",
    fontWeight: "800",
    fontSize: 12,
  },

  label: {
    marginTop: 10,
    marginBottom: 6,
    fontWeight: "700",
    color: "#111827",
    fontSize: 13,
  },

  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",

    // ✅ IMPORTANT: text visibility fix
    color: "#111827",

    fontSize: 15,
    fontWeight: "600",
  },

  button: {
    marginTop: 16,
    backgroundColor: "#111827",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },

  helper: {
    marginTop: 10,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    lineHeight: 16,
  },
});
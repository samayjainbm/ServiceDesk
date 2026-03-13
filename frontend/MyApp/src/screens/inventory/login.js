import React, { useState } from "react";
import { BASE_URL, TOKEN_KEY } from "../../../config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

export default function LoginScreen({ navigation }) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const invId = id.trim();
    const pwd = password;

    if (!invId || !pwd) {
      Alert.alert("Validation Error", "ID and password are required");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/api/login_inventory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: invId,
          password: pwd,
        }),
      });

      const data = await res.json().catch(() => ({}));

      console.log("LOGIN STATUS:", res.status);
      console.log("LOGIN DATA:", data);

      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || "Invalid credentials");
      }

      await AsyncStorage.multiRemove([
        TOKEN_KEY,
        "role",
        "user_data",
        "worker_user",
        "pa_user",
      ]);

      if (data?.token) {
        await AsyncStorage.setItem(TOKEN_KEY, data.token);
      }

      await AsyncStorage.setItem("role", "admin");

      const savedToken = await AsyncStorage.getItem(TOKEN_KEY);
      console.log("SAVED TOKEN AFTER LOGIN:", savedToken);

      Alert.alert("Success", data?.message || "Login successful");
      navigation.replace("InventoryMenuScreen");
    } catch (err) {
      console.log("Inventory login error:", err);
      Alert.alert("Login Failed", err?.message || "Server not reachable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Inventory Login</Text>
          <Text style={styles.subtitle}>Login with inventory credentials</Text>

          <View style={styles.inputWrap}>
            <Text style={styles.label}>ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter inventory id"
              value={id}
              onChangeText={setId}
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={onSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: "#f6f7fb",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 16,
    color: "#6b7280",
    fontSize: 14,
  },
  inputWrap: {
    marginBottom: 14,
  },
  label: {
    marginBottom: 6,
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
    color: "#111827",
  },
  loginBtn: {
    marginTop: 6,
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
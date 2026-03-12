import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function PAUserScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Management</Text>

      <TouchableOpacity
        style={[styles.btn, styles.btnPrimary]}
        onPress={() => navigation.navigate('PAUserCreateScreen')}
      >
        <Text style={styles.btnText}>Create User</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, styles.btnSuccess]}
        onPress={() => navigation.navigate('PAUserListScreen')}
      >
        <Text style={styles.btnText}>View All Users</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 18, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 20, textAlign: 'center', color: '#111827' },

  btn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  btnPrimary: { backgroundColor: '#2563eb' },
  btnSuccess: { backgroundColor: '#16a34a' },

  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
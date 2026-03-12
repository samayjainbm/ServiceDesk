import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Home from '../home';
export default function UserHomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* 🔙 Back Button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>User Dashboard</Text>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate('UserRegisterComplaintScreen')}
      >
        <Text style={styles.btnText}>Register Complaint</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate('UserComplaintsScreen')}
      >
        <Text style={styles.btnText}>My Complaints</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 18, justifyContent: 'center' },

  backBtn: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  backText: { fontSize: 16, fontWeight: '800', color: '#111827' },

  title: { fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 24, color: '#111827' },
  btn: { backgroundColor: '#111827', paddingVertical: 16, borderRadius: 12, marginBottom: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
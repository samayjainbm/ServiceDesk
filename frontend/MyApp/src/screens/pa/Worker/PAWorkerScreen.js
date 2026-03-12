// src/screens/pa/PAWorkerScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function PAWorkerScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Worker Management</Text>

      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('PAWorkerCreateScreen')}>
        <Text style={styles.cardTitle}>Create Worker</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('PAWorkerListScreen')}>
        <Text style={styles.cardTitle}>View / Update / Delete Workers</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('PAWorkerCredentialsScreen')}>
        <Text style={styles.cardTitle}>Worker Credentials</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '800', marginTop: 10, marginBottom: 18 },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f9fafb',
  },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  cardSub: { color: '#6b7280' },
});
 
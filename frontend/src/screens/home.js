import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

export default function Home({ navigation }) {
  const go = (role) => {
    if (role === 'worker') {
      navigation.navigate('WorkerLoginScreen');
      return;
    }

    if (role === 'inventory') {
      navigation.navigate('Login');
      return;
    }

    if (role === 'pa') {
      navigation.navigate('PALoginScreen');
      return;
    }

    if (role === 'user') {
      navigation.navigate('UserLoginScreen');
      return;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>College App</Text>

        <TouchableOpacity style={styles.btn} onPress={() => go('worker')}>
          <Text style={styles.btnText}>LOGIN AS WORKER</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={() => go('pa')}>
          <Text style={styles.btnText}>LOGIN AS PA</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={() => go('inventory')}>
          <Text style={styles.btnText}>LOGIN AS INVENTORY</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={() => go('user')}>
          <Text style={styles.btnText}>LOGIN AS USER</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f3eee8' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 28,
    letterSpacing: 0.5,
  },
  btn: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#d9d2cb',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c9c0b8',
    elevation: 2,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

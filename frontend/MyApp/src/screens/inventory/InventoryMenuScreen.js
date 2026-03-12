// Page1.js (Home screen)
import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ComplaintMenuScreen from './complaints/complaintmenuscreen';
import DemandIdsScreen from './DemandedItems/DemandIdsScreen';
import ItemDisplayScreen from './InventoryStorage/ItemDisplayScreen';
export default function InventoryMenuScreen() {
  const navigation = useNavigation();

  const onComplaints = () => navigation.navigate('ComplaintsMenuScreen');
  const onDemandedItems = () => navigation.navigate('DemandIdsScreen');
  const onInventoryStorage = () => navigation.navigate('ItemDisplayScreen');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.pill, styles.pillSmall, styles.blue]}
          activeOpacity={0.85}
          onPress={onComplaints}
        >
          <Text style={styles.pillSmallText}>Complaints</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pill, styles.pillSmall, styles.gray]}
          activeOpacity={0.85}
          onPress={onDemandedItems}
        >
          <Text style={styles.pillSmallTextDark}>Demanded Items</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pill, styles.pillBig, styles.blue]}
          activeOpacity={0.85}
          onPress={onInventoryStorage}
        >
          <Text style={styles.pillBigText}>Inventory Storage</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f3f3f3' },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 26,
  },
  pill: {
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillSmall: { width: 220, height: 46 },
  pillBig: { width: 320, height: 78, borderRadius: 28 },
  blue: { backgroundColor: '#77aebe' },
  gray: { backgroundColor: '#d0d0d0' },
  pillSmallText: { fontSize: 22, fontWeight: '400', color: '#eaf3f6' },
  pillSmallTextDark: { fontSize: 22, fontWeight: '400', color: '#222' },
  pillBigText: { fontSize: 34, fontWeight: '400', color: '#eaf3f6', letterSpacing: 1 },
});

// screens/ItemDisplayScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import { BASE_URL } from '../../../../config';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../theme';
import { Screen, AppBar, Card, Avatar, Badge, Icon, Button, SkeletonList, EmptyState, useToast } from '../../../components/ui';

export default function ItemDisplayScreen({ navigation }) {
  const { colors } = useTheme();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchItems = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/item_display`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();
      if (!res.ok || !data.success) { throw new Error(data.message || 'Failed to fetch items'); }
      setItems(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error('fetchItems error:', err);
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const renderItemCard = ({ item }) => (
    <Card onPress={() => navigation.navigate('ItemDetailsScreen', { itemName: item.item_name })} style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Avatar icon="box" role="inventory" size={44} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800', textTransform: 'capitalize' }}>{item.item_name}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>Tap to view debt details</Text>
        </View>
        <Badge label={`${item.count ?? 0}`} color={colors.primary} tint={colors.primaryTint} />
        <View style={{ marginLeft: 8 }}><Icon name="chevronRight" size={20} color={colors.textMuted} /></View>
      </View>
    </Card>
  );

  const Footer = (
    <View style={{ gap: 10, marginTop: 6 }}>
      <Button title="Return Items" icon="refresh" variant="secondary" onPress={() => navigation.navigate('ReturnItemsScreen')} />
      <Button title="Demand Stock" icon="send" accent={colors.accent} onPress={() => navigation.navigate('DemandStockScreen')} />
      <Button title="Add New Items" icon="plus" variant="secondary" onPress={() => navigation.navigate('AddItems')} />
      <Button title="Add Inventory Storage" icon="plus" onPress={() => navigation.navigate('AddInventoryStorageScreen')} />
    </View>
  );

  return (
    <Screen header={<AppBar title="Inventory Storage" subtitle="Stock items" role="inventory" onBack={() => navigation.goBack()} />} padded={false} scroll={false}>
      {loading ? (
        <View style={{ padding: 16 }}>
          <SkeletonList count={5} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) => `${item.item_name}-${index}`}
          renderItem={renderItemCard}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchItems(true)} tintColor={colors.primary} colors={[colors.primary]} />}
          ListFooterComponent={Footer}
          ListEmptyComponent={<EmptyState icon="box" title="No items found" subtitle="Add inventory to get started." />}
        />
      )}
    </Screen>
  );
}

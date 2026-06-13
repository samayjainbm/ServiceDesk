// AssignedComplaintsScreen.js
import { BASE_URL } from '../../../../../config';
import React, { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../../theme';
import { Screen, AppBar, Card, Input, Button, SegmentedControl, StatusPill, SkeletonList, EmptyState, useToast } from '../../../../components/ui';

function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function endOfDay(d) { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; }

export default function AssignedComplaintsScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rawItems, setRawItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDateText, setFromDateText] = useState('');
  const [toDateText, setToDateText] = useState('');
  const [togglingIds, setTogglingIds] = useState({});

  const fetchAssigned = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) { toast.warning('Token missing. Please login again.'); return; }
      const res = await fetch(`${BASE_URL}/api/assigned_ids`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      let json = {};
      try { json = await res.json(); } catch { json = {}; }
      if (!res.ok || json?.success === false) { toast.error(json?.message || 'Failed to load assigned complaints'); return; }
      setRawItems(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      console.log('fetchAssigned error:', e);
      toast.error('Backend not reachable');
    }
  };

  useEffect(() => {
    (async () => { try { await fetchAssigned(); } finally { setLoading(false); setRefreshing(false); } })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => { setRefreshing(true); try { await fetchAssigned(); } finally { setRefreshing(false); } };

  const parseBackendDate = (iso) => { if (!iso) return null; const d = new Date(iso); return Number.isNaN(d.getTime()) ? null : d; };
  const parseInputDate = (text) => {
    const t = (text || '').trim();
    if (!t) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
    if (!m) return 'INVALID';
    const year = Number(m[1]); const month = Number(m[2]); const day = Number(m[3]);
    const d = new Date(year, month - 1, day);
    if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return 'INVALID';
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const parsedFrom = useMemo(() => parseInputDate(fromDateText), [fromDateText]);
  const parsedTo = useMemo(() => parseInputDate(toDateText), [toDateText]);
  const hasInvalidDateInput = parsedFrom === 'INVALID' || parsedTo === 'INVALID';

  const filteredItems = useMemo(() => {
    let list = [...rawItems];
    if (statusFilter !== 'all') list = list.filter((it) => (it.status || '').toLowerCase() === statusFilter);
    if (hasInvalidDateInput) return list;
    if (parsedFrom || parsedTo) {
      const fromT = parsedFrom ? startOfDay(parsedFrom).getTime() : null;
      const toT = parsedTo ? endOfDay(parsedTo).getTime() : null;
      list = list.filter((it) => {
        const d = parseBackendDate(it.start_date);
        if (!d) return false;
        const t = d.getTime();
        if (fromT !== null && t < fromT) return false;
        if (toT !== null && t > toT) return false;
        return true;
      });
    }
    return list;
  }, [rawItems, statusFilter, parsedFrom, parsedTo, hasInvalidDateInput]);

  const applyDateFilters = () => {
    if (parsedFrom === 'INVALID' || parsedTo === 'INVALID') { return toast.warning('Use YYYY-MM-DD format (e.g. 2026-02-24)'); }
    if (parsedFrom && parsedTo && parsedFrom.getTime() > parsedTo.getTime()) { return toast.warning("'From' date cannot be after 'To' date"); }
    toast.success('Date filters applied');
  };

  const toggleComplaintStatus = async (complaintId) => {
    try {
      if (togglingIds[complaintId]) return;
      setTogglingIds((prev) => ({ ...prev, [complaintId]: true }));
      const token = await AsyncStorage.getItem('token');
      if (!token) { toast.warning('Token missing. Please login again.'); return; }
      const res = await fetch(`${BASE_URL}/api/toggle_complaint_status/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      let json = {};
      try { json = await res.json(); } catch { json = {}; }
      if (!res.ok || json?.success === false) { toast.error(json?.message || 'Failed to toggle complaint status'); return; }
      setRawItems((prev) => prev.map((it) => {
        if (it.complaint_id !== complaintId) return it;
        const current = String(it.status || '').toLowerCase();
        const fallbackNext = current === 'delayed' ? 'ongoing' : current === 'ongoing' ? 'delayed' : current;
        const backendStatus = json?.data?.status ?? json?.status ?? json?.data?.complaint?.status ?? null;
        return { ...it, status: backendStatus || fallbackNext };
      }));
    } catch (e) {
      console.log('toggleComplaintStatus error:', e);
      toast.error('Could not toggle complaint status');
    } finally {
      setTogglingIds((prev) => ({ ...prev, [complaintId]: false }));
    }
  };

  const renderCard = ({ item }) => {
    const d = parseBackendDate(item.start_date);
    const currentStatus = String(item.status || '').toLowerCase();
    const isToggleAllowed = currentStatus === 'ongoing' || currentStatus === 'delayed';
    const isToggling = !!togglingIds[item.complaint_id];
    return (
      <Card onPress={() => navigation.navigate('ComplaintDetailsForOngoing_Delayed', { complaint_id: item.complaint_id })} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>Complaint #{item.complaint_id}</Text>
          <Pressable
            onPress={() => { if (!isToggleAllowed) { return toast.info('Only ongoing/delayed complaints can be toggled.'); } toggleComplaintStatus(item.complaint_id); }}
            disabled={!isToggleAllowed || isToggling}
            hitSlop={6}
          >
            <StatusPill status={isToggling ? 'pending' : item.status} size="sm" />
          </Pressable>
        </View>
        <Text style={{ marginTop: 8, color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>Start: {d ? d.toDateString() : '—'}</Text>
        <Text style={{ marginTop: 6, color: colors.textMuted, fontSize: 12 }}>Tap card for details • tap status to toggle</Text>
      </Card>
    );
  };

  const Filters = (
    <View style={{ marginBottom: 12 }}>
      <SegmentedControl
        options={[{ value: 'all', label: 'All' }, { value: 'ongoing', label: 'Ongoing' }, { value: 'delayed', label: 'Delayed' }]}
        value={statusFilter}
        onChange={setStatusFilter}
      />
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <View style={{ flex: 1 }}>
          <Input placeholder="From (YYYY-MM-DD)" value={fromDateText} onChangeText={setFromDateText} error={parsedFrom === 'INVALID' ? 'Invalid' : undefined} style={{ marginBottom: 0 }} />
        </View>
        <View style={{ flex: 1 }}>
          <Input placeholder="To (YYYY-MM-DD)" value={toDateText} onChangeText={setToDateText} error={parsedTo === 'INVALID' ? 'Invalid' : undefined} style={{ marginBottom: 0 }} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <Button title="Apply Dates" variant="secondary" size="sm" fullWidth={false} onPress={applyDateFilters} style={{ flex: 1 }} />
        <Button title="Clear" variant="ghost" size="sm" fullWidth={false} onPress={() => { setFromDateText(''); setToDateText(''); }} style={{ flex: 1 }} />
      </View>
    </View>
  );

  return (
    <Screen header={<AppBar title="Assigned" subtitle="Ongoing & delayed" role="inventory" onBack={() => navigation.goBack()} />} padded={false} scroll={false}>
      {loading ? (
        <View style={{ padding: 16 }}>{Filters}<SkeletonList count={4} /></View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(it) => String(it.complaint_id)}
          renderItem={renderCard}
          ListHeaderComponent={Filters}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
          ListEmptyComponent={<EmptyState icon="clipboard" title="No complaints match filters" subtitle="Try changing the status or date range." />}
        />
      )}
    </Screen>
  );
}

import React, { useState } from 'react';
import { BASE_URL } from '../../../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, AppBar, Card, Input, Button, useToast } from '../../../components/ui';

export default function PAUserCreateScreen({ navigation }) {
  const toast = useToast();
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('pa_token');
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const parseSafely = async (res) => {
    const raw = await res.text();
    try { return { data: raw ? JSON.parse(raw) : {}, raw, isJson: true }; }
    catch { return { data: null, raw, isJson: false }; }
  };

  const reportCreate = (status, msg) => {
    if (status === 201 || status === 200) { toast.success('User created successfully.'); return true; }
    if (status === 409) { toast.warning(msg || 'User already exists.'); return false; }
    if (status === 400) { toast.warning(msg || 'Invalid data. Please check the fields.'); return false; }
    if (status === 401) { toast.error('Unauthorized. Please log in as PA again.'); return false; }
    if (status === 403) { toast.error('You do not have permission for this action.'); return false; }
    toast.error(msg || `User create failed (HTTP ${status})`);
    return false;
  };

  const onCreate = async () => {
    const uid = userId.trim();
    const uname = userName.trim();
    const uaddr = userAddress.trim();
    const phone = phoneNumber.trim();
    const pwd = password.trim();

    if (!uid || !uname || !uaddr || !phone || !pwd) { return toast.warning('Please fill all fields'); }
    if (!/^\d+$/.test(uid)) { return toast.warning('User ID must be numeric'); }
    if (!/^\d{10}$/.test(phone)) { return toast.warning('Phone number must be exactly 10 digits'); }

    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/pa/users`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ user_id: Number(uid), user_name: uname, user_address: uaddr, phone_number: phone, password: pwd }),
      });
      const parsed = await parseSafely(res);
      const msg = parsed.isJson ? parsed.data?.message : `Non-JSON response (HTTP ${res.status})`;
      if (!reportCreate(res.status, msg)) return;
      navigation.replace('PAUserDetailScreen', { userId: uid });
    } catch (e) {
      toast.error(e?.message?.includes('Network request failed') ? 'Network error. Check your connection.' : (e?.message || 'Failed to create user'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen header={<AppBar title="Create User" subtitle="Administration" role="pa" onBack={() => navigation.goBack()} />} scroll keyboardAvoiding>
      <Card>
        <Input label="User ID" leftIcon="user" placeholder="1001" value={userId} onChangeText={(t) => setUserId(t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" editable={!loading} />
        <Input label="User Name" placeholder="Full name" value={userName} onChangeText={setUserName} autoCapitalize="words" editable={!loading} />
        <Input label="User Address" placeholder="Hostel / Room / Address" value={userAddress} onChangeText={setUserAddress} multiline autoCapitalize="sentences" editable={!loading} />
        <Input label="Phone Number" leftIcon="mail" placeholder="10-digit number" value={phoneNumber} onChangeText={(t) => setPhoneNumber(t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" maxLength={10} editable={!loading} />
        <Input label="Password" leftIcon="lock" placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry editable={!loading} />
      </Card>

      <Button title="Create User" icon="plus" onPress={onCreate} loading={loading} style={{ marginTop: 18 }} />
    </Screen>
  );
}

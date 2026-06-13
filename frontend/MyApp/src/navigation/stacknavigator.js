
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme';

import Splash from '../screens/Splash';
import Home from '../screens/home';
// Inventory
import AddItems from '../screens/inventory/InventoryStorage/AddItems';
import LoginScreen from '../screens/inventory/login';
import DemandIdsScreen from '../screens/inventory/DemandedItems/DemandIdsScreen';
import BookedComplaintsScreen from '../screens/inventory/complaints/complaintsNotAssigned/BookedIds';
import InventoryMenuScreen from '../screens/inventory/InventoryMenuScreen';
import ComplaintsMenuScreen from '../screens/inventory/complaints/complaintmenuscreen';
import ComplaintDetailsScreen from '../screens/inventory/complaints/complaintsNotAssigned/ComplaintDetails';
import AssignWorkerScreen from '../screens/inventory/complaints/complaintsNotAssigned/AssignWorker';
import AssignedComplaintsScreen from '../screens/inventory/complaints/ComplaintsAssigned/getIds';
import ComplaintDetailsScreenForOngoing_Delayed from '../screens/inventory/complaints/ComplaintsAssigned/ComplaintDetailsForOngoing_Delayed';
import DemandItemDetailsScreen from '../screens/inventory/DemandedItems/DemandItemDetailsScreen';
import ItemDisplayScreen from '../screens/inventory/InventoryStorage/ItemDisplayScreen';
import ItemDetailsScreen from '../screens/inventory/InventoryStorage/ItemDetailsScreen';
import AddInventoryStorageScreen from '../screens/inventory/InventoryStorage/AddInventoryStorageScreen';
import ReturnItemsScreen from '../screens/inventory/InventoryStorage/ReturnItemsScreen';

// DemandStock
import DemandStockScreen from '../screens/inventory/InventoryStorage/DemandStockScreen';

// Worker
import WorkerLoginScreen from '../screens/worker/WorkerLoginScreen';
import WorkerComplaintsListScreen from '../screens/worker/WorkerComplaintList';
import WorkerComplaintDetailsScreen from '../screens/worker/WorkerComplaintDetailsScreen';
import WorkerDemandItemsScreen from '../screens/worker/WorkerDemandItemsScreen';


// PA
import PALoginScreen from '../screens/pa/PALoginScreen';
import PAHomeScreen from '../screens/pa/PAHomeScreen';
// 1) worker
import PAWorkerScreen from '../screens/pa/Worker/PAWorkerScreen';
import PAWorkerCreateScreen from '../screens/pa/Worker/PAWorkerCreateScreen';
import PAWorkerListScreen from '../screens/pa/Worker/PAWorkerListScreen';
import PAWorkerDetailScreen from '../screens/pa/Worker/PAWorkerDetailScreen';
import PAWorkerCredentialsScreen from '../screens/pa/Worker/PAWorkerCredentialsScreen';
// 2) User
import PAUserScreen from '../screens/pa/User/PAUserScreen';
import PAUserCreateScreen from '../screens/pa/User/PAUserCreateScreen';
import PAUserListScreen from '../screens/pa/User/PAUserListScreen';
import PAUserDetailScreen from '../screens/pa/User/PAUserDetailScreen';
import PAUserPasswordScreen from '../screens/pa/User/PAUserPasswordScreen';
// 3) Record

// 4) Inventory Required
import InventoryRequiredScreen from '../screens/pa/InventoryRequiredScreen';


//  user
import UserLoginScreen from '../screens/user/UserLoginScreen';
import UserHomeScreen from '../screens/user/UserHomeScreen';
import UserRegisterComplaintScreen from '../screens/user/UserRegisterComplaintScreen';
import UserComplaintsScreen from '../screens/user/UserComplaintsScreen';
import UserComplaintDetailScreen from '../screens/user/UserComplaintDetailScreen';
import UserResolveItemsScreen from '../screens/user/UserResolveItemsScreen';
import WorkerDebtScreen from '../screens/worker/workerDebtScreen';

const Stack = createNativeStackNavigator();

// Screens that render their own AppBar from the UI kit (no native header).
const NO_HEADER = { headerShown: false };

export default function StackNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="Splash" component={Splash} options={NO_HEADER} />
      <Stack.Screen name="Home" component={Home} options={NO_HEADER} />

      {/* inventory */}
      <Stack.Screen name="Login" component={LoginScreen} options={NO_HEADER} />
      <Stack.Screen name="InventoryMenuScreen" component={InventoryMenuScreen} options={NO_HEADER} />
      <Stack.Screen name="ComplaintsMenuScreen" component={ComplaintsMenuScreen} options={NO_HEADER} />
      <Stack.Screen name="bookedIds" component={BookedComplaintsScreen} options={{ title: 'Not Assigned' }} />
      <Stack.Screen name="ComplaintDetails" component={ComplaintDetailsScreen} options={{ title: 'Complaint Details' }} />
      <Stack.Screen name="AssignWorker" component={AssignWorkerScreen} options={{ title: 'Assign Worker' }} />
      <Stack.Screen name="AssignedComplaints" component={AssignedComplaintsScreen} options={{ title: 'Assigned' }} />
      <Stack.Screen name="ComplaintDetailsForOngoing_Delayed" component={ComplaintDetailsScreenForOngoing_Delayed} options={{ title: 'Complaint Details' }} />
      <Stack.Screen name="DemandIdsScreen" component={DemandIdsScreen} options={{ title: 'Demanded Items' }} />
      <Stack.Screen name="DemandItemDetailsScreen" component={DemandItemDetailsScreen} options={{ title: 'Demand Details' }} />
      <Stack.Screen name="ItemDisplayScreen" component={ItemDisplayScreen} options={{ title: 'Inventory Storage' }} />
      <Stack.Screen name="ItemDetailsScreen" component={ItemDetailsScreen} options={{ title: 'Item Details' }} />
      <Stack.Screen name="AddInventoryStorageScreen" component={AddInventoryStorageScreen} options={{ title: 'Add Stock' }} />
      <Stack.Screen name="ReturnItemsScreen" component={ReturnItemsScreen} options={{ title: 'Return Items' }} />
      <Stack.Screen name="AddItems" component={AddItems} options={{ title: 'Add Items' }} />

      {/* demand stock */}
      <Stack.Screen name="DemandStockScreen" component={DemandStockScreen} options={{ title: 'Demand Stock' }} />

      {/* worker */}
      <Stack.Screen name="WorkerLoginScreen" component={WorkerLoginScreen} options={NO_HEADER} />
      <Stack.Screen name="WorkerComplaintsListScreen" component={WorkerComplaintsListScreen} options={{ title: 'My Tasks' }} />
      <Stack.Screen name="WorkerComplaintDetailsScreen" component={WorkerComplaintDetailsScreen} options={{ title: 'Complaint Details' }} />
      <Stack.Screen name="WorkerDemandItemsScreen" component={WorkerDemandItemsScreen} options={{ title: 'Demand Items' }} />
      <Stack.Screen name="WorkerDebtScreen" component={WorkerDebtScreen} options={{ title: 'Material Debt' }} />

      {/* user */}
      <Stack.Screen name="UserLoginScreen" component={UserLoginScreen} options={NO_HEADER} />
      <Stack.Screen name="UserHomeScreen" component={UserHomeScreen} options={NO_HEADER} />
      <Stack.Screen name="UserRegisterComplaintScreen" component={UserRegisterComplaintScreen} options={NO_HEADER} />
      <Stack.Screen name="UserComplaintsScreen" component={UserComplaintsScreen} options={NO_HEADER} />
      <Stack.Screen name="UserComplaintDetailScreen" component={UserComplaintDetailScreen} options={NO_HEADER} />

      {/* pa */}
      <Stack.Screen name="PALoginScreen" component={PALoginScreen} options={NO_HEADER} />
      <Stack.Screen name="PAHomeScreen" component={PAHomeScreen} options={NO_HEADER} />
      <Stack.Screen name="PAWorkerScreen" component={PAWorkerScreen} options={{ title: 'Workers' }} />
      <Stack.Screen name="PAWorkerCreateScreen" component={PAWorkerCreateScreen} options={{ title: 'Create Worker' }} />
      <Stack.Screen name="PAWorkerListScreen" component={PAWorkerListScreen} options={{ title: 'Workers' }} />
      <Stack.Screen name="PAWorkerDetailScreen" component={PAWorkerDetailScreen} options={{ title: 'Worker Detail' }} />
      <Stack.Screen name="PAWorkerCredentialsScreen" component={PAWorkerCredentialsScreen} options={{ title: 'Credentials' }} />
      <Stack.Screen name="PAUserScreen" component={PAUserScreen} options={{ title: 'Users' }} />
      <Stack.Screen name="PAUserCreateScreen" component={PAUserCreateScreen} options={{ title: 'Create User' }} />
      <Stack.Screen name="PAUserListScreen" component={PAUserListScreen} options={{ title: 'Users' }} />
      <Stack.Screen name="PAUserDetailScreen" component={PAUserDetailScreen} options={{ title: 'User Detail' }} />
      <Stack.Screen name="PAUserPasswordScreen" component={PAUserPasswordScreen} options={{ title: 'Change Password' }} />
      <Stack.Screen name="UserResolveItemsScreen" component={UserResolveItemsScreen} options={NO_HEADER} />
      <Stack.Screen name="InventoryRequiredScreen" component={InventoryRequiredScreen} options={{ title: 'Inventory Required' }} />
    </Stack.Navigator>
  );
}

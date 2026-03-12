
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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

export default function StackNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home">

      <Stack.Screen name="Home" component={Home} />

      {/* inventory */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="InventoryMenuScreen" component={InventoryMenuScreen} />
      <Stack.Screen name="ComplaintsMenuScreen" component={ComplaintsMenuScreen} />
      <Stack.Screen name="bookedIds" component={BookedComplaintsScreen} />
      <Stack.Screen name="ComplaintDetails" component={ComplaintDetailsScreen} />
     <Stack.Screen name="AssignWorker" component={AssignWorkerScreen} />
     <Stack.Screen name="AssignedComplaints" component={AssignedComplaintsScreen} />
     <Stack.Screen name="ComplaintDetailsForOngoing_Delayed" component={ComplaintDetailsScreenForOngoing_Delayed}/>
    <Stack.Screen name="DemandIdsScreen" component={DemandIdsScreen}/>
    <Stack.Screen name="DemandItemDetailsScreen" component={DemandItemDetailsScreen}/>
    <Stack.Screen name="ItemDisplayScreen" component = {ItemDisplayScreen}/>
    <Stack.Screen name="ItemDetailsScreen" component={ItemDetailsScreen}/>
    <Stack.Screen name="AddInventoryStorageScreen" component={AddInventoryStorageScreen}/>
    <Stack.Screen name="ReturnItemsScreen" component={ReturnItemsScreen}/>
    <Stack.Screen name="AddItems" component={AddItems} />

    {/* demand stock */}
    <Stack.Screen name="DemandStockScreen" component={DemandStockScreen} />

    {/* worker */}
    <Stack.Screen name="WorkerLoginScreen" component={WorkerLoginScreen}/>
    <Stack.Screen name="WorkerComplaintsListScreen" component={WorkerComplaintsListScreen}/>
    <Stack.Screen name="WorkerComplaintDetailsScreen" component={WorkerComplaintDetailsScreen}/>
    <Stack.Screen name="WorkerDemandItemsScreen" component={WorkerDemandItemsScreen}/>
    <Stack.Screen name="WorkerDebtScreen" component={WorkerDebtScreen} />

    {/* user */}
  <Stack.Screen name="UserLoginScreen" component={UserLoginScreen} />
<Stack.Screen name="UserHomeScreen" component={UserHomeScreen} />
<Stack.Screen name="UserRegisterComplaintScreen" component={UserRegisterComplaintScreen} />
<Stack.Screen name="UserComplaintsScreen" component={UserComplaintsScreen} />
<Stack.Screen name="UserComplaintDetailScreen" component={UserComplaintDetailScreen} />


    {/* pa */}
    <Stack.Screen name="PALoginScreen" component={PALoginScreen} />
    <Stack.Screen name="PAHomeScreen" component={PAHomeScreen} />
   <Stack.Screen name="PAWorkerScreen" component={PAWorkerScreen} />
<Stack.Screen name="PAWorkerCreateScreen" component={PAWorkerCreateScreen} />
<Stack.Screen name="PAWorkerListScreen" component={PAWorkerListScreen} />
<Stack.Screen name="PAWorkerDetailScreen" component={PAWorkerDetailScreen} />
<Stack.Screen name="PAWorkerCredentialsScreen" component={PAWorkerCredentialsScreen} />
<Stack.Screen name="PAUserScreen" component={PAUserScreen} />
<Stack.Screen name="PAUserCreateScreen" component={PAUserCreateScreen} />
<Stack.Screen name="PAUserListScreen" component={PAUserListScreen} />
<Stack.Screen name="PAUserDetailScreen" component={PAUserDetailScreen} />
<Stack.Screen name="PAUserPasswordScreen" component={PAUserPasswordScreen} />
<Stack.Screen name="UserResolveItemsScreen" component={UserResolveItemsScreen} />
<Stack.Screen name="InventoryRequiredScreen" component={InventoryRequiredScreen} />

   </Stack.Navigator>
  );
}







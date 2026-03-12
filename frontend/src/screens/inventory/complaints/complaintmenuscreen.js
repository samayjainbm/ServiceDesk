// ComplaintsMenuScreen.js
import React from "react";
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import BookedComplaintsScreen from "./complaintsNotAssigned/BookedIds";
import AssignedComplaintsScreen from "./ComplaintsAssigned/getIds";
export default function ComplaintsMenuScreen() {
  const navigation = useNavigation();
const complaintnotassigned = () =>{
  
  
  
  navigation.navigate("bookedIds");

};
const complaintassigned = () => navigation.navigate("AssignedComplaints");
  return (
    <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
        <TouchableOpacity
          style={[styles.pill, styles.itemPill]}
          activeOpacity={0.85}
          onPress={complaintnotassigned}
        >
          <Text style={styles.itemText}>Com. Not Assigned</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pill, styles.itemPill]}
          activeOpacity={0.85}
          onPress={complaintassigned}
        >
          <Text style={styles.itemText}>Com. Assigned</Text>
        </TouchableOpacity>

        

     
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f3f3" },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  pill: {
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  titlePill: {
    width: 340,
    height: 72,
    backgroundColor: "#77aebe",
    borderRadius: 30,
    marginBottom: 48,
  },
  titleText: {
    fontSize: 42,
    fontWeight: "400",
    color: "#eaf3f6",
    letterSpacing: 1,
  },

  itemPill: {
    width: 290,
    height: 56,
    backgroundColor: "#d0d0d0",
    marginBottom: 26,
  },
  itemText: {
    fontSize: 28,
    fontWeight: "400",
    color: "#222",
  },

  backPill: {
    width: 120,
    height: 40,
    backgroundColor: "#cfcfcf",
    marginTop: 30,
    borderRadius: 18,
  },
  backText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
  },
});
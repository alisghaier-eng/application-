import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import MapView, { Marker } from 'react-native-maps';


export default function PaymentPage({ route, navigation }) {
  // Déstructuration des paramètres passés via la navigation
  const {
    carId,
    rentalDays,
    totalAmount,
    startDate,
    endDate,
    wantsDriver,
    destination,
    paymentMethod,
    userToken,
  } = route.params;

  // Fonction pour récupérer le token si non fourni
  const getToken = async () => {
    try {
      const token = userToken || (await AsyncStorage.getItem("authToken")); // Récupération du token
      if (!token) {
        throw new Error("Aucun token disponible.");
      }
      return token;
    } catch (error) {
      console.error("Erreur lors de la récupération du token:", error);
      return null;
    }
  };

  // Fonction de gestion du paiement
  const handlePayment = async () => {
    try {
      // Récupération du token
      const token = await getToken();
      if (!token) {
        Alert.alert("Erreur", "Vous n'êtes pas authentifié. Veuillez vous connecter.");
        return;
      }
  
      // Préparation des données de paiement
      const formattedStartDate = new Date(startDate).toISOString().split("T")[0];
      const formattedEndDate = new Date(endDate).toISOString().split("T")[0];
      const paymentDetails = {
        carId,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        withDriver: wantsDriver,
        ...(wantsDriver && { destination }), // Inclure la destination uniquement si wantsDriver est vrai
        paymentMethod,
      };
  
      console.log("Détails du paiement envoyés :", paymentDetails);
  
      // Requête POST vers le backend
      const response = await axios.post(
        "http://192.168.94.57:6000/rentals",
        paymentDetails,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Token JWT
          },
        }
      );
  
      // Succès
      Alert.alert("Succès", "Votre réservation a été enregistrée avec succès.");
      navigation.navigate("HomepageClient");
    } catch (error) {
      console.error("Erreur lors du paiement :", error);
      Alert.alert(
        "Erreur",
        error.response?.data?.message || "Impossible de traiter la réservation pour le moment."
      );
    }
  };
  

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Détails du Paiement</Text>

      {/* Section de détails de la réservation */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Détails de la réservation</Text>
        <Text style={styles.detailText}>
          <Text style={styles.bold}>ID de la voiture :</Text> {carId}
        </Text>
        <Text style={styles.detailText}>
          <Text style={styles.bold}>Nombre de jours :</Text> {rentalDays} jours
        </Text>
        <Text style={styles.detailText}>
          <Text style={styles.bold}>Date de début :</Text> {new Date(startDate).toDateString()}
        </Text>
        <Text style={styles.detailText}>
          <Text style={styles.bold}>Date de fin :</Text> {new Date(endDate).toDateString()}
        </Text>
        <Text style={styles.detailText}>
          <Text style={styles.bold}>Chauffeur :</Text> {wantsDriver ? "Oui" : "Non"}
        </Text>
        {wantsDriver && (
          <Text style={styles.detailText}>
            <Text style={styles.bold}>Destination :</Text> {destination}
          </Text>
        )}
      </View>

      {/* Section de montant total */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Montant Total</Text>
        <Text style={styles.totalAmount}>${totalAmount.toFixed(2)}</Text>
      </View>

      {/* Bouton de paiement */}
      <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
        <Text style={styles.payButtonText}>Payer Maintenant</Text>
      </TouchableOpacity>

      {/* Bouton retour */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Retour</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f4f6fc",
    alignItems: "center",
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#6200ea",
  },
  detailText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 8,
  },
  bold: {
    fontWeight: "bold",
    color: "#333",
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ff4081",
    textAlign: "center",
    marginVertical: 10,
  },
  payButton: {
    backgroundColor: "#6200ea",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#6200ea",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  backButton: {
    marginTop: 10,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
    color: "#6200ea",
    textDecorationLine: "underline",
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Image,
  Alert,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';

export default function ListeVoitureAgence({ route, navigation }) {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const agencyId = route.params?.agencyId;

  // Récupérer les voitures de l'agence
  const fetchCarsForAgency = async () => {
    if (!agencyId) {
      setError("ID de l'agence non fourni.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `http://192.168.94.57:6000/carsagency?agencyId=${agencyId}`
      );
      const carsData = response.data;

      if (!Array.isArray(carsData)) {
        throw new Error('Données invalides reçues du serveur.');
      }

      setCars(carsData);
      setError(null);
    } catch (err) {
      console.error("Erreur lors de la récupération des voitures :", err);
      setError("Impossible de charger les voitures de l'agence. Réessayez plus tard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarsForAgency();
  }, [agencyId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCarsForAgency();
    setRefreshing(false);
  };

  const renderCarItem = ({ item }) => {
    const imageUrl = item.image.startsWith('http')
      ? item.image
      : `http://192.168.94.57:5000${item.image}`;

    return (
      <View style={styles.card}>
        <TouchableOpacity
          onPress={() => navigation.navigate("DetailsVoiture", { carId: item._id })}
        >
          <Image source={{ uri: imageUrl }} style={styles.carImage} />
        </TouchableOpacity>
        <View style={styles.carInfo}>
          <Text style={styles.carModel}>{item.model}</Text>
          <Text style={styles.carPrice}>{item.priceperday} $/jour</Text>
          <Text style={styles.carMileage}>{item.mileage} km</Text>
          <Text style={styles.carAvailability}>
            {item.availability ? "Disponible" : "Indisponible"}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ea" />
          <Text style={styles.loadingText}>Chargement des voitures...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={cars}
          keyExtractor={(item) => item._id}
          renderItem={renderCarItem}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fbff', // Couleur de fond légère et agréable
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fbff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#78909c',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 16,
    elevation: 2,
  },
  errorText: {
    fontSize: 18,
    color: '#d32f2f',
    fontWeight: '600',
    textAlign: 'center',
  },
  listContainer: {
    marginTop: 16,
    paddingBottom: 20,
  },
  card: {
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  carImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  carInfo: {
    padding: 16,
  },
  carModel: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#263238',
    marginBottom: 4,
  },
  carPrice: {
    fontSize: 18,
    color: '#2e7d32', // Vert doux
    fontWeight: '500',
    marginBottom: 6,
  },
  carMileage: {
    fontSize: 14,
    color: '#78909c',
    marginBottom: 6,
  },
  carAvailability: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f57c00', // Orange vif pour attirer l'attention
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#039be5', // Bleu moderne
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    elevation: 4,
    shadowColor: '#039be5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
});

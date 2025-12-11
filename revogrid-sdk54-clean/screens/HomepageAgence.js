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
import { Button, Card, Badge, Menu, FAB } from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function HomepageAgence({ navigation, route }) {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [badgeCount, setBadgeCount] = useState(0);

  const [menuVisible, setMenuVisible] = useState(false); // Pour afficher/masquer le menu
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

  const fetchNotifications = async () => {
    try {
      // Filtrer les voitures non disponibles
      const rentedCars = cars.filter((car) => !car.availability);
  
      if (rentedCars.length === 0) {
        // Pas de voitures louées, réinitialiser les notifications
        setNotifications([]);
        setBadgeCount(0);
        return;
      }
  
      // Récupérer le jeton d'authentification
      const authToken = await AsyncStorage.getItem("authToken");
  
      if (!authToken) {
        throw new Error("Token d'authentification introuvable.");
      }
  
      // Effectuer les requêtes pour les voitures louées
      const notificationPromises = rentedCars.map((car) =>
        axios
          .get(`http://192.168.94.57:6000/rentals/${car._id}`, {
            headers: {
              Authorization: `Bearer ${authToken}`, // Ajouter le token dans l'en-tête
            },
          })
          .then((response) => response.data.message) // Extraire le message de notification
          .catch((err) => {
            console.error(`Erreur pour la voiture ${car._id} :`, err.message);
            return null; // Retourner null en cas d'erreur
          })
      );
  
      // Attendre que toutes les requêtes soient terminées
      const notificationsList = (await Promise.all(notificationPromises)).filter(Boolean);
  
      // Mettre à jour les notifications et le badge
      setNotifications(notificationsList);
      setBadgeCount(notificationsList.length);
    } catch (err) {
      console.error("Erreur lors de la récupération des notifications :", err);
      Alert.alert("Erreur", "Impossible de récupérer les notifications.");
    }
  };
  
  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["authToken", "userRole", "agencyId"]);
      navigation.reset({
        index: 0,
        routes: [{ name: "HomepageClient" }],
      });
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la déconnexion.");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCarsForAgency();
    setRefreshing(false);
  };

  const renderCarItem = ({ item }) => {
    const imageUrl = item.image.startsWith('http')
      ? item.image
      : `http://192.168.94.57:6000${item.image}`;

    return (
      <Animatable.View animation="fadeInUp" duration={800} style={styles.card}>
        <TouchableOpacity
          onPress={() => navigation.navigate("DetailVoitureAgence", { carId: item._id })}
        >
          <Image source={{ uri: imageUrl }} style={styles.carImage} />
        </TouchableOpacity>
        <Card.Content>
          <Text style={styles.carModel}>{item.model}</Text>
          <Text style={styles.carPrice}>{item.priceperday} $/jour</Text>
          <Text style={styles.carMileage}>{item.mileage} km</Text>
          <Text style={styles.carAvailability}>
            {item.availability ? "Disponible" : "Indisponible"}
          </Text>
          <Text style={styles.agency}>Agence: {item.agency?.email || "Non spécifié"}</Text>
        </Card.Content>
        <Card.Actions style={styles.cardActions}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate("DetailVoitureAgence", { carId: item._id })}
            labelStyle={styles.buttonText}
            style={styles.button}
          >
            Détails
          </Button>
        </Card.Actions>
      </Animatable.View>
    );
  };
  return (
    <View style={styles.container}>
      {/* En-tête avec icône de menu et de notifications */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Mes Voitures</Text>
        <View style={styles.iconsContainer}>
          {/* Icône de menu */}
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TouchableOpacity
                style={styles.menuIcon}
                onPress={() => setMenuVisible(true)}
              >
                <Icon name="menu" size={28} color="#6200ea" />
              </TouchableOpacity>
            }
          >
            <Menu.Item
              onPress={() => navigation.navigate("AjouterVoiture")}
              title="Ajouter une voiture"
              leadingIcon="plus"
            />
            <Menu.Item
              onPress={handleLogout}
              title="Se déconnecter"
              leadingIcon="logout"
            />
          </Menu>
  
          {/* Icône de notifications */}
          <TouchableOpacity
            style={styles.notificationIcon}
            onPress={() => {
              if (notifications.length === 0) {
                Alert.alert("Notifications", "Aucune voiture n'a été louée.");
              } else {
                Alert.alert("Notifications", notifications.join('\n'));
              }
            }}
          >
            <Icon name="notifications" size={28} color="#6200ea" />
            {badgeCount > 0 && <Badge style={styles.badge}>{badgeCount}</Badge>}
          </TouchableOpacity>
        </View>
      </View>
  
      {/* Bouton Rafraîchir */}
      <View style={styles.refreshButtonContainer}>
        <Button
          mode="outlined"
          onPress={handleRefresh}
          loading={refreshing}
          style={styles.refreshButton}
        >
          Rafraîchir les voitures
        </Button>
      </View>
  
      {/* Affichage des voitures */}
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#37474f', // Couleur sombre pour un bon contraste
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#37474f',
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 16, // Espacement entre menu et notification
    padding: 8,
    borderRadius: 50,
    backgroundColor: '#ffffff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  notificationIcon: {
    position: 'relative',
    padding: 8,
    borderRadius: 50,
    backgroundColor: '#ffffff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ff5252',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  refreshButtonContainer: {
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: '#29b6f6',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 28,
    elevation: 3,
  },
  menuIconContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#7c4dff', // Violet lumineux pour une touche moderne
    borderRadius: 50,
    paddingVertical: 14,
    elevation: 5,
    shadowColor: '#7c4dff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  refreshButtonContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: '#4fc3f7',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 28,
    elevation: 3,
    shadowColor: '#4fc3f7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
  agency: {
    fontSize: 12,
    color: '#b0bec5',
    fontStyle: 'italic',
  },
  cardActions: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
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
  logoutContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  logoutButton: {
    backgroundColor: '#ef5350',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#ef5350',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  logoutButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
});

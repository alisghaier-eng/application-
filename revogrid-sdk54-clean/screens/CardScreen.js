import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Appbar, Text as PaperText, Card, Button } from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function CartScreen({ navigation }) {
  const [cartItems, setCartItems] = useState([]); // Voitures récupérées
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Récupérer les voitures dans le panier
  const fetchCartItems = async () => {
    try {
      setLoading(true); // Début du chargement
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.warn('Token manquant. Redirection vers la connexion.');
        setError('Vous devez être connecté pour voir votre panier.');
        return;
      }

      const response = await axios.get('http://192.168.9.57:6000/cart', {
        headers: {
          Authorization: `Bearer ${token}`, // Token envoyé dans les en-têtes
        },
      });

      const items = response.data.cartItems || [];
      setCartItems(items);
      setError(null); // Réinitialiser les erreurs en cas de succès
    } catch (err) {
      setError('Impossible de charger les voitures du panier. Veuillez réessayer.');
    } finally {
      setLoading(false); // Fin du chargement
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  // Affichage des voitures
  const renderCarItem = ({ item }) => {
    const carDetails = item?.carId;
    if (!carDetails) return null;

    const imageUrl = carDetails?.image?.startsWith('http')
      ? carDetails?.image
      : `http://192.168.94.57:6000${carDetails?.image || ''}`;

    return (
      <Animatable.View animation="fadeInUp" duration={800} style={styles.cardContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate('DetailsVoiture', { carId: carDetails._id })}
        >
          <Card style={styles.card}>
            {/* Chargez l'image avec la source correcte */}
            <Image source={{ uri: imageUrl }} style={styles.image} />
            <Card.Content style={styles.cardContent}>
              <PaperText style={styles.name}>{item.model}</PaperText>
              <PaperText style={styles.price}>${item.priceperday}/jour</PaperText>
              <PaperText style={styles.agency}>
                Agency: {item.agency?.email || 'Non spécifié'}
              </PaperText>
            </Card.Content>
            <Card.Actions style={styles.cardActions}>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('DetailsVoiture', { carId: item._id })}
                labelStyle={styles.buttonText}
                style={styles.button}
              >
                Détails
              </Button>
            </Card.Actions>
          </Card>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  // Affichage conditionnel : chargement, erreur ou liste
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ea" />
        <PaperText style={styles.loadingText}>Chargement des voitures dans le panier...</PaperText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <PaperText style={styles.errorText}>{error}</PaperText>
        <Button mode="contained" onPress={fetchCartItems} style={styles.retryButton}>
          Réessayer
        </Button>
      </View>
    );
  }

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <PaperText style={styles.emptyText}>Votre panier est vide.</PaperText>
      </View>
    );
  }

  return (
    <>
      {/* Barre de navigation */}
      <Appbar.Header style={styles.navbar}>
        <Appbar.Content title="Mon Panier" />
        <Appbar.Action icon="home" onPress={() => navigation.navigate('Accueil')} />
      </Appbar.Header>

      {/* Liste des voitures */}
      <FlatList
        contentContainerStyle={styles.listContainer}
        data={cartItems}
        renderItem={renderCarItem}
        keyExtractor={(item) => item._id || item.id}
        numColumns={2}
      />
    </>
  );
}

const styles = StyleSheet.create({
  navbar: {
    backgroundColor: '#6200ea',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  cardContainer: {
    margin: 8,
    width: CARD_WIDTH,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginVertical: 6,
    textAlign: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '500',
    color: '#777',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardActions: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  button: {
    backgroundColor: '#6200ea',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    marginTop: 10,
    backgroundColor: '#6200ea',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#757575',
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: 16,
  },
});

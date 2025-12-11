import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

export default function DetailsVoitureAgence({ route }) {
  const { carId } = route.params; // Receives carId from the previous screen
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false); // Toggle for editing mode
  const [editedCar, setEditedCar] = useState({});
  const navigation = useNavigation();

  useEffect(() => {
    const fetchCarDetails = async () => {
      try {
        const response = await axios.get(`http://192.168.94.57:6000/cars/${carId}`);
        setCar(response.data);
        setEditedCar(response.data); // Initialize edited fields with the original car details
        setLoading(false);
      } catch (err) {
        console.error('Error fetching car details:', err);
        setError('Impossible de charger les détails de la voiture. Réessayez plus tard.');
        setLoading(false);
      }
    };

    fetchCarDetails();
  }, [carId]);

  const handleSave = async () => {
    try {
      await axios.put(`http://192.168.94.57:6000/cars/${carId}`, editedCar);
      setCar(editedCar); // Update the original car data
      setEditing(false); // Exit editing mode
      Alert.alert('Succès', 'Les modifications ont été enregistrées.');
    } catch (err) {
      console.error('Error saving car details:', err);
      Alert.alert('Erreur', 'Impossible d\'enregistrer les modifications.');
    }
  };

  const handleDelete = () => {
    Alert.alert('Confirmation', 'Êtes-vous sûr de vouloir supprimer cette voiture ?', [
      {
        text: 'Annuler',
        style: 'cancel',
      },
      {
        text: 'Supprimer',
        onPress: async () => {
          try {
            await axios.delete(`http://192.168.94.57:6000/cars/${carId}`);
            navigation.goBack(); // Navigate back after deletion
          } catch (err) {
            console.error('Error deleting car:', err);
            Alert.alert('Erreur', 'Impossible de supprimer la voiture. Réessayez plus tard.');
          }
        },
      },
    ]);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleEditToggle = () => {
    setEditing(!editing); // Toggle between editing and viewing mode
  };

  const handleChange = (field, value) => {
    setEditedCar((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ea" />
        <Text style={styles.loadingText}>Chargement des détails...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!car) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Voiture non trouvée</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {car.image && (
        <Image
          source={{
            uri: car.image.startsWith('http')
              ? car.image
              : `http://192.168.217.57:5000${car.image}`,
          }}
          style={styles.carImage}
        />
      )}
      <View style={styles.detailsContainer}>
        {editing ? (
          <TextInput
            style={styles.input}
            value={editedCar.model}
            onChangeText={(text) => handleChange('model', text)}
          />
        ) : (
          <Text style={styles.carModel}>{car.model}</Text>
        )}

        {editing ? (
          <TextInput
            style={styles.input}
            value={editedCar.priceperday.toString()}
            keyboardType="numeric"
            onChangeText={(text) => handleChange('priceperday', text)}
          />
        ) : (
          <Text style={styles.carPrice}>{car.priceperday} $/jour</Text>
        )}

        {editing ? (
          <TextInput
            style={styles.input}
            value={editedCar.licensePlate}
            onChangeText={(text) => handleChange('licensePlate', text)}
          />
        ) : (
          <Text style={styles.carLicensePlate}>Matricule: {car.licensePlate}</Text>
        )}

        <Text style={styles.carTransmission}>Transmission: {car.transmission}</Text>

        <Text style={styles.carAvailability}>
          Disponibilité: {car.availability ? 'Disponible' : 'Indisponible'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        {editing ? (
          <>
            <TouchableOpacity style={styles.button} onPress={handleSave}>
              <Text style={styles.buttonText}>Enregistrer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleEditToggle}
            >
              <Text style={styles.buttonText}>Annuler</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleEditToggle}>
            <Text style={styles.buttonText}>Modifier</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
          <Text style={styles.buttonText}>Supprimer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleBack}>
          <Text style={styles.buttonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 18,
    color: '#777',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
  },
  errorText: {
    fontSize: 18,
    color: '#d32f2f', // Red color for errors
    fontWeight: '600',
  },
  carImage: {
    width: '100%',
    height: 300,
    borderRadius: 15,
    resizeMode: 'cover',
    marginBottom: 20,
  },
  detailsContainer: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: -30,
    marginHorizontal: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  carModel: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  carPrice: {
    fontSize: 22,
    color: '#03A9F4',
    fontWeight: '500',
    marginTop: 12,
  },
  carLicensePlate: {
    fontSize: 18,
    color: '#444',
    marginTop: 18,
  },
  carTransmission: {
    fontSize: 18,
    color: '#444',
    marginTop: 14,
  },
  carAvailability: {
    fontSize: 18,
    color: '#444',
    marginTop: 14,
    fontWeight: '500',
    color: '#388E3C', // Green for availability
  },
  carCreatedAt: {
    fontSize: 16,
    color: '#888',
    marginTop: 12,
  },
  buttonContainer: {
    marginTop: 32,
    alignItems: 'center',
    marginBottom: 32, // Increased space for better layout
  },
  button: {
    borderRadius: 25,
    paddingHorizontal: 24,
    paddingVertical: 12,
    width: '80%',
    elevation: 4,
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  modifyButton: {
    backgroundColor: '#03A9F4', // Light blue for modification
  },
  deleteButton: {
    backgroundColor: '#d32f2f', // Red color for delete
  },
  backButton: {
    backgroundColor: '#8BC34A', // Green for return button
  },
});

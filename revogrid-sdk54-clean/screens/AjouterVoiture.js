import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { TextInput, Button } from 'react-native-paper'; 
import * as ImagePicker from 'expo-image-picker'; 
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AddCarScreen({ navigation }) {
  const [model, setModel] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [availability, setAvailability] = useState(true);
  const [image, setImage] = useState(null);
  const [licensePlate, setLicensePlate] = useState('');
  const [transmission, setTransmission] = useState('manuelle');
  const [loading, setLoading] = useState(false);

  // Fonction pour sélectionner l'image
  const handleImagePick = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert("Permission d'accès à la galerie est nécessaire !");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'image :', error);
    }
  };

  // Récupération du token d'authentification
  const getToken = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return token;
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
      return null;
    }
  };

  // Envoi des données à l'API
  const handleAddCar = async () => {
    if (!model || !pricePerDay || !licensePlate || !image) {
      Alert.alert("Erreur", "Tous les champs, y compris une image, sont obligatoires.");
      return;
    }

    setLoading(true);

    try {
      const token = await getToken();
      if (!token) {
        Alert.alert("Erreur", "Vous n'êtes pas authentifié.");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("model", model);
      formData.append("priceperday", parseFloat(pricePerDay));
      formData.append("availability", availability);
      formData.append("licensePlate", licensePlate);
      formData.append("transmission", transmission);
      formData.append("image", {
        uri: image,
        name: "car_image.jpg",
        type: "image/jpeg",
      });

      await axios.post(
        "http://192.168.94.57:6000/cars",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      Alert.alert("Succès", "Voiture ajoutée avec succès !");
      navigation.goBack();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la voiture:', error.response?.data || error.message);
      Alert.alert("Erreur", "Problème lors de l'ajout de la voiture.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Ajouter une voiture</Text>

      <TextInput
        label="Modèle"
        value={model}
        onChangeText={setModel}
        style={styles.input}
        mode="outlined"
        autoCapitalize="none"
      />
      <TextInput
        label="Prix par jour"
        value={pricePerDay}
        onChangeText={setPricePerDay}
        style={styles.input}
        mode="outlined"
        keyboardType="numeric"
      />
      <TouchableOpacity 
        onPress={() => setAvailability(!availability)} 
        style={[
          styles.availabilityButton, 
          availability ? styles.available : styles.unavailable,
        ]}
      >
        <Text style={styles.availabilityText}>
          {availability ? "Disponible" : "Indisponible"}
        </Text>
      </TouchableOpacity>
      <TextInput
        label="Matricule"
        value={licensePlate}
        onChangeText={setLicensePlate}
        style={styles.input}
        mode="outlined"
        autoCapitalize="none"
      />
      <Text style={styles.label}>Transmission</Text>
      <View style={styles.transmissionContainer}>
        <TouchableOpacity 
          onPress={() => setTransmission('manuelle')} 
          style={[styles.transmissionButton, transmission === 'manuelle' && styles.selected]}
        >
          <Text style={styles.transmissionText}>Manuelle</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setTransmission('automatique')} 
          style={[styles.transmissionButton, transmission === 'automatique' && styles.selected]}
        >
          <Text style={styles.transmissionText}>Automatique</Text>
        </TouchableOpacity>
      </View>
      <Button 
        mode="outlined" 
        onPress={handleImagePick} 
        style={styles.imagePickerButton}
      >
        {image ? "Modifier l'image" : "Ajouter une image"}
      </Button>
      {image && <Text style={styles.imageSelected}>Image sélectionnée</Text>}
      <Button 
        mode="contained" 
        onPress={handleAddCar} 
        style={styles.button}
        loading={loading}
        disabled={loading}
      >
        Ajouter la voiture
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    backgroundColor: '#6200ea',
    paddingVertical: 10,
    borderRadius: 5,
  },
  availabilityButton: {
    paddingVertical: 10,
    marginVertical: 10,
    borderRadius: 5,
  },
  available: {
    backgroundColor: '#4caf50',
  },
  unavailable: {
    backgroundColor: '#f44336',
  },
  availabilityText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
  },
  label: {
    marginVertical: 10,
    fontSize: 16,
    color: '#555',
  },
  transmissionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  transmissionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  selected: {
    backgroundColor: '#6200ea',
    borderColor: '#6200ea',
  },
  transmissionText: {
    color: '#fff',
  },
  imagePickerButton: {
    marginVertical: 20,
    borderColor: '#6200ea',
    borderWidth: 1,
  },
  imageSelected: {
    textAlign: 'center',
    color: '#4caf50',
    marginTop: 10,
    fontSize: 14,
  },
});

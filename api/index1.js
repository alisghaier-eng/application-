import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { TextInput, Button, RadioButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import axios from 'axios';
import { Linking } from 'react-native';


export default function SignUpScreen({ navigation }) {
  const [userType, setUserType] = useState('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [driverLicenseImage, setDriverLicenseImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [mapImage, setMapImage] = useState(null);
  const openMap = (latitude, longitude) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    Linking.openURL(url).catch(err => {
      console.error('Erreur lors de l\'ouverture de la carte :', err);
      Alert.alert('Erreur', 'Impossible d\'ouvrir la carte.');
    });
  };
  

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
        setDriverLicenseImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'image :', error);
    }
  };

  const handleLocationFetch = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'La permission d\'accéder à la localisation est requise.');
        return;
      }
  
      const userLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = userLocation.coords;
  
      setLocation({ latitude, longitude });
  
      // Générer une URL d'image statique avec OpenStreetMap
      const mapUrl = `https://static-maps.yandex.ru/1.x/?ll=${longitude},${latitude}&size=600,300&z=15&l=map&pt=${longitude},${latitude},pm2rdm`;
  
      setMapImage(mapUrl);
    } catch (error) {
      console.error('Erreur lors de la récupération de la localisation :', error);
      Alert.alert('Erreur', 'Impossible d\'obtenir votre localisation.');
    }
  };
  
  
  const handleSignUp = async () => {
    if (!email.trim() || !password || !confirmPassword || !phoneNumber.trim()) {
      Alert.alert('Erreur', 'Tous les champs obligatoires doivent être remplis.');
      return;
    }
  
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }
  
    if (userType === 'agence' && (!location || !location.latitude || !location.longitude)) {
      Alert.alert('Erreur', 'La localisation est requise pour les agences.');
      return;
    }
  
    const user = {
      role: userType,
      email: email.trim(),
      password: password,
      phoneNumber: phoneNumber.trim(),
      driverLicenseImage: userType === 'client' ? driverLicenseImage : null,
      latitude: userType === 'agence' ? location?.latitude : null,
      longitude: userType === 'agence' ? location?.longitude : null,
    };
  
    try {
      const response = await axios.post('http://192.168.217.57:5000/signUp', user);
      Alert.alert('Inscription réussie !', 'Vous pouvez maintenant vous connecter.');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Erreur lors de l\'inscription :', error.response?.data || error.message);
  
      // Afficher des messages d'erreur plus précis si disponibles
      const errorMessage = error.response?.data?.message || 'Problème lors de l\'inscription.';
      Alert.alert('Erreur', errorMessage);
    }
  };
  

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Créez votre compte</Text>
      <Text style={styles.subtitle}>Rejoignez-nous pour louer une voiture facilement</Text>

      <Text style={styles.label}>Vous êtes :</Text>
      <RadioButton.Group onValueChange={setUserType} value={userType}>
        <View style={styles.radioButtonContainer}>
          <RadioButton value="client" />
          <Text style={styles.radioLabel}>Client</Text>
        </View>
        <View style={styles.radioButtonContainer}>
          <RadioButton value="agence" />
          <Text style={styles.radioLabel}>Agence</Text>
        </View>
      </RadioButton.Group>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        mode="outlined"
        autoCapitalize="none"
        keyboardType="email-address"
        left={<TextInput.Icon name="email" />}
        theme={{ colors: { primary: '#6200ea' } }}
      />

      <TextInput
        label="Mot de passe"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        mode="outlined"
        secureTextEntry
        left={<TextInput.Icon name="lock" />}
        theme={{ colors: { primary: '#6200ea' } }}
      />

      <TextInput
        label="Confirmer le mot de passe"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={styles.input}
        mode="outlined"
        secureTextEntry
        left={<TextInput.Icon name="lock" />}
        theme={{ colors: { primary: '#6200ea' } }}
      />

      <TextInput
        label="Numéro de téléphone"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        style={styles.input}
        mode="outlined"
        keyboardType="phone-pad"
        left={<TextInput.Icon name="phone" />}
        theme={{ colors: { primary: '#6200ea' } }}
      />

      {userType === 'client' && (
        <>
          <Text style={styles.label}>Permis de conduire :</Text>
          <Button mode="outlined" onPress={handleImagePick} style={styles.imagePickerButton}>
            {driverLicenseImage ? 'Modifier l\'image' : 'Ajouter une image'}
          </Button>
          {driverLicenseImage && (
            <Text style={styles.imageSelected}>Image sélectionnée</Text>
          )}
        </>
      )}

      {userType === 'agence' && (
        <>
          <Text style={styles.label}>Localisation :</Text>
          <Button mode="contained" onPress={handleLocationFetch} style={styles.locationButton}>
            Préciser ma localisation
          </Button>
          {location && (
            <View>
              <Text style={styles.coordinates}>
                Localisation : Latitude {location.latitude.toFixed(5)}, Longitude {location.longitude.toFixed(5)}
              </Text>
              {mapImage && (
  <TouchableOpacity onPress={() => openMap(location.latitude, location.longitude)}>
    <Image source={{ uri: mapImage }} style={styles.mapImage} />
  </TouchableOpacity>
)}

            </View>
          )}
        </>
      )}

      <Button mode="contained" onPress={handleSignUp} style={styles.button}>
        S'inscrire
      </Button>

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.link}>
        <Text style={styles.linkText}>Déjà un compte ? Connectez-vous</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#e8eaf6',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#4a148c',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    color: '#555',
  },
  input: {
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  button: {
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: '#6200ea',
  },
  link: {
    marginTop: 15,
    alignItems: 'center',
  },
  linkText: {
    color: '#4a148c',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#4a148c',
    fontWeight: 'bold',
  },
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  radioLabel: {
    fontSize: 16,
    color: '#555',
  },
  imagePickerButton: {
    marginBottom: 10,
  },
  imageSelected: {
    fontSize: 14,
    color: '#4a148c',
    marginTop: 5,
  },
  locationButton: {
    marginBottom: 10,
  },
  coordinates: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  mapImage: {
    width: '100%',
    height: 200,
    marginTop: 10,
    borderRadius: 12,
  },
});

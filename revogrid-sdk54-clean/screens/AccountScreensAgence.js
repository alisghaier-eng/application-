import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Button,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as Location from 'expo-location'; // Importation de expo-location
import MapView, { Marker } from 'react-native-maps'; 
import { Linking } from 'react-native';

export default function AccountScreensAgence({ route, navigation }) {
  const [agency, setAgency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState(false);
  const [isMapInteractive, setIsMapInteractive] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);

  // Sécurité : si route.params est vide (cas rare), on évite le crash
  const agencyId = route.params?.agencyId; 

  useEffect(() => {
    if (!agencyId) {
       Alert.alert("Erreur", "ID de l'agence manquant");
       navigation.goBack();
       return;
    }

    const fetchAgencyDetails = async () => {
      try {
        // Assurez-vous que cette adresse IP est accessible depuis votre téléphone
        const response = await axios.get(`http://192.168.94.57:6000/agencies/${agencyId}`);
        setAgency(response.data.agency);
      } catch (err) {
        console.error("Erreur API Agence:", err);
        Alert.alert('Erreur', "Impossible de récupérer les informations de l'agence.");
      } finally {
        setLoading(false);
      }
    };

    fetchAgencyDetails();
    getLocationPermission();
  }, [agencyId]);

  const getLocationPermission = async () => {
    try {
      // CORRECTION ICI : Utilisez requestForegroundPermissionsAsync au lieu de requestPermissionsAsync
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
    } catch (error) {
      console.log("Erreur permission localisation:", error);
    }
  };

  const openInGoogleMaps = () => {
    if (agency?.latitude && agency?.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${agency.latitude},${agency.longitude}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Erreur', "Impossible d'ouvrir Google Maps.");
      });
    } else {
      Alert.alert('Erreur', "Coordonnées de l'agence manquantes.");
    }
  };

  const makePhoneCall = (phoneNumber) => {
    if (!phoneNumber) return;
    Linking.openURL(`tel:${phoneNumber}`).catch(() => Alert.alert('Erreur', "Impossible de passer l'appel."));
  };

  const sendEmail = (email) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`).catch(() => Alert.alert('Erreur', "Impossible d'ouvrir l'email."));
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#4a148c" style={styles.loader} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <Ionicons name="business" size={80} color="#fff" />
        <Text style={styles.name}>{agency?.agencyName || "Agence inconnue"}</Text>
      </View>

      {/* Informations */}
      <View style={styles.infoSection}>
        <Text style={styles.title}>Informations</Text>
        <InfoItem icon="business" label="Nom" value={agency?.agencyName} />
        
        <TouchableOpacity onPress={() => makePhoneCall(agency?.phoneNumber)}>
          <InfoItem icon="call" label="Téléphone" value={agency?.phoneNumber} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => sendEmail(agency?.email)}>
          <InfoItem icon="mail" label="Email" value={agency?.email} />
        </TouchableOpacity>
      </View>

      {/* Carte */}
      <View style={styles.mapContainer}>
        {agency?.latitude && agency?.longitude ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: parseFloat(agency.latitude), // Conversion en nombre par sécurité
              longitude: parseFloat(agency.longitude),
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={isMapInteractive}
            zoomEnabled={isMapInteractive}
            pitchEnabled={isMapInteractive}
            rotateEnabled={isMapInteractive}
          >
            <Marker
              coordinate={{
                latitude: parseFloat(agency.latitude),
                longitude: parseFloat(agency.longitude),
              }}
              title={agency.agencyName}
              description="Localisation de l'agence"
              onCalloutPress={openInGoogleMaps}
            />
          </MapView>
        ) : (
          <View style={[styles.map, {justifyContent: 'center', alignItems: 'center'}]}>
             <Text>Localisation non disponible</Text>
          </View>
        )}

        {isOverlayVisible && agency?.latitude && (
          <View style={styles.overlay}>
            <Button
              title="Activer la carte"
              onPress={() => {
                setIsMapInteractive(true);
                setIsOverlayVisible(false);
              }}
              color="#FF7F50"
            />
          </View>
        )}
      </View>

      {/* Bouton Navigation */}
      <View style={styles.buttonContainer}>
        <Button
          title="Voir les voitures"
          onPress={() => navigation.navigate('Listevoitureagence', { agencyId })}
          color="#4a148c"
        />
      </View>
    </ScrollView>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={22} color="#4a148c" />
      <Text style={styles.infoText}>
        {label} : {value || 'Non renseigné'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#f7f7f7' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 20, backgroundColor: '#4a148c', paddingVertical: 20, borderRadius: 10, elevation: 5 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 10, textAlign: 'center' },
  infoSection: { marginTop: 10, backgroundColor: '#fff', padding: 20, borderRadius: 12, elevation: 3 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12, color: '#4a148c' },
  infoItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  infoText: { marginLeft: 12, fontSize: 16, color: '#444' },
  mapContainer: { marginVertical: 25, height: 300, borderRadius: 12, overflow: 'hidden', elevation: 4, backgroundColor: '#fff', position: 'relative' },
  map: { width: '100%', height: '100%' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0, 0.3)', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  buttonContainer: { marginBottom: 30 },
});
import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Platform,
  Dimensions
} from 'react-native';
import { WebView } from 'react-native-webview'; // <--- LE SAUVEUR POUR ANDROID
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';

// --- THEME ---
const THEME = {
  bg: '#050B14',
  primary: '#00F0FF',
  secondary: '#00FF9D',
  occupied: '#FF0055',
  text: '#FFFFFF',
  textDim: 'rgba(255, 255, 255, 0.6)',
};

// --- VOS BORNES ---
const STATIONS = [
  {
    id: 1,
    name: "Station Pôle Ghazela",
    lat: 36.8930,
    lng: 10.1880,
    status: "libre",
    price: 0.350,
    power: 150,
    connector: "CCS2",
    address: "Technopark El Ghazela, Ariana"
  },
  {
    id: 2,
    name: "TotalEnergies Lac 2",
    lat: 36.8440,
    lng: 10.2340,
    status: "occupé",
    price: 0.450,
    power: 50,
    connector: "Type 2",
    address: "Les Berges du Lac 2, Tunis"
  },
  {
    id: 3,
    name: "La Marsa Corniche",
    lat: 36.8850,
    lng: 10.3300,
    status: "libre",
    price: 0.400,
    power: 22,
    connector: "Type 2",
    address: "Corniche, La Marsa"
  }
];

export default function SmartMapScreen({ navigation }) {
  const [selectedStation, setSelectedStation] = useState(null);
  const webviewRef = useRef(null);

  // --- C'EST ICI QUE LA MAGIE OPÈRE : LE CODE HTML DE LA CARTE ---
  // On injecte Leaflet (JS) directement dans l'application.
  const leafletHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; background-color: #050B14; }
        #map { height: 100vh; width: 100vw; }
        /* Style des popups pour qu'ils soient sombres */
        .leaflet-popup-content-wrapper, .leaflet-popup-tip {
            background: rgba(20, 30, 50, 0.9);
            color: white;
            box-shadow: 0 3px 14px rgba(0,0,0,0.4);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        // 1. Initialisation de la carte (Centrée sur Tunis)
        var map = L.map('map', {zoomControl: false}).setView([36.8700, 10.2200], 12);

        // 2. Chargement des tuiles "Dark Matter" (Gratuit & Sombre)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '',
          maxZoom: 19
        }).addTo(map);

        // 3. Icônes personnalisées (Cercles Néon)
        const createIcon = (color) => L.divIcon({
          className: 'custom-div-icon',
          html: "<div style='background-color:" + color + "; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px " + color + ";'></div>",
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        // 4. Injection des stations depuis React Native
        const stations = ${JSON.stringify(STATIONS)};

        stations.forEach(station => {
          const color = station.status === 'libre' ? '${THEME.secondary}' : '${THEME.occupied}';
          
          const marker = L.marker([station.lat, station.lng], { icon: createIcon(color) }).addTo(map);
          
          // Quand on clique sur le marqueur HTML
          marker.on('click', () => {
             // On envoie l'ID à React Native
             window.ReactNativeWebView.postMessage(JSON.stringify(station));
             
             // Petit effet de zoom
             map.flyTo([station.lat, station.lng], 14, { duration: 0.5 });
          });
        });

      </script>
    </body>
    </html>
  `;

  // --- RECEPTION DU CLIC DEPUIS LA WEBVIEW ---
  const handleMessage = (event) => {
    const station = JSON.parse(event.nativeEvent.data);
    setSelectedStation(station);
  };

  const startNavigation = () => {
    if (selectedStation) {
      Alert.alert("Navigation", `Itinéraire vers ${selectedStation.name} démarré.`);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* --- LA CARTE WEBVIEW (Remplace MapView) --- */}
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html: leafletHTML }}
        style={styles.map}
        onMessage={handleMessage} // Écoute les clics sur les marqueurs
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />

      {/* --- HEADER FLOTTANT --- */}
      <View style={styles.headerOverlay}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={THEME.primary} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Text style={{color: THEME.textDim, marginLeft: 10}}>Rechercher une borne...</Text>
        </View>
      </View>

      {/* --- FICHE INFO (BOTTOM SHEET) --- */}
      {selectedStation && (
        <Animatable.View animation="fadeInUp" duration={300} style={styles.bottomSheet}>
          <LinearGradient
            colors={['rgba(20, 30, 50, 0.98)', 'rgba(5, 11, 20, 1)']}
            style={styles.sheetGradient}
          >
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.stationName}>{selectedStation.name}</Text>
                <Text style={styles.stationAddress}>{selectedStation.address}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedStation(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>PUISSANCE</Text>
                <Text style={styles.statValue}>{selectedStation.power} kW</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>TARIF</Text>
                <Text style={styles.statValue}>{selectedStation.price} DT</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>ÉTAT</Text>
                <Text style={{
                    color: selectedStation.status === 'libre' ? THEME.secondary : THEME.occupied,
                    fontWeight: 'bold'
                }}>
                    {selectedStation.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={startNavigation} style={styles.navigateBtn}>
              <LinearGradient
                colors={[THEME.primary, '#0085FF']}
                start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                style={styles.navigateGradient}
              >
                <FontAwesome5 name="location-arrow" size={18} color="#000" style={{marginRight: 10}} />
                <Text style={styles.navigateText}>DÉMARRER ITINÉRAIRE</Text>
              </LinearGradient>
            </TouchableOpacity>

          </LinearGradient>
        </Animatable.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  map: {
    flex: 1,
    backgroundColor: '#050B14', // Fond sombre pendant le chargement
  },
  headerOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
  },
  backButton: {
    width: 45, height: 45,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  searchBar: {
    flex: 1,
    height: 45,
    marginLeft: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 25,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 30,
    left: 15,
    right: 15,
    borderRadius: 20,
    elevation: 20,
  },
  sheetGradient: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  stationName: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  stationAddress: { color: THEME.textDim, fontSize: 12 },
  closeBtn: { padding: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 15 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 12,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  statLabel: { color: THEME.textDim, fontSize: 10, marginBottom: 5 },
  statValue: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  navigateBtn: { borderRadius: 12, overflow: 'hidden' },
  navigateGradient: { paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  navigateText: { color: '#000', fontWeight: 'bold' },
});
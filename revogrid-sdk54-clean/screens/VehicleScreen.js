import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ScrollView,
  SafeAreaView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// --- THÈME CYBERPUNK ---
const THEME = {
  bg: '#050B14',
  primary: '#00F0FF',
  secondary: '#00FF9D',
  cardBg: 'rgba(30, 41, 59, 0.6)',
  text: '#FFFFFF',
  textDim: 'rgba(255, 255, 255, 0.6)',
  danger: '#EF4444',
  warning: '#F59E0B'
};

export default function VehicleScreen({ navigation }) {
  
  // État local de la voiture (Simulation)
  const [carState, setCarState] = useState({
    isEngineOn: false,
    speed: 0,
    battery: 78,
    range: 342,
    rpm: 0,
    temp: 24,
    location: "Tunis, Les Berges du Lac"
  });

  // Moteur de Simulation
  useEffect(() => {
    let interval;
    if (carState.isEngineOn) {
      interval = setInterval(() => {
        setCarState(prev => {
          const speedChange = Math.random() > 0.5 ? 2 : -2;
          let newSpeed = prev.speed + speedChange;
          
          if (newSpeed < 60) newSpeed += 5; 
          if (newSpeed > 130) newSpeed -= 5;
          
          const newBattery = prev.battery - 0.05;
          const newRange = (newBattery / 100) * 450; 

          return {
            ...prev,
            speed: Math.max(0, Math.round(newSpeed)),
            battery: Math.max(0, parseFloat(newBattery.toFixed(2))),
            range: Math.round(newRange),
            rpm: Math.round(newSpeed * 35 + (Math.random() * 200)), 
            temp: 24 + (newSpeed / 20)
          };
        });
      }, 800);
    } else {
      setCarState(prev => ({
        ...prev,
        speed: 0,
        rpm: 0,
        temp: 24
      }));
    }
    return () => clearInterval(interval);
  }, [carState.isEngineOn]);

  const toggleEngine = () => {
    setCarState(prev => ({ ...prev, isEngineOn: !prev.isEngineOn }));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
      
      <LinearGradient
        colors={['#050B14', '#0F172A', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.brandTitle}>TESLA MODEL 3</Text>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: carState.isEngineOn ? THEME.secondary : THEME.danger }]} />
              <Text style={styles.statusText}>{carState.isEngineOn ? 'EN LIGNE' : 'PARKED'}</Text>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Visualisation Voiture */}
          <View style={styles.carContainer}>
            {carState.isEngineOn && (
               <View style={styles.pulseRing} />
            )}
            <Image 
              source={{ uri: 'https://pngimg.com/d/tesla_car_PNG46.png' }} 
              style={styles.carImage} 
              resizeMode="contain"
            />
          </View>

          {/* Dashboard Stats */}
          <View style={styles.dashboardCard}>
            
            {/* Jauge Principale (Vitesse) */}
            <View style={styles.gaugeContainer}>
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={toggleEngine}
                style={[styles.gaugeCircle, carState.isEngineOn && styles.gaugeActive]}
              >
                {!carState.isEngineOn && (
                   <Feather name="power" size={32} color={THEME.danger} style={{ marginBottom: 5 }} />
                )}
                <Text style={styles.speedText}>{carState.speed}</Text>
                <Text style={styles.unitText}>KM/H</Text>
                
                {!carState.isEngineOn && (
                  <Text style={styles.startText}>DÉMARRER</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Grille de Données */}
            <View style={styles.gridContainer}>
              
              {/* Batterie */}
              <View style={styles.gridItem}>
                <View style={[styles.progressBar, { width: `${carState.battery}%`, backgroundColor: carState.battery < 20 ? THEME.danger : THEME.secondary }]} />
                <View style={styles.gridHeader}>
                  <Feather name="battery-charging" size={20} color={carState.battery < 20 ? THEME.danger : THEME.secondary} />
                  <Text style={styles.gridLabel}>SOC</Text>
                </View>
                <Text style={styles.gridValue}>{Math.floor(carState.battery)}<Text style={styles.gridUnit}>%</Text></Text>
                <Text style={styles.gridSubText}>~{carState.range} km</Text>
              </View>

              {/* Localisation */}
              <View style={styles.gridItem}>
                <View style={styles.gridHeader}>
                  <Feather name="map-pin" size={20} color="#A78BFA" />
                  {carState.isEngineOn && <Feather name="activity" size={16} color="#A78BFA" />}
                </View>
                <Text numberOfLines={1} style={[styles.gridValue, { fontSize: 14, marginTop: 5 }]}>{carState.location}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                  <Feather name="navigation" size={10} color={THEME.textDim} />
                  <Text style={styles.gridSubText}> GPS Actif</Text>
                </View>
              </View>

              {/* Température */}
              <View style={styles.gridItem}>
                <View style={styles.gridHeader}>
                  <Feather name="thermometer" size={20} color={THEME.warning} />
                  <Text style={styles.gridLabel}>TEMP</Text>
                </View>
                <Text style={styles.gridValue}>{carState.temp.toFixed(1)}°C</Text>
                <View style={styles.tempBarBg}>
                  <View style={[styles.tempBarFill, { width: `${(carState.temp / 80) * 100}%` }]} />
                </View>
              </View>

              {/* Moteur */}
              <View style={styles.gridItem}>
                <View style={styles.gridHeader}>
                  <Feather name="zap" size={20} color="#FACC15" />
                  <Text style={styles.gridLabel}>RPM</Text>
                </View>
                <Text style={styles.gridValue}>{carState.rpm}</Text>
                <Text style={[styles.gridSubText, { color: '#FACC15' }]}>
                  {carState.isEngineOn ? 'Performance' : 'Standby'}
                </Text>
              </View>

            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    zIndex: 10,
  },
  backBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  brandTitle: {
    color: THEME.primary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 6, height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  carContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  carImage: {
    width: width * 0.9,
    height: 200,
    zIndex: 2,
  },
  pulseRing: {
    position: 'absolute',
    width: 250, height: 250,
    borderRadius: 125,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
  },
  dashboardCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    minHeight: 500,
  },
  gaugeContainer: {
    alignItems: 'center',
    marginTop: -50,
    marginBottom: 30,
  },
  gaugeCircle: {
    width: 140, height: 140,
    borderRadius: 70,
    backgroundColor: '#0F172A',
    borderWidth: 4,
    borderColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  gaugeActive: {
    borderColor: THEME.primary,
    shadowColor: THEME.primary,
  },
  speedText: {
    color: '#FFF',
    fontSize: 42,
    fontWeight: 'bold',
    includeFontPadding: false,
  },
  unitText: {
    color: THEME.textDim,
    fontSize: 12,
    fontWeight: 'bold',
  },
  startText: {
    color: THEME.primary,
    fontSize: 10,
    marginTop: 5,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    top: 0, left: 0,
    height: 3,
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gridLabel: {
    color: THEME.textDim,
    fontSize: 10,
    fontWeight: 'bold',
  },
  gridValue: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  gridUnit: {
    fontSize: 12,
    color: THEME.textDim,
  },
  gridSubText: {
    color: THEME.textDim,
    fontSize: 11,
    marginTop: 4,
  },
  tempBarBg: {
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    marginTop: 8,
    width: '100%',
  },
  tempBarFill: {
    height: '100%',
    backgroundColor: THEME.warning,
    borderRadius: 2,
  },
});
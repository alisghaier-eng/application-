import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Animated,
  Platform,
  Easing
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons, Ionicons, FontAwesome5, Feather } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

// --- THÈME COULEURS ---
const THEME = {
  bg: '#050B14',
  primary: '#00F0FF',   // Cyan Cyberpunk
  secondary: '#00FF9D', // Vert Énergie
  accent: '#FF0055',    // Rouge
  cardBg: 'rgba(20, 30, 50, 0.6)',
  text: '#FFFFFF',
  dim: 'rgba(255,255,255,0.5)',
  glassBorder: 'rgba(0, 240, 255, 0.3)', // Bordure brillante
};

// --- COMPOSANT 1 : JAUGE CIRCULAIRE ---
const CircularProgress = ({ size, strokeWidth, progress }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const alpha = progress / 100;
  const strokeDashoffset = circumference - alpha * circumference;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center', position: 'absolute' }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="grad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={THEME.primary} stopOpacity="1" />
            <Stop offset="0.5" stopColor={THEME.secondary} stopOpacity="1" />
            <Stop offset="1" stopColor={THEME.primary} stopOpacity="1" />
          </SvgGradient>
        </Defs>
        <Circle stroke="rgba(255,255,255,0.05)" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
        <Circle stroke="url(#grad)" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={strokeDashoffset} strokeLinecap="round" transform={`rotate(-90, ${size / 2}, ${size / 2})`} />
      </Svg>
    </View>
  );
};

// --- COMPOSANT 2 : ÉCLAIR PULSANT ---
const PulsingBolt = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }), Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })])).start();
  }, []);
  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }], marginBottom: 5 }}>
      <MaterialCommunityIcons name="lightning-bolt" size={42} color={THEME.secondary} style={{ textShadowColor: THEME.secondary, textShadowRadius: 15, opacity: 1 }} />
    </Animated.View>
  );
};

// --- COMPOSANT 3 : PARTICULES ---
const EnergyParticle = ({ delay, xPos }) => (
  <Animatable.View animation={{ 0: { translateY: 0, opacity: 0 }, 0.5: { opacity: 0.6 }, 1: { translateY: -350, opacity: 0 } }} iterationCount="infinite" duration={5000} delay={delay} style={{ position: 'absolute', bottom: 50, left: xPos, width: 3, height: 3, borderRadius: 1.5, backgroundColor: THEME.primary }} />
);

export default function UltimateDashboard({ navigation }) {
  const [soc, setSoc] = useState(0);

  useEffect(() => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 1;
      if (progress >= 62) { clearInterval(interval); setSoc(62); } else { setSoc(progress); }
    }, 15);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* FOND */}
      <LinearGradient colors={['#02050a', '#0a1525', '#0f2030']} style={styles.background} />
      
      {/* PARTICULES */}
      <View style={styles.particlesContainer}>
        <EnergyParticle delay={0} xPos={width * 0.2} />
        <EnergyParticle delay={2000} xPos={width * 0.5} />
        <EnergyParticle delay={1000} xPos={width * 0.8} />
      </View>

      {/* --- NOUVEAU NAVBAR (CYBER HUD) --- */}
      <View style={styles.cyberHeader}>
         <LinearGradient 
            colors={['rgba(0, 240, 255, 0.1)', 'rgba(0,0,0,0)']} 
            style={StyleSheet.absoluteFillObject} 
         />
         
         <TouchableOpacity 
            style={styles.glassBtn} 
            onPress={() => navigation.toggleDrawer()}
         >
            <Feather name="menu" size={24} color={THEME.primary} />
         </TouchableOpacity>

         <View style={styles.headerCenter}>
            <Text style={styles.cyberTitle}>Revo <Text style={{fontWeight: '300', color: THEME.text}}>Grid</Text></Text>
            <View style={styles.statusRow}>
               <View style={styles.greenDot} />
               <Text style={styles.statusTextHeader}>SYSTEM READY</Text>
            </View>
         </View>

         <TouchableOpacity style={styles.glassBtn}>
            <MaterialCommunityIcons name="bell-badge-outline" size={24} color={THEME.text} />
         </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* === SECTION COCKPIT === */}
        <View style={styles.cockpitSection}>
          
          <Animatable.View animation="fadeInDown" delay={500} style={styles.digitalTwinBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>DIGITAL TWIN : ONLINE</Text>
          </Animatable.View>

          <View style={styles.gaugeWrapper}>
             <CircularProgress size={280} strokeWidth={10} progress={soc} />
             <View style={styles.centerInfo}>
                <PulsingBolt />
                <Text style={styles.socNumber}>{soc}%</Text>
                <Text style={styles.rangeText}>217 km restants</Text>
             </View>
          </View>

        </View>

        {/* === BARRE DE STATS === */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
             <MaterialCommunityIcons name="speedometer" size={20} color={THEME.primary} />
             <Text style={styles.statVal}>0 <Text style={styles.statUnit}>km/h</Text></Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
             <FontAwesome5 name="thermometer-half" size={18} color={THEME.accent} />
             <Text style={styles.statVal}>32 <Text style={styles.statUnit}>°C</Text></Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
             <Ionicons name="leaf" size={20} color={THEME.secondary} />
             <Text style={styles.statVal}>Eco <Text style={styles.statUnit}>Mode</Text></Text>
          </View>
        </View>

        {/* === SECTION IA === */}
        <Text style={styles.sectionTitle}>// ANALYSES IA</Text>
        
        {/* Carte Alerte */}
        <Animatable.View animation="fadeInLeft" delay={300} style={styles.cardWrapper}>
          <LinearGradient colors={['rgba(255, 0, 85, 0.15)', 'rgba(255, 0, 85, 0.02)']} style={styles.cardGradient} start={{x:0, y:0}} end={{x:1, y:0}}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 0, 85, 0.2)' }]}>
              <MaterialCommunityIcons name="alert-decagram-outline" size={24} color={THEME.accent} />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: THEME.accent }]}>PLANIFICATION REQUISE</Text>
              <Text style={styles.cardDesc}>Trajet weekend (130km) {'>'} Autonomie. Rechargez avant 18h00.</Text>
            </View>
            
            {/* BOUTON PLANIFIER AJOUTÉ */}
            <TouchableOpacity 
                style={styles.actionSmallBtn}
                onPress={() => navigation.navigate('TripPlannerScreen')}
            >
              <Text style={styles.actionSmallText}>PLANIFIER</Text>
            </TouchableOpacity>

          </LinearGradient>
        </Animatable.View>

        {/* Carte V2G */}
        <Animatable.View animation="fadeInLeft" delay={500} style={styles.cardWrapper}>
          <LinearGradient colors={['rgba(0, 255, 157, 0.15)', 'rgba(0, 255, 157, 0.02)']} style={styles.cardGradient} start={{x:0, y:0}} end={{x:1, y:0}}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 255, 157, 0.2)' }]}>
              <Ionicons name="cash-outline" size={24} color={THEME.secondary} />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: THEME.secondary }]}>GAIN V2G DÉTECTÉ</Text>
              <Text style={styles.cardDesc}>Vendez 3 kWh maintenant pour gagner <Text style={{fontWeight:'bold', color: '#FFF'}}>1.35 €</Text>.</Text>
            </View>
            <TouchableOpacity 
                style={styles.actionSmallBtn}
                onPress={() => navigation.navigate('V2GScreen')}
            >
              <Text style={styles.actionSmallText}>VENDRE</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animatable.View>

        {/* === BOUTONS D'ACTION === */}
        <View style={styles.gridContainer}>
          
          <TouchableOpacity 
            style={styles.gridButton}
            onPress={() => navigation.navigate('SmartMapScreen')}
          >
            <LinearGradient colors={['#1F2937', '#111827']} style={styles.gridGradient}>
              <Ionicons name="location" size={26} color={THEME.primary} />
              <Text style={styles.gridLabel}>BORNES</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridButton}
            onPress={() => navigation.navigate('Historic')}
          >
            <LinearGradient colors={['#1F2937', '#111827']} style={styles.gridGradient}>
              <Ionicons name="stats-chart" size={26} color={THEME.text} />
              <Text style={styles.gridLabel}>HISTORIQUE</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  
  cyberHeader: {
    marginTop: Platform.OS === 'ios' ? 0 : 0,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  glassBtn: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.glassBorder,
    shadowColor: THEME.primary,
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  headerCenter: {
    alignItems: 'center',
  },
  cyberTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.primary,
    letterSpacing: 1,
    textShadowColor: THEME.primary,
    textShadowRadius: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.secondary,
    marginRight: 6,
    shadowColor: THEME.secondary,
    shadowRadius: 5,
    shadowOpacity: 1,
  },
  statusTextHeader: {
    color: THEME.dim,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  scrollContent: {
    paddingBottom: 40,
    paddingTop: 20,
  },
  cockpitSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    height: 320,
  },
  digitalTwinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.primary,
    marginBottom: 30,
    shadowColor: THEME.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  statusDot: {
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: THEME.primary,
    marginRight: 8,
  },
  statusText: {
    color: THEME.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  gaugeWrapper: {
    width: 280, height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerInfo: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socNumber: {
    fontSize: 64,
    fontWeight: '900',
    color: '#FFF',
    textShadowColor: THEME.secondary,
    textShadowRadius: 15,
    includeFontPadding: false,
    lineHeight: 70,
  },
  rangeText: {
    fontSize: 14,
    color: THEME.dim,
    marginTop: 5,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginHorizontal: 24,
    borderRadius: 16,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  divider: {
    width: 1, height: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statVal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statUnit: {
    fontSize: 11,
    color: THEME.dim,
    fontWeight: 'normal',
  },
  sectionTitle: {
    color: THEME.dim,
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 24,
    marginBottom: 15,
    letterSpacing: 1,
  },
  cardWrapper: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    backgroundColor: THEME.cardBg,
  },
  cardGradient: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  iconBox: {
    width: 44, height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  cardDesc: {
    fontSize: 12,
    color: '#B0B5C0',
    lineHeight: 18,
  },
  actionSmallBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  actionSmallText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  gridContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    marginTop: 10,
  },
  gridButton: {
    width: '48%',
    height: 70,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  gridGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  gridLabel: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1,
  },
});
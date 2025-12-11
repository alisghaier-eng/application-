import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  Switch,
  Alert,
  Platform,
  Vibration,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- CONFIGURATION API ---
const API_URL = 'http://192.168.94.57:6000'; 

// --- THÈME "CYBER TRADING" ---
const THEME = {
  bg: '#050B14',
  primary: '#00F0FF',
  profit: '#00FF9D',
  loss: '#FF0055',
  cardBg: 'rgba(20, 30, 50, 0.6)',
  glassBorder: 'rgba(0, 240, 255, 0.3)',
  text: '#FFFFFF',
  textDim: 'rgba(255, 255, 255, 0.5)',
};

// --- COMPOSANT : GRAPHIQUE ANIMÉ ---
const MarketGraph = ({ data }) => {
  return (
    <View style={styles.graphContainer}>
      <View style={styles.graphHeader}>
        <View style={{flexDirection:'row', alignItems:'center'}}>
           <MaterialCommunityIcons name="chart-bar" size={20} color={THEME.primary} style={{marginRight: 8}} />
           <Text style={styles.graphTitle}>MARCHÉ EN DIRECT (24 Périodes)</Text>
        </View>
        <View style={styles.liveBadge}>
           <Animatable.View 
             animation="flash" 
             iterationCount="infinite" 
             duration={2000} 
             style={styles.blinkingDot} 
           />
           <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>
      
      <View style={styles.barsContainer}>
        {data.map((price, index) => {
          // Sécurité ici aussi au cas où price est undefined
          const safePrice = price || 0;
          const height = Math.min((safePrice / 0.800) * 120, 140); 
          const isHighPrice = safePrice > 0.400;
          const barColor = isHighPrice ? [THEME.profit, 'rgba(0, 255, 157, 0.1)'] : ['#2A3C55', 'rgba(42, 60, 85, 0.2)'];
          
          return (
            <View key={index} style={styles.barWrapper}>
               <Animatable.View 
                 transition="height"
                 duration={500}
                 style={{ width: '100%', height: height, alignItems: 'center', justifyContent: 'flex-end' }}
               >
                 <LinearGradient
                   colors={barColor}
                   style={[styles.bar, { opacity: isHighPrice ? 1 : 0.6 }]}
                 />
               </Animatable.View>
               
               {index === data.length - 1 && (
                 <Animatable.View animation="bounceIn" style={styles.cursorWrapper}>
                    <View style={styles.cursorLine} />
                 </Animatable.View>
               )}
            </View>
          );
        })}
      </View>
      
      <View style={styles.axisX}>
        <Text style={styles.axisText}>-2h</Text>
        <Text style={styles.axisText}>-1h</Text>
        <Text style={styles.axisText}>Maintenant</Text>
      </View>
    </View>
  );
};

export default function V2GScreen({ navigation }) {
  // --- ÉTATS DU SYSTÈME ---
  const [isV2GActive, setIsV2GActive] = useState(false);
  const [energyToSell, setEnergyToSell] = useState(3);
  const [loading, setLoading] = useState(false); 
  const [walletBalance, setWalletBalance] = useState(45.500); 
  
  // État pour afficher l'ID sur la carte
  const [userIdDisplay, setUserIdDisplay] = useState('ID: CHARGEMENT...');

  // États pour le Live
  const [currentPrice, setCurrentPrice] = useState(0.450);
  const [marketData, setMarketData] = useState(
    Array.from({ length: 24 }, () => 0.300 + Math.random() * 0.200)
  );
  const [trend, setTrend] = useState('stable');

  // --- 1. RECUPERATION DE L'ID AU CHARGEMENT ---
  useEffect(() => {
    const fetchUserInfo = async () => {
        try {
            const storedId = await AsyncStorage.getItem('userId');
            if (storedId) {
                const shortId = storedId.slice(-6).toUpperCase();
                setUserIdDisplay(`ID: ...${shortId}`);
            } else {
                setUserIdDisplay('ID: NON-CONNECTÉ');
            }
        } catch (e) {
            console.error("Erreur récup ID", e);
        }
    };
    fetchUserInfo();
  }, []);

  // --- MOTEUR DE SIMULATION ---
  useEffect(() => {
    const interval = setInterval(() => {
      updateMarket();
    }, 3000); 

    return () => clearInterval(interval);
  }, [currentPrice]);

  const updateMarket = () => {
    const volatility = 0.015;
    const change = (Math.random() - 0.5) * volatility;
    // Sécurité sur currentPrice
    const safePrice = currentPrice || 0.450;
    let newPrice = safePrice + change;

    if (newPrice < 0.100) newPrice = 0.120;
    if (newPrice > 0.900) newPrice = 0.880;

    setTrend(newPrice >= safePrice ? 'up' : 'down');
    setCurrentPrice(newPrice);

    setMarketData(prevData => {
      const newData = [...prevData.slice(1), newPrice];
      return newData;
    });
  };

  const toggleV2G = () => {
    if (Platform.OS !== 'web') Vibration.vibrate(50);
    setIsV2GActive(!isV2GActive);
  };

  const handleSell = async () => {
    if (!isV2GActive) {
      Alert.alert("Sécurité", "Veuillez activer le switch V2G pour autoriser l'injection.");
      return;
    }

    setLoading(true);

    try {
      const userId = await AsyncStorage.getItem('userId');
      
      if (!userId) {
          Alert.alert("Erreur", "Session utilisateur introuvable. Veuillez vous reconnecter.");
          setLoading(false);
          return;
      }

      const payload = {
          userId: userId,
          quantity: energyToSell,
          currentPrice: currentPrice || 0.450
      };

      const response = await axios.post(`${API_URL}/sell`, payload);

      if (response.data.success) {
          const gain = response.data.gain;
          // IMPORTANT: Sécurisation si newBalance est renvoyé vide ou nul par le backend
          const newBalance = response.data.newBalance !== undefined ? response.data.newBalance : walletBalance;
          
          setWalletBalance(newBalance); 
          if (Platform.OS !== 'web') Vibration.vibrate([0, 100, 50, 100]); 

          Alert.alert(
            "Injection Réussie !",
            `Gain validé : +${(gain || 0).toFixed(3)} DT\nNouveau solde : ${(newBalance || 0).toFixed(3)} DT`,
            [{ text: "Super", onPress: () => {} }]
          );
      }

    } catch (error) {
      console.error("Erreur V2G", error);
      Alert.alert(
          "Échec de la transaction",
          "Impossible de contacter le réseau Smart Grid. Vérifiez votre connexion."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#02050a', '#0a1525', '#000000']} style={StyleSheet.absoluteFillObject} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.glassBtn}>
            <Ionicons name="arrow-back" size={24} color={THEME.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>TRADING <Text style={{fontWeight:'300'}}>ÉNERGIE</Text></Text>
          <TouchableOpacity style={styles.glassBtn}>
             <Ionicons name="settings-outline" size={22} color={THEME.text} />
          </TouchableOpacity>
        </View>

        {/* 1. CARTE PORTEFEUILLE (WALLET) */}
        <Animatable.View animation="fadeInDown" duration={1000} style={styles.walletContainer}>
           <LinearGradient
             colors={['rgba(0, 255, 157, 0.15)', 'rgba(0, 20, 40, 0.6)']}
             start={{x:0, y:0}} end={{x:1, y:1}}
             style={styles.walletCard}
           >
             <View style={styles.circuitLine} />
             <View style={styles.walletHeader}>
                <View style={styles.chipIcon}>
                   <MaterialCommunityIcons name="integrated-circuit-chip" size={30} color={THEME.profit} />
                </View>
                <Text style={styles.walletLabel}>SMART WALLET</Text>
             </View>

             <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>GAINS CUMULÉS</Text>
                <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                   {/* CORRECTION CRITIQUE : Fallback || 0 avant toFixed */}
                   <Text style={styles.balanceAmount}>{(walletBalance || 0).toFixed(3)}</Text>
                   <Text style={styles.currency}>DT</Text>
                </View>
             </View>

             <View style={styles.walletFooter}>
                <View style={styles.trendBox}>
                   <Feather name="trending-up" size={16} color="#000" />
                   <Text style={styles.trendText}>Transaction instantanée</Text>
                </View>
                <Text style={styles.idText}>{userIdDisplay}</Text>
             </View>
           </LinearGradient>
        </Animatable.View>

        {/* 2. GRAPHIQUE LIVE */}
        <Animatable.View animation="fadeInUp" delay={200}>
           <MarketGraph data={marketData} />
        </Animatable.View>

        {/* 3. PANNEAU DE CONTRÔLE */}
        <Animatable.View animation="fadeInUp" delay={400} style={styles.controlPanel}>
           
           <View style={styles.topControlRow}>
              <View>
                 <Text style={styles.panelLabel}>TARIF RÉSEAU ACTUEL</Text>
                 <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                    {/* CORRECTION CRITIQUE : Fallback || 0 avant toFixed */}
                    <Text style={[styles.priceBig, { color: trend === 'up' ? THEME.profit : THEME.loss }]}>
                        {(currentPrice || 0).toFixed(3)}
                    </Text>
                    <Text style={styles.unit}> DT/kWh</Text>
                 </View>
                 <View style={[styles.priceTag, { borderColor: trend === 'up' ? THEME.profit : THEME.loss }]}>
                    <Text style={[styles.priceTagText, { color: trend === 'up' ? THEME.profit : THEME.loss }]}>
                        {trend === 'up' ? '▲ HAUSSE' : '▼ BAISSE'}
                    </Text>
                 </View>
              </View>

              <View style={styles.switchWrapper}>
                 <Text style={[styles.switchLabel, {color: isV2GActive ? THEME.profit : THEME.textDim}]}>
                    {isV2GActive ? "V2G ACTIF" : "V2G OFF"}
                 </Text>
                 <Switch
                   trackColor={{ false: "#333", true: "rgba(0, 255, 157, 0.3)" }}
                   thumbColor={isV2GActive ? THEME.profit : "#f4f3f4"}
                   onValueChange={toggleV2G}
                   value={isV2GActive}
                   style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
                 />
              </View>
           </View>

           <View style={styles.divider} />

           <Text style={styles.panelLabel}>QUANTITÉ À VENDRE</Text>
           <View style={styles.qtyContainer}>
              <TouchableOpacity 
                onPress={() => setEnergyToSell(Math.max(1, energyToSell - 1))} 
                style={styles.qtyBtn}
              >
                 <Feather name="minus" size={24} color="#FFF" />
              </TouchableOpacity>
              
              <View style={styles.qtyDisplay}>
                 <Text style={styles.qtyText}>{energyToSell}</Text>
                 <Text style={styles.qtyUnit}>kWh</Text>
              </View>

              <TouchableOpacity 
                onPress={() => setEnergyToSell(energyToSell + 1)} 
                style={styles.qtyBtn}
              >
                 <Feather name="plus" size={24} color="#FFF" />
              </TouchableOpacity>
           </View>

           <View style={styles.gainSummary}>
              <Text style={styles.gainLabel}>GAIN ESTIMÉ :</Text>
              {/* CORRECTION CRITIQUE : Fallback avant le calcul */}
              <Text style={styles.gainValue}>+ {(energyToSell * (currentPrice || 0)).toFixed(3)} DT</Text>
           </View>

           <TouchableOpacity 
             activeOpacity={0.8}
             onPress={handleSell}
             disabled={loading} 
             style={[styles.sellButtonContainer, { opacity: (isV2GActive && !loading) ? 1 : 0.5 }]}
           >
             <LinearGradient
               colors={isV2GActive ? [THEME.profit, '#00C853'] : ['#333', '#444']}
               start={{x: 0, y: 0}} end={{x: 1, y: 0}}
               style={styles.sellButtonGradient}
             >
                {(isV2GActive && !loading) && <Animatable.View animation="pulse" iterationCount="infinite" style={styles.pulseRing} />}
                
                {loading ? (
                    <ActivityIndicator color="#000" />
                ) : (
                    <>
                        <MaterialCommunityIcons name="flash" size={24} color={isV2GActive ? "#000" : "#888"} style={{marginRight:10}} />
                        <Text style={[styles.sellButtonText, { color: isV2GActive ? "#000" : "#888" }]}>
                        {isV2GActive ? "CONFIRMER LA VENTE" : "ACTIVER V2G CI-DESSUS"}
                        </Text>
                    </>
                )}
             </LinearGradient>
           </TouchableOpacity>

        </Animatable.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  scrollContent: { paddingBottom: 40 },
  header: { marginTop: Platform.OS === 'ios' ? 50 : 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  glassBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: THEME.glassBorder },
  headerTitle: { fontSize: 20, fontWeight: '800', color: THEME.text, letterSpacing: 1 },
  walletContainer: { marginHorizontal: 20, marginBottom: 30, shadowColor: THEME.profit, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  walletCard: { borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0, 255, 157, 0.4)', overflow: 'hidden', padding: 24, minHeight: 180, justifyContent: 'space-between' },
  circuitLine: { position: 'absolute', top: 20, right: -20, width: 100, height: 100, borderWidth: 2, borderColor: 'rgba(255,255,255,0.05)', borderRadius: 50 },
  walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chipIcon: { opacity: 0.8 },
  walletLabel: { color: THEME.textDim, fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  balanceContainer: { marginTop: 10 },
  balanceLabel: { color: THEME.textDim, fontSize: 10, marginBottom: 5 },
  balanceAmount: { color: '#FFF', fontSize: 42, fontWeight: '900', textShadowColor: 'rgba(0, 255, 157, 0.5)', textShadowRadius: 10 },
  currency: { color: THEME.profit, fontSize: 20, fontWeight: 'bold', marginLeft: 8, marginBottom: 8 },
  walletFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  trendBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.profit, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  trendText: { color: '#000', fontWeight: 'bold', fontSize: 11, marginLeft: 4 },
  idText: { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  graphContainer: { marginHorizontal: 20, marginBottom: 30 },
  graphHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  graphTitle: { color: THEME.text, fontWeight: 'bold', fontSize: 14, letterSpacing: 0.5 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,0,0,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,0,0,0.3)' },
  blinkingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF0055', marginRight: 6 },
  liveText: { color: '#FF0055', fontSize: 10, fontWeight: 'bold' },
  barsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 140, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  barWrapper: { width: '3%', height: '100%', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' },
  bar: { width: '100%', height: '100%', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  cursorWrapper: { position: 'absolute', bottom: 0, left: -20, width: 40, alignItems: 'center', zIndex: 10 },
  cursorLine: { width: 2, height: 140, backgroundColor: '#FFF', opacity: 0.5 },
  axisX: { flexDirection: 'row', justifyContent: 'space-between' },
  axisText: { color: THEME.textDim, fontSize: 10 },
  controlPanel: { marginHorizontal: 20, backgroundColor: 'rgba(20, 30, 50, 0.4)', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 40 },
  topControlRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  panelLabel: { color: THEME.textDim, fontSize: 11, fontWeight: 'bold', marginBottom: 6, letterSpacing: 1 },
  priceBig: { color: '#FFF', fontSize: 28, fontWeight: 'bold' },
  unit: { color: THEME.textDim, fontSize: 14 },
  priceTag: { marginTop: 6, backgroundColor: 'rgba(0, 255, 157, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: THEME.profit },
  priceTagText: { color: THEME.profit, fontSize: 10, fontWeight: 'bold' },
  switchWrapper: { alignItems: 'center' },
  switchLabel: { fontSize: 10, fontWeight: 'bold', marginBottom: 8 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 20 },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: 6, marginBottom: 20 },
  qtyBtn: { width: 50, height: 50, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  qtyDisplay: { alignItems: 'center' },
  qtyText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  qtyUnit: { color: THEME.textDim, fontSize: 12 },
  gainSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: 'rgba(0, 255, 157, 0.05)', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0, 255, 157, 0.1)' },
  gainLabel: { color: THEME.textDim, fontWeight: 'bold' },
  gainValue: { color: THEME.profit, fontSize: 18, fontWeight: 'bold' },
  sellButtonContainer: { borderRadius: 16, overflow: 'hidden', shadowColor: THEME.profit, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  sellButtonGradient: { paddingVertical: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  sellButtonText: { fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  pulseRing: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.2)', opacity: 0 },
});
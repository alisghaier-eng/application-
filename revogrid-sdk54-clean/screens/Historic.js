import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  TouchableOpacity
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';

// --- CONFIGURATION ---
// Remplacez par votre IP
const API_URL = 'http://192.168.94.57:6000'; 
const { width } = Dimensions.get('window');

// --- THÈME "NEO-DARK" ---
const THEME = {
  bg: '#0F172A',         // Bleu nuit très profond
  bgGradient: ['#0F172A', '#1E293B', '#020617'],
  primary: '#38BDF8',    // Cyan clair
  secondary: '#818CF8',  // Indigo doux
  profit: '#34D399',     // Vert menthe (plus moderne que le vert pur)
  profitGradient: ['#34D399', 'rgba(52, 211, 153, 0.2)'],
  cardBg: 'rgba(30, 41, 59, 0.7)', // Semi-transparent
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  text: '#F8FAFC',
  textDim: '#94A3B8',
  white: '#FFFFFF',
};

// --- COMPOSANT : HEADER / BALANCE CARD ---
const BalanceCard = ({ totalGain, totalEnergy }) => (
  <Animatable.View animation="fadeInDown" duration={800} style={styles.heroContainer}>
    <LinearGradient
      colors={['rgba(56, 189, 248, 0.15)', 'rgba(129, 140, 248, 0.05)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.heroCard}
    >
      <View style={styles.heroTopRow}>
        <View>
          <Text style={styles.heroLabel}>Solde total généré</Text>
          <View style={styles.heroAmountRow}>
            <Text style={styles.heroCurrency}>DT</Text>
            <Text style={styles.heroAmount}>{totalGain.toFixed(3)}</Text>
          </View>
        </View>
        <View style={styles.heroIconContainer}>
          <MaterialCommunityIcons name="lightning-bolt-circle" size={42} color={THEME.primary} />
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.heroStatsRow}>
        <View style={styles.heroStatItem}>
            <Feather name="zap" size={16} color={THEME.textDim} />
            <Text style={styles.heroStatValue}> {totalEnergy} kWh</Text>
            <Text style={styles.heroStatLabel}>Vendus</Text>
        </View>
        <View style={styles.heroStatItem}>
            <Feather name="trending-up" size={16} color={THEME.profit} />
            <Text style={[styles.heroStatValue, { color: THEME.profit }]}> +12%</Text>
            <Text style={styles.heroStatLabel}>vs Hier</Text>
        </View>
      </View>
    </LinearGradient>
  </Animatable.View>
);

// --- COMPOSANT : GRAPHIQUE BARRES MODERNISÉ ---
const ModernChart = ({ transactions }) => {
    const data = transactions ? transactions.slice(0, 7).reverse() : [];
    if (data.length === 0) return null;

    const maxGain = Math.max(...data.map(t => t.totalGain)) || 1;

    return (
        <View style={styles.chartSection}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Performance Hebdo</Text>
                <TouchableOpacity>
                    <Feather name="more-horizontal" size={20} color={THEME.textDim} />
                </TouchableOpacity>
            </View>
            
            <View style={styles.chartContainer}>
                {/* Lignes de fond pour effet grille */}
                <View style={styles.gridLine} />
                <View style={[styles.gridLine, { top: '33%' }]} />
                <View style={[styles.gridLine, { top: '66%' }]} />

                <View style={styles.chartRow}>
                    {data.map((item, index) => {
                        const heightPercent = (item.totalGain / maxGain) * 100;
                        const isMax = item.totalGain === maxGain;
                        
                        return (
                            <View key={index} style={styles.barWrapper}>
                                {isMax && (
                                    <Animatable.View animation="bounceIn" delay={index*100 + 500} style={styles.bestBadge}>
                                        <Ionicons name="star" size={8} color="#FFF" />
                                    </Animatable.View>
                                )}
                                
                                <Animatable.View 
                                    animation="fadeInUp" 
                                    duration={1000}
                                    delay={index * 100}
                                    style={[
                                        styles.bar, 
                                        { height: `${Math.max(heightPercent, 10)}%` } // Min 10% pour visibilité
                                    ]} 
                                >
                                    <LinearGradient
                                        colors={isMax ? [THEME.primary, THEME.secondary] : THEME.profitGradient}
                                        style={StyleSheet.absoluteFill}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 0, y: 1 }}
                                    />
                                </Animatable.View>
                                
                                <Text style={[styles.barLabel, isMax && {color: THEME.white, fontWeight: 'bold'}]}>
                                    {new Date(item.timestamp).getDate()}
                                </Text>
                            </View>
                        )
                    })}
                </View>
            </View>
        </View>
    );
};

// --- COMPOSANT : LISTE DES TRANSACTIONS ---
const TransactionItem = ({ item, index }) => (
    <Animatable.View 
        animation="fadeInUp" 
        delay={400 + (index * 100)} 
        style={styles.transCard}
    >
        <LinearGradient
            colors={[THEME.cardBg, 'rgba(30, 41, 59, 0.4)']}
            style={styles.transGradient}
        >
            <View style={styles.transIconBox}>
                <MaterialCommunityIcons name="arrow-top-right-thin" size={24} color={THEME.profit} />
            </View>
            
            <View style={styles.transContent}>
                <Text style={styles.transTitle}>Injection Réseau</Text>
                <Text style={styles.transDate}>
                    {new Date(item.timestamp).toLocaleDateString()} • {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>
            </View>

            <View style={styles.transAmountBox}>
                <Text style={styles.transAmount}>+{item.totalGain.toFixed(3)}</Text>
                <Text style={styles.transUnit}>DT</Text>
                <Text style={styles.transKwh}>{item.quantityKwh} kWh</Text>
            </View>
        </LinearGradient>
    </Animatable.View>
);

// --- MAIN SCREEN ---
export default function Historic({ navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ totalGain: 0, totalEnergy: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      const response = await axios.get(`${API_URL}/v2g/history/${userId}`);
      if (response.data.success) {
          setTransactions(response.data.transactions);
          setStats(response.data.stats);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const onRefresh = () => {
      setRefreshing(true);
      fetchHistory();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <LinearGradient colors={THEME.bgGradient} style={StyleSheet.absoluteFillObject} />
        <ActivityIndicator size="large" color={THEME.primary} />
        <Text style={{color: THEME.textDim, marginTop: 15, letterSpacing: 1}}>SYNCHRONISATION...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={THEME.bgGradient} style={StyleSheet.absoluteFillObject} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.primary} />}
      >
        <View style={styles.header}>
            <View>
                <Text style={styles.greeting}>Historique</Text>
                <Text style={styles.appName}>V2G <Text style={{color: THEME.primary}}>CONNECT</Text></Text>
            </View>
            <TouchableOpacity style={styles.profileBtn}>
                 <Feather name="user" size={20} color={THEME.white} />
            </TouchableOpacity>
        </View>

        <BalanceCard totalGain={stats.totalGain} totalEnergy={stats.totalEnergy} />

        <ModernChart transactions={transactions} />

        <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Transactions Récentes</Text>
            <TouchableOpacity>
                <Text style={styles.seeAll}>Tout voir</Text>
            </TouchableOpacity>
        </View>

        {transactions.length === 0 ? (
            <View style={styles.emptyBox}>
                <Feather name="inbox" size={40} color={THEME.textDim} />
                <Text style={styles.emptyText}>Aucune activité récente</Text>
            </View>
        ) : (
            transactions.map((t, i) => <TransactionItem key={t._id} item={t} index={i} />)
        )}
        
        <View style={{height: 40}} /> 
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.bg,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
  },
  
  // HEADER SUPERIEUR
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  greeting: {
    color: THEME.textDim,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  appName: {
    color: THEME.white,
    fontSize: 24,
    fontWeight: '800',
  },
  profileBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },

  // HERO CARD (BALANCE)
  heroContainer: {
    marginBottom: 25,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  heroCard: {
    padding: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLabel: {
    color: THEME.textDim,
    fontSize: 14,
    marginBottom: 8,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  heroCurrency: {
    color: THEME.primary,
    fontSize: 20,
    fontWeight: '600',
    marginRight: 4,
  },
  heroAmount: {
    color: THEME.white,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
  },
  heroIconContainer: {
    width: 50, height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 20,
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 20,
  },
  heroStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroStatValue: {
    color: THEME.white,
    fontWeight: '600',
    fontSize: 13,
  },
  heroStatLabel: {
    color: THEME.textDim,
    fontSize: 12,
    marginLeft: 4,
  },

  // CHART SECTION
  chartSection: {
    marginBottom: 30,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    color: THEME.white,
    fontSize: 18,
    fontWeight: '700',
  },
  chartContainer: {
    height: 180,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  gridLine: {
    position: 'absolute',
    left: 0, right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    paddingHorizontal: 5,
  },
  barWrapper: {
    alignItems: 'center',
    width: (width - 100) / 7, // Dynamique
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 12,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    marginBottom: 8,
    overflow: 'hidden',
  },
  barLabel: {
    color: THEME.textDim,
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  bestBadge: {
    position: 'absolute',
    top: -20, // Au dessus de la barre
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 2,
    borderRadius: 10,
  },

  // TRANSACTIONS LIST
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAll: {
    color: THEME.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  transCard: {
    marginBottom: 12,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  transGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  transIconBox: {
    width: 48, height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.2)',
  },
  transContent: {
    flex: 1,
  },
  transTitle: {
    color: THEME.white,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  transDate: {
    color: THEME.textDim,
    fontSize: 12,
  },
  transAmountBox: {
    alignItems: 'flex-end',
  },
  transAmount: {
    color: THEME.profit,
    fontSize: 16,
    fontWeight: '700',
  },
  transUnit: {
    color: THEME.profit,
    fontSize: 10,
    opacity: 0.8,
  },
  transKwh: {
    color: THEME.textDim,
    fontSize: 11,
    marginTop: 2,
  },
  emptyBox: {
      alignItems: 'center',
      paddingVertical: 40,
      opacity: 0.5,
  },
  emptyText: {
      color: THEME.textDim,
      marginTop: 10,
  }
});
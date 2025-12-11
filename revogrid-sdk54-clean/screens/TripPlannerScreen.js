import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'; // Icônes React Native standard

// Note: Ce composant utilise des styles natifs et des composants React Native.
// Il ne nécessite PAS les bibliothèques Web (lucide-react, Tailwind CSS pour le web).

// --- THEME CYBERPUNK ---
const THEME = {
  bg: '#050B14',
  primary: '#00F0FF',
  secondary: '#7000FF',
  success: '#00FF9D',
  warning: '#FFC107',
  danger: '#FF0055',
  cardBg: 'rgba(20, 30, 50, 0.6)',
  text: '#FFFFFF',
  textDim: 'rgba(255, 255, 255, 0.5)',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  terminalBg: '#000000',
  terminalText: '#00FF00',
  terminalHeaderBg: '#181818',
  terminalDotRed: '#FF5F56',
  terminalDotYellow: '#FFBD2E',
  terminalDotGreen: '#27C93F',
};

// Dimensions pour le responsive design natif
const screenWidth = Dimensions.get('window').width;

// Composant principal de l'application
export default function TripPlannerScreen() {
  // --- ÉTATS ---
  const [destination, setDestination] = useState('Paris');
  const [distance, setDistance] = useState('250');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [aiConfidence, setAiConfidence] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  
  const terminalRef = useRef();

  // Données Digital Twin
  const vehicleState = {
    soc: 62, // State of Charge (Charge actuelle)
    range: 217, // Autonomie estimée (km)
    efficiency: 15.4 // Consommation Wh/km
  };

  // Défilement automatique du terminal
  useEffect(() => {
    if (terminalRef.current) {
      // Utilisation d'un timeout car le contenu change de manière asynchrone
      setTimeout(() => {
        terminalRef.current.scrollToEnd({ animated: true });
      }, 50);
    }
  }, [terminalLogs]);

  // --- MOTEUR DE SIMULATION "AI" ---
  const runModelInference = useCallback((inputDistance) => {
    return new Promise((resolve) => {
      setTerminalLogs([]);
      
      const techSteps = [
        "[SYSTEM] Initializing secure handshake...",
        "[DATA] Fetching telemetry: SOC=62%, SOH=98%, Temp=32°C",
        "[CLOUD] Connected to inference-server-eu-west-1",
        `[INPUT] Vectorizing destination: '${inputDistance}km'`,
        "[XGBOOST] Loading artifact: 'xgb_range_predictor_v4.2.bin'",
        "[XGBOOST] Booster loaded. Features: 14, Tree_depth: 6",
        "[MODEL] Normalizing input tensor...",
        "[INFERENCE] Processing batch #4492...",
        "[XGBOOST] Prediction score calculated.",
        "[OUTPUT] Generating risk assessment report...",
        "[SYSTEM] Process completed. Latency: 42ms."
      ];

      let stepIndex = 0;

      const interval = setInterval(() => {
        if (stepIndex < techSteps.length) {
          const log = techSteps[stepIndex];
          setTerminalLogs(prev => [...prev, `> ${log}`]);
          stepIndex++;
        } else {
          clearInterval(interval);
          finishAnalysis(inputDistance, resolve);
        }
      }, 400);
    });
  }, [vehicleState.range]);

  const finishAnalysis = (inputDistance, resolve) => {
        const range = vehicleState.range;
        const dist = parseFloat(inputDistance);
        let prediction = 'safe';
        let confidence = 0;

        if (isNaN(dist) || dist <= 0) {
            prediction = 'error';
            confidence = 0;
        } else if (dist > range) {
          prediction = 'danger';
          confidence = (96 + Math.random() * 3).toFixed(1); // 96-99%
        } else if (dist > range * 0.8) {
          prediction = 'warning';
          confidence = (82 + Math.random() * 5).toFixed(1); // 82-87%
        } else {
          prediction = 'safe';
          confidence = (94 + Math.random() * 5).toFixed(1); // 94-99%
        }

        resolve({
          prediction,
          confidence,
        });
  };

  const analyzeTrip = async () => {
    setErrorMessage(null);
    if (!destination || !distance || isNaN(parseFloat(distance)) || parseFloat(distance) <= 0) {
      setErrorMessage("Veuillez entrer une destination valide et une distance positive.");
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    const aiResult = await runModelInference(distance);

    setTimeout(() => {
      setIsAnalyzing(false);
      setResult(aiResult.prediction);
      setAiConfidence(aiResult.confidence);
      
      if (aiResult.prediction === 'error') {
          setErrorMessage("Erreur d'analyse : Distance invalide.");
          setResult(null);
      }
    }, 500);
  };

  // Indicateur de batterie simple (remplace le SVG complexe)
  const renderBatteryIndicator = () => {
    const tripDist = parseInt(distance) || 100;
    const startSoc = vehicleState.soc;
    const estimatedEndSoc = Math.max(0, startSoc - (tripDist / vehicleState.range) * startSoc);
    
    // Détermine la couleur en fonction du résultat
    const resultColor = result === 'danger' ? THEME.danger : result === 'warning' ? THEME.warning : THEME.success;
    
    return (
        <View style={styles.batteryContainer}>
            {/* Ligne de décharge */}
            <View style={styles.dischargeLine} />

            {/* Niveau de batterie restant (visuel) */}
            <View style={[styles.batteryLevel, { width: `${estimatedEndSoc}%`, backgroundColor: resultColor }]} />
            
            {/* Indicateurs de niveau */}
            <View style={styles.batteryMarkers}>
                <Text style={[styles.batteryText, { color: THEME.primary }]}>Départ ({startSoc}%)</Text>
                <Text style={[styles.batteryText, { color: resultColor, textAlign: 'right' }]}>Arrivée (Est. {estimatedEndSoc.toFixed(0)}%)</Text>
            </View>
        </View>
    );
  };

  // Obtient les styles et icônes basés sur le résultat
  const getResultStyle = () => {
    switch (result) {
      case 'danger':
        return { 
          color: THEME.danger, 
          icon: <Feather name="alert-octagon" size={30} color={THEME.danger} />,
          text: 'RISQUE ÉLEVÉ',
          description: `Analyse prédictive : La consommation estimée dépasse la capacité actuelle de la batterie (${vehicleState.range}km). Le modèle recommande une recharge immédiate.`,
          cardBorder: { borderColor: THEME.danger, shadowColor: THEME.danger, shadowOpacity: 0.5 }
        };
      case 'warning':
        return { 
          color: THEME.warning, 
          icon: <Feather name="alert-triangle" size={30} color={THEME.warning} />,
          text: 'RISQUE MODÉRÉ',
          description: "Analyse prédictive : Marge de sécurité inférieure à 15%. Le modèle suggère un mode de conduite ÉCO pour garantir l'arrivée.",
          cardBorder: { borderColor: THEME.warning, shadowColor: THEME.warning, shadowOpacity: 0.5 }
        };
      case 'safe':
      default:
        return { 
          color: THEME.success, 
          icon: <Feather name="check-circle" size={30} color={THEME.success} />,
          text: 'TRAJET OPTIMAL',
          description: "Analyse prédictive : Consommation nominale. Le véhicule atteindra la destination avec une réserve de sécurité adéquate.",
          cardBorder: { borderColor: THEME.success, shadowColor: THEME.success, shadowOpacity: 0.5 }
        };
    }
  };
  
  const resultData = getResultStyle();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setResult(null)} style={styles.headerButton}>
          <Feather name="arrow-left" size={24} color={THEME.primary} />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.mainTitle}>PLANIFICATEUR <Text style={styles.secondaryTitle}>AI</Text></Text>
          <Text style={styles.subtitle}>Modèle Prédictif XGBoost</Text>
        </View>
        <View style={styles.headerButton}>
          <Feather name="cpu" size={24} color={THEME.text} />
        </View>
      </View>

      {/* 1. ÉTAT VÉHICULE */}
      <View style={styles.vehicleStatusCard}>
         <View style={styles.statusItem}>
           <Feather name="battery-charging" size={24} color={THEME.success} style={{marginBottom: 4}} />
           <Text style={styles.statusLabel}>CHARGE ACTUELLE</Text>
           <Text style={styles.statusValue}>{vehicleState.soc}%</Text>
         </View>
         
         <View style={styles.separator} />
         
         <View style={styles.statusItem}>
           <Feather name="map" size={24} color={THEME.primary} style={{marginBottom: 4}} />
           <Text style={styles.statusLabel}>AUTONOMIE</Text>
           <Text style={styles.statusValue}>{vehicleState.range} km</Text>
         </View>
      </View>

      {/* Message d'Erreur */}
      {errorMessage && (
          <View style={styles.errorBox}>
              <Feather name="alert-circle" size={20} color={THEME.danger} style={{marginRight: 10}} />
              <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
      )}

      {/* 2. FORMULAIRE DE TRAJET */}
      {!isAnalyzing && !result && (
        <View style={styles.inputSection}>
           <Text style={styles.inputLabel}>PARAMÈTRES D'ENTRÉE DU MODÈLE</Text>
           
           <View style={{ marginBottom: 15 }}>
               {/* Destination */}
               <View style={styles.inputField}>
                 <Feather name="map-pin" size={20} color={THEME.primary} style={{marginLeft: 5, marginRight: 15}} />
                 <TextInput
                   placeholder="Destination Cible"
                   placeholderTextColor={THEME.textDim}
                   style={styles.textInput}
                   value={destination}
                   onChangeText={setDestination}
                 />
               </View>

               {/* Distance */}
               <View style={styles.inputField}>
                 <Feather name="compass" size={20} color={THEME.primary} style={{marginLeft: 5, marginRight: 15}} />
                 <TextInput
                   placeholder="Distance Estimée (km)"
                   placeholderTextColor={THEME.textDim}
                   style={styles.textInput}
                   value={distance}
                   onChangeText={setDistance}
                   keyboardType="numeric"
                 />
               </View>
           </View>

           <TouchableOpacity 
             onPress={analyzeTrip} 
             style={[styles.analyzeButton, { backgroundColor: THEME.secondary, shadowColor: THEME.secondary }]}
             disabled={isAnalyzing}
           >
             <View style={styles.analyzeButtonContent}>
               <Feather name="cpu" size={24} color={THEME.text} style={{marginRight: 10}} />
               <Text style={styles.analyzeButtonText}>LANCER L'INFÉRENCE IA</Text>
             </View>
           </TouchableOpacity>
        </View>
      )}

      {/* 3. TERMINAL DE LOGS (PENDANT L'ANALYSE) */}
      {isAnalyzing && (
        <View style={styles.terminalContainer}>
           <View style={styles.terminalHeader}>
             <View style={styles.dotContainer}>
                <View style={[styles.terminalDot, { backgroundColor: THEME.terminalDotRed }]} />
                <View style={[styles.terminalDot, { backgroundColor: THEME.terminalDotYellow }]} />
                <View style={[styles.terminalDot, { backgroundColor: THEME.terminalDotGreen }]} />
             </View>
             <Text style={styles.terminalTitle}>PYTHON KERNEL - XGBOOST</Text>
           </View>
           
           <ScrollView 
             ref={terminalRef}
             style={styles.terminalLogs}
           >
             {terminalLogs.map((log, index) => (
                <Text 
                  key={index} 
                  style={styles.terminalLogText}
                >
                  {log}
                </Text>
             ))}
             {/* Simulateur d'activité */}
             <View style={styles.activityIndicatorRow}>
                <ActivityIndicator size="small" color={THEME.primary} />
             </View>
           </ScrollView>
        </View>
      )}

      {/* 4. RÉSULTAT DE L'IA */}
      {result && (
        <View style={styles.resultSection}>
           
           <View style={styles.simulationHeader}>
             <Text style={styles.simulationTitle}>SIMULATION ÉNERGÉTIQUE</Text>
             <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>Confiance IA: {aiConfidence}%</Text>
             </View>
           </View>

           {/* Indicateur de batterie (remplace le Chart Container) */}
           <View style={styles.chartContainer}>
             {renderBatteryIndicator()}
           </View>

           {/* Report Card */}
           <View style={[styles.reportCard, resultData.cardBorder]}>
             
             <View style={styles.reportHeader}>
                {resultData.icon}
                <View style={{ marginLeft: 10 }}>
                    <Text style={[styles.reportStatus, { color: resultData.color }]}>
                        {resultData.text}
                    </Text>
                    <Text style={styles.reportSubtitle}>Output from XGBoost_v4.2</Text>
                </View>
             </View>
              
             <Text style={styles.reportDescription}>
                 {resultData.description}
             </Text>

             {result !== 'safe' && (
                <TouchableOpacity style={styles.findChargerButton}>
                   <View style={styles.findChargerContent}>
                      <Text style={styles.findChargerText}>
                         TROUVER UNE BORNE RAPIDE
                      </Text>
                      <Feather name="target" size={18} color={THEME.text} style={{marginLeft: 5}} />
                   </View>
                </TouchableOpacity>
             )}
              
             {/* Bouton pour recommencer */}
             <TouchableOpacity onPress={() => setResult(null)} style={styles.newAnalysisButton}>
                <Text style={styles.newAnalysisText}>Nouvelle analyse</Text>
             </TouchableOpacity>
           </View>

        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  contentContainer: {
    padding: 25,
    paddingTop: 50,
    minHeight: '100%',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: screenWidth * 0.9,
    maxWidth: 500,
    marginBottom: 20,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.borderColor,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  titleBlock: {
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 3,
    color: THEME.text,
  },
  secondaryTitle: {
    fontWeight: '300',
    color: THEME.secondary,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: THEME.textDim,
  },
  vehicleStatusCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderRadius: 15,
    marginBottom: 25,
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    width: screenWidth * 0.9,
    maxWidth: 500,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: THEME.textDim,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.text,
  },
  separator: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  errorBox: {
      backgroundColor: 'rgba(255, 0, 85, 0.1)',
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: THEME.danger,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      width: screenWidth * 0.9,
      maxWidth: 500,
  },
  errorText: {
      color: THEME.danger,
      fontSize: 13,
      flex: 1,
  },
  inputSection: {
    width: screenWidth * 0.9,
    maxWidth: 500,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 15,
    letterSpacing: 1.5,
    color: THEME.textDim,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    height: 55,
    marginBottom: 15,
    backgroundColor: 'rgba(20, 30, 50, 0.4)',
    borderColor: THEME.borderColor,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: THEME.text,
    paddingHorizontal: 5,
  },
  analyzeButton: {
    borderRadius: 12,
    marginTop: 15,
    elevation: 10,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
  },
  analyzeButtonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: THEME.secondary,
    borderRadius: 12, // Ensure inner view also has radius
  },
  analyzeButtonText: {
    color: THEME.text,
    fontWeight: '700',
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  
  // Terminal Styles
  terminalContainer: {
    width: screenWidth * 0.9,
    maxWidth: 500,
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: THEME.terminalBg,
  },
  terminalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#333',
    backgroundColor: THEME.terminalHeaderBg,
  },
  dotContainer: {
    flexDirection: 'row',
  },
  terminalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  terminalTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: THEME.textDim,
  },
  terminalLogs: {
    height: 250,
    padding: 15,
  },
  terminalLogText: {
    fontSize: 11,
    color: THEME.terminalText,
    fontFamily: 'monospace',
    marginBottom: 3,
  },
  activityIndicatorRow: {
    marginTop: 10,
    marginBottom: 10,
  },
  
  // Result Styles
  resultSection: {
    width: screenWidth * 0.9,
    maxWidth: 500,
    marginTop: 30,
  },
  simulationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  simulationTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: THEME.textDim,
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.primary,
  },
  chartContainer: {
    marginBottom: 25,
    padding: 15,
    borderRadius: 12,
    backgroundColor: THEME.cardBg,
  },
  reportCard: {
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    backgroundColor: 'rgba(20, 30, 50, 0.8)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 15,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reportStatus: {
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  reportSubtitle: {
    fontSize: 10,
    fontStyle: 'italic',
    color: THEME.textDim,
  },
  reportDescription: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
    color: THEME.textDim,
  },
  findChargerButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: THEME.danger,
    // Note: Le gradient est simulé avec une couleur unie dans RN
  },
  findChargerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  findChargerText: {
    color: THEME.text,
    fontWeight: '700',
    fontSize: 14,
  },
  newAnalysisButton: {
    marginTop: 15,
    alignSelf: 'center',
  },
  newAnalysisText: {
    fontSize: 13,
    textDecorationLine: 'underline',
    color: THEME.textDim,
  },

  // Battery Indicator Styles (New)
  batteryContainer: {
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  dischargeLine: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    position: 'absolute',
    width: '98%',
    alignSelf: 'center',
  },
  batteryLevel: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    left: '1%',
  },
  batteryMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 10,
    left: 5,
    right: 5,
    width: '98%',
  },
  batteryText: {
    fontSize: 11,
    fontWeight: '700',
  }
});
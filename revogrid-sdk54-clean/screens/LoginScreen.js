import React, { useState, useContext } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    Alert, 
    BackHandler, 
    StatusBar,
    Dimensions,
    TextInput as NativeInput 
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { jwtDecode } from "jwt-decode"; // <--- 1. IMPORT DU DECODEUR

// --- IMPORT DU CONTEXTE ---
import { AuthContext } from '../App'; 

const { width } = Dimensions.get('window');

// --- THEME CYBERPUNK ---
const THEME = {
    primary: '#00F0FF', 
    secondary: '#00FF9D', 
    error: '#FF0055', 
    bgGradient: ['#02050a', '#0a1525', '#0f2030'],
    inputBg: 'rgba(255, 255, 255, 0.05)',
    text: '#FFFFFF',
    textDim: 'rgba(255, 255, 255, 0.4)',
};

export default function LoginScreen({ navigation }) {
    const { signIn } = useContext(AuthContext);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailError, setEmailError] = useState(false);
    const [passwordError, setPasswordError] = useState(false);

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleLogin = async () => {
        setEmailError(false);
        setPasswordError(false);

        if (!email || !validateEmail(email)) {
            setEmailError(true);
            Alert.alert('Erreur', "L'adresse email est invalide.");
            return;
        }

        if (!password) {
            setPasswordError(true);
            Alert.alert('Erreur', 'Le mot de passe est requis.');
            return;
        }

        try {
            setLoading(true);

            // Nettoyage préventif
            await AsyncStorage.clear();

            // Appel API
            const response = await axios.post('http://192.168.94.57:6000/login', {
                email: email.trim(),
                password: password.trim(),
            });

            // Extraction des données de base
            const { token, role, agencyId } = response.data;

            if (!role || !token) {
                throw new Error('Données de connexion incomplètes (Token ou Rôle manquant).');
            }

            // Gestion spécifique Agence
            if (role === 'agence' && agencyId) {
                await AsyncStorage.setItem('agencyId', agencyId);
            }

            // --- 2. EXTRACTION DE L'ID VIA LE TOKEN ---
            let userId = null;
            try {
                const decoded = jwtDecode(token);
                // On cherche userId, id, ou _id selon comment le backend a signé le token
                userId = decoded.userId || decoded.id || decoded._id;
                
                console.log("Token décodé - UserID trouvé :", userId);
            } catch (decodeError) {
                console.warn("Erreur décodage JWT:", decodeError);
                // Fallback : si le backend renvoie aussi l'user dans le body, on peut essayer de le prendre là
                if (response.data.user && response.data.user._id) {
                    userId = response.data.user._id;
                }
            }

            if (!userId) {
                console.warn("Attention : Aucun UserID n'a pu être extrait.");
            }

            // --- 3. PASSAGE DE L'ID A APP.JS ---
            signIn(token, role, userId);

        } catch (err) {
            console.error("Erreur lors de la connexion :", err);
            const errorMessage =
                err.response?.data?.message || err.message || 'Une erreur est survenue.';
            Alert.alert('Erreur', errorMessage);
            setLoading(false);
        }
    };
    
    // Bloquer le bouton retour physique
    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => true; 
            const subscription = BackHandler.addEventListener(
                'hardwareBackPress', 
                onBackPress
            );
            return () => subscription.remove();
        }, [])
    );

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" />
            
            <LinearGradient
                colors={THEME.bgGradient}
                style={StyleSheet.absoluteFillObject}
            />

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                
                <Animatable.View animation="fadeInDown" duration={1000} style={styles.headerContainer}>
                   <View style={styles.iconCircle}>
                      <MaterialCommunityIcons name="car-electric" size={40} color={THEME.primary} />
                   </View>
                   <Text style={styles.welcomeText}>SYSTEME <Text style={{color: THEME.primary}}>V.E.</Text></Text>
                   <Text style={styles.subText}>Authentification Requise</Text>
                </Animatable.View>

                <Animatable.View animation="fadeInUp" duration={1000} delay={300} style={styles.formContainer}>
                    
                    <View style={styles.inputWrapper}>
                        <Feather name="mail" size={20} color={emailError ? THEME.error : THEME.primary} style={styles.inputIcon} />
                        <NativeInput
                            placeholder="Email"
                            placeholderTextColor={THEME.textDim}
                            value={email}
                            onChangeText={setEmail}
                            style={[
                                styles.input, 
                                emailError && { borderColor: THEME.error, borderWidth: 1 }
                            ]}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Feather name="lock" size={20} color={passwordError ? THEME.error : THEME.primary} style={styles.inputIcon} />
                        <NativeInput
                            placeholder="Mot de passe"
                            placeholderTextColor={THEME.textDim}
                            value={password}
                            onChangeText={setPassword}
                            style={[
                                styles.input, 
                                passwordError && { borderColor: THEME.error, borderWidth: 1 }
                            ]}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity 
                        onPress={handleLogin} 
                        disabled={loading}
                        activeOpacity={0.8}
                        style={styles.loginButton}
                    >
                        <LinearGradient
                            colors={[THEME.primary, '#0085FF']}
                            start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                            style={styles.gradientButton}
                        >
                            {loading ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <Text style={styles.loginButtonText}>ACCÉDER AU TERMINAL</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('SignUpScreen')} style={styles.linkContainer}>
                        <Text style={styles.linkText}>
                            Nouveau conducteur ? <Text style={{color: THEME.primary, fontWeight: 'bold'}}>Initialiser un compte</Text>
                        </Text>
                    </TouchableOpacity>

                </Animatable.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#02050a',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 50,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0, 240, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: THEME.primary,
        marginBottom: 20,
        shadowColor: THEME.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 5,
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: THEME.text,
        letterSpacing: 2,
    },
    subText: {
        fontSize: 14,
        color: THEME.textDim,
        marginTop: 5,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    formContainer: {
        width: '100%',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.inputBg,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        height: 55,
    },
    inputIcon: {
        marginLeft: 15,
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: THEME.text,
        fontSize: 16,
        height: '100%',
        paddingRight: 15,
    },
    loginButton: {
        marginTop: 10,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: THEME.primary,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    gradientButton: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginButtonText: {
        color: '#000', 
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
    },
    linkContainer: {
        marginTop: 25,
        alignItems: 'center',
    },
    linkText: {
        color: THEME.textDim,
        fontSize: 14,
    },
});
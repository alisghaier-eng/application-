import React, { useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    StatusBar,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { height } = Dimensions.get('window');

// --- THEME CYBERPUNK ---
const THEME = {
    primary: '#00F0FF', 
    secondary: '#00FF9D', 
    error: '#FF0055', 
    bgGradient: ['#02050a', '#0a1525', '#0f2030'],
    text: '#FFFFFF',
    textDim: 'rgba(255, 255, 255, 0.6)',
};

export default function WelcomeScreen() {
    const navigation = useNavigation();

    // S'assurer que la barre de statut est adaptée au thème sombre
    useEffect(() => {
        StatusBar.setBarStyle('light-content');
    }, []);

    return (
        <View style={styles.mainContainer}>
            {/* Fond Dégradé */}
            <LinearGradient
                colors={THEME.bgGradient}
                style={StyleSheet.absoluteFillObject}
            />

            <Animatable.View animation="fadeIn" duration={1500} style={styles.contentArea}>
                
                <Animatable.View 
                    animation="tada" 
                    iterationCount="infinite" 
                    direction="alternate" 
                    style={styles.logoContainer}
                >
                    <MaterialCommunityIcons name="car-electric" size={80} color={THEME.primary} />
                </Animatable.View>

                <Animatable.Text 
                    animation="fadeInDown" 
                    delay={500} 
                    style={styles.title}
                >
                    Bienvenue dans le Système V.E.
                </Animatable.Text>

                <Animatable.Text 
                    animation="fadeInUp" 
                    delay={700} 
                    style={styles.subtitle}
                >
                    Optimisez votre voyage électrique et gérez votre flotte.
                </Animatable.Text>

                {/* Bouton de Connexion */}
                <Animatable.View animation="bounceIn" delay={1000} style={styles.buttonWrapper}>
                    <TouchableOpacity 
                        // ATTENTION : Utilisez le nom exact de la route définie dans AuthStack (LoginScreen)
                        onPress={() => navigation.navigate('LoginScreen')} 
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[THEME.primary, '#0085FF']}
                            start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                            style={styles.gradientButton}
                        >
                            <Text style={styles.buttonText}>CONNEXION</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animatable.View>

                {/* Bouton d'Inscription */}
                <Animatable.View animation="bounceIn" delay={1200} style={styles.buttonWrapper}>
                    <TouchableOpacity 
                        // ATTENTION : Utilisez le nom exact de la route définie dans AuthStack (SignUpScreen)
                        onPress={() => navigation.navigate('SignUpScreen')} 
                        activeOpacity={0.8}
                        style={styles.signUpButton}
                    >
                        <Text style={styles.signUpText}>Créer un nouveau compte</Text>
                    </TouchableOpacity>
                </Animatable.View>
            </Animatable.View>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    contentArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    logoContainer: {
        marginBottom: 30,
        padding: 15,
        borderRadius: 50,
        backgroundColor: 'rgba(0, 240, 255, 0.1)',
        borderWidth: 2,
        borderColor: THEME.primary,
        shadowColor: THEME.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 5,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: THEME.text,
        textAlign: 'center',
        marginBottom: 10,
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 16,
        color: THEME.textDim,
        textAlign: 'center',
        marginBottom: 50,
        paddingHorizontal: 20,
    },
    buttonWrapper: {
        width: '80%',
        marginBottom: 15,
    },
    gradientButton: {
        paddingVertical: 18,
        alignItems: 'center',
        borderRadius: 12,
        shadowColor: THEME.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    buttonText: {
        color: '#000000', 
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1.5,
    },
    signUpButton: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    signUpText: {
        color: THEME.text,
        fontSize: 14,
        fontWeight: '600',
        textDecorationLine: 'underline',
        opacity: 0.7,
    }
});
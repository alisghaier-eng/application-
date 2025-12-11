import React, { useEffect, useState, useMemo, createContext } from 'react';
import { View, StatusBar, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { PaperProvider } from 'react-native-paper'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { MaterialCommunityIcons } from '@expo/vector-icons';

// --- Imports des écrans ---
import WelcomeScreen from './screens/WelcomeScreen'; 
import TripPlannerScreen from './screens/TripPlannerScreen';
import ListeVoitureAgence from './screens/Listevoitureagence';
import AccountScreensAgence from './screens/AccountScreensAgence';
import HomepageAgence from './screens/HomepageAgence';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import AccountScreen from './screens/AccountScreens';
import VehicleScreen from './screens/VehicleScreen'; // Import Page Voiture
import Confirmation from './screens/Confirmation';
import DetailVoitureAgence from './screens/DetailsVoitureAgence';
import AjouterVoiture from './screens/AjouterVoiture';
import HomepageClient from './screens/HomepageClient';
import SmartMapScreen from './screens/SmartMapScreen';
import V2GScreen from './screens/V2GScreen';
import theme from './theme'; 
import PaymentPage from './screens/PaymentPage';
import CardScreen from './screens/CardScreen';
import Historic from './screens/Historic'; 

// --- 1. CONTEXTE D'AUTHENTIFICATION ---
export const AuthContext = createContext();

// --- THEME CYBERPUNK GLOBAL ---
const CYBER_THEME = {
  bg: '#050B14',
  primary: '#00F0FF',
  text: '#FFFFFF',
  headerBg: '#0F1C2E',
};

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: CYBER_THEME.bg,
    card: CYBER_THEME.headerBg,
    text: CYBER_THEME.text,
    primary: CYBER_THEME.primary,
  },
};

// ===============================================
// 2. COMPOSANT DE DÉCONNEXION
// ===============================================
function LogoutTrigger() {
    const { signOut } = React.useContext(AuthContext);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            signOut();
        }, 1000);
        return () => clearTimeout(timer);
    }, [signOut]);
    
    return (
        <View style={styles.logoutContainer}>
            <ActivityIndicator size="large" color={CYBER_THEME.primary} />
            <Text style={styles.logoutText}>Fermeture de la session sécurisée...</Text>
        </View>
    );
}

// ===============================================
// 3. STACK D'AUTHENTIFICATION
// ===============================================
function AuthStack() {
    return (
        <Stack.Navigator
            initialRouteName="Welcome"
            screenOptions={{ headerShown: false }}
        >
            <Stack.Screen name="Welcome" component={WelcomeScreen} /> 
            <Stack.Screen name="LoginScreen" component={LoginScreen} />
            <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
        </Stack.Navigator>
    );
}

// ===============================================
// 4. STACK PRINCIPALE
// ===============================================
function HomeStack({ route }) {
    const { userRole } = route.params || { userRole: 'client' }; 
    const initialRoute = userRole === 'agence' ? 'HomepageAgence' : 'HomepageClient';

    const defaultScreenOptions = {
        headerStyle: {
          backgroundColor: CYBER_THEME.headerBg,
          elevation: 0, 
          shadowOpacity: 0, 
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.1)',
        },
        headerTintColor: CYBER_THEME.primary, 
        headerTitleStyle: {
          fontWeight: 'bold',
          color: CYBER_THEME.text,
          letterSpacing: 1,
        },
        headerBackImage: () => (
          <MaterialCommunityIcons name="arrow-left" size={24} color={CYBER_THEME.primary} style={{ marginLeft: 10 }} />
        ),
    };

    return (
        <Stack.Navigator
            initialRouteName={initialRoute}
            screenOptions={defaultScreenOptions}
        >
            <Stack.Screen name="HomepageClient" component={HomepageClient} options={{ headerShown: false }} />
            <Stack.Screen name="HomepageAgence" component={HomepageAgence} options={{ headerShown: false }} />
            
            <Stack.Screen name="SmartMapScreen" component={SmartMapScreen} options={{ headerShown: false }} />
            <Stack.Screen name="V2GScreen" component={V2GScreen} options={{ headerShown: false }} />
            <Stack.Screen name="TripPlannerScreen" component={TripPlannerScreen} options={{ headerShown: false }} />
            
            {/* ICI : Le nom est bien "Vehicle" avec majuscule */}
            <Stack.Screen name="Vehicle" component={VehicleScreen} options={{ headerShown: false }} />

            <Stack.Screen name="CardScreen" component={CardScreen} options={{ title: 'MON CHARIOT' }} />
            <Stack.Screen name="Confirmation" component={Confirmation} options={{ title: 'CONFIRMATION' }} />
            <Stack.Screen name="PaymentPage" component={PaymentPage} options={{ title: 'PAIEMENT' }} />
            <Stack.Screen name="AccountScreen" component={AccountScreen} options={{ title: 'MON PROFIL' }} />
            <Stack.Screen name="Historic" component={Historic} options={{ title: 'HISTORIQUE' }} />
            
            <Stack.Screen name="AjouterVoiture" component={AjouterVoiture} options={{ title: 'AJOUTER VÉHICULE' }} />
            <Stack.Screen name="DetailVoitureAgence" component={DetailVoitureAgence} options={{ title: 'DÉTAILS' }} />
            <Stack.Screen name="Listevoitureagence" component={ListeVoitureAgence} options={{ title: 'FLOTTE' }} />
            <Stack.Screen name="AccountScreensAgence" component={AccountScreensAgence} options={{ title: 'COMPTE AGENCE' }} />
        </Stack.Navigator>
    );
}

// ===============================================
// 5. DRAWER PRINCIPAL (Menu Latéral)
// ===============================================
function AppDrawer({ userRole }) {
    const isAgence = userRole === 'agence';
    
    return (
        <Drawer.Navigator
            initialRouteName="HomeStack"
            screenOptions={{
                headerShown: false,
                drawerStyle: {
                    backgroundColor: CYBER_THEME.bg,
                    width: 260,
                    borderRightWidth: 1,
                    borderRightColor: 'rgba(0, 240, 255, 0.2)',
                },
                drawerActiveTintColor: CYBER_THEME.primary,
                drawerInactiveTintColor: 'rgba(255,255,255,0.7)',
                drawerActiveBackgroundColor: 'rgba(0, 240, 255, 0.1)',
                drawerLabelStyle: { fontWeight: 'bold', letterSpacing: 1 },
            }}
        >
            <Drawer.Screen
                name="HomeStack"
                component={props => <HomeStack {...props} route={{...props.route, params: { userRole }}} />}
                options={{
                    title: isAgence ? 'Tableau de Bord' : 'Cockpit',
                    drawerIcon: ({ color }) => <MaterialCommunityIcons name="view-dashboard-outline" size={22} color={color} />
                }}
            />
            
            {isAgence && (
                <Drawer.Screen
                    name="AccountAgence"
                    component={AccountScreensAgence}
                    options={{ 
                        title: 'Mon Agence',
                        drawerIcon: ({ color }) => <MaterialCommunityIcons name="office-building" size={22} color={color} />
                    }}
                />
            )}
            
            <Drawer.Screen
                name="Account"
                component={AccountScreen}
                options={{ 
                    title: 'Mon Profil',
                    drawerIcon: ({ color }) => <MaterialCommunityIcons name="account-circle-outline" size={22} color={color} />
                }}
            />
            <Drawer.Screen
                name="Historic"
                component={Historic}
                options={{ 
                    title: 'Historique',
                    drawerIcon: ({ color }) => <MaterialCommunityIcons name="history" size={22} color={color} />
                }}
            />
            
             {/* CORRECTION ICI : Changement de 'vehicule' (minuscule) à 'Vehicle' (Majuscule) */}
             <Drawer.Screen
                name="Vehicle" 
                component={VehicleScreen}
                options={{ 
                    title: 'SmartCar',
                    drawerIcon: ({ color }) => <MaterialCommunityIcons name="car-connected" size={22} color={color} />
                }}
            />
            
            {!isAgence && (
                 <Drawer.Screen
                    name="chariot"
                    component={CardScreen}
                    options={{ 
                        title: 'Panier / V2G',
                        drawerIcon: ({ color }) => <MaterialCommunityIcons name="cart-outline" size={22} color={color} />
                    }}
                />
            )}

             <Drawer.Screen
                name="Logout"
                component={LogoutTrigger} 
                options={{ 
                    title: 'Déconnexion',
                    drawerIcon: ({ color }) => <MaterialCommunityIcons name="power" size={22} color={CYBER_THEME.primary} />,
                    drawerLabelStyle: { color: '#FF5555' } 
                }}
            />
        </Drawer.Navigator>
    );
}

// ===============================================
// 6. COMPOSANT RACINE
// ===============================================
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const authContext = useMemo(() => ({
    signIn: async (token, role, userId) => {
        try {
            await AsyncStorage.setItem('authToken', token);
            await AsyncStorage.setItem('userRole', role);
            if (userId) {
                await AsyncStorage.setItem('userId', userId);
            } 
            setIsAuthenticated(true);
            setUserRole(role);
        } catch (e) {
            console.error(e);
        }
    },
    signOut: async () => {
        try {
            await AsyncStorage.multiRemove(['authToken', 'userRole', 'agencyId', 'userId']); 
            setIsAuthenticated(false);
            setUserRole(null);
        } catch (e) {
            console.error(e);
        }
    },
  }), []);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const role = await AsyncStorage.getItem('userRole');
        
        if (token && role) {
          setIsAuthenticated(true);
          setUserRole(role);
        }
      } catch (error) {
        console.error('Auth Check Error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  if (loading) {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={CYBER_THEME.primary} />
            <Text style={styles.loadingText}>Initialisation du Système...</Text>
        </View>
    ); 
  }

  return (
    <PaperProvider theme={theme}>
      <StatusBar barStyle="light-content" backgroundColor="#050B14" />
      <AuthContext.Provider value={authContext}>
        <NavigationContainer theme={CustomDarkTheme}>
          {isAuthenticated 
            ? <AppDrawer userRole={userRole} /> 
            : <AuthStack /> 
          }
        </NavigationContainer>
      </AuthContext.Provider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: CYBER_THEME.bg,
    },
    loadingText: {
        marginTop: 20,
        color: CYBER_THEME.primary,
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    logoutContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: CYBER_THEME.bg,
    },
    logoutText: {
        marginTop: 20,
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
    }
});
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ImageBackground,
  Modal // <--- AJOUTÉ : Pour la fenêtre plein écran
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

const { width, height } = Dimensions.get('window');

// --- THEME CYBERPUNK ---
const THEME = {
  bg: '#050B14',
  primary: '#00F0FF',   // Cyan
  secondary: '#00FF9D', // Vert
  cardBg: 'rgba(30, 41, 59, 0.6)',
  text: '#FFFFFF',
  textDim: 'rgba(255, 255, 255, 0.6)',
  glass: 'rgba(255, 255, 255, 0.05)',
  borderColor: 'rgba(255, 255, 255, 0.1)',
};

export default function AccountScreen({ navigation }) {  // ==========================================
  // LOGIQUE BACKEND (INCHANGÉE)
  // ==========================================
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Champs modifiables
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  
  // Champs conservés pour le backend mais masqués de l'affichage
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [role, setRole] = useState('');

  const [isUpdating, setIsUpdating] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false); // <--- AJOUTÉ : État pour la modale

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          setLoading(false);
          return;
        }
        const response = await axios.get('http://192.168.94.57:6000/user', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = response.data;
        setUser(data);
        setEmail(data.email);
        setPhoneNumber(data.phoneNumber);
        setFirstname(data.firstname || 'Pilote');
        setLastname(data.lastname || '');
        
        // On stocke mais on n'affiche plus
        setBirthDate(data.birthDate);
        setGender(data.gender);
        setRole(data.role || 'client');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserDetails();
  }, []);

  const updateUserDetails = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      // On renvoie tout au backend pour ne rien perdre
      const response = await axios.put(
        'http://192.168.94.57:6000/user',
        { role, firstname, lastname, email, phoneNumber, birthDate, gender },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Succès', 'Profil mis à jour.');
      setUser(response.data);
      setEditingField(null);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de mettre à jour.');
    } finally {
      setIsUpdating(false);
    }
  };

  const imageUrl = user?.profileImage?.startsWith('http')
    ? user.profileImage
    : `http://192.168.94.57:6000${user?.profileImage || ''}`;

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={THEME.primary} />
      </View>
    );
  }

  // ==========================================
  // NOUVELLE UI (STYLE FACEBOOK/INSTAGRAM DARK)
  // ==========================================
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#02050a', '#0a1525', '#000000']} style={StyleSheet.absoluteFillObject} />

      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* 1. COVER PHOTO (Style Facebook) */}
        <View style={styles.coverContainer}>
           <ImageBackground 
              source={{ uri: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1000&auto=format&fit=crop' }} 
              style={styles.coverImage}
              imageStyle={{ opacity: 0.6 }}
           >
              <LinearGradient colors={['transparent', '#050B14']} style={styles.coverGradient} />
           </ImageBackground>
           
           <TouchableOpacity style={styles.coverEditBtn}>
              <MaterialCommunityIcons name="camera" size={20} color="#FFF" />
           </TouchableOpacity>
        </View>

        {/* 2. HEADER PROFIL (Avatar à gauche + Infos) */}
        <View style={styles.profileHeader}>
           <View style={styles.avatarWrapper}>
              {user?.profileImage ? (
                // AJOUTÉ : TouchableOpacity pour ouvrir la modale
                <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.8}>
                  <Image source={{ uri: imageUrl }} style={styles.avatar} />
                </TouchableOpacity>
              ) : (
                <View style={[styles.avatar, {backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center'}]}>
                   <Feather name="user" size={50} color={THEME.primary} />
                </View>
              )}
              <View style={styles.onlineBadge} />
           </View>

           <View style={styles.headerInfo}>
              <View style={styles.nameRow}>
                 <Text style={styles.fullName}>{firstname} {lastname}</Text>
                 <MaterialCommunityIcons name="check-decagram" size={20} color={THEME.primary} style={{marginLeft: 5}} />
              </View>
              <Text style={styles.bioText}>Conducteur Tesla Model 3 • Tunis</Text>
              
              <TouchableOpacity style={styles.editProfileSmallBtn} onPress={() => setEditingField(editingField ? null : 'email')}>
                 <Text style={styles.editBtnText}>Modifier profil</Text>
              </TouchableOpacity>
           </View>
        </View>

        {/* 3. STATS DASHBOARD (Lien avec l'activité) */}
        <Animatable.View animation="fadeInUp" delay={200} style={styles.statsContainer}>
           <LinearGradient colors={[THEME.glass, 'rgba(0,0,0,0.2)']} style={styles.statsBox}>
              <Text style={styles.statNumber}>2,450</Text>
              <Text style={styles.statLabel}>KM PARCOURUS</Text>
           </LinearGradient>
           
           <View style={styles.statSeparator} />
           
           <LinearGradient colors={[THEME.glass, 'rgba(0,0,0,0.2)']} style={styles.statsBox}>
              <Text style={[styles.statNumber, {color: THEME.secondary}]}>45.5 DT</Text>
              <Text style={styles.statLabel}>GAINS V2G</Text>
           </LinearGradient>
           
           <View style={styles.statSeparator} />
           
           <LinearGradient colors={[THEME.glass, 'rgba(0,0,0,0.2)']} style={styles.statsBox}>
              <Text style={[styles.statNumber, {color: THEME.primary}]}>A+</Text>
              <Text style={styles.statLabel}>ECO SCORE</Text>
           </LinearGradient>
        </Animatable.View>

        {/* 4. INFORMATIONS DE CONTACT (Éditables) */}
        <View style={styles.sectionContainer}>
           <Text style={styles.sectionTitle}>COORDONNÉES</Text>
           
           {/* Email */}
           <View style={styles.infoCard}>
              <View style={styles.iconBox}>
                 <MaterialCommunityIcons name="email" size={22} color={THEME.text} />
              </View>
              <View style={styles.infoContent}>
                 <Text style={styles.label}>Adresse Email</Text>
                 {editingField === 'email' ? (
                    <TextInput 
                       style={styles.inputEdit} 
                       value={email} 
                       onChangeText={setEmail}
                       autoCapitalize="none"
                    />
                 ) : (
                    <Text style={styles.valueText}>{user?.email}</Text>
                 )}
              </View>
              <TouchableOpacity onPress={() => setEditingField(editingField === 'email' ? null : 'email')}>
                 <Feather name={editingField === 'email' ? "x" : "edit-2"} size={18} color={THEME.primary} />
              </TouchableOpacity>
           </View>

           {/* Téléphone */}
           <View style={styles.infoCard}>
              <View style={styles.iconBox}>
                 <MaterialCommunityIcons name="phone" size={22} color={THEME.text} />
              </View>
              <View style={styles.infoContent}>
                 <Text style={styles.label}>Téléphone</Text>
                 {editingField === 'phoneNumber' ? (
                    <TextInput 
                       style={styles.inputEdit} 
                       value={phoneNumber} 
                       onChangeText={setPhoneNumber}
                       keyboardType="phone-pad"
                    />
                 ) : (
                    <Text style={styles.valueText}>{user?.phoneNumber || 'Ajouter un numéro'}</Text>
                 )}
              </View>
              <TouchableOpacity onPress={() => setEditingField(editingField === 'phoneNumber' ? null : 'phoneNumber')}>
                 <Feather name={editingField === 'phoneNumber' ? "x" : "edit-2"} size={18} color={THEME.primary} />
              </TouchableOpacity>
           </View>

           {/* BOUTON SAUVEGARDE */}
           {editingField && (
              <Animatable.View animation="fadeInUp" style={{marginTop: 15}}>
                 <TouchableOpacity onPress={updateUserDetails} disabled={isUpdating} style={styles.saveBtn}>
                    <LinearGradient colors={[THEME.primary, '#0055FF']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.saveGradient}>
                       {isUpdating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>ENREGISTRER</Text>}
                    </LinearGradient>
                 </TouchableOpacity>
              </Animatable.View>
           )}
        </View>

        {/* 5. VÉHICULE & SÉCURITÉ */}
        <View style={styles.sectionContainer}>
           <Text style={styles.sectionTitle}>VÉHICULE & SÉCURITÉ</Text>
           <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('Vehicle')}
            >
              <View style={[styles.iconBox, {backgroundColor: 'rgba(0, 255, 157, 0.1)'}]}>
                 <MaterialCommunityIcons name="car-electric" size={22} color={THEME.secondary} />
              </View>
              <Text style={styles.menuText}>Mes Véhicules (1)</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color={THEME.textDim} />
            </TouchableOpacity>
           <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.iconBox, {backgroundColor: 'rgba(255, 85, 85, 0.1)'}]}>
                 <MaterialCommunityIcons name="shield-lock" size={22} color={THEME.secondary} />
              </View>
              <Text style={styles.menuText}>Confidentialité & Données</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color={THEME.textDim} />
           </TouchableOpacity>
        </View>

        <View style={{height: 50}} />
      </ScrollView>

      {/* --- MODALE PLEIN ÉCRAN POUR L'IMAGE DE PROFIL --- */}
      <Modal visible={isModalVisible} transparent={true} onRequestClose={() => setModalVisible(false)} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
            <Ionicons name="close" size={30} color="#FFF" />
          </TouchableOpacity>
          <Image source={{ uri: imageUrl }} style={styles.modalImage} resizeMode="contain" />
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: THEME.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  /* 1. COVER */
  coverContainer: {
    height: 180,
    width: '100%',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverGradient: {
    flex: 1,
    marginTop: 100, // Dégradé vers le noir en bas
  },
  coverEditBtn: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  /* 2. PROFILE HEADER (Layout Facebook : Avatar chevauche Cover) */
  profileHeader: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: -50, // Chevauchement
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 110, // Agrandie
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: '#050B14', // Couleur du fond pour détacher l'avatar
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: THEME.secondary,
    borderWidth: 3,
    borderColor: '#050B14',
  },
  headerInfo: {
    flex: 1,
    paddingBottom: 5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  bioText: {
    color: THEME.textDim,
    fontSize: 13,
    marginBottom: 10,
  },
  editProfileSmallBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  editBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },

  /* 3. STATS DASHBOARD */
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: THEME.borderColor,
    marginBottom: 25,
  },
  statsBox: {
    flex: 1,
    alignItems: 'center',
  },
  statSeparator: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: THEME.textDim,
    fontWeight: 'bold',
  },

  /* 4. INFOS & SECTIONS */
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    color: THEME.primary,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 15,
    letterSpacing: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
  },
  label: {
    color: THEME.textDim,
    fontSize: 11,
    marginBottom: 2,
  },
  valueText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
  },
  inputEdit: {
    color: THEME.primary,
    fontSize: 15,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: THEME.primary,
    paddingVertical: 0,
    height: 20,
  },
  
  /* MENU ITEMS */
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
  },
  menuText: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
  },

  /* SAVE BTN */
  saveBtn: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  saveGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },

  /* MODAL STYLES - AMÉLIORÉS */
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)', // Fond sombre
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 0, // Cadre maximal (toute la hauteur)
  },
  modalImage: {
    width: '100%',
    height: '70%', // Image réduite à 70% de la hauteur totale pour "respirer"
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 25,
    padding: 10,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
  }
});
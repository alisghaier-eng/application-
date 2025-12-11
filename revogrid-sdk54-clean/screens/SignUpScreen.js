import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  StatusBar, 
  TextInput as NativeInput,
  Image // Ajout de Image pour prévisualiser
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; // 1. IMPORT DU PICKER

// --- THEME CYBERPUNK ---
const THEME = {
  primary: '#00F0FF',   // Cyan
  secondary: '#00FF9D', // Vert
  error: '#FF0055',     // Rouge Néon
  bgGradient: ['#02050a', '#0a1525', '#0f2030'],
  inputBg: 'rgba(255, 255, 255, 0.05)',
  text: '#FFFFFF',
  textDim: 'rgba(255, 255, 255, 0.4)',
};

export default function SignUpScreen({ navigation }) {
  const [userType, setUserType] = useState('client'); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [firstname, setfirstname] = useState('');
  const [lastname, setlastname] = useState('');
  const [loading, setLoading] = useState(false);

  // Champs techniques
  const [birthDate, setBirthDate] = useState(new Date().toISOString().split('T')[0]);
  const [gender, setGender] = useState('Homme');
  const [address, setAddress] = useState('Non spécifié');
  const [profileImage, setProfileImage] = useState(null); 

  // --- 2. FONCTION DE SÉLECTION D'IMAGE ---
  const pickImage = async () => {
    // Demander la permission (automatique sur les versions récentes d'Expo, mais bonne pratique)
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission requise", "Vous devez autoriser l'accès à la galerie.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Carré parfait pour un avatar
      quality: 0.5,   // Compression pour éviter les fichiers trop lourds
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password || !confirmPassword || !firstname.trim() || !lastname.trim()) {
      Alert.alert("Erreur", "Veuillez remplir les champs obligatoires (Nom, Prénom, Email, MDP).");
      return;
    }
  
    if (password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");
      return;
    }
  
    setLoading(true);

    try {
      const formData = new FormData();
      
      formData.append("firstname", firstname);
      formData.append("lastname", lastname);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("phoneNumber", phoneNumber || "00000000");
      formData.append("role", "client");
      
      formData.append("birthDate", birthDate);
      formData.append("gender", gender);
      formData.append("address", address);
      
      // Gestion de l'image
      if (profileImage) {
        // Extraction du type de fichier (jpg/png) depuis l'URI
        let filename = profileImage.split('/').pop();
        let match = /\.(\w+)$/.exec(filename);
        let type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append("profileImage", {
          uri: profileImage,
          name: filename,
          type: type,
        });
      }
  
      const response = await axios.post(
        "http://192.168.94.57:6000/signUp", 
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
  
      Alert.alert("Succès", "Compte créé ! Connectez-vous.");
      navigation.navigate('LoginScreen'); // Assurez-vous que le nom correspond à votre Stack (LoginScreen ou Login)
    } catch (error) {
      console.error("Erreur lors de l'inscription :", error.response?.data || error.message);
      Alert.alert("Erreur", "Problème lors de l'inscription. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={THEME.bgGradient}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        <Animatable.View animation="fadeInDown" duration={800} style={styles.headerContainer}>
           <Text style={styles.welcomeText}>INITIALISATION</Text>
           <Text style={styles.subText}>Créer votre identité numérique</Text>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" duration={800} delay={200} style={styles.formContainer}>
          
          {/* --- 3. UI SÉLECTEUR D'IMAGE --- */}
          <View style={{ alignItems: 'center', marginBottom: 25 }}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Feather name="camera" size={32} color={THEME.primary} />
                        <Text style={styles.avatarText}>PHOTO</Text>
                    </View>
                )}
                {/* Petit bouton "+" décoratif style Cyberpunk */}
                <View style={styles.addIconBadge}>
                    <Feather name="plus" size={16} color="#000" />
                </View>
            </TouchableOpacity>
          </View>

          {/* Nom & Prénom */}
          <View style={styles.row}>
             <View style={[styles.inputWrapper, {flex: 1, marginRight: 10}]}>
                <Feather name="user" size={18} color={THEME.primary} style={styles.inputIcon} />
                <NativeInput
                  placeholder="Prénom"
                  placeholderTextColor={THEME.textDim}
                  value={firstname}
                  onChangeText={setfirstname}
                  style={styles.input}
                />
             </View>
             <View style={[styles.inputWrapper, {flex: 1}]}>
                <NativeInput
                  placeholder="Nom"
                  placeholderTextColor={THEME.textDim}
                  value={lastname}
                  onChangeText={setlastname}
                  style={[styles.input, {paddingLeft: 15}]}
                />
             </View>
          </View>

          {/* Email */}
          <View style={styles.inputWrapper}>
            <Feather name="mail" size={18} color={THEME.primary} style={styles.inputIcon} />
            <NativeInput
              placeholder="Email"
              placeholderTextColor={THEME.textDim}
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Téléphone */}
          <View style={styles.inputWrapper}>
            <Feather name="smartphone" size={18} color={THEME.primary} style={styles.inputIcon} />
            <NativeInput
              placeholder="Téléphone"
              placeholderTextColor={THEME.textDim}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              style={styles.input}
              keyboardType="phone-pad"
            />
          </View>

          {/* Mot de passe */}
          <View style={styles.inputWrapper}>
            <Feather name="lock" size={18} color={THEME.primary} style={styles.inputIcon} />
            <NativeInput
              placeholder="Mot de passe"
              placeholderTextColor={THEME.textDim}
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry
            />
          </View>

          {/* Confirm Mot de passe */}
          <View style={styles.inputWrapper}>
            <Feather name="check-circle" size={18} color={THEME.primary} style={styles.inputIcon} />
            <NativeInput
              placeholder="Confirmer Mot de passe"
              placeholderTextColor={THEME.textDim}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.input}
              secureTextEntry
            />
          </View>

          {/* Bouton Inscription */}
          <TouchableOpacity 
            onPress={handleSignUp} 
            disabled={loading}
            activeOpacity={0.8}
            style={styles.signUpButton}
          >
            <LinearGradient
              colors={[THEME.primary, '#0085FF']}
              start={{x: 0, y: 0}} end={{x: 1, y: 0}}
              style={styles.gradientButton}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.buttonText}>CRÉER COMPTE</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')} style={styles.linkContainer}>
            <Text style={styles.linkText}>
              Déjà enregistré ? <Text style={{color: THEME.primary, fontWeight: 'bold'}}>Connexion</Text>
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
    paddingTop: 60,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30, // Réduit un peu pour laisser place à l'image
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '900',
    color: THEME.text,
    letterSpacing: 2,
    marginBottom: 5,
  },
  subText: {
    fontSize: 14,
    color: THEME.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  formContainer: {
    width: '100%',
  },
  // --- STYLES AVATAR ---
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    position: 'relative',
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: THEME.primary,
    fontSize: 10,
    marginTop: 5,
    fontWeight: 'bold',
  },
  addIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: THEME.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#02050a',
  },
  // --- FIN STYLES AVATAR ---
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.inputBg,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    height: 50,
  },
  inputIcon: {
    marginLeft: 15,
    marginRight: 5,
  },
  input: {
    flex: 1,
    color: THEME.text,
    fontSize: 15,
    height: '100%',
    paddingRight: 15,
  },
  signUpButton: {
    marginTop: 20,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  gradientButton: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 1,
  },
  linkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: THEME.textDim,
    fontSize: 14,
  },
});
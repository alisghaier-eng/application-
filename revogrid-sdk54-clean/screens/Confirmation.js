import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Confirmation({ route }) {
  const { car, rentalPeriod, withDriver, total } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Demande envoyée !</Text>
      <Text style={styles.info}>Voiture: {car.name}</Text>
      <Text style={styles.info}>Période: {rentalPeriod} jours</Text>
      <Text style={styles.info}>Avec chauffeur: {withDriver ? 'Oui' : 'Non'}</Text>
      <Text style={styles.info}>Total: ${total}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  info: { fontSize: 16, marginBottom: 8 },
});

import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Correct import

export default function FilterBar({ onFilterChange }) {
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [transmission, setTransmission] = useState('manuel'); // Default value: 'manuel'
  const [availability, setAvailability] = useState('disponible'); // Default value: 'disponible'
  const [isFilterVisible, setIsFilterVisible] = useState(false); // Etat pour afficher/masquer le formulaire de filtre

  const handleApplyFilters = () => {
    // Call the onFilterChange function passed by the parent component
    if (typeof onFilterChange === 'function') {
      onFilterChange({
        minBudget,
        maxBudget,
        transmission,
        availability,
      });
    }
    setIsFilterVisible(false); // Masquer le formulaire après l'application des filtres
  };

  return (
    <View style={styles.container}>
      {/* Bouton de filtre */}
      <TouchableOpacity style={styles.filterButton} onPress={() => setIsFilterVisible(!isFilterVisible)}>
        <Text style={styles.filterButtonText}>Filtre</Text>
      </TouchableOpacity>

      {/* Afficher/masquer le formulaire de filtre */}
      {isFilterVisible && (
        <ScrollView style={styles.filterContainer} contentContainerStyle={styles.contentContainer}>
          {/* Budget Filter */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Budget Min (par jour)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="Entrez votre budget minimum"
              value={minBudget}
              onChangeText={setMinBudget}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Budget Max (par jour)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="Entrez votre budget maximum"
              value={maxBudget}
              onChangeText={setMaxBudget}
            />
          </View>

          {/* Transmission Filter */}
          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Transmission</Text>
            <Picker
              selectedValue={transmission}
              style={styles.picker}
              onValueChange={(itemValue) => setTransmission(itemValue)}
            >
              <Picker.Item label="Manuel" value="manuel" />
              <Picker.Item label="Automatique" value="automatique" />
            </Picker>
          </View>

          {/* Availability Filter */}
          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Disponibilité</Text>
            <Picker
              selectedValue={availability}
              style={styles.picker}
              onValueChange={(itemValue) => setAvailability(itemValue)}
            >
              <Picker.Item label="Disponible" value="disponible" />
              <Picker.Item label="Indisponible" value="indisponible" />
            </Picker>
          </View>

          {/* Apply Filter Button */}
          <TouchableOpacity style={styles.button} onPress={handleApplyFilters}>
            <Text style={styles.buttonText}>Appliquer les filtres</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  filterButton: {
    backgroundColor: '#4CAF50', // Green color for filter button
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  filterContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 16,
  },
  contentContainer: {
    paddingBottom: 20, // Ensures the scroll works if content exceeds screen size
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  picker: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#4CAF50', // Green color for apply button
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

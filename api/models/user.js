const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['client', 'agence'],
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },

    // Champs spécifiques pour les clients
    birthDate: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['Homme', 'Femme'],
    },
    profileImage: {
      type: String,
    },
  
    // Champs spécifiques pour les agences
    agencyId: {
      type: String,
    },
    agencyName: {
      type: String,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    firstName: {
      type: String,
    
    },
    lastName: {
      type: String,
      
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;

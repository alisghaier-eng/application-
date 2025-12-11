const mongoose = require("mongoose");

const carSchema = new mongoose.Schema({
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Référence à l'agence propriétaire
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  priceperday: {
    type: Number,
    required: true,
  },
  availability: {
    type: Boolean,
    default: true,
  },
  image: {
    type: String,
    required: true,
  },
  licensePlate: {
    type: String,
    required: true, // La matricule est obligatoire
    unique: true, // La matricule doit être unique
    trim: true, // Supprime les espaces inutiles
  },
  transmission: {
    type: String,
    required: true, // La transmission est obligatoire
    enum: ["manuelle", "automatique"], // Limite les valeurs possibles
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Car = mongoose.model("Car", carSchema);
module.exports = Car;
const mongoose=require("mongoose")
const rentalSchema = new mongoose.Schema({
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Référence au client
    required: true, // Rendre obligatoire
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
  },
  withDriver: {
    type: Boolean,
    default: false,
  },
  destination: {
    type: String,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'cash', 'bank_transfer'],
  },
  paymentDate: {
    type: Date,
  },
  transactionId: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
}, { timestamps: true });

const Rental = mongoose.model('Rental', rentalSchema);
module.exports = Rental;

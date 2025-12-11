const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const User = require("./models/user");
const Car = require("./models/Car");
const Rental = require("./models/rental");
const Cart = require("./models/card"); // Attention à la casse du fichier (card vs Cart)
const multer = require("multer");
const path = require("path");

const app = express();
const port = 6000;
const secretkey = "reno";

const corsOptions = {
  origin: "192.168.94.57", // Mis à * pour éviter les problèmes en dev, ou gardez votre IP spécifique
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose
  .connect("mongodb+srv://alisghaieribenmansour:QF5fR3u7ofKdvn1A@cluster0.oo2ru.mongodb.net/")
  .then(() => console.log("Connected to MongoDB successfully!"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));


// --- MIDDLEWARE AUTH ---
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized access. Token is missing." });
    }

    const decoded = jwt.verify(token, secretkey);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(403).json({ message: "Invalid token. User not found." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Erreur d'authentification:", error);
    return res.status(401).json({ message: "Unauthorized access." });
  }
};

app.get('/v2g/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Récupérer les transactions, triées par date (la plus récente en premier)
        const transactions = await V2GTransaction.find({ userId })
            .sort({ timestamp: -1 });

        // Calculer des stats pour le dashboard
        const totalGain = transactions.reduce((sum, t) => sum + t.totalGain, 0);
        const totalEnergy = transactions.reduce((sum, t) => sum + t.quantityKwh, 0);
        const transactionCount = transactions.length;

        res.status(200).json({
            success: true,
            transactions,
            stats: {
                totalGain: parseFloat(totalGain.toFixed(3)),
                totalEnergy: parseFloat(totalEnergy.toFixed(3)),
                transactionCount
            }
        });

    } catch (error) {
        console.error("Erreur historique V2G:", error);
        res.status(500).json({ success: false, error: "Erreur serveur" });
    }
});
// --- CONFIG MULTER ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images are allowed."), false);
  }
};

const upload = multer({ storage, fileFilter });


// ============================================================
// LOGIQUE V2G (VEHICLE TO GRID)
// ============================================================

// 1. Définition du schéma Transaction V2G
const V2GTransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quantityKwh: { type: Number, required: true },
    pricePerKwh: { type: Number, required: true },
    totalGain: { type: Number, required: true },
    status: { type: String, default: 'completed' },
    timestamp: { type: Date, default: Date.now }
});

// Vérification pour éviter de recompiler le modèle si le serveur redémarre à chaud
const V2GTransaction = mongoose.models.V2GTransaction || mongoose.model('V2GTransaction', V2GTransactionSchema);

// 2. ROUTE V2G : VENDRE DE L'ÉNERGIE
// URL Frontend: http://192.168.94.57:6000/sell
app.post('/sell', async (req, res) => {
    try {
        const { userId, quantity, currentPrice } = req.body;

        // Validation
        if (!userId || !quantity || !currentPrice) {
            return res.status(400).json({ success: false, error: "Données manquantes (UserId, Qté ou Prix)" });
        }

        // Calcul du gain
        const totalGain = parseFloat((quantity * currentPrice).toFixed(3));

        // Créer l'historique
        const newTransaction = new V2GTransaction({
            userId,
            quantityKwh: quantity,
            pricePerKwh: currentPrice,
            totalGain
        });
        await newTransaction.save();

        // Mettre à jour le solde utilisateur
        // NOTE: Assurez-vous que votre modèle User.js a bien un champ "walletBalance" (Number, default: 0)
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $inc: { walletBalance: totalGain } }, 
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, error: "Utilisateur non trouvé" });
        }

        res.status(200).json({
            success: true,
            message: "Transaction V2G réussie",
            transactionId: newTransaction._id,
            gain: totalGain,
            newBalance: updatedUser.walletBalance
        });

    } catch (error) {
        console.error("Erreur V2G:", error);
        res.status(500).json({ success: false, error: "Erreur serveur transaction V2G" });
    }
});
// ============================================================
// FIN LOGIQUE V2G
// ============================================================


// Route: Ajouter une voiture (Agence)
app.post("/cars", authenticateUser, upload.single("image"), async (req, res) => {
  try {
    if (req.user.role !== "agence") {
      return res.status(403).json({ message: "Access denied. Only agencies can add cars." });
    }

    const { model, priceperday, licensePlate, transmission } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!model || !priceperday || !licensePlate || !transmission || !req.file) {
      return res.status(400).json({ message: "All fields, including an image, are required." });
    }

    const newCar = new Car({
      model,
      priceperday,
      image: `http://192.168.94.57:6000${imagePath}`, // J'ai corrigé l'IP ici (9.57 -> 94.57)
      licensePlate,
      transmission,
      agency: req.user._id,
    });

    await newCar.save();
    res.status(201).json({ message: "Car added successfully", car: newCar });
  } catch (err) {
    console.error("Error adding car:", err);
    res.status(500).json({ message: "An error occurred while adding the car." });
  }
});

// Route: Get all cars
app.get("/cars", async (req, res) => {
  try {
    const cars = await Car.find().populate("agency", "email");
    if (cars.length === 0) {
      return res.status(404).json({ message: "No cars available." });
    }
    res.status(200).json(cars);
  } catch (err) {
    console.error("Error fetching cars:", err);
    res.status(500).json({ message: "An error occurred while fetching cars." });
  }
});

// Route: Get car by ID
app.get("/cars/:id", async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).populate("agency", "email");
    if (!car) {
      return res.status(404).json({ message: "Car not found." });
    }
    res.status(200).json(car);
  } catch (err) {
    console.error("Error fetching car details:", err);
    res.status(500).json({ message: "An error occurred while fetching car details." });
  }
});

// Route: Get cars for specific agency
app.get("/carsagency", async (req, res) => {
  try {
    const agencyId = req.query.agencyId;
    if (!agencyId) {
      return res.status(400).json({ message: "L'ID de l'agence est requis." });
    }
    const cars = await Car.find({ agency: agencyId }).populate("agency", "email");
    if (cars.length === 0) {
      return res.status(404).json({ message: "Aucune voiture trouvée pour cette agence." });
    }
    res.status(200).json(cars);
  } catch (err) {
    console.error("Erreur lors de la récupération des voitures:", err);
    res.status(500).json({ message: "Une erreur est survenue lors de la récupération des voitures." });
  }
});

app.put('/cars/:id', async (req, res) => {
  try {
    const carId = req.params.id;
    const updates = req.body;
    const updatedCar = await Car.findByIdAndUpdate(carId, updates, { new: true });
    if (!updatedCar) {
      return res.status(404).json({ message: 'Voiture non trouvée' });
    }
    res.status(200).json({ message: 'Les détails de la voiture ont été mis à jour avec succès', car: updatedCar });
  } catch (err) {
    console.error('Erreur lors de la mise à jour de la voiture:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de la voiture' });
  }
});

app.delete('/cars/:id', async (req, res) => {
  try {
    const carId = req.params.id;
    const deletedCar = await Car.findByIdAndDelete(carId);
    if (!deletedCar) {
      return res.status(404).json({ message: 'Voiture non trouvée' });
    }
    res.status(200).json({ message: 'La voiture a été supprimée avec succès' });
  } catch (err) {
    console.error('Erreur lors de la suppression de la voiture:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression de la voiture' });
  }
});

// Route: Create a rental
app.post("/rentals", authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== "client") {
      return res.status(403).json({ message: "Access denied. Only clients can create rentals." });
    }
    const { carId, startDate, endDate, withDriver, destination } = req.body;
    if (!carId || !startDate || !endDate) {
      return res.status(400).json({ message: "Car ID, startDate, and endDate are required." });
    }
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: "Car not found." });
    }
    const overlappingRental = await Rental.findOne({
      car: carId,
      $or: [
        { startDate: { $lt: new Date(endDate) }, endDate: { $gt: new Date(startDate) } },
      ],
    });
    if (overlappingRental) {
      return res.status(400).json({ message: "Car is already rented for the selected dates." });
    }
    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    if (days <= 0) {
      return res.status(400).json({ message: "Invalid start or end dates." });
    }
    const totalPrice = days * car.priceperday;
    const rentalData = {
      car: carId,
      client: req.user._id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalPrice,
      withDriver: withDriver || false,
    };
    if (withDriver && destination) {
      rentalData.destination = destination;
    }
    const rental = new Rental(rentalData);
    await rental.save();
    car.availability = false;
    await car.save();
    const endTime = new Date(endDate).getTime();
    const currentTime = Date.now();
    if (endTime > currentTime) {
      const delay = endTime - currentTime;
      setTimeout(async () => {
        try {
          car.availability = true;
          await car.save();
          console.log(`Car ${carId} is now available again.`);
        } catch (err) {
          console.error("Error updating car availability:", err);
        }
      }, delay);
    }
    res.status(201).json({ message: "Rental created successfully.", rental });
  } catch (err) {
    console.error("Error creating rental:", err);
    res.status(500).json({ message: err.message || "An error occurred while creating the rental." });
  }
});

app.get("/rentals/user", authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const rentals = await Rental.find({ client: userId })
      .select("startDate endDate totalPrice car")
      .populate({
        path: "car",
        select: "model priceperday image agency",
        populate: {
          path: "agency",
          select: "agencyName",
        },
      })
      .sort({ startDate: -1 });

    if (!rentals.length) {
      return res.status(200).json({ rentals: [] });
    }
    res.status(200).json({ rentals });
  } catch (err) {
    console.error("Error fetching rentals:", err);
    res.status(500).json({ message: "An error occurred while fetching rentals." });
  }
});

app.get("/rentals/:carId", authenticateUser, async (req, res) => {
  const { carId } = req.params;
  try {
    const rental = await Rental.findOne({ car: carId })
      .populate("client", "name email")
      .populate("car", "model")
      .select("startDate endDate car client");

    if (!rental) {
      return res.status(404).json({ message: "Aucune location trouvée pour cette voiture." });
    }
    const { client, car, startDate, endDate } = rental;
    const start = new Date(startDate).toLocaleDateString();
    const end = new Date(endDate).toLocaleDateString();
    const notificationMessage = `${client.name} a loué la voiture ${car.model} du ${start} au ${end}`;
    res.status(200).json({
      message: notificationMessage,
      rentalDetails: {
        clientName: client.name,
        carModel: car.model,
        startDate: start,
        endDate: end,
      }
    });
  } catch (err) {
    console.error("Erreur lors de la récupération des informations de location :", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.get("/agencies", async (req, res) => {
  try {
    const agencies = await User.find({ role: "agence" }).select("agencyName latitude longitude");
    res.status(200).json({ agencies });
  } catch (err) {
    console.error("Error fetching agencies:", err);
    res.status(500).json({ message: "An error occurred while fetching agencies." });
  }
});

app.get("/agencies/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const agency = await User.findById(id).select("email phoneNumber agencyName latitude longitude");
    if (!agency) {
      return res.status(404).json({ message: "Agence non trouvée." });
    }
    res.status(200).json({ agency });
  } catch (err) {
    console.error("Erreur lors de la récupération de l'agence :", err);
    res.status(500).json({ message: "Une erreur est survenue lors de la récupération de l'agence." });
  }
});

app.post("/signUp", upload.single('profileImage'), async (req, res) => {
  try {
    const { 
      role,firstname,lastname, email, password, phoneNumber, agencyId, agencyName, latitude, longitude, birthDate, gender // Ajout de birthDate et gender ici
    } = req.body;

    if (!email || !password || !role || !phoneNumber) {
      return res.status(400).json({ message: "All required fields must be filled." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Validation conditionnelle simplifiée
    if (role === "agence" && (!latitude || !longitude || !agencyId || !agencyName)) {
        return res.status(400).json({ message: "Agency details missing." });
    }
    // Pour client, on peut être plus souple si besoin, sinon décommentez la validation

    const profileImage = req.file ? `/uploads/${req.file.filename}` : null;

    const newUser = new User({
      role,
      firstname: role==="client" ? firstname : null,
      lastname: role==="client" ? lastname : null,
      email,
      password: hashedPassword,
      phoneNumber,
      birthDate: role === "client" ? birthDate : null,
      gender: role === "client" ? gender : null,
      profileImage: role === "client" ? profileImage : null,
      agencyId: role === "agence" ? agencyId : null,
      agencyName: role === "agence" ? agencyName : null,
      latitude: role === "agence" ? latitude : null,
      longitude: role === "agence" ? longitude : null,
      walletBalance: 0 // Initialisation du portefeuille à 0 pour le V2G
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully!" });

  } catch (err) {
    console.error("Error during signup:", err);
    res.status(500).json({ message: "An error occurred during signup." });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    
    // Ajout de userId dans le token
    const token = jwt.sign({ userId: user._id, role: user.role }, secretkey, { expiresIn: "1h" });
    
    let agencyId = null;
    if (user.role === "agence") {
      agencyId = user._id;
    }
    res.status(200).json({ token, role: user.role, agencyId: agencyId });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: "Error during login." });
  }
});

app.get('/user', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token manquant' });
  try {
    const decoded = jwt.verify(token, secretkey);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.status(200).json(user);
  } catch (error) {
    console.error('Erreur user:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/check-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });
    res.json({ exists: !!user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

app.put('/user', authenticateUser, async (req, res) => {
  const { email, phoneNumber, birthDate, gender } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    user.email = email || user.email;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.birthDate = birthDate || user.birthDate;
    user.gender = gender || user.gender;
    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

app.post('/cart', async (req, res) => {
  const { userId, carId } = req.body;
  if (!userId || !carId) return res.status(400).json({ error: 'userId et carId sont requis.' });
  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(carId)) {
    return res.status(400).json({ error: 'userId ou carId sont invalides.' });
  }
  try {
    const existingItem = await Cart.findOne({ userId, carId });
    if (existingItem) return res.status(400).json({ message: 'Cette voiture est déjà dans le chariot.' });
    const cartItem = new Cart({
      userId: new mongoose.Types.ObjectId(userId),
      carId: new mongoose.Types.ObjectId(carId),
    });
    await cartItem.save();
    return res.status(201).json({ message: 'Voiture ajoutée au chariot.', cartItem });
  } catch (error) {
    console.error('Erreur cart:', error.message);
    return res.status(500).json({ error: 'Erreur interne.' });
  }
});

app.get('/cart', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant.' });
  try {
    const decoded = jwt.verify(token, secretkey);
    const userId = decoded.userId;
    if (!userId) return res.status(400).json({ error: 'Utilisateur non valide.' });
    
    // Correction de la variable 'cart' (import) vs 'Cart' (Model)
    // Ici on utilise Cart (le modèle)
    const cartItems = await Cart 
      .find({ userId })
      .populate('carId')
      .exec();

    if (!cartItems || cartItems.length === 0) {
      return res.status(404).json({ message: 'Aucun article trouvé dans le panier.' });
    }
    return res.status(200).json({ cartItems });
  } catch (error) {
    console.error('Erreur cart fetch:', error.message);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

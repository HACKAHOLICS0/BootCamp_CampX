const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const passport = require("passport");
const mongoose = require('mongoose');
const adminRoutes = require("./routes/AdminRoutes"); 
const bodyParser = require("body-parser");
const path = require("path");
const authRoutes = require("./routes/authRoutes");
const { initializePoints } = require('./controllers/intrestpoint');
const interestPointRoutes = require('./routes/intrestRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const courseRoutes = require('./routes/courseRoutes');
const cookieParser = require('cookie-parser');

require("./utils/passport");
require("./utils/passport1")

const videoRoutes = require("./routes/VideoRoutes");

dotenv.config({ path: "./config/.env" });
const quizRoutes=require('./routes/quizRoutes');
const session = require("express-session");
const jwt = require('jsonwebtoken');
const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(passport.initialize());

require("./config/dbConfig");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("Connexion à MongoDB réussie");
  initializePoints();
})
.catch((err) => {
  console.error("Erreur lors de la connexion à MongoDB:", err);
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false, 
  saveUninitialized: true, 
  cookie: { secure: false }
}));

const SECRET_KEY = "6LebIeMqAAAAAH51qBo0r1Q87u1FxnysnflAv6rb"; 
app.use(cookieParser());
app.use(passport.initialize());

// API Routes
app.use("/api/videos", videoRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api', interestPointRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/courses', courseRoutes);

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get('/api/points', async (req, res) => {
    try {
        const interestPointModel = require('./Model/Interestpoint'); 
        const points = await interestPointModel.find();
        res.status(200).json(points);
    } catch (err) {
        console.error("Erreur lors de la récupération des points d'intérêt:", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

app.all("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

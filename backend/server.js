const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 5000;
const JWT_SECRET = "museum_secret_2023";

app.use(cors());
app.use(express.json());

// Base SQLite
const db = new sqlite3.Database("./museum.db", (err) => {
    if (err) {
        console.error("❌ Erreur SQLite:", err.message);
    } else {
        console.log("✅ Connecté à SQLite");
        initDatabase();
    }
});

function initDatabase() {
    // Table utilisateurs
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error("❌ Erreur création table users:", err.message);
        else console.log("✅ Table 'users' prête");
    });

    // Table œuvres
    db.run(`
        CREATE TABLE IF NOT EXISTS artworks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            artist TEXT NOT NULL,
            century TEXT,
            image_url TEXT,
            description TEXT
        )
    `, (err) => {
        if (err) console.error("❌ Erreur création table artworks:", err.message);
        else {
            console.log("✅ Table 'artworks' prête");
            // Vérifier si la table est vide
            db.get("SELECT COUNT(*) as count FROM artworks", (err, row) => {
                if (!err && row.count === 0) {
                    insertSampleArtworks();
                }
            });
        }
    });
}

function insertSampleArtworks() {
    const artworks = [
        ["La Joconde", "Léonard de Vinci", "XVIe", "https://via.placeholder.com/400x300/2c3e50/ecf0f1?text=Joconde", "Portrait mystérieux de Mona Lisa"],
        ["La Nuit étoilée", "Vincent van Gogh", "XIXe", "https://via.placeholder.com/400x300/3498db/ffffff?text=Nuit+Étoilée", "Ciel tourbillonnant au-dessus d'un village"],
        ["Le Cri", "Edvard Munch", "XIXe", "https://via.placeholder.com/400x300/e74c3c/ffffff?text=Le+Cri", "Expression de l'angoisse existentielle"],
        ["La Jeune Fille à la perle", "Johannes Vermeer", "XVIIe", "https://via.placeholder.com/400x300/2ecc71/ffffff?text=Fille+Perle", "Portrait énigmatique au regard perçant"],
        ["Les Tournesols", "Vincent van Gogh", "XIXe", "https://via.placeholder.com/400x300/f1c40f/000000?text=Tournesols", "Série de peintures de tournesols"]
    ];

    artworks.forEach((art, index) => {
        db.run(
            `INSERT OR IGNORE INTO artworks (title, artist, century, image_url, description) VALUES (?, ?, ?, ?, ?)`,
            art,
            (err) => {
                if (err) {
                    console.error(`❌ Erreur insertion œuvre ${index + 1}:`, err.message);
                }
            }
        );
    });
    console.log("✅ Données de test insérées");
}

// ========== ROUTES AUTH ==========

// INSCRIPTION
app.post("/api/auth/register", async (req, res) => {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: "Le mot de passe doit faire au moins 6 caractères" });
    }

    try {
        // Vérifier si l'utilisateur existe déjà
        db.get("SELECT * FROM users WHERE email = ? OR username = ?", [email, username], async (err, existingUser) => {
            if (err) {
                return res.status(500).json({ error: "Erreur serveur" });
            }

            if (existingUser) {
                return res.status(400).json({ error: "Email ou nom d'utilisateur déjà utilisé" });
            }

            // Hacher le mot de passe
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Insérer l'utilisateur
            db.run(
                "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
                [username, email, hashedPassword],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: "Erreur création du compte" });
                    }
                    
                    // Créer le token JWT
                    const token = jwt.sign(
                        { id: this.lastID, username, email },
                        JWT_SECRET,
                        { expiresIn: "24h" }
                    );
                    
                    res.json({
                        success: true,
                        message: "Compte créé avec succès!",
                        token,
                        user: {
                            id: this.lastID,
                            username,
                            email
                        }
                    });
                }
            );
        });
    } catch (error) {
        console.error("Erreur inscription:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// CONNEXION
app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: "Erreur serveur" });
        }

        if (!user) {
            return res.status(400).json({ error: "Email ou mot de passe incorrect" });
        }

        // Vérifier le mot de passe
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: "Email ou mot de passe incorrect" });
        }

        // Créer le token JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.json({
            success: true,
            message: "Connexion réussie!",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    });
});

// ========== ROUTES PUBLIQUES ==========

// GET toutes les œuvres
app.get("/api/artworks", (req, res) => {
    db.all("SELECT * FROM artworks ORDER BY id", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// GET une œuvre par ID
app.get("/api/artworks/:id", (req, res) => {
    db.get("SELECT * FROM artworks WHERE id = ?", [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (!row) {
            res.status(404).json({ error: "Œuvre non trouvée" });
        } else {
            res.json(row);
        }
    });
});

// ========== ROUTES PROTÉGÉES ==========

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Token manquant" });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Token invalide" });
        }
        req.user = user;
        next();
    });
};

// Profile utilisateur (protégé)
app.get("/api/profile", authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: "Profile utilisateur",
        user: req.user
    });
});

// Route racine
app.get("/", (req, res) => {
    res.json({
        message: "API Musée d'Art Virtuel",
        version: "1.0.0",
        database: "SQLite",
        endpoints: {
            auth: {
                register: "POST /api/auth/register",
                login: "POST /api/auth/login",
                profile: "GET /api/profile (protégé)"
            },
            artworks: {
                list: "GET /api/artworks",
                detail: "GET /api/artworks/:id"
            }
        }
    });
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🎨 Serveur Musée d'Art sur http://localhost:${PORT}`);
});
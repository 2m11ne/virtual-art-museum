const API_URL = "http://localhost:5000/api";

// ========== INSCRIPTION ==========
document.getElementById('register-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    const messageEl = document.getElementById('register-message');
    
    // Validation
    if (password !== confirmPassword) {
        showMessage(messageEl, "Les mots de passe ne correspondent pas!", "error");
        return;
    }
    
    if (password.length < 6) {
        showMessage(messageEl, "Le mot de passe doit faire au moins 6 caractères", "error");
        return;
    }
    
    try {
        showMessage(messageEl, "Création du compte en cours...", "info");
        
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(messageEl, "✅ Compte créé avec succès! Redirection...", "success");
            
            // Stocker le token et rediriger
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            
            // Redirection après 2 secondes
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            
        } else {
            showMessage(messageEl, `❌ ${data.error || "Erreur lors de l'inscription"}`, "error");
        }
        
    } catch (error) {
        showMessage(messageEl, "❌ Erreur de connexion au serveur", "error");
        console.error("Erreur inscription:", error);
    }
});

// ========== CONNEXION ==========
document.getElementById('login-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const messageEl = document.getElementById('login-message');
    
    try {
        showMessage(messageEl, "Connexion en cours...", "info");
        
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(messageEl, "✅ Connexion réussie! Redirection...", "success");
            
            // Stocker le token et informations utilisateur
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirection après 1.5 secondes
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            
        } else {
            showMessage(messageEl, `❌ ${data.error || "Email ou mot de passe incorrect"}`, "error");
        }
        
    } catch (error) {
        showMessage(messageEl, "❌ Erreur de connexion au serveur", "error");
        console.error("Erreur connexion:", error);
    }
});

// ========== GESTION DE LA SESSION ==========
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const authButtons = document.getElementById('auth-buttons');
    
    if (authButtons) {
        if (token && user) {
            try {
                const userData = JSON.parse(user);
                authButtons.innerHTML = `
                    <span style="margin-right: 15px;">👤 ${userData.username}</span>
                    <button onclick="logout()" class="btn-logout">Déconnexion</button>
                `;
            } catch (e) {
                authButtons.innerHTML = `
                    <a href="login.html">Connexion</a>
                    <a href="register.html">Inscription</a>
                `;
            }
        } else {
            authButtons.innerHTML = `
                <a href="login.html">Connexion</a>
                <a href="register.html">Inscription</a>
            `;
        }
    }
}

// ========== DÉCONNEXION ==========
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateAuthUI();
    window.location.href = 'index.html';
}

// ========== FONCTIONS UTILITAIRES ==========
function showMessage(element, text, type) {
    if (!element) return;
    
    element.textContent = text;
    element.className = `message message-${type}`;
    element.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

// ========== AU CHARGEMENT ==========
document.addEventListener('DOMContentLoaded', function() {
    updateAuthUI();
    
    // Vérifier si on est sur une page protégée
    const token = localStorage.getItem('token');
    const protectedPages = ['profile.html']; // Ajoute tes pages protégées
    
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage) && !token) {
        window.location.href = 'login.html';
    }
});

// ========== VÉRIFIER LA CONNEXION (pour autres pages) ==========
function isAuthenticated() {
    return !!localStorage.getItem('token');
}

function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}
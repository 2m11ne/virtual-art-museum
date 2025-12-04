// Gestion des favoris
function loadFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    // Afficher les œuvres favorites
    const favoritesSection = document.getElementById('favorites-section');
    if (favoritesSection && favorites.length > 0) {
        favoritesSection.innerHTML = `
            <h3>Vos œuvres favorites (${favorites.length})</h3>
            <div class="favorites-grid">
                ${favorites.map(id => `
                    <div class="favorite-item">
                        <p>Œuvre #${id}</p>
                        <button onclick="removeFavorite(${id})">❌ Retirer</button>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// Retirer des favoris
function removeFavorite(id) {
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    favorites = favorites.filter(favId => favId !== id);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    alert('Retiré des favoris');
    loadFavorites();
}

// Au chargement
document.addEventListener('DOMContentLoaded', loadFavorites);
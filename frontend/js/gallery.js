document.addEventListener('DOMContentLoaded', function() {
    console.log('Galerie Musée d\'Art chargée');
    
    // Charger les œuvres depuis l'API
    loadArtworks();
    
    // Lightbox
    const lightbox = document.getElementById('lightbox');
    const closeBtn = document.querySelector('.close');
    const lightboxImg = document.getElementById('lightbox-img');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            lightbox.style.display = 'none';
        });
    }
    
    // Filtres
    const artistFilter = document.getElementById('artist-filter');
    const centuryFilter = document.getElementById('century-filter');
    
    if (artistFilter) {
        artistFilter.addEventListener('change', filterArtworks);
    }
    
    if (centuryFilter) {
        centuryFilter.addEventListener('change', filterArtworks);
    }
});

// Charger les œuvres
async function loadArtworks() {
    try {
        const response = await fetch('http://localhost:5000/api/artworks');
        const artworks = await response.json();
        
        displayArtworks(artworks);
        populateFilters(artworks);
    } catch (error) {
        console.error('Erreur chargement œuvres:', error);
        // Données de secours
        const fallbackArtworks = [
            { id: 1, title: "La Joconde", artist: "Léonard de Vinci", century: "XVIe", image_url: "https://via.placeholder.com/300x200" },
            { id: 2, title: "La Nuit étoilée", artist: "Vincent van Gogh", century: "XIXe", image_url: "https://via.placeholder.com/300x200" }
        ];
        displayArtworks(fallbackArtworks);
    }
}

// Afficher les œuvres
function displayArtworks(artworks) {
    const galleryGrid = document.getElementById('artworks-grid');
    if (!galleryGrid) return;
    
    galleryGrid.innerHTML = '';
    
    artworks.forEach(art => {
        const card = document.createElement('div');
        card.className = 'artwork-card';
        card.dataset.id = art.id;
        card.dataset.artist = art.artist;
        card.dataset.century = art.century;
        
        card.innerHTML = `
            <img src="${art.image_url || 'https://via.placeholder.com/300x200'}" 
                 alt="${art.title}" 
                 class="artwork-image">
            <div class="artwork-info">
                <h3 class="artwork-title">${art.title}</h3>
                <p class="artwork-artist">👨‍🎨 ${art.artist}</p>
                <p class="artwork-century">🕰️ ${art.century || 'Non spécifié'}</p>
                ${art.description ? `<p class="artwork-description">${art.description}</p>` : ''}
            </div>
            <div class="artwork-actions">
                <button class="btn-favorite" onclick="toggleFavorite(${art.id})">❤️ Favoris</button>
                <button class="btn-view" onclick="viewArtwork(${art.id})">👁️ Voir détail</button>
            </div>
        `;
        
        galleryGrid.appendChild(card);
    });
}

// Remplir les filtres
function populateFilters(artworks) {
    const artistFilter = document.getElementById('artist-filter');
    const centuryFilter = document.getElementById('century-filter');
    
    if (artistFilter) {
        const artists = [...new Set(artworks.map(a => a.artist))];
        artists.forEach(artist => {
            const option = document.createElement('option');
            option.value = artist;
            option.textContent = artist;
            artistFilter.appendChild(option);
        });
    }
    
    if (centuryFilter) {
        const centuries = [...new Set(artworks.map(a => a.century).filter(c => c))];
        centuries.forEach(century => {
            const option = document.createElement('option');
            option.value = century;
            option.textContent = century;
            centuryFilter.appendChild(option);
        });
    }
}

// Filtrer les œuvres
function filterArtworks() {
    const artistValue = document.getElementById('artist-filter').value;
    const centuryValue = document.getElementById('century-filter').value;
    
    const cards = document.querySelectorAll('.artwork-card');
    
    cards.forEach(card => {
        const showArtist = !artistValue || card.dataset.artist === artistValue;
        const showCentury = !centuryValue || card.dataset.century === centuryValue;
        
        card.style.display = (showArtist && showCentury) ? 'block' : 'none';
    });
}

// Voir détail œuvre
async function viewArtwork(id) {
    try {
        const response = await fetch(`http://localhost:5000/api/artworks/${id}`);
        const artwork = await response.json();
        
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightbox-img');
        const lightboxInfo = document.getElementById('lightbox-info');
        
        if (lightboxImg) lightboxImg.src = artwork.image_url;
        if (lightboxInfo) {
            lightboxInfo.innerHTML = `
                <h3>${artwork.title}</h3>
                <p><strong>Artiste:</strong> ${artwork.artist}</p>
                <p><strong>Siècle:</strong> ${artwork.century || 'Non spécifié'}</p>
                <p><strong>Description:</strong> ${artwork.description || 'Aucune description'}</p>
            `;
        }
        if (lightbox) lightbox.style.display = 'block';
    } catch (error) {
        alert('Erreur chargement détail œuvre');
    }
}

// Favoris
function toggleFavorite(id) {
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    if (favorites.includes(id)) {
        favorites = favorites.filter(favId => favId !== id);
        alert('Retiré des favoris');
    } else {
        favorites.push(id);
        alert('Ajouté aux favoris');
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
}
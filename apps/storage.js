// Storage utility functions for managing favorites

async function loadFavorites() {
    try {
        const result = await window.storage.get('weather_favorites');
        return result ? JSON.parse(result.value) : getDefaultFavorites();
    } catch {
        return getDefaultFavorites();
    }
}

async function saveFavorites(favorites) {
    try {
        await window.storage.set('weather_favorites', JSON.stringify(favorites));
        return true;
    } catch (e) {
        console.error('Error saving favorites:', e);
        return false;
    }
}

async function addFavorite(city) {
    const favorites = await loadFavorites();
    if (!favorites.includes(city)) {
        favorites.push(city);
        await saveFavorites(favorites);
    }
    return favorites;
}

async function removeFavorite(city) {
    const favorites = await loadFavorites();
    const filtered = favorites.filter(fav => fav !== city);
    await saveFavorites(filtered);
    return filtered;
}

function getDefaultFavorites() {
    return ['Stockton', 'San Francisco', 'New York', 'Chicago', 'Los Angeles'];
}
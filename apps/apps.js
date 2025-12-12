// --- Configuration ---
// IMPORTANT: Replace 'YOUR_API_KEY' with your actual OpenWeatherMap API key
const API_KEY = 'bcec763aa1fd9463b3999bb9d5e8000b'; 
const BASE_URL = 'https://api.openweathermap.org/data/2.5/';

// Function to check which page we are on
const isIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
const isForecastPage = window.location.pathname.includes('stockton5day.html');

// =========================================================
// 1. STORAGE UTILITIES (Consolidated from storage.js)
// =========================================================

const storage = {
    // Default favorites for initial setup
    getDefaultFavorites: () => ['Stockton', 'San Francisco', 'New York', 'Chicago', 'Los Angeles'],

    // Retrieves favorites from localStorage
    getFavorites: () => {
        try {
            const favoritesJSON = localStorage.getItem('weather_favorites');
            return favoritesJSON ? JSON.parse(favoritesJSON) : storage.getDefaultFavorites();
        } catch (e) {
            console.error('Error loading favorites from localStorage:', e);
            return storage.getDefaultFavorites();
        }
    },

    // Saves the array of favorites to localStorage
    saveFavorites: (favorites) => {
        try {
            localStorage.setItem('weather_favorites', JSON.stringify(favorites));
        } catch (e) {
            console.error('Error saving favorites to localStorage:', e);
        }
    },

    // Checks if a city is currently a favorite
    isFavorite: (city) => {
        const favorites = storage.getFavorites();
        return favorites.includes(city);
    },

    // Adds or removes a city from favorites
    toggleFavorite: (city) => {
        const favorites = storage.getFavorites();
        const cityIndex = favorites.indexOf(city);

        if (cityIndex > -1) {
            // City is a favorite, remove it
            favorites.splice(cityIndex, 1);
        } else {
            // City is not a favorite, add it
            favorites.push(city);
        }
        storage.saveFavorites(favorites);
    }
};

// Expose the toggleFavorite globally for the inline onclick handler in displayCurrentWeather
window.toggleFavorite = storage.toggleFavorite; 

// =========================================================
// 2. GLOBAL HELPERS & API FETCH
// =========================================================

// Helper function to format wind direction
function getWindDirection(deg) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
}

// Helper function to convert Kelvin to Fahrenheit
function kelvinToFahrenheit(k) {
    return Math.round((k - 273.15) * 9/5 + 32);
}

// Helper function to display errors
function displayError(message, elementId = 'errorMessage') {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    // For the index page, hide all weather info on error
    if (isIndexPage) {
        document.getElementById('weatherCard')?.classList.add('hidden');
        document.getElementById('sidebarPanel')?.classList.add('hidden');
    }
}

function clearError(elementId = 'errorMessage') {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
    // For the index page, show all weather info when clearing error
    if (isIndexPage) {
        document.getElementById('weatherCard')?.classList.remove('hidden');
        document.getElementById('sidebarPanel')?.classList.remove('hidden');
    }
}

// API fetch for 5-day forecast (used by both pages)
async function fetchForecast(city) {
    try {
        const response = await fetch(`${BASE_URL}forecast?q=${city}&appid=${API_KEY}`);
        if (!response.ok) throw new Error('City not found or API issue.');
        return await response.json();
    } catch (error) {
        console.error('Forecast fetch failed:', error);
        displayError('Could not retrieve 5-day forecast data.', 'errorMessage');
        return null;
    }
}

// =========================================================
// 3. INDEX PAGE LOGIC
// =========================================================
if (isIndexPage) {
    // DOM Elements for index page
    const forecastBtn = document.getElementById('forecastBtn');
    const backBtn = document.getElementById('backBtn');
    const weatherCard = document.getElementById('weatherCard');
    const locationDisplay = document.getElementById('locationDisplay');
    const weatherInfo = document.getElementById('weatherInfo');
    const currentWeatherLink = document.getElementById('currentWeatherLink');
    const forecastSection = document.getElementById('forecastSection');
    const forecastGrid = document.getElementById('forecastGrid');
    const locationsList = document.getElementById('locationsList');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    let currentCity = 'Stockton'; // Default city

    // --- Event Listeners ---
    if (forecastBtn) forecastBtn.addEventListener('click', handleForecastClick);
    if (backBtn) backBtn.addEventListener('click', hideForecast);
    if (searchBtn) searchBtn.addEventListener('click', handleSearch);
    if (searchInput) searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch(e);
    });

    // Helper to generate an individual forecast card for the index page
    function createIndexForecastCard(data) {
        const tempMax = kelvinToFahrenheit(data.main.temp_max);
        const tempMin = kelvinToFahrenheit(data.main.temp_min);
        const date = new Date(data.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        const iconCode = data.weather[0].icon;
        const description = data.weather[0].description;
        
        return `
            <div class="forecast-card">
                <div class="forecast-day">${day}</div>
                <div class="forecast-icon"><img src="https://openweathermap.org/img/wn/${iconCode}.png" alt="${description}" /></div>
                <div class="forecast-temp">${tempMax}° / ${tempMin}°</div>
                <div class="forecast-desc">${description}</div>
            </div>
        `;
    }

    // Display 5-day forecast on the index page
    async function displayForecastOnIndex(city) {
        const data = await fetchForecast(city);
        if (!data || !forecastGrid) return;

        const forecastData = data.list;
        const dailyForecasts = [];
        const seenDays = new Set();
        const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });

        // Filter for one entry per day, favoring the 12:00:00 entry for the next 5 days
        for (const item of forecastData) {
            const date = new Date(item.dt * 1000);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            // Skip today and only take the 12:00:00 entry for the next 5 days
            if (day !== today && item.dt_txt.includes('12:00:00') && !seenDays.has(day)) {
                dailyForecasts.push(item);
                seenDays.add(day);
                if (dailyForecasts.length >= 5) break;
            }
        }

        if (dailyForecasts.length > 0) {
            forecastGrid.innerHTML = dailyForecasts.map(createIndexForecastCard).join('');
            document.getElementById('forecastTitle').textContent = `${city} 5-Day Forecast`;
        } else {
            forecastGrid.innerHTML = '<p style="color:white; text-align:center;">Forecast data not available.</p>';
        }
        showForecast();
    }

    function handleForecastClick() {
        if (currentCity) {
            displayForecastOnIndex(currentCity);
        } else {
            displayError('Please load a city first to view the forecast.');
        }
    }

    function showForecast() {
        if (weatherCard) weatherCard.style.display = 'none';
        if (forecastSection) forecastSection.style.display = 'block';
    }

    function hideForecast() {
        if (weatherCard) weatherCard.style.display = 'flex';
        if (forecastSection) forecastSection.style.display = 'none';
    }

    // API fetch for current weather
    async function fetchCurrentWeather(city) {
        try {
            const response = await fetch(`${BASE_URL}weather?q=${city}&appid=${API_KEY}`);
            if (!response.ok) throw new Error('City not found or API issue.');
            return await response.json();
        } catch (error) {
            console.error('Weather fetch failed:', error);
            displayError(`Weather data for "${city}" not found. Please try again.`, 'errorMessage');
            return null;
        }
    }

    // Display current weather
    function displayCurrentWeather(data) {
        if (!data) return;

        const tempF = kelvinToFahrenheit(data.main.temp);
        const tempMaxF = kelvinToFahrenheit(data.main.temp_max);
        const tempMinF = kelvinToFahrenheit(data.main.temp_min);
        const windDir = getWindDirection(data.wind.deg);
        const iconCode = data.weather[0].icon;
        const isFav = storage.isFavorite(data.name);

        if (locationDisplay) locationDisplay.innerHTML = `
            ${data.name}, ${data.sys.country}
            <button class="favorite-btn" onclick="toggleFavorite('${data.name}')">
                <i class="fas fa-star" id="favoriteIcon" style="color: ${isFav ? 'yellow' : 'gray'};"></i>
            </button>
        `;

        if (weatherInfo) weatherInfo.innerHTML = `
            <img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="${data.weather[0].description}" class="weather-icon-large">
            <div class="condition">${data.weather[0].description}</div>
            <div class="temp-display">${tempF}°F</div>
            <div class="high-low">High: ${tempMaxF}°F / Low: ${tempMinF}°F</div>
            <div class="humidity">Humidity: ${data.main.humidity}%</div>
            <div class="wind">Wind: ${data.wind.speed} mph ${windDir}</div>
        `;
        
        // Update the hidden link's data-city for easy forecast access
        if (currentWeatherLink) {
            currentWeatherLink.dataset.city = data.name;
            currentWeatherLink.href = `./pages/stockton5day.html?city=${data.name}`;
        }
    }

    // Main function to load weather for a city
    async function loadWeather(city) {
        clearError('errorMessage');
        const data = await fetchCurrentWeather(city);
        if (data) {
            currentCity = data.name;
            displayCurrentWeather(data);
            hideForecast();
        }
        updateFavoritesList();
    }

    // Function to handle search input
    function handleSearch(e) {
        e.preventDefault();
        const city = searchInput.value.trim();
        if (city) {
            loadWeather(city);
            searchInput.value = ''; // Clear search field
        } else {
            displayError('Please enter a city name to search.', 'errorMessage');
        }
    }

    // Function to dynamically update the favorites list in the sidebar
    function updateFavoritesList() {
        const favorites = storage.getFavorites();
        if (locationsList) {
            locationsList.innerHTML = '';
            favorites.forEach(city => {
                const item = document.createElement('a');
                item.href = '#'; 
                item.className = 'location-item';
                item.dataset.city = city;
                item.innerHTML = `<div class="location-name">${city}</div>`;
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    loadWeather(city);
                });
                locationsList.appendChild(item);
            });
        }
    }
    
    // Initialize index page
    async function initIndex() {
        // Load default city (Stockton) or the first favorite if available
        const firstFavorite = storage.getFavorites()[0];
        await loadWeather(firstFavorite || 'Stockton'); 
    }

    initIndex();
}

// =========================================================
// 4. FORECAST PAGE LOGIC
// =========================================================
if (isForecastPage) {
    // 1. DOM Elements (Grouped)
    const DOMElements = {
        returnToIndexBtn: document.getElementById('returnToIndexBtn'),
        forecastTitle: document.getElementById('forecastMainTitle'),
        forecastGrid: document.getElementById('dynamicForecastCards'),
        locationsList: document.getElementById('locationsList'),
        prevBtn: document.getElementById('prevBtn'),
        nextBtn: document.getElementById('nextBtn'),
        pageIndicator: document.getElementById('pageIndicator'),
        favoritesTitle: document.querySelector('.favorites-section .favorites-title')
    };
    
    // Pagination state
    const itemsPerPage = 6;
    let currentPage = 1;
    let favorites = [];

    // Utility function to get city from URL
    function getCityFromUrl() {
        const params = new URLSearchParams(window.location.search);
        // Default to 'Stockton' if no city is passed in the URL
        return params.get('city') || 'Stockton'; 
    }

    // Helper to generate an individual forecast card for the forecast page
    function createForecastPageCard(data) {
        const tempMax = kelvinToFahrenheit(data.main.temp_max);
        const tempMin = kelvinToFahrenheit(data.main.temp_min);
        const date = new Date(data.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        const iconCode = data.weather[0].icon;
        const description = data.weather[0].description;
        
        // Determine color for Font Awesome icon based on OpenWeatherMap icon code
        const iconStyle = {
            '01d': 'orange', '01n': 'white', 
            '02d': 'rgb(247, 215, 114)', '02n': 'rgb(247, 215, 114)', 
            '03d': '#6b7280', '03n': '#6b7280', 
            '04d': '#6b7280', '04n': '#6b7280', 
            '09d': 'rgb(109, 137, 187)', '09n': 'rgb(109, 137, 187)', 
            '10d': 'rgb(109, 137, 187)', '10n': 'rgb(109, 137, 187)', 
            '11d': 'rgb(255, 230, 0)', '11n': 'rgb(255, 230, 0)', 
            '13d': 'white', '13n': 'white', 
            '50d': '#6b7280', '50n': '#6b7280' 
        }[iconCode] || '#6b7280';
        
        // Mapping OpenWeatherMap icons to Font Awesome classes
        const faIcon = {
            '01d': 'fa-sun', '01n': 'fa-moon',
            '02d': 'fa-cloud-sun', '02n': 'fa-cloud-moon',
            '03d': 'fa-cloud', '03n': 'fa-cloud',
            '04d': 'fa-cloud', '04n': 'fa-cloud',
            '09d': 'fa-cloud-showers-heavy', '09n': 'fa-cloud-showers-heavy',
            '10d': 'fa-cloud-showers-heavy', '10n': 'fa-cloud-showers-heavy',
            '11d': 'fa-cloud-bolt', '11n': 'fa-cloud-bolt',
            '13d': 'fa-snowflake', '13n': 'fa-snowflake',
            '50d': 'fa-smog', '50n': 'fa-smog'
        }[iconCode] || 'fa-question-circle';

        return `
            <div class="forecast-card" data-day="${day}">
                <div class="card-icon-section">
                    <i class="fas ${faIcon} fa-5x" style="color:${iconStyle};"></i>
                </div>
                <div class="card-info-section">
                    <div class="day-label">
                        <span class="calendar-icon">📅</span>
                        <span class="forecast-day-label">${day}</span>
                    </div>
                    <div class="condition-row">
                        <span class="condition-icon"><img src="https://openweathermap.org/img/wn/${iconCode}.png" alt="${description}" style="width:24px; height:24px;"/></span>
                        <span class="forecast-desc">${description}</span>
                    </div>
                    <div class="temp-row">
                        <span class="temp-icon">🌡️</span>
                        <span class="forecast-temp">${tempMax}° / ${tempMin}°</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Function to render the main 5-day forecast
    async function renderForecast(city) {
        clearError('errorMessage');
        const data = await fetchForecast(city);
        if (!data || !DOMElements.forecastGrid) return;

        const forecastData = data.list;
        const dailyForecasts = [];
        const seenDays = new Set();
        
        // Filter for one entry per day, prioritizing the 12:00:00 entry
        for (const item of forecastData) {
            const date = new Date(item.dt * 1000);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            // Only take the 12:00:00 entry for a representative daily forecast
            if (item.dt_txt.includes('12:00:00') && !seenDays.has(day) && dailyForecasts.length < 5) {
                dailyForecasts.push(item);
                seenDays.add(day);
            }
        }
        
        if (DOMElements.forecastTitle) {
            DOMElements.forecastTitle.textContent = `${data.city.name}, ${data.city.country} 5-day forecast`;
        }

        if (dailyForecasts.length > 0) {
            DOMElements.forecastGrid.innerHTML = dailyForecasts.map(createForecastPageCard).join('');
        } else {
            DOMElements.forecastGrid.innerHTML = '<p style="color:white; text-align:center;">Forecast data not available.</p>';
        }
    }

    // --- Pagination and Favorites ---

    function renderFavoriteItems() {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = favorites.slice(start, end);
        
        if (DOMElements.locationsList) {
            DOMElements.locationsList.innerHTML = '';
            pageItems.forEach(city => {
                const item = document.createElement('a');
                // Link to the same forecast page, passing the new city in the URL
                item.href = `?city=${city}`; 
                item.className = 'favorite-item'; // Use the correct class name for styling
                item.dataset.city = city;
                item.textContent = city;
                item.addEventListener('click', (e) => {
                    // Prevent default navigation to allow URL update and page refresh
                    e.preventDefault();
                    window.location.href = `stockton5day.html?city=${city}`; 
                });
                DOMElements.locationsList.appendChild(item);
            });
        }
        updatePaginationControls();
    }

    function updatePaginationControls() {
        const totalPages = Math.ceil(favorites.length / itemsPerPage);
        
        if (DOMElements.pageIndicator) {
            DOMElements.pageIndicator.textContent = `${currentPage} / ${totalPages > 0 ? totalPages : 1}`;
        }
        
        if (DOMElements.prevBtn) DOMElements.prevBtn.disabled = currentPage === 1;
        if (DOMElements.nextBtn) DOMElements.nextBtn.disabled = currentPage === totalPages || totalPages === 0;

        // Hide pagination if there's only one page or no favorites
        const paginationContainer = document.querySelector('.pagination');
        if (paginationContainer) {
            paginationContainer.style.display = totalPages > 1 ? 'flex' : 'none';
        }
        
        if (DOMElements.favoritesTitle) {
             DOMElements.favoritesTitle.textContent = favorites.length > 0 ? 'Favorites' : 'No Favorites Added';
        }
    }

    function goToNextPage() {
        const totalPages = Math.ceil(favorites.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderFavoriteItems();
        }
    }

    function goToPrevPage() {
        if (currentPage > 1) {
            currentPage--;
            renderFavoriteItems();
        }
    }

    // --- Event Listeners ---

    if (DOMElements.returnToIndexBtn) {
        // Navigates back to the main index page (assuming correct file path)
        DOMElements.returnToIndexBtn.addEventListener('click', () => {
            // Adjust path based on your project structure (e.g., ../index.html)
            window.location.href = '../index.html'; 
        });
    }

    if (DOMElements.prevBtn) DOMElements.prevBtn.addEventListener('click', goToPrevPage);
    if (DOMElements.nextBtn) DOMElements.nextBtn.addEventListener('click', goToNextPage);

    // --- Initialization ---

    function initForecastPage() {
        // 1. Get city from URL (or default)
        const city = getCityFromUrl();
        
        // 2. Render the main forecast for that city
        renderForecast(city);
        
        // 3. Load and render paginated favorites list
        favorites = storage.getFavorites();
        renderFavoriteItems();
    }

    initForecastPage();
}
// --- Configuration ---
// IMPORTANT: Replace 'YOUR_API_KEY' with your actual OpenWeatherMap API key
const API_KEY = 'bcec763aa1fd9463b3999bb9d5e8000b'; 
const BASE_URL = 'https://api.openweathermap.org/data/2.5/';

// Function to check which page we are on
const isIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
const isForecastPage = window.location.pathname.includes('stockton5day.html');

// Helper function to convert Kelvin to Fahrenheit (This was missing its definition in the snippet)
function kelvinToFahrenheit(k) {
    return Math.round((k - 273.15) * 9/5 + 32);
}

// =========================================================
// 1. STORAGE UTILITIES (Replacing storage.js)
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
        
        // Use storage.isFavorite directly in the template literal
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

        // ✅ Base icon
        let iconFile = iconMap[main] || "overcast.png";

        // ✅ Special case: Partly Cloudy
        if (desc.toLowerCase().includes("partly")) {
            iconFile = "partlycloudy.png";
        }

        const high = Math.round(entry.main.temp_max);
        const low = Math.round(entry.main.temp_min);

        const card = document.createElement("div");
        card.className = "forecast-card";

        card.innerHTML = `
            <img src="/assets/${iconFile}" class="forecast-icon">

            <div class="forecast-bottom">
                <h3>${day}</h3>
                <p>${desc.charAt(0).toUpperCase() + desc.slice(1)}</p>
                <p>🌡️ ${high}° / ${low}°</p>
            </div>
        `;

        container.appendChild(card);
    });
}

<<<<<<< HEAD
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
    }
}
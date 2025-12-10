// Weather App Main JavaScript - Central File

const API_KEY = '64f60853740a1ee3ba20d0fb595c97d5';
const API_BASE = 'https://api.openweathermap.org/data/2.5';

// Weather icon mapping for emojis
const weatherIcons = {
    '01d': '☀️', '01n': '🌙',
    '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️',
    '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️'
};

// Weather icon URLs for forecast page
const weatherIconUrls = {
    'Clear': 'https://cdn-icons-png.flaticon.com/512/869/869869.png',
    'Clouds': 'https://cdn-icons-png.flaticon.com/512/414/414927.png',
    'Rain': 'https://cdn-icons-png.flaticon.com/512/4005/4005817.png',
    'Drizzle': 'https://cdn-icons-png.flaticon.com/512/3222/3222808.png',
    'Thunderstorm': 'https://cdn-icons-png.flaticon.com/512/1146/1146860.png',
    'Snow': 'https://cdn-icons-png.flaticon.com/512/642/642102.png',
    'Mist': 'https://cdn-icons-png.flaticon.com/512/4005/4005901.png',
    'Fog': 'https://cdn-icons-png.flaticon.com/512/4005/4005901.png',
    'Partly Cloudy': 'https://cdn-icons-png.flaticon.com/512/1163/1163661.png'
};

// Weather emoji icons for forecast page
const weatherEmojis = {
    'Clear': '☀️',
    'Clouds': '☁️',
    'Rain': '🌧️',
    'Drizzle': '🌦️',
    'Thunderstorm': '⛈️',
    'Snow': '❄️',
    'Mist': '🌫️',
    'Fog': '🌫️',
    'Partly Cloudy': '⛅'
};

// Detect current page
const isIndexPage = document.body.classList.contains('index-page');
const isForecastPage = document.body.classList.contains('forecast-page');

// ===================================
// INDEX PAGE FUNCTIONALITY
// ===================================
if (isIndexPage) {
    // DOM Elements for index page
    const cityInput = document.getElementById('cityInput');
    const forecastBtn = document.getElementById('forecastBtn');
    const backBtn = document.getElementById('backBtn');
    const locationDisplay = document.getElementById('locationDisplay');
    const weatherInfo = document.getElementById('weatherInfo');
    const forecastSection = document.getElementById('forecastSection');
    const forecastGrid = document.getElementById('forecastGrid');
    const locationsList = document.getElementById('locationsList');
    const errorMessage = document.getElementById('errorMessage');

    // Current weather data
    let currentWeatherData = null;

    // Event Listeners
    forecastBtn.addEventListener('click', handleForecastClick);
    backBtn.addEventListener('click', hideForecast);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Setup location items
    document.querySelectorAll('.location-item').forEach(item => {
        item.addEventListener('click', () => {
            const city = item.dataset.city;
            loadWeather(city);
        });
    });

    // Load weather for a city
    async function loadWeather(city) {
        errorMessage.innerHTML = '';
        
        try {
            const response = await fetch(
                `${API_BASE}/weather?q=${city}&appid=${API_KEY}&units=imperial`
            );
            
            if (!response.ok) throw new Error('City not found');
            
            const data = await response.json();
            currentWeatherData = data;
            displayCurrentWeather(data);
            
        } catch (error) {
            errorMessage.innerHTML = `<div class="error">❌ ${error.message}. Please try another city.</div>`;
        }
    }

    // Display current weather on main panel
    function displayCurrentWeather(data) {
        const temp = Math.round(data.main.temp);
        const tempMin = Math.round(data.main.temp_min);
        const humidity = data.main.humidity;
        const windSpeed = Math.round(data.wind.speed);
        const windDir = getWindDirection(data.wind.deg);
        
        locationDisplay.textContent = `${data.name}, ${data.sys.country === 'US' ? data.name.includes(',') ? data.sys.country : 'CA, US' : data.sys.country}`;
        
        weatherInfo.innerHTML = `
            <div class="condition">${data.weather[0].main}/${data.weather[0].description}</div>
            <div class="temp-display">${temp}°/${tempMin}°</div>
            <div class="humidity">Humidity ${humidity}%</div>
            <div class="wind">Wind ${windSpeed} mph ${windDir}</div>
        `;
    }

    // Get wind direction from degrees
    function getWindDirection(deg) {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round(deg / 45) % 8;
        return directions[index];
    }

    // Handle search
    async function handleSearch() {
        const city = cityInput.value.trim();
        if (city) {
            await loadWeather(city);
            cityInput.value = '';
        }
    }

    // Handle forecast button click
    async function handleForecastClick() {
        if (!currentWeatherData) return;
        
        const city = currentWeatherData.name;
        
        try {
            const response = await fetch(
                `${API_BASE}/forecast?q=${city}&appid=${API_KEY}&units=imperial`
            );
            
            if (!response.ok) throw new Error('Unable to fetch forecast');
            
            const data = await response.json();
            displayForecastOnIndex(data);
            showForecast();
            
        } catch (error) {
            errorMessage.innerHTML = `<div class="error">❌ ${error.message}</div>`;
        }
    }

    // Display 5-day forecast on index page
    function displayForecastOnIndex(data) {
        const dailyForecasts = [];
        const processedDays = new Set();
        
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            if (!processedDays.has(day) && dailyForecasts.length < 5) {
                processedDays.add(day);
                dailyForecasts.push(item);
            }
        });
        
        forecastGrid.innerHTML = dailyForecasts.map(item => {
            const date = new Date(item.dt * 1000);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            const icon = weatherIcons[item.weather[0].icon] || '🌤️';
            const temp = Math.round(item.main.temp);
            const tempMin = Math.round(item.main.temp_min);
            
            return `
                <div class="forecast-card">
                    <div class="forecast-day">${day}</div>
                    <div class="forecast-icon">${icon}</div>
                    <div class="forecast-temp">${temp}° / ${tempMin}°</div>
                    <div class="forecast-desc">${item.weather[0].description}</div>
                </div>
            `;
        }).join('');
    }

    // Show forecast section
    function showForecast() {
        forecastSection.style.display = 'block';
        forecastSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Hide forecast section
    function hideForecast() {
        forecastSection.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Initialize index page
    async function initIndex() {
        await loadWeather('Stockton');
    }

    initIndex();
}

// ===================================
// FORECAST PAGE FUNCTIONALITY
// ===================================
if (isForecastPage) {
    // DOM Elements for forecast page
    const searchInput = document.getElementById('searchInput');
    const forecastBtn = document.getElementById('forecastBtn');
    const forecastTitle = document.getElementById('forecastTitle');
    const forecastCards = document.getElementById('forecastCards');
    const favoritesList = document.getElementById('favoritesList');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageIndicator = document.getElementById('pageIndicator');

    // State
    let currentCity = 'Stockton';
    let currentPage = 1;
    let totalPages = 1;

    // Event Listeners
    forecastBtn.addEventListener('click', handleForecastSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleForecastSearch();
    });

    // Load forecast for a city
    async function loadForecast(city) {
        try {
            const response = await fetch(
                `${API_BASE}/forecast?q=${city}&appid=${API_KEY}&units=imperial`
            );
            
            if (!response.ok) throw new Error('City not found');
            
            const data = await response.json();
            currentCity = data.city.name;
            displayForecast(data);
            
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }

    // Display forecast data
    function displayForecast(data) {
        // Update title
        forecastTitle.textContent = `${data.city.name}, ${data.city.country === 'US' ? 'CA' : data.city.country} 5 day forecast`;
        
        // Get one forecast per day
        const dailyForecasts = [];
        const processedDays = new Set();
        
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toDateString();
            
            if (!processedDays.has(dayKey) && dailyForecasts.length < 5) {
                processedDays.add(dayKey);
                dailyForecasts.push(item);
            }
        });
        
        // Generate forecast cards
        forecastCards.innerHTML = dailyForecasts.map(item => {
            const date = new Date(item.dt * 1000);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const weatherMain = item.weather[0].main;
            const description = item.weather[0].description;
            const temp = Math.round(item.main.temp);
            const tempMin = Math.round(item.main.temp_min);
            
            // Determine icon
            let iconUrl = weatherIconUrls[weatherMain] || weatherIconUrls['Clouds'];
            let emoji = weatherEmojis[weatherMain] || '🌤️';
            
            // Special case for partly cloudy
            if (description.includes('few clouds') || description.includes('scattered')) {
                iconUrl = weatherIconUrls['Partly Cloudy'];
                emoji = '⛅';
            }
            
            return `
                <div class="forecast-card">
                    <div class="card-icon-section">
                        <img src="${iconUrl}" alt="${weatherMain}" class="weather-icon-large">
                    </div>
                    <div class="card-info-section">
                        <div class="day-label">
                            <span class="calendar-icon">📅</span>
                            <span>${dayName}</span>
                        </div>
                        <div class="condition-row">
                            <span class="condition-icon">${emoji}</span>
                            <span>${description.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                        </div>
                        <div class="temp-row">
                            <span class="temp-icon">🌡️</span>
                            <span>${temp}° / ${tempMin}°</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Handle search
    async function handleForecastSearch() {
        const city = searchInput.value.trim();
        if (city) {
            await loadForecast(city);
            searchInput.value = '';
        }
    }

    // Display favorites
    async function displayFavorites() {
        const favorites = await loadFavorites();
        totalPages = Math.ceil(favorites.length / 5);
        
        // Calculate start and end indices for current page
        const startIndex = (currentPage - 1) * 5;
        const endIndex = Math.min(startIndex + 5, favorites.length);
        const visibleFavorites = favorites.slice(startIndex, endIndex);
        
        favoritesList.innerHTML = visibleFavorites.map(city => 
            `<div class="favorite-item" data-city="${city}">${city}</div>`
        ).join('');
        
        // Add click events
        document.querySelectorAll('.favorite-item').forEach(item => {
            item.addEventListener('click', () => {
                loadForecast(item.dataset.city);
            });
        });
        
        // Update pagination
        pageIndicator.textContent = `${currentPage} / ${totalPages}`;
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages;
    }

    // Pagination handlers
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayFavorites();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayFavorites();
        }
    });

    // Initialize forecast page
    async function initForecast() {
        await displayFavorites();
        await loadForecast('Stockton');
    }

    initForecast();
}
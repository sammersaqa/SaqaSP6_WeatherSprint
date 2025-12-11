// ===================================
// FORECAST PAGE FUNCTIONALITY
// ===================================
if (isForecastPage) {
    // DOM Elements for forecast page (Updated to use IDs from HTML structure)
    const searchInput = document.getElementById('forecastSearchInput'); // Changed from searchInput
    const returnToIndexBtn = document.getElementById('returnToIndexBtn'); // Changed from forecastBtn
    const forecastTitle = document.getElementById('forecastMainTitle'); // Changed from forecastTitle
    const forecastCards = document.getElementById('dynamicForecastCards'); // Changed from forecastCards
    const favoritesList = document.getElementById('favoritesList'); // Add ID to HTML
    
    // Pagination elements (Check if they exist)
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageIndicator = document.getElementById('pageIndicator');


    // State
    let currentCity = 'Stockton';
    let currentPage = 1;
    let totalPages = 1;

    // Event Listeners
    // Note: Using returnToIndexBtn for navigation, not forecastBtn for search
    if (returnToIndexBtn) {
        returnToIndexBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    // Using searchInput for search
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleForecastSearch();
        });
        // Add a search button handler if you have one, or just rely on 'Enter'
    }

    // Load forecast for a city
    // ... (Keep loadForecast and displayForecast functions as they are) ...

    async function loadForecast(city) {
        // Your existing loadForecast logic...
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

    function displayForecast(data) {
        // Your existing displayForecast logic...
        
        // Update title
        forecastTitle.textContent = `${data.city.name}, ${data.city.country === 'US' ? data.city.country : data.city.country} 5 day forecast`;
        
        // ... (rest of displayForecast function remains the same)
    }

    // Handle search
    async function handleForecastSearch() {
        const city = searchInput.value.trim();
        if (city) {
            await loadForecast(city);
            searchInput.value = '';
        }
    }

    // Display favorites (Added checks for pagination elements)
    async function displayFavorites() {
        if (!favoritesList) return; // Skip if favorites container is missing
        
        // Assuming loadFavorites() is in storage.js and works
        const loadFavorites = async () => {
             // Mock load for demonstration if storage.js is not provided
             return ['San Francisco', 'New York', 'Chicago', 'Los Angeles', 'Miami', 'London', 'Tokyo', 'Sydney'];
        };

        const favorites = await loadFavorites();
        totalPages = Math.ceil(favorites.length / 5);
        
        // Calculate start and end indices for current page
        const startIndex = (currentPage - 1) * 5;
        const endIndex = Math.min(startIndex + 5, favorites.length);
        const visibleFavorites = favorites.slice(startIndex, endIndex);
        
        favoritesList.innerHTML = visibleFavorites.map(city => 
            `<span class="favorite-item" data-city="${city}">${city}</span>` // Use span as per your CSS
        ).join('');
        
        // Add click events
        document.querySelectorAll('.favorite-item').forEach(item => {
            item.addEventListener('click', () => {
                loadForecast(item.dataset.city);
            });
        });
        
        // Update pagination (Only if pagination elements exist)
        if (pageIndicator && prevBtn && nextBtn) {
            pageIndicator.textContent = `${currentPage} / ${totalPages}`;
            prevBtn.disabled = currentPage === 1;
            nextBtn.disabled = currentPage === totalPages;
        }
    }

    // Pagination handlers (Only register if elements exist)
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayFavorites();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                displayFavorites();
            }
        });
    }


    // Initialize forecast page
    async function initForecast() {
        await displayFavorites();
        await loadForecast('Stockton');
    }

    initForecast();
}
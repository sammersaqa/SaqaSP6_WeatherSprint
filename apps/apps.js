async function loadFiveDayForecast(city) {
    const apiKey = "e49c5df5ed882ea60e4603c9123e0d04";
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=imperial&appid=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    // Group forecasts by day
    const daily = {};

    data.list.forEach(entry => {
        const date = new Date(entry.dt * 1000);
        const dayName = date.toLocaleDateString("en-US", { weekday: "long" });

        if (!daily[dayName]) {
            daily[dayName] = entry;
        }
    });

    // Only take the first 5 days
    const days = Object.keys(daily).slice(0, 5);

    // ✅ Only the icons YOU have
    const iconMap = {
        "Clear": "../assets/sunny.jpg",
        "Clouds": "../assets/cloudy-overcast.jpg",
        "Rain": "../assets/sunny.jpg",
        "Drizzle": "../assets/sunny.jpg",
        "Thunderstorm": "../assets/sunny.jpg",
        
    };

    const container = document.getElementById("forecast-cards");
    container.innerHTML = "";

    days.forEach(day => {
        const entry = daily[day];
        const desc = entry.weather[0].description;
        const main = entry.weather[0].main;

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

// ✅ Auto-run when on the 5-day page
if (window.location.pathname.includes("stockton5day.html")) {
    loadFiveDayForecast("Stockton");
}
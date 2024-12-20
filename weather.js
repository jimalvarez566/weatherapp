const apiKey = "9e598161662fa90d10571de2f74fef68";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?";
const searchBox = document.querySelector(".search input");
const searchBtn = document.querySelector(".search button");
const locationBtn = document.getElementById("location-btn");
const saveCityButton = document.getElementById("save-city-button"); // Save button for saving the current city

const unitSwitch = document.getElementById("unit-switch");
const unitLabel = document.getElementById("unit-label");

// Cache for weather data
let cachedWeatherDataMetric = null;
let cachedWeatherDataImperial = null;
let cachedCityName = "";

let unit = "metric"; // Default to Celsius (metric)

// Toggle between Celsius and Fahrenheit
unitSwitch.addEventListener("change", () => {
    unit = unitSwitch.checked ? "imperial" : "metric";
    unitLabel.innerHTML = unit === "imperial" ? "°F" : "°C";
    
    // Update UI with cached data without re-fetching the current weather
    if (unit === "imperial" && cachedWeatherDataImperial) {
        updateUI(cachedWeatherDataImperial);
    } else if (unit === "metric" && cachedWeatherDataMetric) {
        updateUI(cachedWeatherDataMetric);
    }

    // Re-fetch and re-render the forecast for the new unit
    if (cachedWeatherDataMetric) {
        const lat = cachedWeatherDataMetric.coord.lat;
        const lon = cachedWeatherDataMetric.coord.lon;
        fetchAndRenderForecast(lat, lon);
    }
});

// Fetch weather data by city name
async function checkWeather(city) {
    try {
        const metricResponse = await fetch(apiUrl + `q=${city}&units=metric&appid=${apiKey}`);
        const imperialResponse = await fetch(apiUrl + `q=${city}&units=imperial&appid=${apiKey}`);
        
        const metricData = await metricResponse.json();
        const imperialData = await imperialResponse.json();

        // Cache both metric and imperial data
        cachedWeatherDataMetric = metricData;
        cachedWeatherDataImperial = imperialData;
        cachedCityName = metricData.name;  // Cache city name

        // Update the UI based on the current unit
        updateUI(unit === "metric" ? cachedWeatherDataMetric : cachedWeatherDataImperial);

        // Fetch and render the forecast
        const lat = metricData.coord.lat;
        const lon = metricData.coord.lon;
        await fetchAndRenderForecast(lat, lon);
    } catch (error) {
        console.error("Error fetching weather data:", error);
        document.querySelector(".city").innerHTML = "City not found!";
    }
}

// Update the UI with weather data
function updateUI(data) {
    document.querySelector(".city").innerHTML = cachedCityName;
    document.querySelector(".temp").innerHTML = Math.round(data.main.temp) + (unit === "metric" ? "°C" : "°F");
    document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
    document.querySelector(".wind").innerHTML = convertWindSpeed(data.wind.speed) + (unit === "metric" ? " km/h" : " mph");
}

// Convert wind speed based on units
function convertWindSpeed(speed) {
    if (unit === "metric") {
        return (speed * 3.6).toFixed(2); // Convert m/s to km/h
    } else {
        return (speed * 2.237).toFixed(2); // Convert m/s to mph
    }
}

// Fetch and render the 5-day/3-hour forecast
async function fetchAndRenderForecast(lat, lon) {
    try {
        const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`);
        const forecastData = await forecastResponse.json();

        let forecastHTML = "";
        forecastData.list.forEach((forecast, index) => {
            if (index % 8 === 0) { // Show forecast for every 24 hours
                const date = new Date(forecast.dt * 1000).toLocaleDateString("en-US", { weekday: 'short', hour: '2-digit', minute: '2-digit' });
                const temp = Math.round(forecast.main.temp);
                const weatherIcon = `http://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png`;

                forecastHTML += `
                    <div class="forecast-day">
                        <p>${date}</p>
                        <img src="${weatherIcon}" alt="Weather icon">
                        <p>Temp: ${temp} ${unit === "metric" ? "°C" : "°F"}</p>
                    </div>
                `;
            }
        });

        document.querySelector(".forecast").innerHTML = forecastHTML;

    } catch (error) {
        console.error("Error fetching forecast data:", error);
    }
}

// Toggle map visibility
const toggleMapBtn = document.getElementById("toggle-map");
const mapContainer = document.getElementById("map");
let isMapVisible = false;
let map; // Leaflet map instance

toggleMapBtn.addEventListener("click", function () {
    if (isMapVisible) {
        mapContainer.style.display = "none";
        toggleMapBtn.innerHTML = "Show Weather Map";
        isMapVisible = false;
    } else {
        mapContainer.style.display = "block";
        toggleMapBtn.innerHTML = "Hide Weather Map";
        isMapVisible = true;
        initializeMap(); // Initialize the map when first shown

        // Invalidate size to force proper rendering
        if (map) {
            setTimeout(() => {
                map.invalidateSize(); // Force Leaflet to recheck container size
            }, 200);
        }
    }
});

// Function to initialize Leaflet map
function initializeMap() {
    if (!map) {
        map = L.map('map').setView([51.505, -0.09], 5); // Default map center and zoom level

        // Add base map layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
        }).addTo(map);

        // Add OpenWeatherMap weather layer (e.g., Clouds)
        const cloudLayer = L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKey}`, {
            maxZoom: 18,
            attribution: '&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
        });

        // Add additional layers for different weather data
        const temperatureLayer = L.tileLayer(`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${apiKey}`, {
            maxZoom: 18,
            attribution: '&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
        });

        const precipitationLayer = L.tileLayer(`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey}`, {
            maxZoom: 18,
            attribution: '&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
        });

        // Add layer control to toggle between weather layers
        const baseMaps = {
            "Clouds": cloudLayer,
            "Temperature": temperatureLayer,
            "Precipitation": precipitationLayer
        };

        L.control.layers(baseMaps).addTo(map);

        // Set the default layer to Clouds
        cloudLayer.addTo(map);
    }
}

// Event listener for search button
searchBtn.addEventListener("click", () => {
    const city = searchBox.value;
    if (city) {
        checkWeather(city);
    }
});

// Event listener for location button
locationBtn.addEventListener("click", () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                checkWeatherByLocation(lat, lon);
            },
            (error) => {
                alert("Unable to retrieve your location");
            }
        );
    } else {
        alert("Geolocation is not supported by your browser.");
    }
});

// Fetch weather data by current location
async function checkWeatherByLocation(lat, lon) {
    try {
        const metricResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
        const imperialResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`);

        const metricData = await metricResponse.json();
        const imperialData = await imperialResponse.json();

        // Cache both metric and imperial data
        cachedWeatherDataMetric = metricData;
        cachedWeatherDataImperial = imperialData;
        cachedCityName = metricData.name;

        // Update the UI based on the current unit
        updateUI(unit === "metric" ? cachedWeatherDataMetric : cachedWeatherDataImperial);

        // Fetch and render the forecast
        await fetchAndRenderForecast(lat, lon);
    } catch (error) {
        console.error("Error fetching weather data by location:", error);
        document.querySelector(".city").innerHTML = "Location not found!";
    }
}

const apiKey = "9e598161662fa90d10571de2f74fef68";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";

const searchBox = document.querySelector(".search input");
const searchBtn = document.querySelector(".search button");
const locationBtn = document.getElementById("location-btn");

let unit = "metric"; // Default unit is Celsius (metric)
const unitSwitch = document.getElementById("unit-switch");
const unitLabel = document.getElementById("unit-label");

let cachedCityName = "";  // Cache the city name

// Add an event listener to toggle between Celsius and Fahrenheit
unitSwitch.addEventListener("change", () => {
    // Switch between Celsius and Fahrenheit
    if (unitSwitch.checked) {
        unit = "imperial"; // Fahrenheit
        unitLabel.innerHTML = "°F";
    } else {
        unit = "metric"; // Celsius
        unitLabel.innerHTML = "°C";
    }

    // Re-fetch weather and forecast data
    if (cachedCityName) {
        // Use cached city name to re-fetch the weather
        checkWeather(cachedCityName);
    } else {
        // Use geolocation if no city is cached
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                checkWeatherByLocation(lat, lon);
            }
        );
    }
});

// Check weather by city name (Search)
async function checkWeather(city) {
    // Show loading indicator or handle UI changes (optional)
    document.querySelector(".city").innerHTML = "Loading...";

    try {
        const response = await fetch(apiUrl + city + `&units=${unit}&appid=${apiKey}`);
        const data = await response.json();

        console.log(data);

        // Cache the city name to avoid changes when toggling units
        cachedCityName = data.name;

        // Update UI with current weather data
        document.querySelector(".city").innerHTML = cachedCityName;
        document.querySelector(".temp").innerHTML = Math.round(data.main.temp) + (unit === "metric" ? "°C" : "°F");
        document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
        document.querySelector(".wind").innerHTML = data.wind.speed + " " + (unit === "metric" ? "km/h" : "mph");

        // Fetch and render the 5-day forecast
        const lat = data.coord.lat;
        const lon = data.coord.lon;
        await fetchAndRenderForecast(lat, lon);

    } catch (error) {
        console.error("Error fetching weather data:", error);
        document.querySelector(".city").innerHTML = "City not found!";
    }
}

// Check weather by current location
async function checkWeatherByLocation(lat, lon) {
    try {
        // Fetch the current weather using the selected unit
        const cityResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`);
        const cityData = await cityResponse.json();

        // Cache the city name on the first request
        if (!cachedCityName) {
            cachedCityName = cityData.name;
        }

        // Always display the cached city name, avoiding misspelling or changes
        document.querySelector(".city").innerHTML = cachedCityName;

        // Fetch the 5-day/3-hour forecast in the selected unit
        await fetchAndRenderForecast(lat, lon);

        // Update current weather display with correct unit
        document.querySelector(".temp").innerHTML = Math.round(cityData.main.temp) + (unit === "metric" ? "°C" : "°F");
        document.querySelector(".humidity").innerHTML = cityData.main.humidity + "%";
        document.querySelector(".wind").innerHTML = cityData.wind.speed + " " + (unit === "metric" ? "km/h" : "mph");

    } catch (error) {
        console.error("Error fetching weather data by location:", error);
        document.querySelector(".city").innerHTML = "Location not found!";
    }
}

// Fetch and render the 5-day/3-hour forecast
async function fetchAndRenderForecast(lat, lon) {
    try {
        // Fetch the 5-day/3-hour forecast using the selected unit
        const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`);
        const forecastData = await forecastResponse.json();

        // Log the forecast data for debugging
        console.log("5-day/3-hour forecast data:", forecastData);

        // Update the 5-day forecast display
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

// Event listener for search button
searchBtn.addEventListener("click", () => {
    const city = searchBox.value;
    if (city) {
        checkWeather(city);  // Fetch weather based on the search query
    }
});

// Event listener for location button
locationBtn.addEventListener("click", () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                // Log latitude and longitude for debugging
                console.log("Current position:", lat, lon); 

                // Fetch weather based on current location
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

// OpenWeatherMap API key (replace with your own)
const apiKey = 'your_api_key_here';

// Elements
const locationElement = document.getElementById('location');
const temperatureElement = document.getElementById('temperature');
const descriptionElement = document.getElementById('description');
const refreshBtn = document.getElementById('refresh-btn');

// Function to fetch weather data
function getWeather(latitude, longitude) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const temperature = data.main.temp;
            const description = data.weather[0].description;
            const location = data.name;

            // Update UI
            locationElement.textContent = `Location: ${location}`;
            temperatureElement.textContent = `Temperature: ${temperature}°C`;
            descriptionElement.textContent = `Description: ${description}`;
        })
        .catch(error => {
            locationElement.textContent = 'Unable to fetch weather data.';
            console.error(error);
        });
}

// Function to get user's location
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            // Fetch weather using the location
            getWeather(latitude, longitude);
        }, () => {
            locationElement.textContent = 'Location access denied.';
        });
    } else {
        locationElement.textContent = 'Geolocation is not supported by this browser.';
    }
}

// Refresh button event listener
refreshBtn.addEventListener('click', getLocation);

// Initial call to get location and weather
getLocation();

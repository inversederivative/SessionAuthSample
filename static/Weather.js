// // Function to update weather box with data from API response
// function updateWeatherBox(weatherData) {
//     const weatherIcon = document.getElementById('weather-icon');
//     const temperature = document.getElementById('temperature');
//     const description = document.getElementById('description');
//     const location = document.getElementById('location');
//
//     // Update weather icon based on weather condition (e.g., sunny, cloudy, rainy)
//     weatherIcon.style.backgroundImage = `url('images/weather-icons/${weatherData.weather[0].icon}.jpg')`;
//
//     // Update temperature, description, and location
//     temperature.textContent = `${weatherData.current.temp}°C`;
//     description.textContent = weatherData.current.weather[0].description;
//     location.textContent = `${weatherData.lat}, ${weatherData.lon}`;
// }
//
// // Example weather data from API response
// const exampleWeatherData = {
//     lat: 33.44,
//     lon: -94.04,
//     current: {
//         temp: 25, // Example temperature in Celsius
//         weather: [{ description: 'Clear', icon: '01d' }] // Example weather condition
//     }
// };
//
// // Call the function with example data (replace with actual API response)
// updateWeatherBox(exampleWeatherData);

// Weather.js

// Function to fetch weather data from the backend server
async function fetchWeatherData() {
    try {
        const response = await fetch('/weather'); // Assuming the endpoint is '/weather'
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return null;
    }
}

// Function to update the weather information in the HTML
async function updateWeather() {
    const weatherData = await fetchWeatherData();
    console.log(weatherData);
    if (weatherData) {
        if (weatherData.error) {
            // Handle the case when no user is logged in
            console.log('No user logged in');
            // You can display an error message or handle it as needed
        } else {
            // Populate the temperature
            const temperatureElement = document.getElementById('temperature');
            if (weatherData.userData.fahrenheit) // Is in America
            {
                temperatureElement.textContent = `${weatherData.weatherData.main.temp}°F`;
            } else {
                temperatureElement.textContent = `${weatherData.weatherData.main.temp}°C`;
            }

            // Populate the weather description
            const descriptionElement = document.getElementById('description');

            descriptionElement.textContent = "<Condition>";

            // Populate the location
            const locationElement = document.getElementById('location');
            locationElement.textContent = weatherData.userData.city;
        }
    }
}

// Call the updateWeather function to fetch and update weather information on page load
updateWeather();

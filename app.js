const API_KEY = "1ae118f33543b15dfb44c1ad1930b278";

async function fetchWeather(city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        console.log("Weather data:", data);

        // TODO: update your HTML with city, temp, etc.
    } catch (error) {
        console.error("Error fetching weather data:", error);
    }
}

document.getElementById('search-btn').addEventListener('click', function() {
    const city = document.getElementById('city-input').value;
    console.log('City entered:', city);

    // Additional code for API will be added later
});

document.getElementById("search-btn").addEventListener("click", () => {
    const city = document.getElementById("city-input").value;
    fetchWeather(city);
});

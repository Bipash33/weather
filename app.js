const API_KEY = "1ae118f33543b15dfb44c1ad1930b278";

async function fetchWeather(city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Insert into correct HTML IDs
        document.getElementById("city-name").innerText = data.name;
        document.getElementById("temperature").innerText = data.main.temp + "°C";
        document.getElementById("weather-description").innerText = data.weather[0].description;
        document.getElementById("humidity").innerText = "Humidity: " + data.main.humidity + "%";
        document.getElementById("wind-speed").innerText = "Wind Speed: " + data.wind.speed + " m/s";

    } catch (error) {
        console.error("Error fetching weather:", error);
    }
}

document.getElementById("search-btn").addEventListener("click", () => {
    const city = document.getElementById("city-input").value;
    fetchWeather(city);
});

// app.js - Updated to fetch current weather + 3-day forecast
const API_KEY = "1ae118f33543b15dfb44c1ad1930b278"; // keep this in app.js for now (or use env in production)

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

function showMessageInWeatherBox(message) {
  const container = document.querySelector(".weather-info");
  if (!container) return;
  container.innerHTML = `<p style="color:#666;margin:0">${message}</p>`;
}

function clearWeatherInfoSkeleton() {
  const container = document.querySelector(".weather-info");
  if (!container) return;
  container.innerHTML = `
    <h2 id="city-name"></h2>
    <div class="temp-badge">
      <div class="icon-circle"><img id="weather-icon" alt="icon" style="width:42px;height:42px"/></div>
      <div>
        <p id="temperature" style="margin:0"></p>
        <p id="weather-description" style="margin:0"></p>
      </div>
    </div>
    <div class="info-row">
      <div class="info-item" id="humidity"></div>
      <div class="info-item" id="wind-speed"></div>
    </div>
  `;
}

function displayCurrentWeather(data) {
  clearWeatherInfoSkeleton();
  if (!data) {
    showMessageInWeatherBox("No weather data to display.");
    return;
  }

  // City and basic fields
  setText("city-name", data.name || "—");

  // temperature rounding
  const temp = (data.main && data.main.temp !== undefined) ? Math.round(data.main.temp) : "—";
  setText("temperature", `${temp}°C`);

  // description & capitalise
  const desc = (data.weather && data.weather[0] && data.weather[0].description) ? data.weather[0].description : "";
  setText("weather-description", desc ? (desc.charAt(0).toUpperCase() + desc.slice(1)) : "");

  setText("humidity", `Humidity: ${data.main && data.main.humidity !== undefined ? data.main.humidity + "%" : "—"}`);
  setText("wind-speed", `Wind: ${data.wind && data.wind.speed !== undefined ? data.wind.speed + " m/s" : "—"}`);

  // icon
  if (data.weather && data.weather[0] && data.weather[0].icon) {
    const iconCode = data.weather[0].icon;
    const iconEl = document.getElementById("weather-icon");
    if (iconEl) iconEl.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }

  // mark card for small animation
  const card = document.querySelector(".weather-info");
  if (card) {
    card.classList.remove("data-loaded");
    // force reflow
    void card.offsetWidth;
    card.classList.add("data-loaded");
  }
}

// Convert UNIX timestamp (seconds) -> friendly date like "Mon, Nov 3"
function formatDayLabel(unixSeconds) {
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

// Renders forecast array (expects 3 items)
function renderForecastCards(dailyArr) {
  // dailyArr should be an array of daily forecast objects
  const container = document.querySelector(".forecast-days");
  if (!container) return;
  container.innerHTML = ""; // clear previous

  // create up to 3 day cards
  dailyArr.slice(0, 3).forEach(day => {
    const dateLabel = formatDayLabel(day.dt);
    const icon = day.weather && day.weather[0] && day.weather[0].icon ? day.weather[0].icon : "";
    const description = day.weather && day.weather[0] && day.weather[0].description ? day.weather[0].description : "";
    const tempDay = day.temp && day.temp.day !== undefined ? Math.round(day.temp.day) : "—";

    const card = document.createElement("div");
    card.className = "day-card";
    card.innerHTML = `
      <div class="day-date">${dateLabel}</div>
      <div class="day-weather-icon">
        ${icon ? `<img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="icon" style="width:44px;height:44px">` : ""}
      </div>
      <div class="day-meta">
        <div class="day-temperature">${tempDay}°C</div>
        <div class="day-description">${description ? description.charAt(0).toUpperCase() + description.slice(1) : ""}</div>
      </div>
    `;
    container.appendChild(card);
  });
}

// Fetch One Call daily forecast using lat/lon. We exclude unnecessary parts.
async function fetchForecastByCoords(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&exclude=minutely,hourly,alerts&units=metric&appid=${API_KEY}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error("Forecast API error status", res.status);
      return null;
    }
    const json = await res.json();
    // json.daily is an array (today, next day, ...)
    return json.daily ? json.daily.slice(1, 4) : null; // next 3 days (skip today)
  } catch (err) {
    console.error("Error fetching forecast:", err);
    return null;
  }
}

// Primary function: fetch current weather, display it, then fetch+display forecast
async function fetchWeather(city) {
  if (!city) {
    showMessageInWeatherBox("Please enter a city name.");
    return;
  }

  showMessageInWeatherBox("Loading current weather…");

  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      let errBody = {};
      try { errBody = await response.json(); } catch (_) {}
      console.error("Current weather API error", response.status, errBody);
      if (response.status === 401) showMessageInWeatherBox("Invalid API key (401).");
      else if (response.status === 404) showMessageInWeatherBox("City not found. Try another city.");
      else showMessageInWeatherBox(`Server error: ${response.status}`);
      return;
    }

    const data = await response.json();
    console.log("Current weather:", data);
    displayCurrentWeather(data);

    // now fetch forecast by coords
    if (data.coord && data.coord.lat !== undefined && data.coord.lon !== undefined) {
      showMessageInWeatherBox("Loading 3-day forecast…"); // temporary message while forecast loads
      const future = await fetchForecastByCoords(data.coord.lat, data.coord.lon);
      if (future && future.length) {
        renderForecastCards(future);
        // after rendering forecast, show current card again (it was already rendered)
        // ensure the weather-info skeleton remains visible (we already set it)
      } else {
        // fallback: clear forecast container and show message
        const fc = document.querySelector(".forecast-days");
        if (fc) fc.innerHTML = `<div class="muted">Forecast not available</div>`;
      }
    } else {
      const fc = document.querySelector(".forecast-days");
      if (fc) fc.innerHTML = `<div class="muted">Forecast not available</div>`;
    }

  } catch (error) {
    console.error("Network error:", error);
    showMessageInWeatherBox("Network error. Check console and your connection.");
  }
}

// initialization: wire buttons and prepare skeletons
function init() {
  const btn = document.getElementById("search-btn");
  const input = document.getElementById("city-input");

  if (!btn || !input) {
    console.error("Missing #search-btn or #city-input in HTML.");
    return;
  }

  // initialize skeletons
  clearWeatherInfoSkeleton();
  const fc = document.querySelector(".forecast-days");
  if (fc) fc.innerHTML = `<div class="muted">Enter a city and press Search to load the 3-day forecast.</div>`;

  btn.addEventListener("click", () => {
    const city = input.value.trim();
    fetchWeather(city);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") btn.click();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

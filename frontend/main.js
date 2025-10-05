const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "/api";
let currentUnits = "metric";
let currentTheme = "light";

async function getWeather(query) {
  try {
    const response = await fetch(`${API_BASE_URL}/weather?${query}`);
    if (!response.ok) {
      throw new Error("Weather data not found");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching weather:", error);
    showError("Failed to get weather data. Please try again.");
    return null;
  }
}

async function getForecast(query) {
  try {
    const response = await fetch(`${API_BASE_URL}/forecast?${query}`);
    if (!response.ok) {
      throw new Error("Forecast data not found");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching forecast:", error);
    return null;
  }
}

function displayWeather(data) {
  if (!data) return;

  document.getElementById(
    "cityName"
  ).textContent = `${data.name}, ${data.sys.country}`;

  // temperature
  const temp = Math.round(data.main.temp);
  const unit = currentUnits === "metric" ? "°C" : "°F";
  document.getElementById("temperature").textContent = `${temp}${unit}`;

  document.getElementById("description").textContent =
    data.weather[0].description;

  document.getElementById("feelsLike").textContent = `${Math.round(
    data.main.feels_like
  )}${unit}`;
  document.getElementById("humidity").textContent = `${data.main.humidity}%`;
  document.getElementById("windSpeed").textContent = `${data.wind.speed} ${
    currentUnits === "metric" ? "m/s" : "mph"
  }`;
  document.getElementById("pressure").textContent = `${data.main.pressure} hPa`;

  const weatherCard = document.getElementById("weatherCard");
  weatherCard.style.display = "block";
}

function displayForecast(data) {
  if (!data) return;

  const forecastContainer = document.getElementById("forecastContainer");
  forecastContainer.innerHTML = "";

  const dailyForecasts = data.list
    .filter((item, index) => index % 8 === 0)
    .slice(0, 5);

  dailyForecasts.forEach((forecast) => {
    const date = new Date(forecast.dt * 1000);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    const temp = Math.round(forecast.main.temp);
    const unit = currentUnits === "metric" ? "°C" : "°F";
    const description = forecast.weather[0].description;
    const emoji = getWeatherEmoji(forecast.weather[0].main);

    const forecastItem = document.createElement("div");
    forecastItem.className = "forecast-item";
    forecastItem.innerHTML = `
      <div class="forecast-day">${dayName}</div>
      <div class="forecast-emoji">${emoji}</div>
      <div class="forecast-temp">${temp}${unit}</div>
      <div class="forecast-desc">${description}</div>
    `;

    forecastContainer.appendChild(forecastItem);
  });

  document.getElementById("forecastSection").style.display = "block";
}

function getWeatherEmoji(condition) {
  const emojiMap = {
    Clear: "☀️",
    Clouds: "☁️",
    Rain: "🌧️",
    Drizzle: "🌦️",
    Thunderstorm: "⛈️",
    Snow: "❄️",
    Mist: "🌫️",
    Fog: "🌫️",
  };
  return emojiMap[condition] || "🌤️";
}

async function searchWeather() {
  const cityInput = document.getElementById("cityInput");
  const city = cityInput.value.trim();

  if (!city) {
    showError("Please enter a city name");
    return;
  }

  showLoading(true);

  const weatherData = await getWeather(`q=${city}`);
  if (weatherData) {
    displayWeather(weatherData);

    const forecastData = await getForecast(`q=${city}`);
    displayForecast(forecastData);
  }

  showLoading(false);
}

async function getLocationWeather() {
  if (!navigator.geolocation) {
    showError("Geolocation is not supported by your browser");
    return;
  }

  showLoading(true);

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      const weatherData = await getWeather(`lat=${latitude}&lon=${longitude}`);
      if (weatherData) {
        displayWeather(weatherData);

        const forecastData = await getForecast(
          `lat=${latitude}&lon=${longitude}`
        );
        displayForecast(forecastData);
      }
      showLoading(false);
    },
    (error) => {
      showError(
        "Unable to get your location. Please try searching for a city."
      );
      showLoading(false);
    }
  );
}

function toggleUnits() {
  currentUnits = currentUnits === "metric" ? "imperial" : "metric";

  const toggle = document.getElementById("unitsToggle");
  toggle.checked = currentUnits === "imperial";

  const cityName = document.getElementById("cityName").textContent;
  if (cityName) {
    searchWeatherByName(cityName.split(",")[0]);
  }
}

function toggleTheme() {
  currentTheme = currentTheme === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", currentTheme);

  const themeIcon = document.querySelector(".theme-icon");
  themeIcon.textContent = currentTheme === "dark" ? "☀️" : "🌙";

  localStorage.setItem("theme", currentTheme);
}

async function searchWeatherByName(cityName) {
  showLoading(true);
  const weatherData = await getWeather(`q=${cityName}`);
  if (weatherData) {
    displayWeather(weatherData);
    const forecastData = await getForecast(`q=${cityName}`);
    displayForecast(forecastData);
  }
  showLoading(false);
}

function showLoading(show) {
  const loadingOverlay = document.getElementById("loadingOverlay");
  loadingOverlay.style.display = show ? "flex" : "none";
}

function showError(message) {
  const errorModal = document.getElementById("errorModal");
  const errorMessage = document.getElementById("errorMessage");
  errorMessage.textContent = message;
  errorModal.style.display = "flex";
}

function hideError() {
  const errorModal = document.getElementById("errorModal");
  errorModal.style.display = "none";
}

function initApp() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    currentTheme = savedTheme;
    document.documentElement.setAttribute("data-theme", currentTheme);
    const themeIcon = document.querySelector(".theme-icon");
    themeIcon.textContent = currentTheme === "dark" ? "☀️" : "🌙";
  }

  document.getElementById("searchBtn").addEventListener("click", searchWeather);
  document
    .getElementById("locationBtn")
    .addEventListener("click", getLocationWeather);
  document.getElementById("themeToggle").addEventListener("click", toggleTheme);
  document
    .getElementById("unitsToggle")
    .addEventListener("change", toggleUnits);
  document.getElementById("closeErrorBtn").addEventListener("click", hideError);

  document.getElementById("cityInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      searchWeather();
    }
  });

  searchWeatherByName("Gautam Budh Nagar, IN");
}

document.addEventListener("DOMContentLoaded", initApp);

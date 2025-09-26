class WeatherAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = window.location.hostname === 'localhost' 
      ? "http://localhost:5000/api" 
      : "/api";
  }

  getCurrentWeather = async (query) => {
    const url = `${this.baseURL}/weather?${query}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Weather data not found");
    return await response.json();
  };

  getForecast = async (query) => {
    const url = `${this.baseURL}/forecast?${query}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Forecast data not found");
    return await response.json();
  };
}

const WeatherApp = (() => {
  const weatherService = new WeatherAPI();

  const weatherEmojis = new Map([
    ["clear sky", "☀️"],
    ["few clouds", "🌤️"],
    ["scattered clouds", "⛅"],
    ["broken clouds", "☁️"],
    ["shower rain", "🌦️"],
    ["rain", "🌧️"],
    ["thunderstorm", "⛈️"],
    ["snow", "❄️"],
    ["mist", "🌫️"],
    ["haze", "😶‍🌫️"],
  ]);

  const createWeatherCard = ({
    name,
    main: { temp, feels_like, humidity, pressure },
    weather,
    wind,
  }) => {
    const [{ description }] = weather;
    const emoji = weatherEmojis.get(description) || "🌍";

    return `
      <div class="city-name">${name} ${emoji}</div>
      <div class="temperature">${Math.round(temp)}°C</div>
      <div class="description">${description}</div>
      <div class="weather-details">
        <div class="detail-item">
          <div>Feels like</div>
          <div>${Math.round(feels_like)}°C</div>
        </div>
        <div class="detail-item">
          <div>Humidity</div>
          <div>${humidity}%</div>
        </div>
        <div class="detail-item">
          <div>Pressure</div>
          <div>${pressure} hPa</div>
        </div>
        <div class="detail-item">
          <div>Wind Speed</div>
          <div>${wind.speed} m/s</div>
        </div>
      </div>
    `;
  };

  const createForecastCards = (forecastData) => {
    const dailyForecasts = forecastData.list
      .filter((_, index) => index % 8 === 0)
      .slice(0, 5) // first 5 days show
      .map((forecast) => {
        const date = new Date(forecast.dt * 1000);
        const day = date.toLocaleDateString("en-US", { weekday: "short" });
        const emoji =
          weatherEmojis.get(forecast.weather[0].description) || "🌍";

        return `
          <div class="forecast-item">
            <div class="forecast-day">${day}</div>
            <div>${emoji}</div>
            <div class="forecast-temp">${Math.round(forecast.main.temp)}°C</div>
            <div>${forecast.weather[0].description}</div>
          </div>
        `;
      });

    return dailyForecasts.join("");
  };

  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      });
    });
  };

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const showError = (element, message) => {
    element.innerHTML = `<div class="error">❌ ${message}</div>`;
  };

  const displayWeather = async (query, queryType = "q") => {
    const weatherCard = document.getElementById("weatherCard");
    const forecastSection = document.getElementById("forecastSection");
    const forecastContainer = document.getElementById("forecastContainer");

    try {
      weatherCard.innerHTML = `<div class="loading"></div>`;

      const [weatherData, forecastData] = await Promise.all([
        weatherService.getCurrentWeather(
          queryType ? `${queryType}=${query}` : query
        ),
        weatherService.getForecast(queryType ? `${queryType}=${query}` : query),
      ]);

      weatherCard.innerHTML = createWeatherCard(weatherData);
      forecastContainer.innerHTML = createForecastCards(forecastData);

      forecastSection.style.display = "block";
    } catch (error) {
      showError(weatherCard, error.message);
      forecastSection.style.display = "none";
    }
  };

  const searchWeather = (city = "") => {
    if (!city.trim()) {
      showError(
        document.getElementById("weatherCard"),
        "Please enter a city name"
      );
      return;
    }
    displayWeather(city);
  };

  const searchByLocation = async () => {
    const locationBtn = document.getElementById("locationBtn");
    const originalText = locationBtn.innerHTML;

    try {
      locationBtn.innerHTML = `<div class="loading"></div>`;
      locationBtn.disabled = true;

      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;

      //  query type write in
      await displayWeather(`lat=${latitude}&lon=${longitude}`, null);
    } catch (error) {
      showError(
        document.getElementById("weatherCard"),
        "Unable to get your location, please search manually."
      );
    } finally {
      locationBtn.innerHTML = originalText;
      locationBtn.disabled = false;
    }
  };

  const intializeApp = () => {
    const cityInput = document.getElementById("cityInput");
    const searchBtn = document.getElementById("searchBtn");
    const locationBtn = document.getElementById("locationBtn");

    const debouncedSearch = debounce((value) => {
      if (value.length > 2) {
        searchWeather(value);
      }
    }, 300);

    cityInput.addEventListener("input", (e) => debouncedSearch(e.target.value));

    cityInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        searchWeather(cityInput.value);
      }
    });

    searchBtn.addEventListener("click", () => searchWeather(cityInput.value));
    locationBtn.addEventListener("click", searchByLocation);

    // load my current city ---
    displayWeather("Noida");
  };

  return {
    init: intializeApp,
  };
})();

document.addEventListener("DOMContentLoaded", WeatherApp.init);

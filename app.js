const API_KEY = ''; // Reemplaza con tu API key de OpenWeatherMap

if (!API_KEY || API_KEY.length !== 32 ) {
    alert('La API key no es válida. Debe ser una clave de exactamente 32 caracteres.');
    throw new Error('API key no configurada');
}

async function getWeather() {
    const location = document.getElementById('location').value;
    if (!location) return;

    document.getElementById('loader').classList.remove('hidden');
    document.getElementById('weather-info').classList.add('hidden');

    try {
        // Obtener clima actual y pronóstico en una sola llamada
        const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${API_KEY}&units=metric&lang=es`
        );
        const forecastData = await forecastResponse.json();

        if (forecastResponse.ok) {
            // Usar el primer elemento del pronóstico como clima actual
            updateUI(forecastData.list[0], forecastData.city.name);
            updateHourlyForecast(forecastData.list);
            updateForecastUI(forecastData);
        } else {
            if (forecastData.cod === '404') {
                alert('No se encontró la ciudad. Por favor, verifica el nombre e intenta de nuevo.');
            } else {
                alert(`Error: ${forecastData.message}`);
            }
        }
    } catch (error) {
        if (error.message === 'API key no configurada') {
            alert('No hay API key configurada. Por favor, configura una API key válida.');
        } else {
            alert('Error al obtener el clima. Por favor, intenta de nuevo.');
        }
    } finally {
        document.getElementById('loader').classList.add('hidden');
    }
}

function updateUI(data, cityName) {
    document.getElementById('city-name').textContent = cityName;
    document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°C`;
    document.getElementById('description').textContent = 
        data.weather[0].description.charAt(0).toUpperCase() + 
        data.weather[0].description.slice(1);
    document.getElementById('humidity').textContent = data.main.humidity;
    document.getElementById('wind').textContent = Math.round(data.wind.speed * 3.6);
    document.getElementById('weather-icon').src = 
        `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

    document.getElementById('weather-info').classList.remove('hidden');
}

function updateForecastUI(data) {
    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = '';

    // Agrupar pronósticos por día
    const dailyForecasts = data.list.reduce((acc, forecast) => {
        const date = new Date(forecast.dt * 1000);
        const dateStr = date.toLocaleDateString('es-ES');
        
        if (!acc[dateStr]) {
            acc[dateStr] = {
                date: date,
                temps: [],
                forecasts: []
            };
        }
        
        acc[dateStr].temps.push(forecast.main.temp);
        acc[dateStr].forecasts.push(forecast);
        return acc;
    }, {});

    // Tomar los primeros 5 días
    Object.values(dailyForecasts).slice(0, 5).forEach(dayData => {
        const { date, temps, forecasts } = dayData;
        
        // Encontrar máxima y mínima del día
        const maxTemp = Math.max(...temps);
        const minTemp = Math.min(...temps);
        
        // Usar el pronóstico más cercano a mediodía para los otros datos
        const middayForecast = forecasts.reduce((closest, current) => {
            const currentHour = new Date(current.dt * 1000).getHours();
            const closestHour = new Date(closest.dt * 1000).getHours();
            return Math.abs(currentHour - 12) < Math.abs(closestHour - 12) ? current : closest;
        }, forecasts[0]);

        const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
        const dayMonth = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

        const forecastDay = document.createElement('div');
        forecastDay.className = 'forecast-day';
        forecastDay.innerHTML = `
            <div class="forecast-date">
                <strong>${dayName}</strong><br>
                ${dayMonth}
            </div>
            <img src="http://openweathermap.org/img/wn/${middayForecast.weather[0].icon}@2x.png" 
                 alt="${middayForecast.weather[0].description}">
            <div class="forecast-temp">
                <span class="max-temp">🔴 ${Math.round(maxTemp)}°C</span><br>
                <span class="min-temp">🔵 ${Math.round(minTemp)}°C</span>
            </div>
            <div class="forecast-description">
                ${middayForecast.weather[0].description}
            </div>
            <div class="forecast-details">
                <div>💧 ${middayForecast.main.humidity}%</div>
                <div>💨 ${Math.round(middayForecast.wind.speed * 3.6)} km/h</div>
            </div>
        `;

        forecastContainer.appendChild(forecastDay);
    });
}

function updateHourlyForecast(forecastList) {
    const hourlyContainer = document.getElementById('hourly-forecast-container');
    hourlyContainer.innerHTML = '';

    // Tomar las próximas 24 horas (8 períodos de 3 horas)
    const next24Hours = forecastList.slice(0, 8);

    next24Hours.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const hour = date.getHours();
        const formattedHour = hour.toString().padStart(2, '0') + ':00';

        const hourlyItem = document.createElement('div');
        hourlyItem.className = 'hourly-item';
        hourlyItem.innerHTML = `
            <div class="hourly-time">${formattedHour}</div>
            <img src="http://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png" 
                 alt="${forecast.weather[0].description}">
            <div class="hourly-temp">${Math.round(forecast.main.temp)}°C</div>
            <div class="hourly-description">${forecast.weather[0].description}</div>
        `;

        hourlyContainer.appendChild(hourlyItem);
    });
}

// Permitir búsqueda al presionar Enter
document.getElementById('location').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        getWeather();
    }
}); 

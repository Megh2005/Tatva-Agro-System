import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  LucideIcon,
} from "lucide-react";

export interface WmoWeatherInfo {
  code: number;
  description: string;
  iconName: string;
  LucideIcon: LucideIcon;
}

export interface CurrentWeatherData {
  temperature: number; // °C
  feelsLike: number; // °C
  humidity: number; // %
  windSpeed: number; // km/h
  windDirectionDegrees: number;
  windDirectionCardinal: string;
  weatherCode: number;
  weatherDescription: string;
  isDay: boolean;
  precipitation: number; // mm
  rain: number; // mm
  cloudCover: number; // %
  pressure: number; // hPa
  uvIndex?: number;
}

export interface HourlyForecastData {
  time: string[];
  temperature: number[];
  humidity: number[];
  apparentTemperature: number[];
  precipitationProbability: number[];
  weatherCode: number[];
  uvIndex: number[];
  soilTemperature?: number[];
  soilMoisture?: number[];
}

export interface DailyForecastData {
  time: string[];
  weatherCode: number[];
  temperatureMax: number[];
  temperatureMin: number[];
  apparentTemperatureMax: number[];
  apparentTemperatureMin: number[];
  sunrise: string[];
  sunset: string[];
  uvIndexMax: number[];
  precipitationSum: number[];
  precipitationProbabilityMax: number[];
}

export interface WeatherData {
  current: CurrentWeatherData;
  hourly?: HourlyForecastData;
  daily?: DailyForecastData;
  soilData?: {
    temperature: number | null;
    moisture: number | null;
  };
  timezone: string;
  latitude: number;
  longitude: number;
  fetchedAt: number;
}

// Convert wind degrees (0 - 360) to cardinal direction
export function getWindCardinalDirection(degrees: number): string {
  const normalized = (degrees % 360 + 360) % 360;
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(normalized / 45) % 8;
  return directions[index];
}

// Map WMO Weather Interpretation Codes to human readable descriptions & Lucide icons
export function getWmoWeatherInfo(code: number, isDay = true): WmoWeatherInfo {
  switch (code) {
    case 0:
      return {
        code,
        description: "Clear sky",
        iconName: "Sun",
        LucideIcon: Sun,
      };
    case 1:
      return {
        code,
        description: "Mainly clear",
        iconName: "CloudSun",
        LucideIcon: CloudSun,
      };
    case 2:
      return {
        code,
        description: "Partly cloudy",
        iconName: "CloudSun",
        LucideIcon: CloudSun,
      };
    case 3:
      return {
        code,
        description: "Overcast",
        iconName: "Cloud",
        LucideIcon: Cloud,
      };
    case 45:
    case 48:
      return {
        code,
        description: "Foggy",
        iconName: "CloudFog",
        LucideIcon: CloudFog,
      };
    case 51:
      return {
        code,
        description: "Light drizzle",
        iconName: "CloudDrizzle",
        LucideIcon: CloudDrizzle,
      };
    case 53:
      return {
        code,
        description: "Moderate drizzle",
        iconName: "CloudDrizzle",
        LucideIcon: CloudDrizzle,
      };
    case 55:
      return {
        code,
        description: "Dense drizzle",
        iconName: "CloudDrizzle",
        LucideIcon: CloudDrizzle,
      };
    case 56:
    case 57:
      return {
        code,
        description: "Freezing drizzle",
        iconName: "CloudDrizzle",
        LucideIcon: CloudDrizzle,
      };
    case 61:
      return {
        code,
        description: "Slight rain",
        iconName: "CloudRain",
        LucideIcon: CloudRain,
      };
    case 63:
      return {
        code,
        description: "Moderate rain",
        iconName: "CloudRain",
        LucideIcon: CloudRain,
      };
    case 65:
      return {
        code,
        description: "Heavy rain",
        iconName: "CloudRain",
        LucideIcon: CloudRain,
      };
    case 66:
    case 67:
      return {
        code,
        description: "Freezing rain",
        iconName: "CloudRain",
        LucideIcon: CloudRain,
      };
    case 71:
      return {
        code,
        description: "Slight snow fall",
        iconName: "CloudSnow",
        LucideIcon: CloudSnow,
      };
    case 73:
      return {
        code,
        description: "Moderate snow fall",
        iconName: "CloudSnow",
        LucideIcon: CloudSnow,
      };
    case 75:
      return {
        code,
        description: "Heavy snow fall",
        iconName: "CloudSnow",
        LucideIcon: CloudSnow,
      };
    case 77:
      return {
        code,
        description: "Snow grains",
        iconName: "CloudSnow",
        LucideIcon: CloudSnow,
      };
    case 80:
    case 81:
    case 82:
      return {
        code,
        description: "Rain showers",
        iconName: "CloudRain",
        LucideIcon: CloudRain,
      };
    case 85:
    case 86:
      return {
        code,
        description: "Snow showers",
        iconName: "CloudSnow",
        LucideIcon: CloudSnow,
      };
    case 95:
      return {
        code,
        description: "Thunderstorm",
        iconName: "CloudLightning",
        LucideIcon: CloudLightning,
      };
    case 96:
    case 99:
      return {
        code,
        description: "Thunderstorm with hail",
        iconName: "CloudLightning",
        LucideIcon: CloudLightning,
      };
    default:
      return {
        code,
        description: "Partly cloudy",
        iconName: "CloudSun",
        LucideIcon: CloudSun,
      };
  }
}

// Memory Cache for weather responses
const memoryCache = new Map<string, { timestamp: number; data: WeatherData }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function fetchOpenMeteoWeather(
  lat: number,
  lng: number,
  forceRefresh = false,
): Promise<WeatherData> {
  const cacheKey = `tatva_openmeteo_v1_${lat.toFixed(4)}_${lng.toFixed(4)}`;

  // 1. Check in-memory cache
  if (!forceRefresh && memoryCache.has(cacheKey)) {
    const cached = memoryCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  // 2. Check localStorage cache
  if (!forceRefresh && typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
          memoryCache.set(cacheKey, parsed);
          return parsed.data;
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  // 3. Fetch fresh data from Open-Meteo API
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat.toString());
  url.searchParams.set("longitude", lng.toString());
  url.searchParams.set("timezone", "auto");
  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "precipitation",
      "rain",
      "weather_code",
      "cloud_cover",
      "surface_pressure",
      "wind_speed_10m",
      "wind_direction_10m",
    ].join(","),
  );
  url.searchParams.set(
    "hourly",
    [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "precipitation_probability",
      "precipitation",
      "rain",
      "weather_code",
      "surface_pressure",
      "cloud_cover",
      "visibility",
      "wind_speed_10m",
      "soil_temperature_0cm",
      "soil_moisture_0_to_1cm",
      "uv_index",
    ].join(","),
  );
  url.searchParams.set(
    "daily",
    [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "apparent_temperature_max",
      "apparent_temperature_min",
      "sunrise",
      "sunset",
      "uv_index_max",
      "precipitation_sum",
      "precipitation_probability_max",
    ].join(","),
  );

  let response: Response;
  try {
    response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Open-Meteo returned status ${response.status}`);
    }
  } catch (firstErr) {
    // Single retry attempt on network failure
    await new Promise((res) => setTimeout(res, 1000));
    response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Open-Meteo retry failed with status ${response.status}`);
    }
  }

  const json = await response.json();

  const current = json.current || {};
  const hourly = json.hourly || {};
  const daily = json.daily || {};

  const windDegrees = current.wind_direction_10m ?? 0;
  const wmoInfo = getWmoWeatherInfo(
    current.weather_code ?? 0,
    current.is_day === 1,
  );

  // Extract latest soil readings from hourly if available
  let soilTemp: number | null = null;
  let soilMoist: number | null = null;
  if (hourly.soil_temperature_0cm?.length > 0) {
    soilTemp = hourly.soil_temperature_0cm[0];
  }
  if (hourly.soil_moisture_0_to_1cm?.length > 0) {
    // Open-Meteo returns soil moisture in m³/m³ (0 to 1). Convert to percentage if <= 1.0
    const rawM = hourly.soil_moisture_0_to_1cm[0];
    soilMoist = rawM <= 1.0 ? rawM * 100 : rawM;
  }

  const weatherData: WeatherData = {
    current: {
      temperature: current.temperature_2m ?? 0,
      feelsLike: current.apparent_temperature ?? current.temperature_2m ?? 0,
      humidity: current.relative_humidity_2m ?? 0,
      windSpeed: current.wind_speed_10m ?? 0,
      windDirectionDegrees: windDegrees,
      windDirectionCardinal: getWindCardinalDirection(windDegrees),
      weatherCode: current.weather_code ?? 0,
      weatherDescription: wmoInfo.description,
      isDay: current.is_day === 1,
      precipitation: current.precipitation ?? 0,
      rain: current.rain ?? 0,
      cloudCover: current.cloud_cover ?? 0,
      pressure: current.surface_pressure ?? 0,
      uvIndex: hourly.uv_index?.[0] ?? 0,
    },
    hourly: {
      time: hourly.time || [],
      temperature: hourly.temperature_2m || [],
      humidity: hourly.relative_humidity_2m || [],
      apparentTemperature: hourly.apparent_temperature || [],
      precipitationProbability: hourly.precipitation_probability || [],
      weatherCode: hourly.weather_code || [],
      uvIndex: hourly.uv_index || [],
      soilTemperature: hourly.soil_temperature_0cm || [],
      soilMoisture: hourly.soil_moisture_0_to_1cm || [],
    },
    daily: {
      time: daily.time || [],
      weatherCode: daily.weather_code || [],
      temperatureMax: daily.temperature_2m_max || [],
      temperatureMin: daily.temperature_2m_min || [],
      apparentTemperatureMax: daily.apparent_temperature_max || [],
      apparentTemperatureMin: daily.apparent_temperature_min || [],
      sunrise: daily.sunrise || [],
      sunset: daily.sunset || [],
      uvIndexMax: daily.uv_index_max || [],
      precipitationSum: daily.precipitation_sum || [],
      precipitationProbabilityMax: daily.precipitation_probability_max || [],
    },
    soilData: {
      temperature: soilTemp,
      moisture: soilMoist,
    },
    timezone: json.timezone || "UTC",
    latitude: lat,
    longitude: lng,
    fetchedAt: Date.now(),
  };

  // Cache in memory and localStorage
  const cachePayload = { timestamp: Date.now(), data: weatherData };
  memoryCache.set(cacheKey, cachePayload);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(cachePayload));
    } catch {
      // Ignore localStorage errors
    }
  }

  return weatherData;
}

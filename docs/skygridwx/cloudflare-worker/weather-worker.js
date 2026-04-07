/**
 * SkyGrid Wx — Cloudflare Worker
 * Proxies Open-Meteo weather data with CORS headers so the
 * frontend can fetch from any origin (localhost, GitHub Pages, etc.)
 *
 * Deploy:
 *   1. workers.cloudflare.com → Create Worker → paste this file
 *   2. Copy your *.workers.dev URL
 *   3. Paste it into WORKER_URL in js/indexJS.js
 *
 * Free tier: 100,000 requests/day — more than enough.
 * No credit card required.
 */

const OPEN_METEO_URL =
  "https://api.open-meteo.com/v1/forecast" +
  "?latitude=38.73&longitude=-82.99" +
  "&hourly=temperature_2m,precipitation_probability,weathercode,windspeed_10m" +
  "&daily=sunrise,sunset" +
  "&timezone=America%2FNew_York" +
  "&temperature_unit=fahrenheit" +
  "&wind_speed_unit=mph" +
  "&precipitation_unit=inch" +
  "&forecast_days=2";

export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }

    try {
      const res = await fetch(OPEN_METEO_URL, {
        headers: { "User-Agent": "SkyGridWx/1.0" },
      });

      if (!res.ok) {
        return new Response(`Open-Meteo error: ${res.status}`, { status: 502 });
      }

      const data = await res.json();
      const normalizedData = {
        location: {
          lat: data.latitude,
          lon: data.longitude,
          timezone: data.timezone,
        },
        current: {
          time: data.current?.time ?? data.hourly?.time?.[0] ?? null,
          temp: data.current?.temperature_2m ?? data.hourly?.temperature_2m?.[0] ?? null,
          wind: data.current?.windspeed_10m ?? data.hourly?.windspeed_10m?.[0] ?? null,
          precipitation:
            data.current?.precipitation_probability ??
            data.hourly?.precipitation_probability?.[0] ??
            null,
          weatherCode: data.current?.weathercode ?? data.hourly?.weathercode?.[0] ?? null,
        },
        hourly: {
          time: Array.isArray(data.hourly?.time) ? data.hourly.time : [],
          temperature_2m: Array.isArray(data.hourly?.temperature_2m) ? data.hourly.temperature_2m : [],
          windspeed_10m: Array.isArray(data.hourly?.windspeed_10m) ? data.hourly.windspeed_10m : [],
          precipitation_probability: Array.isArray(data.hourly?.precipitation_probability)
            ? data.hourly.precipitation_probability
            : [],
          weathercode: Array.isArray(data.hourly?.weathercode) ? data.hourly.weathercode : [],
        },
        daily: {
          sunrise: Array.isArray(data.daily?.sunrise) ? data.daily.sunrise : [],
          sunset: Array.isArray(data.daily?.sunset) ? data.daily.sunset : [],
        },
      };

      return new Response(JSON.stringify(normalizedData), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=300", // cache 5 min at edge
        },
      });
    } catch (err) {
      return new Response(`Worker fetch failed: ${err.message}`, { status: 500 });
    }
  },
};

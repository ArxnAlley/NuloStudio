/*
   SkyGrid Wx — Cloudflare Worker (Backend)

   OVERVIEW:
   - This Worker acts as the central data source for the dashboard
   - Handles all external API calls and returns a clean, frontend-safe response
   - Prevents exposing API keys or sensitive logic in the browser

   ROUTES:

   GET /
   - Primary endpoint used by the frontend
   - Returns full weather payload

   GET /weather
   - Fetches weather data (Weather.gov or Open-Meteo depending on config)
   - Formats and normalizes response

   GET /youtube
   - Checks live status of configured YouTube channel
   - Returns videoId + live state for frontend player

   ENVIRONMENT VARIABLES:

   YOUTUBE_API_KEY
   - Required for YouTube Data API v3
   - Must be set in Cloudflare Worker settings (NOT in frontend)

   DEPLOYMENT:

   1) Create Worker at workers.cloudflare.com
   2) Paste this file into the editor
   3) Go to Settings → Variables → add YOUTUBE_API_KEY
   4) Deploy the Worker
   5) Copy the *.workers.dev URL into WORKER_URL in js/indexJS.js

   IMPORTANT:

   - Do NOT expose API keys in frontend code
   - All third-party requests should go through this Worker
   - The frontend depends on a consistent response structure
   - Any changes here must be reflected in frontend parsing logic
*/

/* ============================================================
   SKYGRID WX — CONFIG
============================================================ */

const LAT = 38.73;

const LON = -82.99;

const NWS_BASE = "https://api.weather.gov";

const USER_AGENT = "SkyGridWx/2.0 (skygridwx@nulostudio.com)";

const CORS_HEADERS =
{

  "Content-Type": "application/json",

  "Access-Control-Allow-Origin":  "*",

  "Access-Control-Allow-Methods": "GET, OPTIONS",

  "Access-Control-Allow-Headers": "*",

};


/* ============================================================
   SKYGRID WX — ROUTING
============================================================ */

export default
{
  
  async fetch(request, env)
  {

    if (request.method === "OPTIONS")
    {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url  = new URL(request.url);

    const path = url.pathname;

    if (path === "/youtube")
    {
      return handleYouTube(env);
    }

    if (path === "/" || path === "/weather")
    {
      try
      {
        return await handleWeather();
      }
      catch (err)
      {
        return errorResponse("Failed to fetch weather: " + err.message);
      }
    }

    return new Response("Not Found", { status: 404 });

  }

};

/* ============================================================
   SKYGRID WX — WEATHER HANDLER
============================================================ */

async function handleWeather()
{

  /* Resolve NWS grid point */

  const pointsRes = await nwsFetch(`${NWS_BASE}/points/${LAT},${LON}`);

  if (!pointsRes.ok) throw new Error(`NWS /points failed: ${pointsRes.status}`);

  const pointsData = await pointsRes.json();

  const timezone = pointsData.properties.timeZone ?? "America/New_York";

  const forecastHourlyUrl = pointsData.properties.forecastHourly;

  /* Fetch hourly forecast + alerts concurrently */

  const [hourlyRes, alertsRes] = await Promise.all
  ([
  
    nwsFetch(forecastHourlyUrl),
  
    nwsFetch(`${NWS_BASE}/alerts/active?point=${LAT},${LON}`)
  
  ]);

  if (!hourlyRes.ok) throw new Error(`NWS hourly forecast failed: ${hourlyRes.status}`);

  const [hourlyData, alertsData] = await Promise.all
  ([
  
    hourlyRes.json(),
  
    alertsRes.ok ? alertsRes.json() : Promise.resolve({ features: [] })
  
  ]);

  const periods = hourlyData.properties.periods;

  if (!periods || periods.length === 0) throw new Error("No forecast periods returned");

  /* Find current period */

  const now = new Date();

  let curIdx = 0;

  for (let i = 0; i < periods.length; i++)
  {

    if (new Date(periods[i].startTime) <= now)
    {
  
      curIdx = i;
  
    }
  
    else  
    {
      
      break;
    
    }

  }

  const cur   = periods[curIdx];

  const limit = Math.min(periods.length, 48);

  /* Build normalized hourly arrays */

  const times = [];

  const temps = [];

  const winds = [];

  const precips = [];

  const codes = [];

  for (let i = 0; i < limit; i++)
  {

    const p = periods[i];

    times.push(toEasternISO(p.startTime));

    temps.push(p.temperature);

    winds.push(parseWindMph(p.windSpeed));

    precips.push(p.probabilityOfPrecipitation?.value ?? 0);

    codes.push(forecastToCode(p.shortForecast));

  }

  /* Current conditions */

  const windSpd  = parseWindMph(cur.windSpeed);

  const humidity = cur.relativeHumidity?.value ?? 50;

  const feelsLike = computeFeelsLike(cur.temperature, windSpd, humidity);

  /* Sunrise / sunset for today and tomorrow */

  const todayStr    = toEasternDateStr(now);

  const tomorrowStr = toEasternDateStr(new Date(now.getTime() + 86400000));

  const sun0 = computeSunTimes(LAT, LON, todayStr);

  const sun1 = computeSunTimes(LAT, LON, tomorrowStr);

  /* Precipitation timeline */

  const precipTimeline = buildPrecipTimeline(periods.slice(0, limit));

  /* Alerts */

  const alerts = (alertsData.features || []).map(f => (
  {
    event: f.properties.event ?? "Advisory",
    severity: f.properties.severity ?? "Unknown",
    headline: f.properties.headline ?? "",
    description: (f.properties.description ?? "").substring(0, 200)
  }));

  return jsonResponse(
  {
    
    location:
    {
    
      lat: LAT,
    
      lon: LON,
    
      timezone
    
    },

    current:
    {
    
      time: toEasternISO(cur.startTime),
    
      temp: cur.temperature,
    
      wind: windSpd,
    
      precipitation: cur.probabilityOfPrecipitation?.value ?? 0,
    
      weatherCode: forecastToCode(cur.shortForecast),
    
      feelsLike
    },

    hourly:
    {
    
      time: times,
    
      temperature_2m: temps,
    
      windspeed_10m: winds,
    
      precipitation_probability: precips,
    
      weathercode: codes
    
    },

    daily:
    {
      
      sunrise: [sun0.sunrise, sun1.sunrise],
      
      sunset: [sun0.sunset,  sun1.sunset]
    
    },

    precipitationTimeline: precipTimeline,
    
    alerts
  
  },
  
  200,
  
  { "Cache-Control": "public, max-age=300" });

}


/* ============================================================
   SKYGRID WX — YOUTUBE HANDLER
============================================================ */

async function handleYouTube(env)
{

  const apiKey = env.YOUTUBE_API_KEY;

  const primaryChannelId = "UCJHAT3Uvv-g3I8H3GhHWV7w"; // Ryan Hall Y'all

  const secondaryChannelId = "UCPwnemYfXSHz_IQq1sT7c9g"; // YallBot (24/7 fallback)

  const fallbackYallBotId = "rqHW2HhgGQ0";

  async function getLiveVideo(channelId)
  {

    try
    {

      const liveUrl = `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${channelId}&eventType=live&type=video&maxResults=1&key=${apiKey}`;

      const liveRes = await fetch(liveUrl);

      const liveData = await liveRes.json();

      const liveVideoId = liveData.items?.[0]?.id?.videoId;

      if (liveVideoId)
      {

        const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${liveVideoId}&key=${apiKey}`;

        const videoRes = await fetch(videoUrl);

        const videoData = await videoRes.json();

        const details = videoData.items?.[0]?.liveStreamingDetails;

        if (details && details.actualStartTime && !details.actualEndTime)
        {
          
          return liveVideoId;
        
        }

      }

      const recentUrl = `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${channelId}&type=video&order=date&maxResults=5&key=${apiKey}`;

      const recentRes = await fetch(recentUrl);

      const recentData = await recentRes.json();

      if (!recentData.items) return null;

      for (const item of recentData.items)
      {

        const videoId = item.id?.videoId;

        if (!videoId) continue;

        const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${apiKey}`;

        const videoRes = await fetch(videoUrl);

        const videoData = await videoRes.json();

        const details = videoData.items?.[0]?.liveStreamingDetails;

        if (details && details.actualStartTime && !details.actualEndTime)
        {
          return videoId;
        }

      }

      return null;

    }
    
    catch
    {
      return null;
    }

  }

  try
  {

    const [primaryLive, secondaryLive] = await Promise.all
    ([
    
      getLiveVideo(primaryChannelId),
    
      getLiveVideo(secondaryChannelId)
    
    ]);

    const videoId = primaryLive || secondaryLive || fallbackYallBotId;

    return jsonResponse({ videoId, isLive: !!videoId });

  }
  
  catch
  {
    return errorResponse("Failed to fetch YouTube data");
  }

}


/* ============================================================
   SKYGRID WX — FORECAST CODE MAPPING
============================================================ */

function forecastToCode(shortForecast)
{

  const s = (shortForecast || "").toLowerCase();

  if (s.includes("thunderstorm")) return 95;

  if (s.includes("blizzard")) return 77;

  if (s.includes("heavy snow") || s.includes("blowing snow")) return 75;

  if (s.includes("snow shower") || s.includes("snow and sleet")) return 85;

  if (s.includes("snow") || s.includes("sleet") || s.includes("wintry mix")) return 71;

  if (s.includes("heavy rain") || s.includes("heavy shower")) return 65;

  if (s.includes("shower") || s.includes("sprinkle")) return 80;

  if (s.includes("drizzle")) return 51;

  if (s.includes("rain")) return 61;

  if (s.includes("fog") || s.includes("mist")) return 45;

  if (s.includes("mostly cloudy") || s.includes("overcast") || s.includes("increasing clouds")) return 3;

  if (s.includes("partly cloudy") || s.includes("partly sunny") || s.includes("partly clear"))  return 2;

  if (s.includes("mostly sunny") || s.includes("mostly clear")) return 1;

  if (s.includes("sunny") || s.includes("clear")) return 0;

  if (s.includes("cloud")) return 3;

  return 3;

}

/* ============================================================
   SKYGRID WX — PARSE WIND SPEED
============================================================ */

function parseWindMph(str)
{

  if (!str) return 0;

  const nums = (str.match(/\d+/g) || []).map(Number);

  if (nums.length === 0) return 0;

  return Math.max(...nums);

}


/* ============================================================
   SKYGRID WX — COMPUTE FEELS LIKE
============================================================ */

function computeFeelsLike(tempF, windMph, humidity)
{

  if (tempF <= 50 && windMph > 3)
  {

    // NWS wind chill formula

    const w = Math.pow(windMph, 0.16);

    return Math.round(35.74 + 0.6215 * tempF - 35.75 * w + 0.4275 * tempF * w);

  }

  if (tempF >= 80 && humidity != null)
  {

    // Rothfusz heat index formula

    const T = tempF;

    const R = humidity;

    const hi = -42.379
      + 2.04901523  * T
      + 10.14333127 * R
      - 0.22475541  * T * R
      - 0.00683783  * T * T
      - 0.05481717  * R * R
      + 0.00122874  * T * T * R
      + 0.00085282  * T * R * R
      - 0.00000199  * T * T * R * R;

    return Math.round(hi);

  }

  return Math.round(tempF);

}


/* ============================================================
   SKYGRID WX — PRECIPITATION TIMELINE
============================================================ */

function buildPrecipTimeline(periods)
{

  const THRESHOLD = 30;

  const segments  = [];

  let   seg       = null;

  for (const p of periods)
  {

    const prob = p.probabilityOfPrecipitation?.value ?? 0;

    if (prob >= THRESHOLD)
    {

      if (!seg)
      {
        seg = { start: p.startTime, peak: p.startTime, peakProb: prob, end: p.endTime || p.startTime };
      }
      else
      {

        seg.end = p.endTime || p.startTime;

        if (prob > seg.peakProb)
        {

          seg.peak = p.startTime;

          seg.peakProb = prob;

        }

      }

    }
    
    else if (seg)
    {

      segments.push(closeSegment(seg));

      seg = null;

    }

  }

  if (seg) segments.push(closeSegment(seg));

  return segments;

}

function closeSegment(seg)
{

  const intensity = seg.peakProb >= 70 ? "heavy" : seg.peakProb >= 50 ? "moderate" : "light";

  return { start: seg.start, peak: seg.peak, end: seg.end, intensity };

}


/* ============================================================
   SKYGRID WX — SUNRISE / SUNSET
============================================================ */

function computeSunTimes(lat, lon, dateStr)
{

  const RAD = Math.PI / 180;

  const [y, m, d] = dateStr.split("-").map(Number);

  const JD = 367 * y
    - Math.floor(7 * (y + Math.floor((m + 9) / 12)) / 4)
    + Math.floor(275 * m / 9)
    + d + 1721013.5;

  const n = JD - 2451545.0;

  const Jnoon = 2451545.0 + 0.0009 + (0 - lon / 360) + Math.round(n - (0 - lon / 360));

  const M = (357.5291 + 0.98560028 * (Jnoon - 2451545.0)) % 360;

  const Mrad = M * RAD;

  const C = 1.9148 * Math.sin(Mrad) + 0.0200 * Math.sin(2 * Mrad) + 0.0003 * Math.sin(3 * Mrad);

  const lRad = ((M + C + 180 + 102.9372) % 360) * RAD;

  const Jtr = Jnoon + 0.0053 * Math.sin(Mrad) - 0.0069 * Math.sin(2 * lRad);

  const sinDec = Math.sin(lRad) * Math.sin(23.4397 * RAD);

  const cosDec = Math.cos(Math.asin(sinDec));

  const cosW = (Math.sin(-0.8333 * RAD) - Math.sin(lat * RAD) * sinDec) / (Math.cos(lat * RAD) * cosDec);

  if (cosW > 1)  return { sunrise: `${dateStr}T00:00`, sunset: `${dateStr}T00:00` };

  if (cosW < -1) return { sunrise: `${dateStr}T00:00`, sunset: `${dateStr}T23:59` };

  const w0 = Math.acos(cosW);

  return {
    sunrise: jdToEasternISO(Jtr - w0 / (2 * Math.PI), dateStr),
    sunset:  jdToEasternISO(Jtr + w0 / (2 * Math.PI), dateStr)
  };

}

function jdToEasternISO(jd, dateStr)
{

  const date = new Date((jd - 2440587.5) * 86400000);

  const f = new Intl.DateTimeFormat("en-US",
  {
    
    timeZone: "America/New_York",
    
    hour: "2-digit", minute: "2-digit", hour12: false
  
  });

  const parts = Object.fromEntries(f.formatToParts(date).map(p => [p.type, p.value]));

  const hr = parts.hour === "24" ? "00" : parts.hour;

  return `${dateStr}T${hr}:${parts.minute}`;

}


/* ============================================================
   SKYGRID WX — TIME UTILITIES
============================================================ */

function toEasternISO(isoStr)
{

  const date = new Date(isoStr);

  const f = new Intl.DateTimeFormat("en-US",
  {
    
    timeZone: "America/New_York",
    
    year: "numeric", month: "2-digit", day: "2-digit",
    
    hour: "2-digit", minute: "2-digit", hour12: false
  
  });

  const parts = Object.fromEntries(f.formatToParts(date).map(p => [p.type, p.value]));

  const hr = parts.hour === "24" ? "00" : parts.hour;

  return `${parts.year}-${parts.month}-${parts.day}T${hr}:${parts.minute}`;

}

function toEasternDateStr(date)
{

  const f = new Intl.DateTimeFormat("en-US",
  {
  
    timeZone: "America/New_York",
  
    year: "numeric", month: "2-digit", day: "2-digit"
  
  });

  const parts = Object.fromEntries(f.formatToParts(date).map(p => [p.type, p.value]));

  return `${parts.year}-${parts.month}-${parts.day}`;

}


/* ============================================================
   SKYGRID WX — HELPERS
============================================================ */

function nwsFetch(url)
{

  return fetch(url, { headers: { "User-Agent": USER_AGENT, "Accept": "application/geo+json" } });

}

function jsonResponse(data, status = 200, extraHeaders = {})
{

  return new Response(JSON.stringify(data),
  {
  
    status,
  
    headers: { ...CORS_HEADERS, ...extraHeaders }
  
  });

}

function errorResponse(message)
{

  return new Response(JSON.stringify({ error: message }),
  {
  
    status: 500,
  
    headers: CORS_HEADERS
  
  });

}

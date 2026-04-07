/* ============================================================
   SKYGRID WX — MAIN SCRIPT
   js/indexJS.js
   Frontend-only weather dashboard · No frameworks · No API key
   ============================================================ */

'use strict';


/* ────────────────────────────────────────────────────────────
   CONFIGURATION
   ──────────────────────────────────────────────────────────── */

/**
 * YouTube embed sources for the top-left quadrant.
 * Hayden: update these URLs if a channel goes offline or changes.
 *
 *   ryanHall — Ryan Hall Y'all live channel stream
 *   yallBot  — Y'allBot stream (replace video ID if needed)
 *
 * Channel live-stream embed format:
 *   https://www.youtube.com/embed/live_stream?channel=CHANNEL_ID
 *
 * Single video embed format:
 *   https://www.youtube.com/embed/VIDEO_ID
 */
const YT_SOURCES = {
  ryanHall: "https://www.youtube-nocookie.com/embed/live_stream?channel=UCNMbegBD9OjH4Eza8vVjBMg&autoplay=1&mute=1",
  yallBot:  "https://www.youtube-nocookie.com/embed/EptQj6Q9ykY?autoplay=1&mute=1"
};

/**
 * Open-Meteo forecast API — Wheelersburg, OH (38.73, -82.99)
 * No API key required.
 */
const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast?latitude=38.73&longitude=-82.99&hourly=temperature_2m,precipitation_probability,weathercode,windspeed_10m&daily=sunrise,sunset&timezone=auto&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&forecast_days=2";


/**
 * Webcam stream URL.
 * ─────────────────────────────────────────────────────────────
 * Set this string to activate the sky cam feed.
 *
 *   Option 1 — Direct HTTP stream:
 *     const CAM_STREAM_URL = 'http://192.168.1.x:PORT/stream';
 *
 *   Option 2 — MJPEG:
 *     const CAM_STREAM_URL = 'http://192.168.1.x/video.mjpeg';
 *     (also change initCamFeed() to use an <img> element)
 *
 *   Option 3 — HLS (.m3u8):
 *     Load hls.js, then use: hls.loadSource(CAM_STREAM_URL)
 *
 *   Option 4 — Backend proxy:
 *     const CAM_STREAM_URL = 'http://your-server/cam-proxy';
 * ─────────────────────────────────────────────────────────────
 */
const CAM_STREAM_URL = ''; // ← Insert your webcam stream URL here

/** How often to refresh weather data (ms). Default: 15 minutes. */
const WEATHER_REFRESH_MS = 15 * 60 * 1000;

/* ────────────────────────────────────────────────────────────
   STATE
   ──────────────────────────────────────────────────────────── */
let activeYtSource = 'yallBot';
let topExpanded    = false;
let bottomExpanded = false;


/* ============================================================
   CLOCK
   ============================================================ */

/**
 * Updates the header clock display every second.
 * Called on init, then via setInterval.
 */
function updateClock() {
  const now = new Date();
  const h   = now.getHours();
  const pad = n => String(n).padStart(2, '0');

  // Time digits (no period — rendered separately in #clockAmPm)
  document.getElementById('clockTime').textContent =
    `${pad(h % 12 || 12)}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  document.getElementById('clockAmPm').textContent = h >= 12 ? 'PM' : 'AM';

  document.getElementById('clockDate').textContent = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month:   'long',
    day:     'numeric',
    year:    'numeric'
  });
}


/* ============================================================
   YOUTUBE — SOURCE SWITCHING
   ============================================================ */

function setActiveYoutubeButton(source) {
  document.getElementById('btnRyanHall').classList.toggle('active', source === 'ryanHall');
  document.getElementById('btnYallBot').classList.toggle('active', source === 'yallBot');
}

function setYoutubeIframeSrc(src) {
  document.getElementById('youtubeQuadrantIframe').src = src;
}

/**
 * On load: asks the backend which channel is currently live and loads
 * that stream automatically. Priority: Ryan Hall → Y'allBot → RH default.
 *
 * Hayden: this requires the /api/getLiveStream backend to be running.
 * If the backend is unreachable, falls back to Ryan Hall's channel embed
 * (YouTube handles the "not live" state on their end).
 *
 * Backend expected response: { live: true, videoId: 'VIDEO_ID' }
 *                        or: { live: false }
 */
function loadYouTubeStream() {

  activeYtSource = 'yallBot';

  setYoutubeIframeSrc(YT_SOURCES.yallBot);

  setActiveYoutubeButton('yallBot');

}

/**
 * Manual button override. Switches directly to the configured embed URL
 * for that source — no live check needed for manual selection.
 *
 * @param {'ryanHall'|'yallBot'} source
 */
function switchYoutubeSource(source) {
  if (!(source in YT_SOURCES)) return;
  activeYtSource = source;
  setYoutubeIframeSrc(YT_SOURCES[source]);
  setActiveYoutubeButton(source);
}


/* ============================================================
   EXPAND / COLLAPSE — TOP HALF (YouTube)
   ============================================================ */

/**
 * Expands YouTube panel to fill the full top half.
 * Collapses the hourly forecast panel.
 * Toggles back on second call.
 */
function toggleTopPanelExpand() {
  topExpanded = !topExpanded;

  const forecastPanel = document.getElementById('forecastPanel');
  const expandBtn     = document.getElementById('btnExpandTop');
  const arrow         = document.getElementById('expandTopArrow');

  if (topExpanded) {
    forecastPanel.classList.add('collapsed');
    expandBtn.classList.add('active');
    arrow.innerHTML = '&#10094;'; // ‹ point left = collapse
  } else {
    forecastPanel.classList.remove('collapsed');
    expandBtn.classList.remove('active');
    arrow.innerHTML = '&#10095;'; // › point right = expand
    setTimeout(() => fetchWeatherData(), 100);
  }
}


/* ============================================================
   EXPAND / COLLAPSE — BOTTOM HALF (Cam)
   ============================================================ */

/**
 * Expands weather cam to fill the full bottom half.
 * Collapses the weather stats panel.
 * Toggles back on second call.
 */
function toggleBottomPanelExpand() {
  bottomExpanded = !bottomExpanded;

  const statsPanel = document.getElementById('statsPanel');
  const expandBtn  = document.getElementById('btnExpandBottom');
  const arrow      = document.getElementById('expandBottomArrow');

  if (bottomExpanded) {
    statsPanel.classList.add('collapsed');
    expandBtn.classList.add('active');
    arrow.innerHTML = '&#10095;'; // › point right = collapse
  } else {
    statsPanel.classList.remove('collapsed');
    expandBtn.classList.remove('active');
    arrow.innerHTML = '&#10094;'; // ‹ point left = expand
  }
}


/* ============================================================
   WEATHER — FETCH
   ============================================================ */

/**
 * Fetches forecast data from Open-Meteo.
 * No API key needed. Refreshes on a timer.
 */
async function fetchWeatherData() {
  console.log("Fetching weather from:", WEATHER_API_URL);

  try {
    const res = await fetch(WEATHER_API_URL, {
      method: "GET",
      mode: "cors",
      cache: "no-store"
    });
    console.log("Fetch success:", res);

    if (!res.ok) throw new Error("Fetch failed");

    const data = await res.json();
    console.log("Weather data:", data);

    if (!data || !data.hourly || !data.hourly.time) {
      console.error("Invalid weather data:", data);
      showWeatherError();
      return;
    }

    const currentIndex = getCurrentIndex(data.hourly.time);

    try {
      renderWeatherStats(data.hourly, data.daily, currentIndex);
      renderHourlyForecast(data.hourly, currentIndex);
    } catch (err) {
      console.error("Render failed:", err);
      showWeatherError();
    }

  } catch (err) {
    console.error("Weather failed (network level):", err);

    showWeatherError();

    const now  = new Date();
    const pad  = n => String(n).padStart(2, '0');
    const container = document.getElementById('hourlyList');
    container.innerHTML = '';

    for (let i = 0; i < 12; i++) {
      const hour = pad((now.getHours() + i) % 24);
      const item = document.createElement('div');
      item.className = 'hourlyItem' + (i === 0 ? ' current' : '');
      item.innerHTML = `
        <div class="hourlyTime">${hour}:00</div>
        <div class="hourlyIcon">&mdash;</div>
        <div class="hourlyTemp">&mdash;</div>
      `;
      container.appendChild(item);
    }
  }
}


/* ============================================================
   WEATHER — UTILITIES
   ============================================================ */

/**
 * Finds the index in hourly.time that corresponds to the current hour.
 * Open-Meteo returns local times as "YYYY-MM-DDTHH:MM" (no offset),
 * so we build a matching string from the browser's local clock.
 *
 * Works correctly when the browser timezone matches the location
 * (Eastern Time for Wheelersburg, OH).
 *
 * @param {string[]} hourlyTimes
 * @returns {number}
 */
function getCurrentIndex(hourlyTimes) {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const nowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:00`;

  let index = 0;
  for (let i = 0; i < hourlyTimes.length; i++) {
    if (hourlyTimes[i] <= nowStr) {
      index = i;
    } else {
      break; // times are ascending — safe to stop
    }
  }

  if (index < 0 || index >= hourlyTimes.length) {
    index = 0;
  }

  return index;
}


/**
 * Maps an Open-Meteo WMO weathercode to a label and emoji icon.
 * Full code table: open-meteo.com/en/docs#weathervariables
 *
 * @param {number} code
 * @returns {{ label: string, icon: string }}
 */
function mapWeatherCode(code) {
  if (code === 0)                 return { label: 'Clear',         icon: '☀️'  };
  if (code === 1)                 return { label: 'Mostly Clear',  icon: '🌤️' };
  if (code === 2)                 return { label: 'Partly Cloudy', icon: '⛅'  };
  if (code === 3)                 return { label: 'Cloudy',        icon: '☁️'  };
  if (code >= 45 && code <= 48)  return { label: 'Fog',           icon: '🌫️' };
  if (code >= 51 && code <= 57)  return { label: 'Drizzle',       icon: '🌦️' };
  if (code >= 61 && code <= 67)  return { label: 'Rain',          icon: '🌧️' };
  if (code >= 71 && code <= 77)  return { label: 'Snow',          icon: '❄️'  };
  if (code >= 80 && code <= 82)  return { label: 'Showers',       icon: '🌦️' };
  if (code === 85 || code === 86) return { label: 'Snow Showers',  icon: '🌨️' };
  if (code >= 95 && code <= 99)  return { label: 'Storm',         icon: '⛈️'  };
  return { label: 'Unknown', icon: '🌡️' };
}


/**
 * Formats the time portion of an Open-Meteo ISO-like string.
 * Input:  "2024-04-03T07:25"
 * Output: "7:25 AM"
 *
 * @param {string} isoStr
 * @returns {string}
 */
function formatLocalTime(isoStr) {
  const timePart = (isoStr || '').split('T')[1] || '00:00';
  const [h, m]   = timePart.split(':').map(Number);
  const period   = h >= 12 ? 'PM' : 'AM';
  const hour     = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}


/* ============================================================
   WEATHER — RENDER HOURLY FORECAST
   ============================================================ */

/**
 * Builds and injects hourly forecast cards into #hourlyList.
 * Displays the next 24 hours starting from the current hour.
 *
 * @param {object} hourly     - hourly object from Open-Meteo response
 * @param {number} startIndex - index of the current hour
 */
function renderHourlyForecast(hourly, startIndex) {
  const container  = document.getElementById('hourlyList');
  const hoursToShow = 24;
  const endIndex   = Math.min(startIndex + hoursToShow, hourly.time.length);

  container.innerHTML = '';

  for (let i = startIndex; i < endIndex; i++) {
    const condition = mapWeatherCode(hourly.weathercode[i]);
    const temp      = Math.round(hourly.temperature_2m[i]);
    const timeLabel = formatLocalTime(hourly.time[i]);

    const item = document.createElement('div');
    item.className = 'hourlyItem' + (i === startIndex ? ' current' : '');
    item.innerHTML = `
      <div class="hourlyTime">${timeLabel}</div>
      <div class="hourlyIcon">${condition.icon}</div>
      <div class="hourlyTemp">${temp}&deg;</div>
    `;
    container.appendChild(item);
  }
}


/* ============================================================
   WEATHER — RENDER STATS PANEL
   ============================================================ */

/**
 * Populates the bottom-left stats panel with current conditions.
 *
 * @param {object} hourly - hourly object from Open-Meteo response
 * @param {object} daily  - daily object from Open-Meteo response
 * @param {number} index  - current hour index
 */
function renderWeatherStats(hourly, daily, index) {
  const condition = mapWeatherCode(hourly.weathercode[index]);
  const temp      = Math.round(hourly.temperature_2m[index]);
  const wind      = Math.round(hourly.windspeed_10m[index]);
  const rain      = hourly.precipitation_probability[index] ?? 0;

  document.getElementById('valTemp').textContent          = `${temp}\u00B0F`;
  document.getElementById('valWind').textContent          = `${wind} mph`;
  document.getElementById('valRain').textContent          = `${rain}%`;
  document.getElementById('valConditionIcon').textContent = condition.icon;
  document.getElementById('valConditionText').textContent = condition.label;

  // Sunrise / Sunset from daily[0] (today)
  document.getElementById('valSunrise').textContent = formatLocalTime(daily.sunrise[0]);
  document.getElementById('valSunset').textContent  = formatLocalTime(daily.sunset[0]);

  // Timestamp
  const now = new Date();
  document.getElementById('lastUpdated').textContent = 'Updated ' + now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}


/* ============================================================
   WEATHER — ERROR STATE
   ============================================================ */

/** Displays fallback values in all weather elements on API failure. */
function showWeatherError() {
  ['valTemp', 'valWind', 'valRain', 'valSunrise', 'valSunset'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '\u2014'; // em dash
  });
  document.getElementById('valConditionIcon').textContent = '\u26A0\uFE0F'; // ⚠️
  document.getElementById('valConditionText').textContent = 'Unavailable';
  document.getElementById('lastUpdated').textContent      = 'Failed to load';
  document.getElementById('hourlyList').innerHTML =
    '<p class="loadingMsg">Weather data unavailable</p>';
}


/* ============================================================
   WEBCAM FEED
   ============================================================ */

/**
 * Initializes the sky cam video element if a stream URL is set.
 *
 * For HLS (.m3u8) streams:
 *   1. Add <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script> to index.html
 *   2. Replace the src assignment below with:
 *      const hls = new Hls();
 *      hls.loadSource(CAM_STREAM_URL);
 *      hls.attachMedia(camFeed);
 */
function initCamFeed() {
  if (!CAM_STREAM_URL) return; // No stream configured — placeholder stays visible

  const camFeed        = document.getElementById('camFeed');
  const camPlaceholder = document.getElementById('camPlaceholder');
  const camStatus      = document.getElementById('camStatus');

  camFeed.src = CAM_STREAM_URL;

  camFeed.addEventListener('loadeddata', () => {
    camPlaceholder.style.display = 'none';
    camStatus.textContent = 'Live';
    camStatus.classList.add('online');
  });

  camFeed.addEventListener('error', () => {
    camStatus.textContent = 'Error';
    camStatus.classList.remove('online');
  });
}


/* ============================================================
   INIT
   ============================================================ */
(function init() {
  loadYouTubeStream();

  // Clock: start immediately, update every second
  updateClock();
  setInterval(updateClock, 1000);

  // Weather: fetch now, then refresh every 15 minutes
  fetchWeatherData();
  setInterval(fetchWeatherData, WEATHER_REFRESH_MS);

  // Webcam: only activates if CAM_STREAM_URL is set
  initCamFeed();
})();

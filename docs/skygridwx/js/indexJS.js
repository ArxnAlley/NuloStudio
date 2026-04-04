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
 * Hayden: fallback stream for the top-left YouTube quadrant.
 * This video is used only when neither monitored channel is live.
 * Replace this ID if you want a different default stream.
 */
const YT_FALLBACK_VIDEO_ID = 'EptQj6Q9ykY';

/**
 * Open-Meteo forecast API — Wheelersburg, OH (38.73, -82.99)
 * No API key required.
 */
const WEATHER_API_URL = (() => {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude',          '38.73');
  url.searchParams.set('longitude',         '-82.99');
  url.searchParams.set('hourly',            'temperature_2m,precipitation_probability,weathercode,windspeed_10m');
  url.searchParams.set('daily',             'sunrise,sunset');
  url.searchParams.set('timezone',          'auto');
  url.searchParams.set('temperature_unit',  'fahrenheit');
  url.searchParams.set('wind_speed_unit',   'mph');
  url.searchParams.set('precipitation_unit','inch');
  url.searchParams.set('forecast_days',     '2');
  return url.toString();
})();

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

/**
 * How long (ms) to wait for the Ryan Hall iframe to respond before
 * falling back to Y'allBot. 3 seconds is enough for a normal load.
 */


/* ────────────────────────────────────────────────────────────
   STATE
   ──────────────────────────────────────────────────────────── */
let activeYtSource = 'ryanHall';
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

function setYoutubeIframeVideo(videoId) {
  const iframe = document.getElementById('youtubeQuadrantIframe');
  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&modestbranding=1`;
}

/**
 * Loads the YouTube quadrant stream with this priority:
 * 1. Ryan Hall live
 * 2. Y'allBot live
 * 3. Fallback weather stream
 *
 * Hayden: the API key is never used here. The frontend only calls
 * /api/getLiveStream, and the backend keeps the YouTube key private.
 */
async function loadYouTubeStream() {
  try {
    const [ryanResponse, yallbotResponse] = await Promise.all([
      fetch('/api/getLiveStream?channel=ryan'),
      fetch('/api/getLiveStream?channel=yallbot')
    ]);

    const [ryanData, yallbotData] = await Promise.all([
      ryanResponse.json(),
      yallbotResponse.json()
    ]);

    let videoId = YT_FALLBACK_VIDEO_ID;
    let source = 'fallback';

    if (ryanResponse.ok && ryanData.live) {
      videoId = ryanData.videoId;
      source = 'ryanHall';
    } else if (yallbotResponse.ok && yallbotData.live) {
      videoId = yallbotData.videoId;
      source = 'yallBot';
    }

    activeYtSource = source;
    setYoutubeIframeVideo(videoId);
    setActiveYoutubeButton(source);
  } catch (err) {
    console.error('[SkyGrid] Failed to load YouTube stream:', err);
    activeYtSource = 'fallback';
    setYoutubeIframeVideo(YT_FALLBACK_VIDEO_ID);
    setActiveYoutubeButton('fallback');
  }
}

/**
 * Manual button override for the two monitored channels.
 * This keeps the existing UI while resolving the current live
 * video through the backend endpoint.
 *
 * @param {'ryanHall'|'yallBot'} source
 */
async function switchYoutubeSource(source) {
  const channel = source === 'ryanHall' ? 'ryan' : 'yallbot';

  try {
    const response = await fetch(`/api/getLiveStream?channel=${channel}`);
    const data = await response.json();
    const videoId = response.ok && data.live && data.videoId
      ? data.videoId
      : YT_FALLBACK_VIDEO_ID;
    const resolvedSource = response.ok && data.live && data.videoId
      ? source
      : 'fallback';

    activeYtSource = resolvedSource;
    setYoutubeIframeVideo(videoId);
    setActiveYoutubeButton(resolvedSource);
  } catch (err) {
    console.error('[SkyGrid] Failed to switch YouTube source:', err);
    activeYtSource = 'fallback';
    setYoutubeIframeVideo(YT_FALLBACK_VIDEO_ID);
    setActiveYoutubeButton('fallback');
  }
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
  try {
    const res = await fetch(WEATHER_API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data         = await res.json();
    const currentIndex = getCurrentIndex(data.hourly.time);

    renderWeatherStats(data.hourly, data.daily, currentIndex);
    renderHourlyForecast(data.hourly, currentIndex);

  } catch (err) {
    console.error('[SkyGrid] Weather fetch failed:', err);
    showWeatherError();
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
    const rain      = hourly.precipitation_probability[i] ?? 0;
    const wind      = Math.round(hourly.windspeed_10m[i]);
    const timeLabel = formatLocalTime(hourly.time[i]);

    const item = document.createElement('div');
    item.className = 'hourlyItem' + (i === startIndex ? ' current' : '');
    item.innerHTML = `
      <div class="hourlyTime">${timeLabel}</div>
      <div class="hourlyIcon">${condition.icon}</div>
      <div class="hourlyTemp">${temp}&deg;</div>
      <div class="hourlyRain">${rain}%</div>
      <div class="hourlyWind">${wind}&nbsp;mph</div>
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
document.addEventListener('DOMContentLoaded', loadYouTubeStream);

(function init() {
  // Clock: start immediately, update every second
  updateClock();
  setInterval(updateClock, 1000);

  // Weather: fetch now, then refresh every 15 minutes
  fetchWeatherData();
  setInterval(fetchWeatherData, WEATHER_REFRESH_MS);

  // Webcam: only activates if CAM_STREAM_URL is set
  initCamFeed();
})();

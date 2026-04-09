/*
   Hayden — This dashboard uses a backend data source (Cloudflare Worker by default).

   CURRENT SETUP:
   - The frontend calls a Worker endpoint for weather + external data
   - No API keys or secrets exist in this frontend
   - All sensitive logic is handled server-side

   YOUR OPTIONS:

   1) Use the existing Cloudflare Worker
      - You’ll be given access to the Worker project
      - Update logic there if needed
      - Redeploy using Wrangler (Cloudflare CLI)

   2) Replace with your own backend (Firebase, Supabase, custom API, etc.)
      - Update the WORKER_URL in this file
      - Your API must return the same data structure

   IMPORTANT:
   - Do NOT place API keys or secrets in this frontend
   - The UI depends on a consistent response format
   - If the backend structure changes, update the frontend mapping

   EXPECTED RESPONSE FORMAT:
   {
     location: { lat, lon, timezone },

     current: { time, temperature, windspeed, weathercode },

     hourly:
     {
       time: [],
       temperature_2m: [],
       precipitation_probability: [],
       windspeed_10m: [],
       weathercode: []
     },

     daily:
     {
       sunrise: [],
       sunset: []
     }
   }
*/

/*  =================================
   CONFIGURATION
================================== */

'use strict';

/*  =================================
   YOUTUBE SOURCES
================================== */

const YT_SOURCES = 
{

  ryanHall: "https://www.youtube-nocookie.com/embed/live_stream?channel=UCNMbegBD9OjH4Eza8vVjBMg&autoplay=1&mute=1",

  yallBot: "https://www.youtube-nocookie.com/embed/EptQj6Q9ykY?autoplay=1&mute=1"

};

const WORKER_URL = "https://skygrid-weather.alley-aron97.workers.dev";

/*
   Hayden — Weather Cam Setup

   This controls your live Weather Cam feed on the dashboard.

   HOW TO USE:

   1) Paste your camera stream URL into CAM_STREAM_URL below
   2) Save the file
   3) Refresh the dashboard

   SUPPORTED FORMATS:
   - .m3u8 (recommended for live streams)
   - .mp4
   - Any browser-compatible video stream

   IMPORTANT:
   - Leave blank = camera shows OFFLINE
   - RTSP links will NOT work directly in browsers
   - If your stream fails, the dashboard will fallback to OFFLINE

   EXAMPLE:
   const CAM_STREAM_URL = 'https://your-stream-url.m3u8';
*/

const CAM_STREAM_URL = ''; /* Paste your camera stream URL here */

const WEATHER_REFRESH_MS = 15 * 60 * 1000;

let topExpanded = false;

let bottomExpanded = false;

let lastVideoId = null;

/* Clock Cache */

let _elClockTime, _elClockAmPm, _elClockDate;

let backgroundSettings =

{

  mode: "static", /* Modes */

  selected: "default"

};


let layoutConfig = 
[

  { slotId: "youtubePanel", position: "topLeft" },

  { slotId: "forecastPanel", position: "topRight" },

  { slotId: "statsPanel", position: "bottomLeft" },

  { slotId: "camPanel", position: "bottomRight" }

];


let selectedSlot = null;

let editMode = false;

const defaultLayout = 
[

  { slotId: "youtubePanel", position: "topLeft" },

  { slotId: "forecastPanel", position: "topRight" },

  { slotId: "statsPanel", position: "bottomLeft" },

  { slotId: "camPanel", position: "bottomRight" }

];

let tempLayout = null;

let tempTopExpanded = false;

let tempBottomExpanded = false;

let layoutChanged = false;

function applyBackground(weatherCode) 
{

  let value = "default";

  if (backgroundSettings.mode === "static") 
  {
  
    value = backgroundSettings.selected;

  } 
  
  else if (backgroundSettings.mode === "time" || backgroundSettings.mode === "weather") 
  {
  
    const now = new Date();
  
    const sunrise = window.currentSunriseISO ? new Date(window.currentSunriseISO) : null;
  
    const sunset = window.currentSunsetISO  ? new Date(window.currentSunsetISO)  : null;
  
    const isDaytime = sunrise && sunset && now >= sunrise && now < sunset;

  
    if (!isDaytime) 
    {
    
      value = "nighttime";
  
    } 
    
    else if (backgroundSettings.mode === "time") 
    {
    
      const hour = now.getHours();
    
      if (hour < 12) value = "morning";
    
      else if (hour < 18) value = "afternoon";
    
      else value = "evening";
  
    } 
    
    else 
    {
    
      const code = weatherCode ?? 0;
    
      if (code === 0 || code === 1) value = "sunny";
    
      else if (code === 45 || code === 48) value = "foggy";
    
      else if (code >= 51 && code <= 67 || code >= 80 && code <= 82) value = "rain";
    
      else if (code >= 95) value = "storm";
    
      else value = "nighttime";
  
    }

  }

  document.body.dataset.bg = value;

}

function toggleEditMode() 
{

  editMode = !editMode;

  document.body.classList.toggle('editMode', editMode);

  if (editMode) 
  {
  
    tempTopExpanded = topExpanded;
  
    tempBottomExpanded = bottomExpanded;
  
    layoutChanged = false;
  
    if (topExpanded) toggleTopPanelExpand();
  
    if (bottomExpanded) toggleBottomPanelExpand();
  
    tempLayout = JSON.parse(JSON.stringify(layoutConfig));

  } 
  
  else 
  {
  
    tempLayout = null;

  }

}

function swapPanels(idA, idB) 
{

  const a = document.getElementById(idA);

  const b = document.getElementById(idB);

  if (!a || !b || a === b) return;

  const aParent = a.parentNode;

  const bParent = b.parentNode;

  const aNext = a.nextSibling === b ? b.nextSibling : a.nextSibling;

  const bNext = b.nextSibling === a ? a.nextSibling : b.nextSibling;


  aParent.insertBefore(b, aNext);

  bParent.insertBefore(a, bNext);

  document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));

  selectedSlot = null;

  updateControlBars();

  updateControlBarPositions();

  updateSlotNumbers();

}

function getPanelPosition(panelId) 
{

  const panel = document.getElementById(panelId);

  if (!panel || !panel.parentNode) return null;

  return panel.parentNode.firstElementChild === panel ? 'left' : 'right';

}

function updateSlotNumbers() 
{

  const topRow = document.getElementById('topRow');

  const bottomRow = document.getElementById('bottomRow');

  [

    { el: topRow.children[0], num: 1 },

    { el: topRow.children[1], num: 2 },

    { el: bottomRow.children[0], num: 3 },

    { el: bottomRow.children[1], num: 4 }

  ]
  
  .forEach(({ el, num }) =>   
  {
  
    if (el) el.dataset.slotNum = num;

  });

}

function updateControlBarPositions() 
{

  const ytPos = getPanelPosition('youtubePanel');

  const camPos = getPanelPosition('camPanel');

  const ytBar = document.getElementById('youtubeControlBar');

  const camBar = document.getElementById('camControlBar');

  ytBar.classList.toggle('controlLeft',  ytPos === 'right');

  ytBar.classList.toggle('controlRight', ytPos === 'left');

  camBar.classList.toggle('controlLeft',  camPos === 'right');

  camBar.classList.toggle('controlRight', camPos === 'left');

  /* Arrows */
  const ytArrow = document.getElementById('expandTopArrow');

  if (ytArrow) 
  {
  
    const ytInward  = ytPos === 'left' ? '&#10095;' : '&#10094;';
  
    const ytOutward = ytPos === 'left' ? '&#10094;' : '&#10095;';
  
    ytArrow.innerHTML = topExpanded ? ytOutward : ytInward;

  }

  const camArrow = document.getElementById('expandBottomArrow');

  const btnAlt = document.getElementById('btnExpandBottomAlt');

  const camAltArrow = btnAlt ? btnAlt.querySelector('.arrowIcon') : null;

  const camInward = camPos === 'right' ? '&#10094;' : '&#10095;';

  const camOutward = camPos === 'right' ? '&#10095;' : '&#10094;';

  if (camArrow) camArrow.innerHTML = bottomExpanded ? camOutward : camInward;

  if (camAltArrow) camAltArrow.innerHTML = bottomExpanded ? camOutward : camInward;

}

function updateControlBars() 
{

  const yt = document.getElementById('youtubePanel');

  const cam = document.getElementById('camPanel');

  const shared = yt.parentNode === cam.parentNode;

  document.getElementById('topRow').classList.toggle('sharedRow', shared && yt.parentNode.id === 'topRow');

  document.getElementById('bottomRow').classList.toggle('sharedRow', shared && yt.parentNode.id === 'bottomRow');

}

/*  =================================
   CLOCK
   ================================= */

function updateClock() 
{

  const now = new Date();

  const h = now.getHours();

  const pad = n => String(n).padStart(2, '0');


  /* Time Digits */
  _elClockTime.textContent =

  `${pad(h % 12 || 12)}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;


  _elClockAmPm.textContent = h >= 12 ? 'PM' : 'AM';


  _elClockDate.textContent = now.toLocaleDateString('en-US', 
  {

    weekday: 'long',

    month: 'long',

    day: 'numeric',

    year: 'numeric'

  });

}

/*  =================================
   YOUTUBE
   ================================= */

function setActiveYoutubeButton(source) 
{

  document.getElementById('btnRyanHall').classList.toggle('active', source === 'ryanHall');

  document.getElementById('btnYallBot').classList.toggle('active', source === 'yallBot');

}

function setYoutubeIframeSrc(src) 
{

  document.getElementById('youtubeQuadrantIframe').src = src;

}



async function loadYouTubeStream() 
{

  const iframe = document.getElementById('youtubeQuadrantIframe');

  if (!lastVideoId) 
  {
  
    iframe.src = '';
  
    iframe.title = 'Loading stream...';

  }

  try 
  {
  
    const res = await fetch(WORKER_URL + '/youtube');
  
    const data = await res.json();

    if (data.videoId && data.videoId !== lastVideoId) 
    {
    
      lastVideoId = data.videoId;
    
      iframe.src = `https://www.youtube.com/embed/${data.videoId}?autoplay=1&mute=1`;
  
    }

  } 
  
  catch 
  {
  
    if (lastVideoId) 
    {
    
      iframe.src = `https://www.youtube.com/embed/${lastVideoId}?autoplay=1&mute=1`;
  
    }

  }

}



function switchYoutubeSource(source) 
{

  if (!(source in YT_SOURCES)) return;

  setYoutubeIframeSrc(YT_SOURCES[source]);

  setActiveYoutubeButton(source);

}

/*  =================================
   PANELS
   ================================= */

function toggleTopPanelExpand() 
{

  topExpanded = !topExpanded;

  const ytPanel = document.getElementById('youtubePanel');

  const sibling = Array.from(ytPanel.parentNode.children).find(el => el !== ytPanel);

  const expandBtn = document.getElementById('btnExpandTop');

  const arrow = document.getElementById('expandTopArrow');

  const ytPos = getPanelPosition('youtubePanel');

  const arrowInward = ytPos === 'left' ? '&#10095;' : '&#10094;'; 

  const arrowOutward = ytPos === 'left' ? '&#10094;' : '&#10095;';

  if (topExpanded) 
  {
  
    if (sibling) { sibling.classList.add('collapsed'); sibling.classList.remove('expanded'); }

    ytPanel.classList.add('expanded');

    expandBtn.classList.add('active');

    arrow.innerHTML = arrowOutward;

  } 
  
  else 
  {
  
    if (sibling) { sibling.classList.remove('collapsed'); }
  
    ytPanel.classList.remove('expanded');
  
    expandBtn.classList.remove('active');
  
    arrow.innerHTML = arrowInward;
  
    setTimeout(() => fetchWeatherData(), 100);

  }

}



function toggleBottomPanelExpand() 
{

  bottomExpanded = !bottomExpanded;

  const camPanelEl = document.getElementById('camPanel');

  const sibling = Array.from(camPanelEl.parentNode.children).find(el => el !== camPanelEl);

  const btnMain = document.getElementById('btnExpandBottom');

  const btnAlt = document.getElementById('btnExpandBottomAlt');

  const arrowMain = btnMain ? btnMain.querySelector('.arrowIcon') : null;

  const arrowAlt = btnAlt  ? btnAlt.querySelector('.arrowIcon')  : null;

  const camPos = getPanelPosition('camPanel');

  const arrowInward = camPos === 'right' ? '&#10094;' : '&#10095;'; /* Inward */

  const arrowOutward = camPos === 'right' ? '&#10095;' : '&#10094;'; /* Outward */

  if (bottomExpanded) 
  {
  
    if (sibling) { sibling.classList.add('collapsed'); sibling.classList.remove('expanded'); }
  
    camPanelEl.classList.add('expanded');
  
    if (btnMain) { btnMain.classList.add('active'); if (arrowMain) arrowMain.innerHTML = arrowOutward; }
  
    if (btnAlt)  { btnAlt.classList.add('active'); if (arrowAlt)  arrowAlt.innerHTML  = arrowOutward; }

  } 
  
  else 
  {

    if (sibling) sibling.classList.remove('collapsed');

    camPanelEl.classList.remove('expanded');

    if (btnMain) { btnMain.classList.remove('active'); if (arrowMain) arrowMain.innerHTML = arrowInward; }

    if (btnAlt)  { btnAlt.classList.remove('active');  if (arrowAlt)  arrowAlt.innerHTML  = arrowInward; }

  }

}

/*  =================================
   WEATHER FETCH
   ================================= */

async function fetchWeatherData() 
{

  try 
  {
  
    const res = await fetch(WORKER_URL);
  
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    if (!data || !data.hourly || !data.current) throw new Error('Invalid data shape');

    const currentIndex = getCurrentIndex(data.hourly.time);

    window.currentWeatherCode = data.current.weatherCode;

    window.currentSunriseISO = data.daily.sunrise?.[0] ?? null;

    window.currentSunsetISO = data.daily.sunset?.[0]  ?? null;

    if (backgroundSettings.mode === 'weather') 
    {
    
      applyBackground(window.currentWeatherCode);
  
    }

    renderWeatherStats(data.current, data.daily, data.precipitationTimeline || []);
  
    renderAlerts(data.alerts || []);
  
    renderHourlyForecast(data.hourly, currentIndex);

  } 
  
  catch (err) 
  {
  
    console.error('Weather fetch failed:', err);
  
    showWeatherError();

  }

}

/*  =================================
   WEATHER UTILITIES
   ================================= */

function getCurrentIndex(hourlyTimes) 
{

  const now = new Date();

  const pad = n => String(n).padStart(2, '0');

  const nowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:00`;

  let index = 0;

  for (let i = 0; i < hourlyTimes.length; i++) 
  {
  
    if (hourlyTimes[i] <= nowStr) 
    {
    
      index = i;
  
    } 
    
    else 
    {
    
      break; /* Sorted */
  
    }

  }

  if (index < 0 || index >= hourlyTimes.length) 
  {

    index = 0;

  }

  return index;

}



function mapWeatherCode(code) 
{

  if (code === 0) return { label: 'Clear', icon: '☀️'  };

  if (code === 1) return { label: 'Mostly Clear', icon: '🌤️' };

  if (code === 2) return { label: 'Partly Cloudy', icon: '⛅'  };

  if (code === 3) return { label: 'Cloudy', icon: '☁️'  };

  if (code >= 45 && code <= 48)  return { label: 'Fog', icon: '🌫️' };

  if (code >= 51 && code <= 57)  return { label: 'Drizzle', icon: '🌦️' };

  if (code >= 61 && code <= 67)  return { label: 'Rain', icon: '🌧️' };

  if (code >= 71 && code <= 77)  return { label: 'Snow', icon: '❄️'  };

  if (code >= 80 && code <= 82)  return { label: 'Showers', icon: '🌦️' };

  if (code === 85 || code === 86) return { label: 'Snow Showers', icon: '🌨️' };

  if (code >= 95 && code <= 99)  return { label: 'Storm', icon: '⛈️'  };

  return { label: 'Unknown', icon: '🌡️' };

}





function formatLocalTime(isoStr) 
{

  const timePart = (isoStr || '').split('T')[1] || '00:00';

  const [h, m] = timePart.split(':').map(Number);

  const period = h >= 12 ? 'PM' : 'AM';

  const hour = h % 12 || 12;

  return `${hour}:${String(m).padStart(2, '0')} ${period}`;

}

/*  =================================
   RENDERING
   ================================= */

function renderHourlyForecast(hourly, startIndex)
{

  const topRow = document.getElementById('hourlyTopRow');

  const bottomRow = document.getElementById('hourlyBottomRow');

  topRow.innerHTML = '';

  bottomRow.innerHTML = '';

  const endIndex = Math.min(startIndex + 12, hourly.time.length);

  for (let i = startIndex; i < endIndex; i++)
  {
  
    const condition = mapWeatherCode(hourly.weathercode[i]);
  
    const temp = Math.round(hourly.temperature_2m[i]);
  
    const timeLabel = formatLocalTime(hourly.time[i]);

    const item = document.createElement('div');
  
    item.className = 'hourlyItem' + (i === startIndex ? ' current' : '');

    item.innerHTML = `

    <div class="hourlyTime">${timeLabel}</div>

    <div class="hourlyIcon">${condition.icon}</div>

    <div class="hourlyTemp">${temp}&deg;</div>

    `;

    if (i < startIndex + 6)

    {

      topRow.appendChild(item);

    }

    else

    {

      bottomRow.appendChild(item);

    }

  }

}



function renderWeatherStats(current, daily, precipTimeline) 
{

  const condition = mapWeatherCode(current.weatherCode);

  const tempF = Math.round(current.temp);

  const feelsF = Math.round(current.feelsLike);

  const windSpd = Math.round(current.windSpeed);

  const windGust = Math.round(current.windGust ?? 0);

  const windDir = current.windDirection ?? 0;

  /* Temperature */
  const feelsHtml = tempF !== feelsF

  ? `${tempF}\u00B0F<span class="feelsLike">feels like ${feelsF}\u00B0</span>`

  : `${tempF}\u00B0F`;

  document.getElementById('valTemp').innerHTML = feelsHtml;

  /* Wind */
  const windHtml = `<span class="windArrow" style="transform:rotate(${windDir}deg)">&#8593;</span> ${windSpd} mph`;

  document.getElementById('valWind').innerHTML = windHtml;

  /* Gusts */

  const windGustEl = document.getElementById('valWindGust');

  if (windGustEl)
  {

    windGustEl.textContent = windGust > 0

    ? `Wind Gust: ${windGust} mph`

    : '';
  }

  /* Rain */
  const seg = precipTimeline.find(s => new Date(s.end) > new Date()) ?? null;

  if (seg)
  {

    const fmtHour = iso => new Date(iso).toLocaleString('en-US', { hour: 'numeric', hour12: true });

    const startStr = fmtHour(seg.start);

    const endStr = fmtHour(seg.end);

    const wrapAmPm = str => str.replace(/(AM|PM)/g, '<small>$1</small>');

    document.getElementById('valRain').innerHTML = `\u{1F327} ${wrapAmPm(startStr)}\u2009\u2013\u2009${wrapAmPm(endStr)}`;

    const rainIntensityEl = document.getElementById('valRainIntensity');

    if (rainIntensityEl)
    {

      const intensity = seg?.intensity || '';

      let intensityText = '';

      if (intensity === 'light') intensityText = 'LIGHT';
      else if (intensity === 'moderate') intensityText = 'MODERATE';
      else if (intensity === 'heavy') intensityText = 'HEAVY';

      rainIntensityEl.textContent = intensityText ? intensityText + ' ' : '';

    }

  }

  else
  {

    document.getElementById('valRain').textContent = 'None';

    const rainIntensityEl = document.getElementById('valRainIntensity');

    if (rainIntensityEl) rainIntensityEl.textContent = '';

  }

    /* Rain Nudge */

  const rainNextEl = document.getElementById('valRainNext');

  if (rainNextEl)
  {

    let nudgeText = '';

    const nextSeg = precipTimeline.find(s => new Date(s.end) > new Date()) ?? null;

    if (nextSeg)
    {
      try
      {
        const startStr = nextSeg.start;
        const endStr = nextSeg.end;
        const startDate = new Date(startStr + ':00-04:00');
        const endDate = new Date(endStr + ':00-04:00');
        const nowDate = new Date();

        const now = new Date();
        const nowEastern = new Date(
          now.toLocaleString('en-US', { timeZone: 'America/New_York' })
        );

        const startHour = parseInt(startStr.slice(11, 13), 10);

        const isCurrentlyRaining = nowDate >= startDate && nowDate < endDate;

        if (isCurrentlyRaining)
        {
          nudgeText = '';
        }
        else
        {
          const diffMin = Math.round((startDate - nowEastern) / 60000);

          if (diffMin <= 1 && diffMin > 0)
          {
            nudgeText = 'Rain starting now';
          }
          else if (diffMin > 1 && diffMin <= 60)
          {
            nudgeText = `Rain in ${diffMin} mins`;
          }
          else
          {
            if (startHour >= 18)
            {
              nudgeText = 'Tonight';
            }
            else if (startHour >= 0 && startHour < 18)
            {
              nudgeText = 'Later today';
            }
            else
            {
              nudgeText = '';
            }
          }
        }
      }
      catch (err)
      {
        console.warn('Rain nudge fallback triggered:', err);
      }
    }

    if (nudgeText)
    {
      rainNextEl.textContent = nudgeText;
    }
    else
    {
      rainNextEl.textContent = '';
    }

  }

  /* Condition */
  document.getElementById('valConditionIcon').textContent = condition.icon;
  
  document.getElementById('valConditionText').textContent = condition.label;

  /* Sun Times */
  document.getElementById('valSunrise').textContent = formatLocalTime(daily.sunrise[0]);
  
  document.getElementById('valSunset').textContent  = formatLocalTime(daily.sunset[0]);

  /* Timestamp */
  const now = new Date();
  
  document.getElementById('lastUpdated').textContent = 'Updated ' + now.toLocaleTimeString('en-US', 
  {
  
    hour: '2-digit', minute: '2-digit', hour12: true
  
  });

}

/*  =================================
   ALERTS
   ================================= */

function renderAlerts(alerts) 
{
  
  const banner = document.getElementById('alertBanner');
  
  banner.innerHTML = '';

  if (!alerts || alerts.length === 0) 
  {
  
    banner.classList.remove('hasAlerts');
  
    return;
  
  }

  alerts.forEach(alert => 
  {
  
    const item = document.createElement('div');
  
    item.className = 'alertItem alertItem--' + (alert.severity || 'severe').toLowerCase();
  
    item.innerHTML =
  
    `<span class="alertEvent">${alert.event}</span>` +
  
    `<span class="alertHeadline">${alert.headline || ''}</span>`;
  
    banner.appendChild(item);
  
  });

  banner.classList.add('hasAlerts');

}




function showWeatherError() 
{

  ['valTemp', 'valWind', 'valRain', 'valSunrise', 'valSunset'].forEach(id => 
  {
  
    const el = document.getElementById(id);
  
    if (el) el.textContent = '\u2014';
  
  });
  
  document.getElementById('valConditionIcon').textContent = '\u26A0\uFE0F';
  
  document.getElementById('valConditionText').textContent = 'Unavailable';
  
  document.getElementById('lastUpdated').textContent = 'Failed to load';
  
  document.getElementById('hourlyTopRow').innerHTML = '<p class="loadingMsg">Weather data unavailable</p>';
  
  document.getElementById('hourlyBottomRow').innerHTML = '';
  
  renderAlerts([]);

}


/*  =================================
   WEBCAM
   ================================= */

function initCamFeed() 
{

  if (!CAM_STREAM_URL) return; /* Placeholder */

  const camFeed = document.getElementById('camFeed');

  const camPlaceholder = document.getElementById('camPlaceholder');

  const camStatus = document.getElementById('camStatus');

  camFeed.src = CAM_STREAM_URL;

  camFeed.addEventListener('loadeddata', () => 
  {
  
    camPlaceholder.style.display = 'none';
  
    camStatus.textContent = 'Live';
  
    camStatus.classList.add('online');
  
  });

  camFeed.addEventListener('error', () => 
  {
  
    camStatus.textContent = 'Error';
  
    camStatus.classList.remove('online');
  
  });

}

/*  =================================
   INIT
   ================================= */

(function init() 
{

  loadYouTubeStream();

  setInterval(loadYouTubeStream, 60000);

  /* Clock Cache */
  _elClockTime = document.getElementById('clockTime');

  _elClockAmPm = document.getElementById('clockAmPm');

  _elClockDate = document.getElementById('clockDate');

  updateClock();

  setInterval(updateClock, 1000);

  /* Weather Refresh */
  fetchWeatherData();

  setInterval(fetchWeatherData, WEATHER_REFRESH_MS);

  /* Webcam */
  initCamFeed();

  /* Menu */
  const hamburgerBtn = document.getElementById('hamburgerBtn');

  const slidePanel   = document.getElementById('slidePanel');

  const slideOverlay = document.getElementById('slideOverlay');

  hamburgerBtn.addEventListener('click', () => 
  {
  
    slidePanel.classList.toggle('open');
  
    slideOverlay.classList.toggle('open');
  
    hamburgerBtn.classList.toggle('active');
  
  });

  slideOverlay.addEventListener('click', () => 
  {
  
    slidePanel.classList.remove('open');
  
    slideOverlay.classList.remove('open');
  
    hamburgerBtn.classList.remove('active');
  
  });

  document.getElementById('layoutBtn').addEventListener('click', () => 
  {
  
    slidePanel.classList.remove('open');
  
    slideOverlay.classList.remove('open');
  
    hamburgerBtn.classList.remove('active');
  
    toggleEditMode();
  
  });

  document.querySelectorAll('input[name="bgMode"]').forEach(radio => 
  {
  
    radio.addEventListener('change', () => 
    {

      backgroundSettings.mode = radio.value;
  
      applyBackground(window.currentWeatherCode);

      slidePanel.classList.remove('open');

      slideOverlay.classList.remove('open');

      hamburgerBtn.classList.remove('active');

    });

  });

  updateControlBars();

  const allPanelIds = ['youtubePanel', 'forecastPanel', 'statsPanel', 'camPanel'];

  function showSlotNumbers(excludeId) 
  {
  
    const topRow    = document.getElementById('topRow');
  
    const bottomRow = document.getElementById('bottomRow');
  
    const slotMap = 
    [
    
      { el: topRow.children[0], num: 1 },
    
      { el: topRow.children[1], num: 2 },
    
      { el: bottomRow.children[0], num: 3 },
    
      { el: bottomRow.children[1], num: 4 }
    
    ];
    
    slotMap.forEach(({ el, num }) => 
    {
    
      if (!el || el.id === excludeId) return;
    
      const rect = el.getBoundingClientRect();
    
      const overlay = document.createElement('div');
    
      overlay.className = 'slotNumOverlay';
    
      overlay.textContent = num;
    
      overlay.style.left = (rect.left + rect.width / 2) + 'px';
    
      overlay.style.top = (rect.top  + rect.height / 2) + 'px';
    
      document.body.appendChild(overlay);
    
    });
  
  }

  function clearSlotNumbers() 
  {
  
    document.querySelectorAll('.slotNumOverlay').forEach(el => el.remove());
  
  }

  function clearEditSelection() 
  {
  
    allPanelIds.forEach(pid => 
    {
    
      const el = document.getElementById(pid);
    
      el.classList.remove('selected', 'dimmed');
    
    });
    
    clearSlotNumbers();
    
    selectedSlot = null;
  
  }

  allPanelIds.forEach(id => 
  {
  
    const panel = document.getElementById(id);
  
    panel.addEventListener('click', () => 
    {
    
      if (!editMode) return;

      if (!selectedSlot) 
      {
      
        selectedSlot = id;
      
        panel.classList.add('selected');
      
        allPanelIds.forEach(pid => 
        {
        
          if (pid !== id) document.getElementById(pid).classList.add('dimmed');
        
        });
        
        showSlotNumbers(id);
      } 
      
      else if (selectedSlot === id) 
      {
      
        clearEditSelection();
      
      } 
      
      else   
      {
      
        swapPanels(selectedSlot, id);
      
        layoutChanged = true;
      
        clearEditSelection();
      
        updateSlotNumbers();
      
      }
    
    });
  
  });

  updateControlBarPositions();

  function applyLayout(layout) 
  {
  
    const rowMap = 
    {
    
      topLeft: { row: 'topRow',    index: 0 },
    
      topRight: { row: 'topRow',    index: 1 },
    
      bottomLeft: { row: 'bottomRow', index: 0 },
    
      bottomRight: { row: 'bottomRow', index: 1 }
    
    };
    
    const topRow = document.getElementById('topRow');
    
    const bottomRow = document.getElementById('bottomRow');
    
    const slots = [null, null, null, null];
    
    layout.forEach(entry => 
    {
    
      const map = rowMap[entry.position];
    
      const panel = document.getElementById(entry.slotId);
    
    
      if (map.row === 'topRow') slots[map.index] = panel;
    
      else slots[2 + map.index] = panel;
    
    });
    
    topRow.appendChild(slots[0]);
    
    topRow.appendChild(slots[1]);
    
    bottomRow.appendChild(slots[2]);
    
    bottomRow.appendChild(slots[3]);
    
    updateControlBars();
    
    updateControlBarPositions();
  
  }

  document.getElementById('editConfirm').addEventListener('click', () => 
  {
  
    clearEditSelection();
  
    localStorage.setItem('sgLayoutConfig', JSON.stringify(layoutConfig));
  
    tempLayout = null;
  
    if (editMode) toggleEditMode();
  
  });

  function renderLayout() 
  {
  
    applyLayout(layoutConfig); /* Layout */
  
  }

  document.getElementById('editReset').addEventListener('click', () => 
  {
  
    clearEditSelection();
  
    layoutConfig = JSON.parse(JSON.stringify(defaultLayout));
  
    renderLayout();
  
    localStorage.setItem('sgLayoutConfig', JSON.stringify(layoutConfig));
  
    tempLayout = null;
  
    layoutChanged = false;
  
    if (editMode) toggleEditMode();
  
  });

  document.getElementById('editCancel').addEventListener('click', () => 
  {
  
    clearEditSelection();
  
    if (tempLayout && layoutChanged) 
    {
    
      layoutConfig = JSON.parse(JSON.stringify(tempLayout));
    
      renderLayout();
    
    }
    
    tempLayout = null;
    
    layoutChanged = false;
    
    if (editMode) toggleEditMode();
    
    if (tempTopExpanded) toggleTopPanelExpand();
    
    if (tempBottomExpanded) toggleBottomPanelExpand();
  
  });

  applyBackground();

  setInterval(() =>
  {
    
    if (backgroundSettings.mode === "time")
    {
      
      applyBackground();
    
    }

  }, 60000);

})();


/*  =================================
   RADAR TOGGLE
   ================================= */

(function initRadarToggle() 
{

  const radarToggleBtn = document.getElementById('radarToggleBtn');

  const radarOverlay = document.getElementById('radarOverlay');

  const slidePanel = document.getElementById('slidePanel');

  const slideOverlay = document.getElementById('slideOverlay');

  const hamburgerBtn = document.getElementById('hamburgerBtn');

  const quadrants = 
  [
  
    document.getElementById('youtubePanel'),
  
    document.getElementById('forecastPanel'),
  
    document.getElementById('statsPanel'),
  
    document.getElementById('camPanel')
  ];

  radarToggleBtn.addEventListener('click', () => 
  {

    const isActive = document.body.classList.toggle('radarActive');

    /* Menu Reset */
    slidePanel.classList.remove('open');
  
    slideOverlay.classList.remove('open');
  
    hamburgerBtn.classList.remove('active');

    if (isActive) 
    {

      radarOverlay.style.display = 'block';

      quadrants.forEach(el => 
      {
      
        el.style.opacity = '0';
      
        el.style.pointerEvents = 'none';
      
      });

    } 
    
    else 
    {

      radarOverlay.style.display = 'none';

      quadrants.forEach(el => 
      {
      
        el.style.opacity = '';
      
        el.style.pointerEvents = '';
      
      });

    }

  });

})();


/*  =================================
   RADAR MAP
   ================================= */

(function initRadarMap() 
{

  let loaded = false;

  function loadLeaflet(callback) 
  {

    if (window.L) 
    {
    
      /* Load Guard */
    
      setTimeout(callback, 0);
    
      return;
    
    }

    const link  = document.createElement('link');
    
    link.rel = 'stylesheet';
    
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    
    document.head.appendChild(link);

    const script  = document.createElement('script');
    
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    
    script.onload = callback;
    
    document.head.appendChild(script);

  }

  async function buildMap() 
  {

    if (loaded) return;
  
    loaded = true;

    const map = L.map('radarMap', 
    {
    
      center: [38.73, -82.99],
    
      zoom: 7
    
    });

    L.tileLayer
    (
      
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      
      {
      
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      
        subdomains: 'abcd',
      
        maxZoom: 19
      
      }
    
    ).addTo(map);

    try 
    {

      const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    
      const data = await res.json();
    
      const frames = data.radar?.past;

      if (!frames || !frames.length) return;

      const latest = frames[frames.length - 1];

      L.tileLayer
      (
      
        `${data.host}${latest.path}/256/{z}/{x}/{y}/2/1_1.png`,
      
        {
      
          opacity: 0.6,
      
          attribution: 'RainViewer'
      
        }
      
      ).addTo(map);

    } 
    
    catch (err) 
    {
    
      console.error('Radar fetch failed:', err);
    
    }

    /* Locate */
    
    const locBtn = document.getElementById('radarLocateBtn');
    
    if (locBtn) 
    {
    
      locBtn.addEventListener('click', () => 
      {
    
        map.setView([38.73, -82.99], 8);
      
      });
    
    }

  }

  /* Radar Watch */
  
  const observer = new MutationObserver(() => 
  {
  
    if (document.body.classList.contains('radarActive')) 
    {
    
      loadLeaflet(buildMap);
    
    }
  
  });

  observer.observe(document.body, { attributeFilter: ['class'] });

})();


/*  =================================
   CONDITIONS HUD
   ================================= */

(function initConditionsHud() 
{

  const hud = document.getElementById('conditionsHud');

  const tempEl = document.getElementById('valTemp');

  const condIconEl = document.getElementById('valConditionIcon');

  const condTextEl = document.getElementById('valConditionText');

  const windEl = document.getElementById('valWind');

  const windGustEl = document.getElementById('valWindGust');

  const rainEl = document.getElementById('valRain');

  const rainNextEl = document.getElementById('valRainNext');

  const sunriseEl = document.getElementById('valSunrise');

  const sunsetEl = document.getElementById('valSunset');

  const radarToggleBtn = document.getElementById('radarToggleBtn');

  function populateConditionsHud() 
  {
    if (!hud) return;

    /* Temperature */
    let tempMain = '\u2014', feelsStr = '';
  
    if (tempEl) 
    {
    
      const clone = tempEl.cloneNode(true);
    
      const feelsEl = clone.querySelector('.feelsLike');
    
      if (feelsEl) { feelsStr = feelsEl.textContent.trim(); feelsEl.remove(); }
    
      tempMain = clone.textContent.trim();
    
    }

    /* Condition */
    const condIcon = condIconEl ? condIconEl.textContent.trim() : '';
    
    const condLabel = condTextEl ? condTextEl.textContent.trim() : '';

    /* Wind */
    let arrowDeg = 0, windSpeed = '\u2014', gustStr = '';
    
    if (windEl) 
    {
    
      const arrowSpan = windEl.querySelector('.windArrow');
    
      if (arrowSpan) 
      {
      
        const m = (arrowSpan.style.transform || '').match(/rotate\((-?[\d.]+)deg\)/);
      
        arrowDeg = m ? parseFloat(m[1]) : 0;
      
      }
      
      if (windGustEl) gustStr = windGustEl.textContent.trim();
      
      let txt = '';
      
      windEl.childNodes.forEach(n => { if (n.nodeType === Node.TEXT_NODE) txt += n.textContent; });
      
      windSpeed = txt.trim() || '\u2014';
    
    }

    /* Details */
    const rainHTML = rainEl    ? rainEl.innerHTML              : '\u2014';
    
    const rainNextStr = rainNextEl ? rainNextEl.textContent.trim() : '';
    
    const sunriseStr = sunriseEl  ? sunriseEl.textContent.trim()  : '\u2014';
    
    const sunsetStr = sunsetEl   ? sunsetEl.textContent.trim()   : '\u2014';

    hud.innerHTML =
    `<div class="hudRow hudTemp">${tempMain}` +
        (feelsStr ? `<span class="hudFeels">${feelsStr}</span>` : '') +
      `</div>` +
      (condIcon ? `<div class="hudRow hudCondition"><span>${condLabel}</span><span class="hudCondIcon">${condIcon}</span></div>` : '') +
      `<div class="hudRow hudWind">` +
        `<span class="hudArrow" style="transform:rotate(${arrowDeg}deg)">&#8593;</span>` +
        `<span>${windSpeed}</span>` +
      `</div>` +
      (gustStr      ? `<div class="hudRow hudGusts">${gustStr}</div>` : '') +
      `<div class="hudRow hudRain">${rainHTML}</div>` +
      (rainNextStr  ? `<div class="hudRow hudRainNext">${rainNextStr}</div>` : '') +
      `<div class="hudRow hudSun">&#9728;&nbsp;${sunriseStr}</div>` +
      `<div class="hudRow hudSun">&#9790;&nbsp;${sunsetStr}</div>` +
      `<button id="hudCloseBtn" title="Back to Dashboard">&#10005;</button>`;

    document.getElementById('hudCloseBtn').addEventListener('click', () => 
    {
    
      radarToggleBtn.click();
    
    });
  
  }

  const bodyObserver = new MutationObserver(() => 
  {
  
    if (document.body.classList.contains('radarActive')) populateConditionsHud();
  
  });
  
  bodyObserver.observe(document.body, { attributeFilter: ['class'] });

  const statsGrid = document.getElementById('statsGrid');
  
  if (statsGrid) 
  {
  
    const statsObserver = new MutationObserver(() => 
    {
    
      if (document.body.classList.contains('radarActive')) populateConditionsHud();
    
    });
    
    statsObserver.observe(statsGrid, { childList: true, subtree: true, characterData: true });
  
  }

})();

/*  =================================
   RADAR TICKER
   ================================= */

(function initRadarAlertTicker() 
{

  function buildTicker() 
  {

    const ticker = document.getElementById('radarAlertTicker');
  
    if (!ticker) return;

    const banner = document.getElementById('alertBanner');
  
    const hasAlerts = banner && banner.classList.contains('hasAlerts');

    if (!hasAlerts) 
    {
    
      ticker.classList.remove('tickerActive');
    
      ticker.innerHTML = '';
    
      return;
    }

    const items = banner.querySelectorAll('.alertItem');
    
    if (!items.length) 
    {
    
      ticker.classList.remove('tickerActive');
    
      ticker.innerHTML = '';
    
      return;
    }

    /* Alert Text */
    const segments = [];
    
    items.forEach(item => 
    {
    
      const eventEl = item.querySelector('.alertEvent');
    
      const headlineEl = item.querySelector('.alertHeadline');
    
      const event = eventEl    ? eventEl.textContent.trim()    : '';
    
      const headline = headlineEl ? headlineEl.textContent.trim() : '';
    
      if (event) segments.push(headline ? `${event} \u2014 ${headline}` : event);
    
    });

    if (!segments.length) 
    {
    
      ticker.classList.remove('tickerActive');
    
      ticker.innerHTML = '';
    
      return;
    
    }

    const text = segments.join('\u2003\u00B7\u2003');

    ticker.innerHTML =
      `<span class="tickerLabel">&#9888; ALERT</span>` +
      `<div class="tickerTrack">` +
        `<span class="tickerContent">${text}</span>` +
      `</div>`;

    ticker.classList.add('tickerActive');
  
  }

  /* Radar Watch */
  const bodyObserver = new MutationObserver(() => 
  {
  
    if (document.body.classList.contains('radarActive')) 
    {
    
      buildTicker();
    
    } 
    
    else 
    {
    
      const ticker = document.getElementById('radarAlertTicker');
    
      if (ticker) 
      {
      
        ticker.classList.remove('tickerActive');
      
        ticker.innerHTML = '';
      
      }
    
    }
  
  });
  
  bodyObserver.observe(document.body, { attributeFilter: ['class'] });

  /* Alert Watch */
  const banner = document.getElementById('alertBanner');
  
  if (banner) 
  {
  
    const alertObserver = new MutationObserver(() => 
    {
    
      if (document.body.classList.contains('radarActive')) 
      {
      
        buildTicker();
      
      }
    
    });
    
    alertObserver.observe(banner, 
    {
    
      childList: true,
    
      subtree: true,
    
      attributes: true,
    
      attributeFilter: ['class']
    
    });
  
  }

})();

/*  =================================
   LOGO LINK
   ================================= */

(function initLogoLink() 
{

  const link = document.getElementById('siteLogoLink');

  if (!link) return;

  link.addEventListener('click', e => 
  {
  
    if (document.body.classList.contains('radarActive')) 
    {
    
      e.preventDefault();
    
      document.getElementById('radarToggleBtn').click();
    
    }
  
  });

})();


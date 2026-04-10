# SkyGrid Wx Dashboard

## Overview

SkyGrid Wx is a custom weather dashboard built for large screens like TVs, offices, and control-style setups.

It combines live video, real-time weather data, and radar into a structured four-panel layout that stays clean and readable at 1920x1080.

The system is split into two parts:

* A static frontend dashboard
* A Cloudflare Worker that handles all data

---

## What It Does

* Displays live YouTube weather streams with automatic fallback
* Pulls hourly forecast data from weather.gov
* Shows real-time conditions like temperature, wind, and precipitation
* Detects and groups rain periods into a simple timeline
* Calculates sunrise and sunset on the server
* Displays active weather alerts
* Supports a custom weather cam feed
* Includes a radar overlay
* Allows layout editing and panel expansion
* Supports background modes based on time or weather

---

## Project Structure

```
root/

index.html

css/
  styleIndex.css

js/
  indexJS.js

images/
  backgrounds/
  icons/
  logos/
```

---

## How the Frontend Works

This project is a static dashboard. There is no backend code here.

The frontend is responsible for:

* Rendering each panel (YouTube, forecast, stats, cam)
* Fetching data from the Worker
* Handling layout changes and panel expansion
* Managing background modes
* Controlling video switching

Main file:

*

---

## Backend Requirement

This dashboard will not work on its own. It depends on a Cloudflare Worker.

The Worker handles:

* Weather data from weather.gov
* YouTube live detection
* Data formatting so the frontend stays simple

Worker file:

*

---

## Worker Endpoints

```
/weather
/youtube
/
```

### Weather Source

Data comes from the National Weather Service.

The Worker uses:

* /points to determine location data
* /forecastHourly for hourly conditions
* /alerts for active warnings

Everything is cleaned and returned in a consistent format for the frontend.

---

## Data Format

The frontend expects this structure:

```
{
  location: {},
  current: {},
  hourly: {},
  daily: {},
  precipitationTimeline: [],
  alerts: []
}
```

If this changes, the frontend will break.

---

## Setup

### 1. Clone the project

```
git clone https://github.com/ArxnAlley/SkyGridWx.git
cd SkyGridWx
```

---

### 2. Run locally

Use Live Server or any local dev server:

```
127.0.0.1:5500
```

---

### 3. Connect your Worker

Open:

```
js/indexJS.js
```

Update:

```js
const WORKER_BASE_URL = "https://your-worker.workers.dev";
```

---

### 4. Set YouTube API Key

Inside Cloudflare Worker settings, add:

```
YOUTUBE_API_KEY
```

Do not put this in the frontend.

---

### 5. Add Weather Cam (optional)

In `indexJS.js`:

```js
const CAM_STREAM_URL = "";
```

Supported formats:

* MP4 or WebM
* MJPEG
* HLS (.m3u8)

---

## Layout System

Default layout:

Top left: YouTube
Top right: Forecast
Bottom left: Stats
Bottom right: Cam

Users can:

* Expand panels
* Enter edit mode
* Rearrange layout
* Reset to default

---

## Controls

Top bar includes:

* Clock
* Alert indicator
* Menu button

Menu options:

* Edit layout
* Toggle radar
* Change background mode

---

## Display Notes

Built for:

* 1920x1080 baseline

On TVs, the layout is fixed and consistent.
On desktop, it scales more freely.

---

## Security

* No API keys in frontend
* All external requests go through the Worker
* CORS is handled by the Worker

---

## Deployment

Frontend:

* GitHub Pages
* Netlify
* Vercel

Worker:

* Cloudflare Workers

---

## Future Improvements

* Multiple locations
* Saved layouts
* Better alert prioritization
* Analytics tracking
* More stream sources

---

## Maintainer Notes

* Keep naming consistent (camelCase)
* Do not break the quadrant layout
* Avoid fixed heights that break scaling
* Test on large screens

---

## Contact

Nulo Studio
Custom dashboards and real-world web systems

# Productivity Dashboard

Single-page productivity cockpit with to-do list, daily planner, daily goals, Pomodoro timer, motivational quotes, theme cycling, and a pluggable weather widget. Everything runs client-side and persists in `localStorage`, so it works offline after first load.

## Features
- **To-Do Studio:** capture tasks with focus tagging, filters (all/focus/done), progress bar, and local stats.
- **Daily Planner:** 6:00–24:00 timeline with inline editing, block fill counter, and “next anchor” indicator.
- **Daily Goals:** spotlight goal, priority chips, radial progress, momentum bars, quick add/reset.
- **Pomodoro Timer:** 25/5 work-break cycles with start/pause/reset controls.
- **Motivation:** cached quotes from DummyJSON with fallbacks and manual refresh when the panel opens.
- **Weather + Clock:** live date/time and weather; uses WeatherAPI when a key is provided, else falls back to Open-Meteo.
- **Theme cycling:** four themes (`dark-black`, `dark-navy`, `dark-graphite`, `light`) remembered per device.

## Quick Start
1. Clone or download the repo.
2. Open `index.html` in a modern browser, or serve the folder with any static server (e.g., VS Code Live Server).

## Weather Setup
The dashboard works two ways:
- **With your WeatherAPI key (preferred for accuracy):**
  ```js
  localStorage.setItem('weatherApiKey', 'YOUR_WEATHERAPI_KEY');
  localStorage.setItem('weatherCity', 'Your City');

Without a key: it auto-falls back to the free Open-Meteo API using weatherCity (default: Bankura) and shows “(Open-Meteo)” next to the condition.
Data Persistence (localStorage keys)
Tasks: currentTask
Daily planner blocks: dayplanData
Daily goals: dailyGoalsData
Quotes cache: motivationalQuoteCache
Theme: dashboardTheme
Weather config: weatherApiKey, weatherCity
Tech Stack
HTML, CSS, vanilla JS
Remix Icon CDN
WeatherAPI (primary) + Open-Meteo fallback
DummyJSON for motivational quotes
Project Structure
index.html — markup for all panels
style.css — layout, themes, animations
app.js — feature logic, localStorage, API calls
after-motivation-fixed.png — README preview image

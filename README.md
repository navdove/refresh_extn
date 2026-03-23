# Random Tab Refresher

A Chrome extension that automatically refreshes browser tabs at random or configurable intervals. Each tab can be individually enabled or disabled for auto-refresh.

## Features

- **Per-Tab Control**: Enable/disable auto-refresh for each tab independently
- **Random Intervals**: Refresh occurs at random intervals (1-5 minutes by default)
- **Configurable Timing**: Set custom refresh intervals via the popup
- **Visual Indicators**: Extension icon shows active (blue) or inactive (gray) state
- **Badge Countdown**: 
  - Shows minutes until refresh when > 30 seconds remaining
  - Real-time second-by-second countdown in final 30 seconds
  - Red badge color for urgency, blue for normal countdown
- **Smart Behavior**: Only refreshes the currently active tab
- **State Persistence**: Tab states persist during browser session

## How It Works

1. Click the extension icon to enable/disable refresh for the current tab
2. When enabled, the extension schedules a refresh at a random interval
3. The badge shows when the next refresh will occur
4. In the final 30 seconds, the badge counts down second-by-second
5. When the alarm triggers, the active tab is refreshed
6. A new interval is scheduled automatically

## Installation

### Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/` folder

### Production

1. Build the extension:
   ```bash
   npm run build
   ```
2. Package the `dist/` folder as a Chrome extension
3. Install via Chrome Web Store or manually load unpacked

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
refresh_extn/
├── src/              # Svelte components
│   └── Popup.svelte  # Popup UI
├── background.js     # Service worker for tab management
├── manifest.json     # Extension manifest
├── icons/            # Extension icons
└── dist/             # Built extension (production)
```

## Technical Details

- **Framework**: Svelte 5 with Vite
- **Storage**: `chrome.storage.session` (per-session storage)
- **Scheduling**: `chrome.alarms` API for reliable timing
- **Icons**: Dynamically generated using Canvas API
- **Reactivity**: Svelte 5 runes for state management

## Badge Behavior

| State | Badge Text | Badge Color |
|-------|------------|-------------|
| > 30s until refresh | Minutes (e.g., "3") | Blue (#2196F3) |
| 30-1s until refresh | Seconds countdown | Red (#ff4444) |
| Disabled | (empty) | White/transparent |

## Future Enhancements

- Multi-tab refresh (refresh all enabled tabs simultaneously)
- Tab groups support
- URL filtering (exclude/include specific domains)
- Quiet hours (disable during specified times)
- Refresh history logging
- Sound notifications before refresh
- Pause feature
- Statistics dashboard

## License

MIT

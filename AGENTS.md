# Random Tab Refresher - Agent Guidelines

## Project Overview
This is a Chrome extension that refreshes random browser tabs. Built with Svelte 5 and Vite.

## Code Organization
- `src/` - Svelte components (Popup.svelte)
- `background.js` - Service worker for tab management
- `popup.js` - Popup event handling
- `manifest.json` - Extension manifest
- `icons/` - Extension icons

## Development Commands
```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
```

## Key Patterns
- Extension uses Svelte 5 runes for reactivity
- Background script handles tab refresh logic via Chrome tabs API
- Popup UI built with Svelte components and Lucide icons

## Testing
Load unpacked extension in Chrome: `chrome://extensions/` → Enable Developer Mode → Load unpacked (point to `dist/`)

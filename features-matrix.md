# Feature Matrix

## Current Implementation

| Feature | Status | Description |
|---------|--------|-------------|
| **Per-Tab Refresh** | ✅ Implemented | Each tab can be individually enabled/disabled for auto-refresh |
| **Random Interval** | ✅ Implemented | Refresh occurs at random intervals (1-5 minutes by default) |
| **Configurable Interval** | ✅ Implemented | Users can set custom refresh intervals via popup |
| **Tab State Persistence** | ✅ Implemented | Tab enable/disable state stored in `chrome.storage.session` |
| **Visual Indicators** | ✅ Implemented | Extension icon shows active (blue) or inactive (gray) state per tab |
| **Badge Countdown** | ✅ Implemented | Shows minutes until refresh, switches to seconds countdown in final 30s |
| **Decrementing Countdown** | ✅ Implemented | Real-time second-by-second countdown when < 30s remaining |
| **Badge Clear on Inactive** | ✅ Implemented | Badge text and background cleared when extension is disabled |
| **Active Tab Only** | ✅ Implemented | Only the currently active tab is refreshed |
| **Cross-Tab State** | ✅ Implemented | Each tab maintains independent refresh state |

## How It Works

### Per-Tab vs Across Tabs

The extension operates on a **per-tab basis**:

- Each tab can be toggled independently (enabled/disabled)
- Only the **currently active tab** is refreshed when the alarm triggers
- Tab states are tracked individually using `chrome.storage.session`
- When you switch tabs, the extension checks if the new active tab is enabled
- If the new tab is disabled, refresh scheduling stops immediately

### Badge Display Behavior

| Time Remaining | Badge Text | Badge Color |
|----------------|------------|-------------|
| > 30 seconds | Minutes (e.g., "3") | Blue (#2196F3) |
| 30-1 seconds | Seconds countdown (e.g., "25", "24"... "1") | Red (#ff4444) |
| Extension disabled | Empty | White/transparent |

### Refresh Logic Flow

```
1. User enables refresh on a tab
   ↓
2. Extension schedules random interval (1-5 min or custom)
   ↓
3. Alarm triggers at scheduled time
   ↓
4. Extension checks if current active tab is still enabled
   ↓
5. If enabled → reload tab & schedule next refresh
   ↓
6. If disabled → stop scheduling, clear badge
```

### Key Behaviors

| Scenario | Behavior |
|----------|----------|
| Switch to disabled tab | Refresh stops, badge clears |
| Switch to enabled tab | Refresh continues from existing schedule |
| Close enabled tab | Tab state removed from storage |
| Close active tab | Refresh stops, state cleared |
| Tab enabled but not active | No refresh occurs (waits for activation) |
| < 30s until refresh | Real-time countdown (30, 29, 28... 1) |
| Extension inactive | No badge displayed |

## Future Enhancement Ideas

| Feature | Priority | Description |
|---------|----------|-------------|
| **Multi-Tab Refresh** | - | Refresh all enabled tabs simultaneously |
| **Tab Groups Support** | - | Enable/disable refresh for entire tab groups |
| **URL Filtering** | - | Exclude/include specific domains |
| **Quiet Hours** | - | Disable auto-refresh during specified times |
| **Refresh History** | - | Log refresh events per tab |
| **Sound Notification** | - | Alert before refresh occurs |
| **Pause Feature** | - | Temporary pause without disabling |
| **Statistics Dashboard** | - | Show refresh counts, time saved, etc. |

## Technical Details

- **Storage**: `chrome.storage.session` (per-session, cleared on browser restart)
- **Scheduling**: `chrome.alarms` API for reliable timing
- **Reactivity**: Svelte 5 runes for UI state management
- **Icon Rendering**: Dynamic canvas-generated icons (active/inactive states)
- **Badge Updates**: 1-second interval timer for real-time countdown

// Store the next refresh time and interval settings
let nextRefreshTime = null;
let currentInterval = 3 * 60 * 1000; // Default: 3 minutes in milliseconds
let badgeCountdownTimer = null;
let currentTabId = null;
let currentTabEnabled = false;
const TAB_STATE_KEY = 'tabStates';
const ICON_SIZES = [16, 48, 128];
const iconImageDataCache = new Map();

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'refreshTab') {
    refreshCurrentTab();
    scheduleNextRefresh();
  }
});

function refreshCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      isTabEnabled(tabs[0].id).then((enabled) => {
        if (!enabled) {
          stopBadgeCountdown();
          nextRefreshTime = null;
          chrome.action.setBadgeText({ text: '' });
          return;
        }

        chrome.tabs.reload(tabs[0].id);
        updateBadgeDisplay();
      });
    }
  });
}

function scheduleNextRefresh() {
  if (!currentTabEnabled) {
    return;
  }

  stopBadgeCountdown();

  // Ensure we have one alarm active only
  chrome.alarms.clear('refreshTab', () => {
    let delayMinutes;

    if (currentInterval == null) {
      // Random interval when no explicit interval is configured
      delayMinutes = Math.floor(Math.random() * 5) + 1;
      currentInterval = delayMinutes * 60 * 1000;
    } else {
      delayMinutes = Math.max(1, Math.round(currentInterval / 60000));
    }

    nextRefreshTime = Date.now() + delayMinutes * 60 * 1000;

    // Always use `when` only to avoid Chrome alarm option conflicts.
    chrome.alarms.create('refreshTab', {
      when: nextRefreshTime
    });

    chrome.alarms.clear('badgeCountdown', () => {
      const countdownStart = nextRefreshTime - 30 * 1000;

      if (countdownStart > Date.now()) {
        chrome.alarms.create('badgeCountdown', {
          when: countdownStart
        });
      } else {
        startBadgeCountdown();
      }
    });

    console.log(`Next refresh scheduled in ${delayMinutes} minute(s)`);

    updateBadgeDisplay();
  });
}

function setTabIcon(tabId, isActive) {
  if (tabId == null) {
    return;
  }

  chrome.action.setIcon({
    tabId,
    imageData: getActionIconImageData(isActive)
  });
}

function getActionIconImageData(isActive) {
  const cacheKey = isActive ? 'active' : 'inactive';

  if (iconImageDataCache.has(cacheKey)) {
    return iconImageDataCache.get(cacheKey);
  }

  const imageDataBySize = {};
  for (const size of ICON_SIZES) {
    imageDataBySize[size] = createActionIconImageData(size, isActive);
  }

  iconImageDataCache.set(cacheKey, imageDataBySize);
  return imageDataBySize;
}

function createActionIconImageData(size, isActive) {
  const canvas = new OffscreenCanvas(size, size);
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Unable to create icon canvas context');
  }

  const strokeColor = isActive ? '#2196F3' : '#9CA3AF';
  const alpha = isActive ? 1 : 0.9;
  const strokeWidth = Math.max(1.5, size / 12);

  context.clearRect(0, 0, size, size);
  context.strokeStyle = strokeColor;
  context.globalAlpha = alpha;
  context.lineWidth = strokeWidth;
  context.lineCap = 'round';
  context.lineJoin = 'round';

  // Lucide-style refresh icon: two curved arrows and arrowheads.
  const margin = size * 0.18;
  const radius = (size - margin * 2) / 2;
  const center = size / 2;

  context.beginPath();
  context.arc(center, center, radius * 0.92, Math.PI * 1.2, Math.PI * 0.15, false);
  context.stroke();

  context.beginPath();
  context.arc(center, center, radius * 0.92, Math.PI * 0.15, Math.PI * 1.2, false);
  context.stroke();

  drawArrowHead(context, center + radius * 0.65, center - radius * 0.58, -0.5, strokeWidth);
  drawArrowHead(context, center - radius * 0.65, center + radius * 0.58, 2.65, strokeWidth);

  return context.getImageData(0, 0, size, size);
}

function drawArrowHead(context, x, y, angle, strokeWidth) {
  const length = strokeWidth * 2.8;
  const spread = Math.PI / 5;

  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x - Math.cos(angle - spread) * length, y - Math.sin(angle - spread) * length);
  context.moveTo(x, y);
  context.lineTo(x - Math.cos(angle + spread) * length, y - Math.sin(angle + spread) * length);
  context.stroke();
}

function getTabStates() {
  return new Promise((resolve) => {
    chrome.storage.session.get({ [TAB_STATE_KEY]: {} }, (result) => {
      resolve(result[TAB_STATE_KEY] ?? {});
    });
  });
}

function setTabStates(tabStates) {
  return new Promise((resolve) => {
    chrome.storage.session.set({ [TAB_STATE_KEY]: tabStates }, () => resolve());
  });
}

async function isTabEnabled(tabId) {
  const tabStates = await getTabStates();
  return Boolean(tabStates[String(tabId)]);
}

async function setTabEnabled(tabId, enabled) {
  const tabStates = await getTabStates();
  const key = String(tabId);

  if (enabled) {
    tabStates[key] = true;
  } else {
    delete tabStates[key];
  }

  await setTabStates(tabStates);
  setTabIcon(tabId, enabled);

  if (tabId === currentTabId) {
    currentTabEnabled = enabled;

    if (enabled) {
      if (nextRefreshTime === null) {
        scheduleNextRefresh();
      } else {
        updateBadgeDisplay();
      }
    } else {
      stopBadgeCountdown();
      nextRefreshTime = null;
      chrome.action.setBadgeText({ text: '' });
      chrome.alarms.clear('refreshTab');
      chrome.alarms.clear('badgeCountdown');
    }
  }

  return enabled;
}

async function syncTabIcons() {
  const tabStates = await getTabStates();

  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      setTabIcon(tab.id, Boolean(tabStates[String(tab.id)]));
    }
  });
}

async function syncActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const activeTab = tabs[0];

    if (!activeTab?.id) {
      currentTabId = null;
      currentTabEnabled = false;
      stopBadgeCountdown();
      nextRefreshTime = null;
      chrome.action.setBadgeText({ text: '' });
      return;
    }

    currentTabId = activeTab.id;
    currentTabEnabled = await isTabEnabled(activeTab.id);
    setTabIcon(activeTab.id, currentTabEnabled);

    if (currentTabEnabled) {
      if (nextRefreshTime === null) {
        scheduleNextRefresh();
      } else {
        updateBadgeDisplay();
      }
    } else {
      stopBadgeCountdown();
      nextRefreshTime = null;
      chrome.action.setBadgeText({ text: '' });
      chrome.alarms.clear('refreshTab');
      chrome.alarms.clear('badgeCountdown');
    }
  });
}

function getSelectedMinutes() {
  return Math.max(1, Math.round(currentInterval / 60000));
}

function updateBadgeDisplay() {
  if (nextRefreshTime === null) {
    chrome.action.setBadgeText({ text: '' });
    return;
  }

  const secondsLeft = Math.max(0, Math.ceil((nextRefreshTime - Date.now()) / 1000));

  if (secondsLeft === 0) {
    chrome.action.setBadgeText({ text: '' });
    stopBadgeCountdown();
    return;
  }

  // Show the selected minute(s) until the final 30 seconds, then switch to countdown.
  if (secondsLeft <= 30) {
    chrome.action.setBadgeText({ text: `${secondsLeft}` });
    chrome.action.setBadgeBackgroundColor({ color: '#ff4444' }); // Red for urgent
  } else {
    chrome.action.setBadgeText({ text: `${getSelectedMinutes()}` });
    chrome.action.setBadgeBackgroundColor({ color: '#2196F3' });
  }
}

function startBadgeCountdown() {
  stopBadgeCountdown();
  updateBadgeDisplay();

  badgeCountdownTimer = setInterval(() => {
    if (nextRefreshTime === null) {
      stopBadgeCountdown();
      return;
    }

    const secondsLeft = Math.max(0, Math.ceil((nextRefreshTime - Date.now()) / 1000));

    if (secondsLeft <= 30) {
      chrome.action.setBadgeText({ text: `${secondsLeft}` });
      chrome.action.setBadgeBackgroundColor({ color: '#ff4444' });
    } else {
      chrome.action.setBadgeText({ text: `${getSelectedMinutes()}` });
      chrome.action.setBadgeBackgroundColor({ color: '#2196F3' });
    }

    if (secondsLeft === 0) {
      stopBadgeCountdown();
    }
  }, 1000);
}

function stopBadgeCountdown() {
  if (badgeCountdownTimer !== null) {
    clearInterval(badgeCountdownTimer);
    badgeCountdownTimer = null;
  }
}

// Initialize on extension load
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  syncTabIcons();
  syncActiveTab();
});

chrome.runtime.onStartup.addListener(() => {
  syncTabIcons();
  syncActiveTab();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'badgeCountdown') {
    startBadgeCountdown();
  }
});

// Listen for settings from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateSettings') {
    currentInterval = request.interval;
    if (currentTabEnabled) {
      scheduleNextRefresh();
    }
  } else if (request.action === 'getStatus') {
    const secondsLeft = Math.ceil(currentInterval / 1000);
    sendResponse({ 
      interval: currentInterval,
      showBadge: secondsLeft < 30,
      secondsLeft: secondsLeft,
      enabled: currentTabEnabled
    });
  } else if (request.action === 'getTabState') {
    isTabEnabled(request.tabId).then((enabled) => {
      sendResponse({ enabled });
    });
    return true;
  } else if (request.action === 'setTabState') {
    setTabEnabled(request.tabId, request.enabled).then((enabled) => {
      sendResponse({ enabled });
    });
    return true;
  }
});

// Update badge on tab activation
chrome.tabs.onActivated.addListener(({ tabId }) => {
  currentTabId = tabId;
  isTabEnabled(tabId).then((enabled) => {
    currentTabEnabled = enabled;
    setTabIcon(tabId, enabled);

    if (enabled) {
      if (nextRefreshTime === null) {
        scheduleNextRefresh();
      } else {
        updateBadgeDisplay();
      }
    } else {
      stopBadgeCountdown();
      nextRefreshTime = null;
      chrome.action.setBadgeText({ text: '' });
      chrome.alarms.clear('refreshTab');
      chrome.alarms.clear('badgeCountdown');
    }
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  getTabStates().then((tabStates) => {
    if (String(tabId) in tabStates) {
      delete tabStates[String(tabId)];
      setTabStates(tabStates);
    }
  });

  if (tabId === currentTabId) {
    currentTabId = null;
    currentTabEnabled = false;
    stopBadgeCountdown();
    nextRefreshTime = null;
    chrome.action.setBadgeText({ text: '' });
    chrome.alarms.clear('refreshTab');
    chrome.alarms.clear('badgeCountdown');
  }
});

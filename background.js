// Store the next refresh time and interval settings
let nextRefreshTime = null;
let currentInterval = 3 * 60 * 1000; // Default: 3 minutes in milliseconds

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'refreshTab') {
    refreshCurrentTab();
    scheduleNextRefresh();
  }
});

function refreshCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.reload(tabs[0].id);
      updateBadge(''); // Clear badge after refresh
    }
  });
}

function scheduleNextRefresh() {
  // Generate random interval between 1-5 minutes (60,000 to 300,000 ms)
  const randomMinutes = Math.floor(Math.random() * 5) + 1;
  currentInterval = randomMinutes * 60 * 1000;
  
  // Schedule the next alarm
  chrome.alarms.create('refreshTab', {
    delayInMinutes: randomMinutes,
    when: Date.now() + currentInterval
  });
  
  console.log(`Next refresh scheduled in ${randomMinutes} minute(s)`);
  updateBadge(currentInterval);
}

function updateBadge(timeRemaining) {
  if (timeRemaining === '') {
    chrome.action.setBadgeText({ text: '' });
    return;
  }

  const secondsLeft = Math.ceil(timeRemaining / 1000);
  
  // Only show badge when less than 30 seconds remain
  if (secondsLeft < 30) {
    chrome.action.setBadgeText({ text: `${secondsLeft}` });
    chrome.action.setBadgeBackgroundColor({ color: '#ff4444' }); // Red for urgent
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Initialize on extension load
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  scheduleNextRefresh();
});

// Listen for settings from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateSettings') {
    currentInterval = request.interval;
    scheduleNextRefresh();
  } else if (request.action === 'getStatus') {
    const secondsLeft = Math.ceil(currentInterval / 1000);
    sendResponse({ 
      interval: currentInterval,
      showBadge: secondsLeft < 30,
      secondsLeft: secondsLeft
    });
  }
});

// Update badge on tab activation
chrome.tabs.onActivated.addListener(() => {
  const secondsLeft = Math.ceil(currentInterval / 1000);
  if (secondsLeft < 30) {
    updateBadge(currentInterval);
  } else {
    updateBadge('');
  }
});

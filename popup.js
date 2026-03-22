document.addEventListener('DOMContentLoaded', () => {
  const intervalType = document.getElementById('intervalType');
  const customIntervalSetting = document.getElementById('customIntervalSetting');
  const customMinutes = document.getElementById('customMinutes');
  const applyBtn = document.getElementById('applyBtn');
  const statusDiv = document.getElementById('status');

  // Toggle custom interval setting visibility
  intervalType.addEventListener('change', () => {
    if (intervalType.value === 'custom') {
      customIntervalSetting.style.display = 'block';
    } else {
      customIntervalSetting.style.display = 'none';
    }
  });

  // Get current status from background script
  function getStatus() {
    chrome.runtime.sendMessage(
      { action: 'getStatus' },
      (response) => {
        if (chrome.runtime.lastError) {
          statusDiv.innerHTML = '<strong>Status:</strong> Extension not running';
          return;
        }

        const secondsLeft = response.secondsLeft;
        const minutesLeft = Math.floor(secondsLeft / 60);
        const secsDisplay = secondsLeft % 60;

        if (response.showBadge) {
          statusDiv.innerHTML = `
            <strong>Status:</strong> Refreshing in ${secsDisplay}s<br>
            <span class="badge-warning">⚠️ Less than 30 seconds!</span>
          `;
        } else {
          statusDiv.innerHTML = `<strong>Status:</strong> Next refresh in ~${minutesLeft}m ${secsDisplay}s`;
        }
      }
    );
  }

  // Apply settings button
  applyBtn.addEventListener('click', () => {
    const type = intervalType.value;
    
    if (type === 'random') {
      chrome.runtime.sendMessage(
        { action: 'updateSettings', interval: null },
        () => {
          getStatus();
          alert('Set to random refresh (1-5 minutes)');
        }
      );
    } else {
      const customMin = parseInt(customMinutes.value);
      if (customMin < 1 || customMin > 60) {
        alert('Please enter a value between 1 and 60 minutes');
        return;
      }
      
      const intervalMs = customMin * 60 * 1000;
      chrome.runtime.sendMessage(
        { action: 'updateSettings', interval: intervalMs },
        () => {
          getStatus();
          alert(`Set to refresh every ${customMin} minute(s)`);
        }
      );
    }
  });

  // Initial status check and poll every second
  getStatus();
  setInterval(getStatus, 1000);
});

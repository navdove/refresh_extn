<script lang="ts" module>
  declare const chrome: any;
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { RefreshCw, Clock, AlertTriangle, CheckCircle } from 'lucide-svelte';

  let intervalType = $state<'random' | 'custom'>('random');
  let customMinutes = $state<number>(3);
  let statusMessage = $state<string>('Loading status...');
  let isRefreshing = $state<boolean>(false);
  let currentTabEnabled = $state<boolean>(false);
  let currentTabId = $state<number | null>(null);

  function loadCurrentTabState() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];

      if (!activeTab?.id) {
        currentTabId = null;
        currentTabEnabled = false;
        return;
      }

      currentTabId = activeTab.id;
      chrome.runtime.sendMessage(
        { action: 'getTabState', tabId: activeTab.id },
        (response) => {
          if (chrome.runtime.lastError) {
            currentTabEnabled = false;
            return;
          }

          currentTabEnabled = Boolean(response?.enabled);
        }
      );
    });
  }

  function toggleCurrentTab() {
    if (currentTabId === null) {
      return;
    }

    chrome.runtime.sendMessage(
      { action: 'setTabState', tabId: currentTabId, enabled: !currentTabEnabled },
      (response) => {
        if (chrome.runtime.lastError) {
          return;
        }

        currentTabEnabled = Boolean(response?.enabled);
        statusMessage = currentTabEnabled ? 'Enabled on this tab' : 'Disabled on this tab';
      }
    );
  }

  function handleIntervalChange() {
    const customSetting = document.getElementById('customIntervalSetting');
    if (customSetting) {
      customSetting.style.display = intervalType === 'custom' ? 'block' : 'none';
    }
  }

  function getStatus() {
    chrome.runtime.sendMessage(
      { action: 'getStatus' },
      (response) => {
        if (chrome.runtime.lastError) {
          statusMessage = 'Extension not running';
          isRefreshing = false;
          return;
        }

        const secondsLeft = response.secondsLeft;
        const minutesLeft = Math.floor(secondsLeft / 60);
        const secsDisplay = secondsLeft % 60;

        if (response.showBadge) {
          statusMessage = `Refreshing in ${secsDisplay}s`;
          isRefreshing = true;
        } else {
          statusMessage = `Next refresh in ~${minutesLeft}m ${secsDisplay}s`;
          isRefreshing = false;
        }
      }
    );
  }

  async function handleApply() {
    const type = intervalType;
    
    if (type === 'random') {
      await chrome.runtime.sendMessage(
        { action: 'updateSettings', interval: null }
      );
      getStatus();
      showNotification('Set to random refresh (1-5 minutes)');
    } else {
      const customMin = parseInt(customMinutes.toString());
      if (customMin < 1 || customMin > 60) {
        alert('Please enter a value between 1 and 60 minutes');
        return;
      }
      
      const intervalMs = customMin * 60 * 1000;
      await chrome.runtime.sendMessage(
        { action: 'updateSettings', interval: intervalMs }
      );
      getStatus();
      showNotification(`Set to refresh every ${customMin} minute(s)`);
    }
  }

  function showNotification(message: string) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 2000);
  }

  onMount(() => {
    loadCurrentTabState();
    getStatus();
    const interval = setInterval(getStatus, 1000);
    return () => clearInterval(interval);
  });
</script>

<div class="container">
  <div class="header">
    <RefreshCw class="icon" size={24} />
    <h2>Tab Refresher</h2>
  </div>

  <div class="setting">
    <label for="intervalType">Refresh Interval:</label>
    <select id="intervalType" bind:value={intervalType} onchange={handleIntervalChange}>
      <option value="random">Random (1-5 mins)</option>
      <option value="custom">Custom Time</option>
    </select>
  </div>

  <button class="tab-toggle-btn" onclick={toggleCurrentTab}>
    {currentTabEnabled ? 'Disable on this tab' : 'Enable on this tab'}
  </button>

  <div class="setting custom-interval" id="customIntervalSetting" style="display: {intervalType === 'custom' ? 'block' : 'none'};">
    <label for="customMinutes">
      <Clock size={16} /> Custom minutes:
    </label>
    <input type="number" bind:value={customMinutes} min="1" max="60" />
  </div>

  <button class="apply-btn" onclick={handleApply}>
    <CheckCircle size={18} /> Apply Settings
  </button>

  <div class="status">
    {#if isRefreshing}
      <AlertTriangle class="warning-icon" size={16} />
    {/if}
    <span class="status-text">{statusMessage}</span>
  </div>
</div>

<style>
  :global(body) {
    width: 280px;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 0;
  }

  .container {
    padding: 20px;
    background: #fff;
  }

  .header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }

  :global(.icon) {
    color: #2196F3;
  }

  h2 {
    margin: 0;
    font-size: 18px;
    color: #333;
    font-weight: 600;
  }

  .setting {
    margin-bottom: 15px;
  }

  .tab-toggle-btn {
    width: 100%;
    padding: 11px 12px;
    margin-bottom: 15px;
    background: #111827;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background 0.2s, transform 0.1s;
  }

  .tab-toggle-btn:hover {
    background: #1f2937;
  }

  .tab-toggle-btn:active {
    transform: scale(0.98);
  }

  label {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    font-weight: 500;
    color: #555;
    font-size: 14px;
  }

  select, input[type="number"] {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 14px;
    box-sizing: border-box;
    background: #f9f9f9;
    transition: border-color 0.2s, background 0.2s;
  }

  select:focus, input[type="number"]:focus {
    outline: none;
    border-color: #2196F3;
    background: #fff;
  }

  .apply-btn {
    width: 100%;
    padding: 12px;
    background: #2196F3;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background 0.2s, transform 0.1s;
  }

  .apply-btn:hover {
    background: #1976D2;
  }

  .apply-btn:active {
    transform: scale(0.98);
  }

  .status {
    margin-top: 20px;
    padding: 14px;
    background: #f5f5f5;
    border-radius: 8px;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-text {
    color: #666;
    word-break: break-word;
  }

  :global(.warning-icon) {
    color: #ff4444;
    flex-shrink: 0;
  }

  :global(.notification) {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 13px;
    opacity: 0;
    animation: fadeInOut 2s ease-in-out;
  }

  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
    20% { opacity: 1; transform: translateX(-50%) translateY(0); }
    80% { opacity: 1; transform: translateX(-50%) translateY(0); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  }

  .custom-interval label {
    font-size: 14px;
  }
</style>

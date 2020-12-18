import { getCurrentTabUrl, getLigo } from 'lib/misc';

function clearBadge() {
  browser.browserAction.setBadgeText({ text: '' });
}

function setBadge(n) {
  browser.browserAction.setBadgeText({ text: `${n}` });
  browser.browserAction.setBadgeBackgroundColor({ color: '#0c0c0d' });
  browser.browserAction.setBadgeTextColor({ color: '#98d1cf' });
}

function setBadgeCount(link) {
  getLigo(link).then((res) => {
    if (res.length < 1) {
      clearBadge();
    } else {
      setBadge(res.length);
    }
  });
}

function handleActivated() {
  clearBadge();
  getCurrentTabUrl((url) => {
    setBadgeCount(url);
  });
}

function handleUpdated(tabId, changeInfo) {
  if (changeInfo.url) {
    setBadgeCount(changeInfo.url);
  }
}

handleActivated();
browser.tabs.onActivated.addListener(handleActivated);
browser.tabs.onUpdated.addListener(handleUpdated);

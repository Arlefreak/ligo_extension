import {
  TOKEN_STATUS_VALID,
  TOKEN_STATUS_REFRESH,
  TOKEN_STATUS_INVALID,
  API_URL,
} from 'lib/constants';

export function parseTags(_tags) {
  if (_tags == null) return [];
  const tags = _tags.split(',').filter(Boolean);
  tags.push('fromBrowser');
  return tags;
}

export function getCurrentTabUrl(callback) {
  // https://developer.chrome.com/extensions/tabs#method-query
  const queryInfo = {
    active: true,
    currentWindow: true,
  };

  if (typeof chrome === 'undefined') {
    callback('');
  } else {
    chrome.tabs.query(queryInfo, (tabs) => {
      const tab = tabs[0];
      const { url } = tab;
      // console.assert(typeof url == 'string', 'tab.url should be a string');
      callback(url);
    });
  }
}

export function formDataToObject(data) {
  const body = {};
  data.forEach((value, key) => {
    body[key] = value;
  });
  return body;
}

export function getOptions(arr) {
  if (typeof browser === 'undefined') {
    return new Promise((resolve) => {
      const result = arr.reduce(
        (acc, e) => ({ ...acc, [e]: localStorage.getItem(e) }),
        {}
      );
      resolve(result);
    });
  }

  return browser.storage.local.get(arr);
}

export function saveOptions(data) {
  if (typeof browser === 'undefined') {
    return new Promise((resolve) => {
      Object.entries(data).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
      resolve();
    });
  }

  return browser.storage.local.set(data);
}

export function removeOptions(arr) {
  if (typeof browser === 'undefined') {
    arr.forEach((e) => {
      localStorage.removeItem(e);
    });
  } else {
    arr.forEach((e) => {
      browser.storage.local.remove(e);
    });
  }
}

export async function verifyToken(token) {
  const headers = new Headers({
    'Content-Type': 'application/json',
  });

  const body = JSON.stringify({ token });
  const request = new Request(`${API_URL}/token/verify/`, {
    method: 'POST',
    redirect: 'follow',
    mode: 'cors',
    headers,
    body,
  });

  const res = await fetch(request);
  const verify = await res.json();
  if (Object.keys(verify).length === 0) return TOKEN_STATUS_VALID;
  if (
    {}.hasOwnProperty.call(verify, 'code') &&
    verify.code === 'token_not_valid'
  )
    return TOKEN_STATUS_REFRESH;
  return TOKEN_STATUS_INVALID;
}

export async function refreshToken(refresh) {
  const headers = new Headers({
    'Content-Type': 'application/json',
  });

  const body = JSON.stringify({ refresh });
  const request = new Request(`${API_URL}/token/refresh/`, {
    method: 'POST',
    redirect: 'follow',
    mode: 'cors',
    headers,
    body,
  });

  const res = await fetch(request);
  return res.json();
}

export async function login(props) {
  const body = JSON.stringify(props);
  const headers = new Headers({
    'Content-Type': 'application/json',
  });

  const request = new Request(`${API_URL}/token/`, {
    method: 'POST',
    redirect: 'follow',
    mode: 'cors',
    headers,
    body,
  });

  const res = await fetch(request);
  return res.json();
}

export async function restoreOptions(emitter) {
  try {
    const options = await getOptions(['access', 'refresh']);
    const { access, refresh } = options;

    if (access != null && refresh != null) {
      const verify = await verifyToken(access);

      switch (verify) {
        case TOKEN_STATUS_VALID:
          emitter.emit('user:login', options);
          break;
        case TOKEN_STATUS_REFRESH: {
          const { access: nAccess } = await refreshToken(refresh);
          saveOptions({ access: nAccess });
          emitter.emit('user:login', {
            access: nAccess,
            refresh,
          });
          break;
        }
        default:
          emitter.emit('user:logout');
          break;
      }
    } else {
      emitter.emit('user:logout');
    }
  } catch (err) {
    console.error(err);
  }
}

export async function getLigo(link) {
  const url = `${API_URL}/ligoj/link/?link=${encodeURIComponent(link)}`;

  const request = new Request(url, {
    method: 'GET',
    redirect: 'follow',
    mode: 'cors',
  });

  const res = await fetch(request);
  const json = await res.json();
  return json;
}

export async function deleteLink(id, token) {
  const url = `${API_URL}/ligoj/link/${id}`;
  const headers = new Headers({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  const request = new Request(url, {
    method: 'DELETE',
    redirect: 'follow',
    mode: 'cors',
    headers,
  });
  return fetch(request);
}

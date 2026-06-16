import configService from './configService.js';
import { authStore } from '../state/authStore.js';

const SUB_KEY = 'push-subscribed';

function getApiUrl() {
  return configService().then(c => c.apiUrl.replace(/\/$/, ''));
}

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = authStore.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function saveSubscriptionOnServer(subscription) {
  const apiUrl = await getApiUrl();
  const response = await fetch(`${apiUrl}/push/subscribe`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });

  if (!response.ok) {
    throw new Error(`Push subscribe failed: ${response.status}`);
  }

  localStorage.setItem(SUB_KEY, 'true');
}

export async function requestPermission() {
  if (!('Notification' in window)) {
    console.warn('Push: Notification API no soportada');
    return 'unsupported';
  }
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  return result;
}

export async function subscribe() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push: no soportado en este navegador');
    return false;
  }

  const perm = await requestPermission();
  if (perm !== 'granted') {
    console.warn('Push: permiso denegado');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    const apiUrl = await getApiUrl();
    const vapidRes = await fetch(`${apiUrl}/push/vapid-public-key`);
    const { publicKey } = await vapidRes.json();

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    await saveSubscriptionOnServer(subscription);
    console.log('Push: suscrito exitosamente');
    return true;
  } catch (err) {
    console.error('Push: error al suscribir:', err);
    return false;
  }
}

export async function syncExistingSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      localStorage.removeItem(SUB_KEY);
      return false;
    }

    await saveSubscriptionOnServer(subscription);
    console.log('Push: suscripción existente resincronizada con el servidor');
    return true;
  } catch (err) {
    console.error('Push: error al resincronizar suscripción:', err);
    return false;
  }
}

export async function unsubscribe() {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      const apiUrl = await getApiUrl();
      await fetch(`${apiUrl}/push/subscribe`, {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({ endpoint }),
      });
    }
    localStorage.removeItem(SUB_KEY);
    console.log('Push: desuscrito');
  } catch (err) {
    console.error('Push: error al desuscribir:', err);
  }
}

export function isSubscribed() {
  return localStorage.getItem(SUB_KEY) === 'true';
}

export function isSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(ch => ch.charCodeAt(0)));
}

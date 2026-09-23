const CACHE_VERSION_TIMEOUT_MS = 1500;

export async function getActiveCacheVersion() {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  const worker = navigator.serviceWorker.controller || registration.active;
  if (!worker) {
    return null;
  }

  return new Promise(resolve => {
    const channel = new MessageChannel();
    const timeout = setTimeout(() => resolve(null), CACHE_VERSION_TIMEOUT_MS);

    channel.port1.onmessage = event => {
      clearTimeout(timeout);
      resolve(event.data?.cacheVersion || null);
    };

    worker.postMessage({ type: 'GET_CACHE_VERSION' }, [channel.port2]);
  });
}

/**
 * Service Worker registration and lifecycle management helper for Notepad Cloud.
 */

export interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  hasUpdate: boolean;
}

export function isServiceWorkerSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    navigator.serviceWorker !== undefined &&
    navigator.serviceWorker !== null
  );
}

export function registerServiceWorker(
  options: {
    swUrl?: string;
    onUpdate?: () => void;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  } = {}
): () => void {
  if (!isServiceWorkerSupported()) {
    return () => {};
  }

  const { swUrl = "/sw.js", onUpdate, onSuccess, onError } = options;

  let active = true;

  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.register(swUrl);
      if (!active) return;
      onSuccess?.();

      registration.addEventListener("updatefound", () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.addEventListener("statechange", () => {
            if (installingWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                onUpdate?.();
              }
            }
          });
        }
      });
    } catch (err) {
      if (active) {
        onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    }
  };

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }

  return () => {
    active = false;
  };
}

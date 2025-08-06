// PWA Service for handling service worker and offline functionality

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered successfully:', registration);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available
              showUpdateNotification();
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

export const showUpdateNotification = () => {
  // You can implement a custom update notification here
  if (confirm('A new version is available! Would you like to update?')) {
    window.location.reload();
  }
};

export const checkForAppUpdate = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      registration.update();
    }
  }
};

export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

export const showNotification = (title: string, options?: NotificationOptions) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, options);
  }
};

export const addToHomeScreen = () => {
  // This will be handled by the browser's install prompt
  // You can customize the install prompt behavior here
};

export const isOnline = () => {
  return navigator.onLine;
};

export const addOnlineStatusListener = (callback: (online: boolean) => void) => {
  window.addEventListener('online', () => callback(true));
  window.addEventListener('offline', () => callback(false));
};

export const storeOfflineAction = async (action: {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}) => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage({
      type: 'STORE_OFFLINE_ACTION',
      action: {
        ...action,
        timestamp: Date.now(),
      },
    });
  }
};

export const syncOfflineActions = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    if ('sync' in registration) {
      await (registration as any).sync.register('background-sync');
    }
  }
};

export const getAppInstalledStatus = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

export const getInstallPrompt = () => {
  return new Promise<BeforeInstallPromptEvent | null>((resolve) => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      window.removeEventListener('beforeinstallprompt', handler);
      resolve(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
  });
};

export const triggerInstallPrompt = async () => {
  const prompt = await getInstallPrompt();
  if (prompt) {
    await prompt.prompt();
    const result = await prompt.userChoice;
    return result.outcome === 'accepted';
  }
  return false;
};

// Type for beforeinstallprompt event
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
} 
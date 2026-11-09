import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Module-level prompt capture in case the event fired before React hydration
let moduleDeferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    moduleDeferredPrompt = e as BeforeInstallPromptEvent;
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => moduleDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    // Detect standalone mode
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true);
    setIsInstalled(isStandalone);

    if (typeof window === 'undefined') return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Sync with module-level prompt if already captured
    if (moduleDeferredPrompt && !deferredPrompt) {
      setDeferredPrompt(moduleDeferredPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      moduleDeferredPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      moduleDeferredPrompt = null;
      setDeferredPrompt(null);
      setShowInstallGuide(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredPrompt]);

  const install = useCallback(async () => {
    const promptEvent = deferredPrompt || moduleDeferredPrompt;
    if (!promptEvent) {
      // No native prompt available (iOS Safari, or Chrome suppressed automatic prompt) -> show guide modal
      setShowInstallGuide(true);
      return false;
    }
    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        moduleDeferredPrompt = null;
        setDeferredPrompt(null);
        setShowInstallGuide(false);
        return true;
      } else {
        // User dismissed native prompt; next time provide clear guide
        setShowInstallGuide(true);
        return false;
      }
    } catch (err) {
      console.warn('Install prompt error:', err);
      setShowInstallGuide(true);
      return false;
    }
  }, [deferredPrompt]);

  return {
    // Always consider installable if running in browser tab (not standalone)
    isInstallable: !isInstalled,
    isInstalled,
    isIOS,
    hasNativePrompt: !!(deferredPrompt || moduleDeferredPrompt),
    showInstallGuide,
    setShowInstallGuide,
    install,
    triggerNativePrompt: install,
  };
}


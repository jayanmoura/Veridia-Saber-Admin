import { useState, useEffect, useCallback, useRef } from 'react';

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

interface VersionResponse {
  version?: string;
}

export interface UseVersionCheckReturn {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string | null;
  checkVersion: () => Promise<void>;
}

export function useVersionCheck(): UseVersionCheckReturn {
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const isCheckingRef = useRef<boolean>(false);

  const checkVersion = useCallback(async () => {
    if (import.meta.env.DEV) {
      return;
    }

    if (isCheckingRef.current) {
      return;
    }

    isCheckingRef.current = true;

    try {
      const response = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as VersionResponse;
      if (data && typeof data.version === 'string') {
        setLatestVersion(data.version);
        if (typeof __APP_VERSION__ !== 'undefined' && data.version !== __APP_VERSION__) {
          setUpdateAvailable(true);
        }
      }
    } catch {
      // Ignora falhas de conexao em silencio
    } finally {
      isCheckingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV) {
      return;
    }

    void checkVersion();

    const intervalId = setInterval(() => {
      void checkVersion();
    }, CHECK_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkVersion();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkVersion]);

  return {
    updateAvailable,
    currentVersion: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '',
    latestVersion,
    checkVersion,
  };
}

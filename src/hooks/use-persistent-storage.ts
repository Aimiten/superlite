import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Pidetään kirjaa jo nollatuista avaimista sessiokohtaisesti
const cleanedKeys = new Set<string>();

/**
 * An enhanced local storage hook that ensures data persistence across tab navigation,
 * browser refreshes, and route changes with improved synchronization mechanisms.
 * 
 * This version includes user-specific prefixes for security and data isolation.
 */
export function usePersistentStorage<T>(
  key: string,
  initialValue: T,
  options: {
    syncInterval?: number;
    debug?: boolean;
    useUserPrefix?: boolean;
    cleanStaleData?: boolean;
  } = {}
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  const { 
    syncInterval = 1000, 
    debug = false, 
    useUserPrefix = true,
    cleanStaleData = true
  } = options;

  // Haetaan käyttäjätiedot AuthContext:sta
  const { user } = useAuth();
  const userId = user?.id || 'anonymous';

  // Create refs to track the latest value and mounted state
  const latestValueRef = useRef<T>(initialValue);
  const isMountedRef = useRef(true);
  const initialLoadDoneRef = useRef(false);
  const synchronizingRef = useRef(false);
  const dataCleaned = useRef(false);

  // Tallennetaan käyttäjä-ID ref-muuttujaan, jotta voimme verrata sen muutoksia
  const previousUserIdRef = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(userId);

  // Alkuperäinen avain (ilman käyttäjäprefiksiä)
  const originalKey = key;

  // Generoidaan käyttäjäkohtainen avain
  const getUserSpecificKey = useCallback((baseKey: string): string => {
    if (!useUserPrefix) return baseKey;
    return `user_${userId}_${baseKey}`;
  }, [userId, useUserPrefix]);

  // Käytetään käyttäjäkohtaista avainta
  const storageKey = getUserSpecificKey(key);
  const metadataKey = getUserSpecificKey(`${key}_metadata`);

  // Function to log debug messages
  const log = useCallback((message: string, data?: any) => {
    if (debug) {
      console.log(`[PersistentStorage] ${message}`, data);
    }
  }, [debug]);

  // Tarkistetaan ja puhdistetaan vanhat tiedot
  const cleanOldData = useCallback(() => {
    if (!cleanStaleData || !useUserPrefix || dataCleaned.current || cleanedKeys.has(originalKey)) {
      return;
    }

    try {
      // Tarkista onko vanhaa dataa ilman käyttäjäprefiksiä
      const oldData = window.localStorage.getItem(originalKey);
      if (!oldData) {
        return;
      }

      log(`Found old data for key '${originalKey}' - cleaning`);

      // Poistetaan vanha tieto
      window.localStorage.removeItem(originalKey);
      window.localStorage.removeItem(`${originalKey}_metadata`);

      // Merkitään avain puhdistetuksi sessiokohtaisesti
      cleanedKeys.add(originalKey);
      dataCleaned.current = true;

      log(`Cleaned old unprotected data for key '${originalKey}'`);
    } catch (error) {
      console.error(`[PersistentStorage] Error cleaning old data:`, error);
    }
  }, [originalKey, cleanStaleData, useUserPrefix, log]);

  // Function to get value from localStorage
  const readFromStorage = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      // Yritä hakea käyttäjäkohtainen data
      const item = window.localStorage.getItem(storageKey);

      log(`Reading '${storageKey}' from localStorage:`, item ? 'found' : 'not found');

      if (item) {
        try {
          // Jos käyttäjäkohtaista dataa löytyy, puhdistetaan vanhat suojaamattomat tiedot
          if (useUserPrefix && cleanStaleData && !dataCleaned.current) {
            cleanOldData();
          }

          return JSON.parse(item);
        } catch (e) {
          console.error(`[PersistentStorage] Error parsing JSON for key '${storageKey}':`, e);
          return initialValue;
        }
      }

      // Jos käyttäjäkohtaista dataa ei löydy mutta on vanhat suojaamattomat tiedot
      if (useUserPrefix && !dataCleaned.current) {
        // Siivotaan vanhat tiedot, mutta ei oteta niitä käyttöön
        cleanOldData();
      }

      // Jos dataa ei löydy, käytä oletusarvoa
      return initialValue;
    } catch (error) {
      console.error(`[PersistentStorage] Error reading from localStorage key '${storageKey}':`, error);
      return initialValue;
    }
  }, [storageKey, originalKey, initialValue, useUserPrefix, cleanStaleData, cleanOldData, log]);

  // Initialize state with value from localStorage or initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    return readFromStorage();
  });

  // Update the latestValueRef whenever storedValue changes
  useEffect(() => {
    latestValueRef.current = storedValue;
  }, [storedValue]);

  // Function to save value to localStorage
  const writeToStorage = useCallback((value: T): void => {
    if (typeof window === 'undefined' || synchronizingRef.current) return;

    try {
      // Update ref immediately
      latestValueRef.current = value;

      // Save to localStorage
      const valueToStore = JSON.stringify(value);
      window.localStorage.setItem(storageKey, valueToStore);

      // Also save with timestamp to track when it was last updated
      const storageMetadata = {
        value: valueToStore,
        lastUpdated: new Date().getTime()
      };
      window.localStorage.setItem(metadataKey, JSON.stringify(storageMetadata));

      log(`Wrote '${storageKey}' to localStorage:`, value);
    } catch (error) {
      console.error(`[PersistentStorage] Error writing to localStorage key '${storageKey}':`, error);
    }
  }, [storageKey, metadataKey, log]);

  // Function to update the stored value
  const setValue = useCallback((value: T | ((val: T) => T)): void => {
    try {
      // Handle function updates
      const valueToStore = value instanceof Function ? value(latestValueRef.current) : value;

      // Don't update if value is the same (prevents unnecessary renders)
      if (JSON.stringify(valueToStore) === JSON.stringify(latestValueRef.current)) {
        return;
      }

      // Set state
      setStoredValue(valueToStore);

      // Write to storage
      writeToStorage(valueToStore);
    } catch (error) {
      console.error(`[PersistentStorage] Error in setValue for key '${storageKey}':`, error);
    }
  }, [storageKey, writeToStorage]);

  // Function to force-refresh the value from localStorage
  const refreshValue = useCallback((): void => {
    if (synchronizingRef.current) return;

    try {
      synchronizingRef.current = true;
      log(`Forced refresh of '${storageKey}' from localStorage`);
      const freshValue = readFromStorage();

      // Only update if the value has actually changed
      if (JSON.stringify(freshValue) !== JSON.stringify(latestValueRef.current)) {
        log(`Value '${storageKey}' has changed, updating state`);
        setStoredValue(freshValue);
        latestValueRef.current = freshValue;
      }

      synchronizingRef.current = false;
    } catch (error) {
      synchronizingRef.current = false;
      console.error(`[PersistentStorage] Error in refreshValue:`, error);
    }
  }, [storageKey, readFromStorage, log]);

  // Function to check if storage was updated in another tab/window
  const checkForExternalUpdates = useCallback(() => {
    if (synchronizingRef.current) return;

    try {
      synchronizingRef.current = true;
      const metadataStr = window.localStorage.getItem(metadataKey);
      if (!metadataStr) {
        synchronizingRef.current = false;
        return;
      }

      const metadata = JSON.parse(metadataStr);
      const currentValue = JSON.stringify(latestValueRef.current);

      if (metadata.value !== currentValue) {
        log(`External update detected for '${storageKey}', syncing...`);
        const newValue = JSON.parse(metadata.value);
        setStoredValue(newValue);
        latestValueRef.current = newValue;
      }

      synchronizingRef.current = false;
    } catch (error) {
      synchronizingRef.current = false;
      console.error(`[PersistentStorage] Error checking for external updates:`, error);
    }
  }, [storageKey, metadataKey, log]);

  // Tarkistaa onko käyttäjä vaihtunut
  useEffect(() => {
    // Tarkistetaan onko käyttäjä-ID muuttunut
    if (userId !== userIdRef.current) {
      log(`User changed from ${userIdRef.current} to ${userId}`);

      // Päivitetään käyttäjä-ID ref
      previousUserIdRef.current = userIdRef.current;
      userIdRef.current = userId;

      // Nollataan latausmerkkeri, jolloin seuraava useEffect lukee arvot uudelleen
      initialLoadDoneRef.current = false;

      // Nollataan migraatiomerkkeri, jotta migraatio voidaan tarkistaa uudelle käyttäjälle
      dataCleaned.current = false;

      // Päivitetään data uuden käyttäjän tiedoilla
      refreshValue();
    }
  }, [userId, refreshValue, log]);

  // Set up synchronization with localStorage and handle window events
  useEffect(() => {
    // Critical fix: We need to set the initial value properly at mount time
    if (!initialLoadDoneRef.current) {
      refreshValue();
      initialLoadDoneRef.current = true;
    }

    // Handler for storage events (changes in other tabs)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === storageKey && event.newValue !== null) {
        log(`Storage event detected for '${storageKey}':`, event.newValue);

        try {
          if (!synchronizingRef.current) {
            synchronizingRef.current = true;
            const newValue: T = JSON.parse(event.newValue);
            setStoredValue(newValue);
            latestValueRef.current = newValue;
            synchronizingRef.current = false;
          }
        } catch (error) {
          synchronizingRef.current = false;
          console.error(`[PersistentStorage] Error parsing storage event for '${storageKey}':`, error);
        }
      } else if (event.key === metadataKey) {
        checkForExternalUpdates();
      }
    };

    // Handler for visibility change (tab focus/blur)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        log(`Tab visible, refreshing '${storageKey}' from localStorage`);
        refreshValue();
        checkForExternalUpdates();
      } else if (document.visibilityState === 'hidden') {
        log(`Tab hidden, ensuring '${storageKey}' is saved to localStorage`);
        writeToStorage(latestValueRef.current);
      }
    };

    // Handler for page unload (refresh or close)
    const handleBeforeUnload = () => {
      log(`Page unloading, saving '${storageKey}' to localStorage`);
      writeToStorage(latestValueRef.current);
    };

    // Additional handler for cases when the app is minimized/backgrounded on mobile
    const handlePageHide = () => {
      log(`Page hidden, saving '${storageKey}' to localStorage`);
      writeToStorage(latestValueRef.current);
    };

    // Additional handler for cases when the app is restored on mobile
    const handlePageShow = () => {
      log(`Page shown, refreshing '${storageKey}' from localStorage`);
      refreshValue();
      checkForExternalUpdates();
    };

    // Set up event listeners
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);

    // Sync on first load
    checkForExternalUpdates();

    // Periodic check to ensure data consistency
    const syncIntervalId = setInterval(() => {
      if (isMountedRef.current) {
        checkForExternalUpdates();

        // Check if localStorage has the expected value
        const storedValueStr = window.localStorage.getItem(storageKey);

        if (!storedValueStr) {
          log(`Key '${storageKey}' missing from localStorage, restoring`);
          writeToStorage(latestValueRef.current);
        }
      }
    }, syncInterval);

    // Cleanup
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
      clearInterval(syncIntervalId);

      // Ensure data is saved when component unmounts
      writeToStorage(latestValueRef.current);
    };
  }, [storageKey, metadataKey, syncInterval, refreshValue, writeToStorage, checkForExternalUpdates, log]);

  return [storedValue, setValue, refreshValue];
}
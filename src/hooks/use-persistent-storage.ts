
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * An enhanced local storage hook that ensures data persistence across tab navigation,
 * browser refreshes, and route changes with improved synchronization mechanisms.
 */
export function usePersistentStorage<T>(
  key: string,
  initialValue: T,
  options: {
    syncInterval?: number;
    debug?: boolean;
  } = {}
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  const { syncInterval = 1000, debug = false } = options;
  
  // Create refs to track the latest value and mounted state
  const latestValueRef = useRef<T>(initialValue);
  const isMountedRef = useRef(true);
  const initialLoadDoneRef = useRef(false);
  const synchronizingRef = useRef(false);

  // Function to log debug messages
  const log = useCallback((message: string, data?: any) => {
    if (debug) {
      console.log(`[PersistentStorage] ${message}`, data);
    }
  }, [debug]);

  // Function to get value from localStorage
  const readFromStorage = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      
      log(`Reading '${key}' from localStorage:`, item ? 'found' : 'not found');
      
      if (item) {
        try {
          return JSON.parse(item);
        } catch (e) {
          console.error(`[PersistentStorage] Error parsing JSON for key '${key}':`, e);
          return initialValue;
        }
      }
      
      return initialValue;
    } catch (error) {
      console.error(`[PersistentStorage] Error reading from localStorage key '${key}':`, error);
      return initialValue;
    }
  }, [key, initialValue, log]);

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
      window.localStorage.setItem(key, valueToStore);
      
      // Also save with timestamp to track when it was last updated
      const storageMetadata = {
        value: valueToStore,
        lastUpdated: new Date().getTime()
      };
      window.localStorage.setItem(`${key}_metadata`, JSON.stringify(storageMetadata));
      
      log(`Wrote '${key}' to localStorage:`, value);
    } catch (error) {
      console.error(`[PersistentStorage] Error writing to localStorage key '${key}':`, error);
    }
  }, [key, log]);

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
      console.error(`[PersistentStorage] Error in setValue for key '${key}':`, error);
    }
  }, [key, writeToStorage]);

  // Function to force-refresh the value from localStorage
  const refreshValue = useCallback((): void => {
    if (synchronizingRef.current) return;
    
    try {
      synchronizingRef.current = true;
      log(`Forced refresh of '${key}' from localStorage`);
      const freshValue = readFromStorage();
      
      // Only update if the value has actually changed
      if (JSON.stringify(freshValue) !== JSON.stringify(latestValueRef.current)) {
        log(`Value '${key}' has changed, updating state`);
        setStoredValue(freshValue);
        latestValueRef.current = freshValue;
      }
      
      synchronizingRef.current = false;
    } catch (error) {
      synchronizingRef.current = false;
      console.error(`[PersistentStorage] Error in refreshValue:`, error);
    }
  }, [key, readFromStorage, log]);

  // Function to check if storage was updated in another tab/window
  const checkForExternalUpdates = useCallback(() => {
    if (synchronizingRef.current) return;
    
    try {
      synchronizingRef.current = true;
      const metadataStr = window.localStorage.getItem(`${key}_metadata`);
      if (!metadataStr) {
        synchronizingRef.current = false;
        return;
      }
      
      const metadata = JSON.parse(metadataStr);
      const currentValue = JSON.stringify(latestValueRef.current);
      
      if (metadata.value !== currentValue) {
        log(`External update detected for '${key}', syncing...`);
        const newValue = JSON.parse(metadata.value);
        setStoredValue(newValue);
        latestValueRef.current = newValue;
      }
      
      synchronizingRef.current = false;
    } catch (error) {
      synchronizingRef.current = false;
      console.error(`[PersistentStorage] Error checking for external updates:`, error);
    }
  }, [key, log]);

  // Set up synchronization with localStorage and handle window events
  useEffect(() => {
    // Critical fix: We need to set the initial value properly at mount time
    if (!initialLoadDoneRef.current) {
      refreshValue();
      initialLoadDoneRef.current = true;
    }

    // Handler for storage events (changes in other tabs)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        log(`Storage event detected for '${key}':`, event.newValue);
        
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
          console.error(`[PersistentStorage] Error parsing storage event for '${key}':`, error);
        }
      } else if (event.key === `${key}_metadata`) {
        checkForExternalUpdates();
      }
    };

    // Handler for visibility change (tab focus/blur)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        log(`Tab visible, refreshing '${key}' from localStorage`);
        refreshValue();
        checkForExternalUpdates();
      } else if (document.visibilityState === 'hidden') {
        log(`Tab hidden, ensuring '${key}' is saved to localStorage`);
        writeToStorage(latestValueRef.current);
      }
    };

    // Handler for page unload (refresh or close)
    const handleBeforeUnload = () => {
      log(`Page unloading, saving '${key}' to localStorage`);
      writeToStorage(latestValueRef.current);
    };

    // Additional handler for cases when the app is minimized/backgrounded on mobile
    const handlePageHide = () => {
      log(`Page hidden, saving '${key}' to localStorage`);
      writeToStorage(latestValueRef.current);
    };

    // Additional handler for cases when the app is restored on mobile
    const handlePageShow = () => {
      log(`Page shown, refreshing '${key}' from localStorage`);
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
        const storedValueStr = window.localStorage.getItem(key);
        
        if (!storedValueStr) {
          log(`Key '${key}' missing from localStorage, restoring`);
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
  }, [key, syncInterval, refreshValue, writeToStorage, checkForExternalUpdates, log]);

  return [storedValue, setValue, refreshValue];
}

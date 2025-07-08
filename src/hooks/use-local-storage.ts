import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Kokoelma avaimia, jotka on jo puhdistettu tässä sessiossa
const cleanedStorageKeys = new Set<string>();

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Haetaan käyttäjätiedot AuthContext:sta
  const { user } = useAuth();

  // Generoidaan käyttäjäkohtainen avain
  const getUserSpecificKey = (baseKey: string): string => {
    const userId = user?.id || 'anonymous';
    return `user_${userId}_${baseKey}`;
  };

  // Käytä käyttäjäkohtaista avainta
  const storageKey = getUserSpecificKey(key);

  console.log(`[useLocalStorage:${storageKey}] Hook initialized`, {
    initialValue,
    existingItem: typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
  });

  const isFirstRender = useRef(true);
  // Lisätään ref pitämään kirjaa viimeisimmästä arvosta
  const latestValueRef = useRef<T>(initialValue);

  // Puhdista vanhat suojaamattomat tiedot
  const cleanLegacyData = useRef(false);

  useEffect(() => {
    // Puhdistamme vanhat suojaamattomat avaimet vain kerran per avain ja sessio
    if (typeof window !== 'undefined' && !cleanedStorageKeys.has(key)) {
      try {
        const oldItem = window.localStorage.getItem(key);

        if (oldItem) {
          // Jos löytyy vanha suojaamaton avain, poistetaan se
          console.log(`[useLocalStorage:${key}] Found unprotected data, removing it for security`);
          window.localStorage.removeItem(key);
          console.log(`[useLocalStorage:${key}] Successfully removed unprotected data`);

          // Merkitään avain puhdistetuksi tässä sessiossa
          cleanedStorageKeys.add(key);
        }
      } catch (error) {
        console.error(`[useLocalStorage:${key}] Error cleaning legacy data:`, error);
      }

      cleanLegacyData.current = true;
    }
  }, [key]);

  // State initialization from localStorage
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      console.log(`[useLocalStorage:${storageKey}] Window not defined, returning initial value`);
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(storageKey);
      console.log(`[useLocalStorage:${storageKey}] Initial localStorage read:`, {
        rawItem: item,
        parsed: item ? JSON.parse(item) : null
      });

      // Jos localStorage:ssa ei ole arvoa, käytetään alkuarvoa
      if (!item) {
        console.log(`[useLocalStorage:${storageKey}] No existing value, using initial:`, initialValue);
        window.localStorage.setItem(storageKey, JSON.stringify(initialValue));
        return initialValue;
      }

      // Yritetään jäsentää localStorage-arvo
      try {
        const parsedItem = JSON.parse(item);
        console.log(`[useLocalStorage:${storageKey}] Successfully parsed item:`, parsedItem);
        // Päivitetään referenssi
        latestValueRef.current = parsedItem;
        return parsedItem;
      } catch (parseError) {
        console.error(`[useLocalStorage:${storageKey}] Error parsing item:`, parseError);
        return initialValue;
      }
    } catch (error) {
      console.error(`[useLocalStorage:${storageKey}] Error reading from localStorage:`, error);
      return initialValue;
    }
  });

  // Synkronoidaan propsista tulevat muutokset
  useEffect(() => {
    console.log(`[useLocalStorage:${storageKey}] Effect running`, {
      isFirstRender: isFirstRender.current,
      initialValue,
      storedValue,
      storageValue: typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
    });

    if (!isFirstRender.current && initialValue !== undefined) {
      try {
        const initialValueStr = JSON.stringify(initialValue);
        const storedValueStr = JSON.stringify(storedValue);

        console.log(`[useLocalStorage:${storageKey}] Comparing values:`, {
          initialValueStr,
          storedValueStr,
          areEqual: initialValueStr === storedValueStr
        });

        if (initialValueStr !== storedValueStr) {
          console.log(`[useLocalStorage:${storageKey}] Updating with new initialValue:`, initialValue);
          setStoredValue(initialValue);
          window.localStorage.setItem(storageKey, initialValueStr);
          latestValueRef.current = initialValue;
        }
      } catch (error) {
        console.error(`[useLocalStorage:${storageKey}] Error syncing with initialValue:`, error);
      }
    }
    isFirstRender.current = false;
  }, [initialValue, storageKey]);

  // Päivitetään localStorage kun tila muuttuu
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      console.log(`[useLocalStorage:${storageKey}] Setting new value:`, {
        previousValue: storedValue,
        newValue: valueToStore
      });

      setStoredValue(valueToStore);
      latestValueRef.current = valueToStore;

      if (typeof window !== 'undefined') {
        const valueJson = JSON.stringify(valueToStore);
        window.localStorage.setItem(storageKey, valueJson);
        console.log(`[useLocalStorage:${storageKey}] Successfully updated localStorage:`, {
          storedJson: valueJson,
          directCheck: localStorage.getItem(storageKey)
        });
      }
    } catch (error) {
      console.error(`[useLocalStorage:${storageKey}] Error writing to localStorage:`, error);
    }
  };

  // Parannettu kuuntelumekanismi storage- ja visibility-muutoksille
  useEffect(() => {
    // Funktio luetaan arvot uudelleen localStoragesta
    const readFromStorage = () => {
      try {
        if (typeof window === 'undefined') return;

        // Tarkistetaan onko localStorage saatavilla
        const item = window.localStorage.getItem(storageKey);
        console.log(`[useLocalStorage:${storageKey}] Reading from localStorage due to event:`, {
          rawItem: item,
          currentStoredValue: storedValue,
          latestRefValue: latestValueRef.current
        });

        if (!item) {
          console.log(`[useLocalStorage:${storageKey}] No item found during event check`);
          // Jos localStorage on tyhjä mutta meillä on arvo, tallennetaan se
          if (latestValueRef.current !== null && latestValueRef.current !== undefined) {
            console.log(`[useLocalStorage:${storageKey}] Restoring value from ref to localStorage:`, latestValueRef.current);
            window.localStorage.setItem(storageKey, JSON.stringify(latestValueRef.current));
          }
          return;
        }

        try {
          const parsedValue = JSON.parse(item);
          const currentValueStr = JSON.stringify(storedValue);
          const newValueStr = JSON.stringify(parsedValue);

          console.log(`[useLocalStorage:${storageKey}] Comparing current and storage values:`, {
            currentValue: storedValue,
            newValue: parsedValue,
            areEqual: newValueStr === currentValueStr
          });

          if (newValueStr !== currentValueStr) {
            console.log(`[useLocalStorage:${storageKey}] Updating state with value from storage:`, parsedValue);
            setStoredValue(parsedValue);
            latestValueRef.current = parsedValue;
          }
        } catch (parseError) {
          console.error(`[useLocalStorage:${storageKey}] Error parsing item during event:`, parseError);

          // Palautetaan viimeisin arvo, jos parseri epäonnistuu
          if (latestValueRef.current !== null && latestValueRef.current !== undefined) {
            console.log(`[useLocalStorage:${storageKey}] Restoring value from ref:`, latestValueRef.current);
            setStoredValue(latestValueRef.current);
            window.localStorage.setItem(storageKey, JSON.stringify(latestValueRef.current));
          }
        }
      } catch (error) {
        console.error(`[useLocalStorage:${storageKey}] Error in readFromStorage:`, error);
      }
    };

    // Storage-tapahtuman käsittelijä
    const handleStorageChange = (e: StorageEvent) => {
      console.log(`[useLocalStorage:${storageKey}] Storage event detected:`, {
        event: e,
        affectsCurrentKey: e.key === storageKey
      });

      if (e.key === storageKey) {
        readFromStorage();
      }
    };

    // Visibility-tapahtuman käsittelijä
    const handleVisibilityChange = () => {
      console.log(`[useLocalStorage:${storageKey}] Visibility changed:`, {
        visibilityState: document.visibilityState,
        currentStoredValue: storedValue,
        latestRefValue: latestValueRef.current,
        localStorageValue: localStorage.getItem(storageKey)
      });

      if (document.visibilityState === 'visible') {
        console.log(`[useLocalStorage:${storageKey}] Tab became visible, reading storage`);
        readFromStorage();
      } else if (document.visibilityState === 'hidden') {
        // Kun siirrytään pois välilehdeltä, varmistetaan että viimeisin arvo on tallennettu
        console.log(`[useLocalStorage:${storageKey}] Tab hidden, ensuring latest value is stored`);
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(latestValueRef.current));
        } catch (error) {
          console.error(`[useLocalStorage:${storageKey}] Error saving on visibility change:`, error);
        }
      }
    };

    // Focus-tapahtuman käsittelijä
    const handleFocus = () => {
      console.log(`[useLocalStorage:${storageKey}] Window focus event`);
      readFromStorage();
    };

    // Blur-tapahtuman käsittelijä - tallennetaan arvo kun poistutaan
    const handleBlur = () => {
      console.log(`[useLocalStorage:${storageKey}] Window blur event, saving latest value:`, latestValueRef.current);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(latestValueRef.current));
      } catch (error) {
        console.error(`[useLocalStorage:${storageKey}] Error saving on blur:`, error);
      }
    };

    // Lisätään kuuntelijat
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Siivotaan kuuntelijat
    return () => {
      console.log(`[useLocalStorage:${storageKey}] Cleaning up event listeners`);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [storageKey, storedValue]);

  // Alustetaan/korjataan localStorage kun komponentti latautuu
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Varmistetaan että localStorage on ajan tasalla heti alussa
        const item = window.localStorage.getItem(storageKey);
        if (!item && storedValue !== null && storedValue !== undefined) {
          console.log(`[useLocalStorage:${storageKey}] Initializing localStorage with current value:`, storedValue);
          window.localStorage.setItem(storageKey, JSON.stringify(storedValue));
        }
      } catch (error) {
        console.error(`[useLocalStorage:${storageKey}] Error initializing localStorage:`, error);
      }
    }
  }, [storageKey, storedValue]);

  return [storedValue, setValue];
}
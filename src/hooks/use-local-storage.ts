
import { useState, useEffect, useRef } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  console.log(`[useLocalStorage:${key}] Hook initialized`, {
    initialValue,
    existingItem: typeof window !== 'undefined' ? localStorage.getItem(key) : null
  });
  
  const isFirstRender = useRef(true);
  // Lisätään ref pitämään kirjaa viimeisimmästä arvosta
  const latestValueRef = useRef<T>(initialValue);
  
  // State initialization from localStorage
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      console.log(`[useLocalStorage:${key}] Window not defined, returning initial value`);
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      console.log(`[useLocalStorage:${key}] Initial localStorage read:`, {
        rawItem: item,
        parsed: item ? JSON.parse(item) : null
      });
      
      // Jos localStorage:ssa ei ole arvoa, käytetään alkuarvoa
      if (!item) {
        console.log(`[useLocalStorage:${key}] No existing value, using initial:`, initialValue);
        window.localStorage.setItem(key, JSON.stringify(initialValue));
        return initialValue;
      }
      
      // Yritetään jäsentää localStorage-arvo
      try {
        const parsedItem = JSON.parse(item);
        console.log(`[useLocalStorage:${key}] Successfully parsed item:`, parsedItem);
        // Päivitetään referenssi
        latestValueRef.current = parsedItem;
        return parsedItem;
      } catch (parseError) {
        console.error(`[useLocalStorage:${key}] Error parsing item:`, parseError);
        return initialValue;
      }
    } catch (error) {
      console.error(`[useLocalStorage:${key}] Error reading from localStorage:`, error);
      return initialValue;
    }
  });
  
  // Synkronoidaan propsista tulevat muutokset
  useEffect(() => {
    console.log(`[useLocalStorage:${key}] Effect running`, {
      isFirstRender: isFirstRender.current,
      initialValue,
      storedValue,
      storageValue: typeof window !== 'undefined' ? localStorage.getItem(key) : null
    });
    
    if (!isFirstRender.current && initialValue !== undefined) {
      try {
        const initialValueStr = JSON.stringify(initialValue);
        const storedValueStr = JSON.stringify(storedValue);
        
        console.log(`[useLocalStorage:${key}] Comparing values:`, {
          initialValueStr,
          storedValueStr,
          areEqual: initialValueStr === storedValueStr
        });
        
        if (initialValueStr !== storedValueStr) {
          console.log(`[useLocalStorage:${key}] Updating with new initialValue:`, initialValue);
          setStoredValue(initialValue);
          window.localStorage.setItem(key, initialValueStr);
          latestValueRef.current = initialValue;
        }
      } catch (error) {
        console.error(`[useLocalStorage:${key}] Error syncing with initialValue:`, error);
      }
    }
    isFirstRender.current = false;
  }, [initialValue, key]);
  
  // Päivitetään localStorage kun tila muuttuu
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      console.log(`[useLocalStorage:${key}] Setting new value:`, {
        previousValue: storedValue,
        newValue: valueToStore
      });
      
      setStoredValue(valueToStore);
      latestValueRef.current = valueToStore;
      
      if (typeof window !== 'undefined') {
        const valueJson = JSON.stringify(valueToStore);
        window.localStorage.setItem(key, valueJson);
        console.log(`[useLocalStorage:${key}] Successfully updated localStorage:`, {
          storedJson: valueJson,
          directCheck: localStorage.getItem(key)
        });
      }
    } catch (error) {
      console.error(`[useLocalStorage:${key}] Error writing to localStorage:`, error);
    }
  };
  
  // Parannettu kuuntelumekanismi storage- ja visibility-muutoksille
  useEffect(() => {
    // Funktio luetaan arvot uudelleen localStoragesta
    const readFromStorage = () => {
      try {
        if (typeof window === 'undefined') return;
        
        // Tarkistetaan onko localStorage saatavilla
        const item = window.localStorage.getItem(key);
        console.log(`[useLocalStorage:${key}] Reading from localStorage due to event:`, {
          rawItem: item,
          currentStoredValue: storedValue,
          latestRefValue: latestValueRef.current
        });
        
        if (!item) {
          console.log(`[useLocalStorage:${key}] No item found during event check`);
          // Jos localStorage on tyhjä mutta meillä on arvo, tallennetaan se
          if (latestValueRef.current !== null && latestValueRef.current !== undefined) {
            console.log(`[useLocalStorage:${key}] Restoring value from ref to localStorage:`, latestValueRef.current);
            window.localStorage.setItem(key, JSON.stringify(latestValueRef.current));
          }
          return;
        }
        
        try {
          const parsedValue = JSON.parse(item);
          const currentValueStr = JSON.stringify(storedValue);
          const newValueStr = JSON.stringify(parsedValue);
          
          console.log(`[useLocalStorage:${key}] Comparing current and storage values:`, {
            currentValue: storedValue,
            newValue: parsedValue,
            areEqual: newValueStr === currentValueStr
          });
          
          if (newValueStr !== currentValueStr) {
            console.log(`[useLocalStorage:${key}] Updating state with value from storage:`, parsedValue);
            setStoredValue(parsedValue);
            latestValueRef.current = parsedValue;
          }
        } catch (parseError) {
          console.error(`[useLocalStorage:${key}] Error parsing item during event:`, parseError);
          
          // Palautetaan viimeisin arvo, jos parseri epäonnistuu
          if (latestValueRef.current !== null && latestValueRef.current !== undefined) {
            console.log(`[useLocalStorage:${key}] Restoring value from ref:`, latestValueRef.current);
            setStoredValue(latestValueRef.current);
            window.localStorage.setItem(key, JSON.stringify(latestValueRef.current));
          }
        }
      } catch (error) {
        console.error(`[useLocalStorage:${key}] Error in readFromStorage:`, error);
      }
    };
    
    // Storage-tapahtuman käsittelijä
    const handleStorageChange = (e: StorageEvent) => {
      console.log(`[useLocalStorage:${key}] Storage event detected:`, {
        event: e,
        affectsCurrentKey: e.key === key
      });
      
      if (e.key === key) {
        readFromStorage();
      }
    };
    
    // Visibility-tapahtuman käsittelijä
    const handleVisibilityChange = () => {
      console.log(`[useLocalStorage:${key}] Visibility changed:`, {
        visibilityState: document.visibilityState,
        currentStoredValue: storedValue,
        latestRefValue: latestValueRef.current,
        localStorageValue: localStorage.getItem(key)
      });
      
      if (document.visibilityState === 'visible') {
        console.log(`[useLocalStorage:${key}] Tab became visible, reading storage`);
        readFromStorage();
      } else if (document.visibilityState === 'hidden') {
        // Kun siirrytään pois välilehdeltä, varmistetaan että viimeisin arvo on tallennettu
        console.log(`[useLocalStorage:${key}] Tab hidden, ensuring latest value is stored`);
        try {
          window.localStorage.setItem(key, JSON.stringify(latestValueRef.current));
        } catch (error) {
          console.error(`[useLocalStorage:${key}] Error saving on visibility change:`, error);
        }
      }
    };
    
    // Focus-tapahtuman käsittelijä
    const handleFocus = () => {
      console.log(`[useLocalStorage:${key}] Window focus event`);
      readFromStorage();
    };
    
    // Blur-tapahtuman käsittelijä - tallennetaan arvo kun poistutaan
    const handleBlur = () => {
      console.log(`[useLocalStorage:${key}] Window blur event, saving latest value:`, latestValueRef.current);
      try {
        window.localStorage.setItem(key, JSON.stringify(latestValueRef.current));
      } catch (error) {
        console.error(`[useLocalStorage:${key}] Error saving on blur:`, error);
      }
    };
    
    // Lisätään kuuntelijat
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Siivotaan kuuntelijat
    return () => {
      console.log(`[useLocalStorage:${key}] Cleaning up event listeners`);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [key, storedValue]);
  
  // Alustetaan/korjataan localStorage kun komponentti latautuu
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Varmistetaan että localStorage on ajan tasalla heti alussa
        const item = window.localStorage.getItem(key);
        if (!item && storedValue !== null && storedValue !== undefined) {
          console.log(`[useLocalStorage:${key}] Initializing localStorage with current value:`, storedValue);
          window.localStorage.setItem(key, JSON.stringify(storedValue));
        }
      } catch (error) {
        console.error(`[useLocalStorage:${key}] Error initializing localStorage:`, error);
      }
    }
  }, [key, storedValue]);
  
  return [storedValue, setValue];
}

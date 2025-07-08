// src/components/SimplePageTransition.tsx
import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

interface SimplePageTransitionProps {
  children: React.ReactNode;
  minDelay?: number;
}

// Reittiryhmiä tunniste - määrittelee mitkä reitit ovat "samassa ryhmässä"
// ja välttää turhaa transitiota ryhmien sisällä
const ROUTE_GROUPS = {
  // Perusreitit ilman yritysvaatimusta (ei transitiota näiden välillä)
  basic: ['/dashboard', '/profile', '/ai-assistant', '/ai-assistant-history'],

  // Yritysvaatimuksen sisältävät reitit (ei transitiota näiden välillä)
  company: ['/assessment', '/tasks', '/task-list', '/task-generator',
    '/valuation', '/sharing', '/sharing-manager', '/help'],
};

const SimplePageTransition: React.FC<SimplePageTransitionProps> = ({ 
  children, 
  minDelay = 100 // Säilytetään alkuperäinen viivearvo
}) => {
  const [isReady, setIsReady] = useState(true); // Aloita valmiustilassa
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  // Palauttaa reittitunnisteen (eli mihin ryhmään reitti kuuluu)
  const getRouteGroup = (path: string): string | null => {
    for (const [group, paths] of Object.entries(ROUTE_GROUPS)) {
      if (paths.some(route => path.startsWith(route))) {
        return group;
      }
    }
    return null;
  };

  useEffect(() => {
    const currentPath = location.pathname;
    const prevPath = prevPathRef.current;

    // Älä näytä transitiota tietyissä tilanteissa
    const currentGroup = getRouteGroup(currentPath);
    const prevGroup = getRouteGroup(prevPath);

    const shouldSkipTransition =
      // Jos olemme samassa reittidomeenissa, ei transitiota
      currentGroup === prevGroup ||
      // Jos kyseessä on polun parametri tai query-parametri muutos, ei transitiota
      currentPath.split('?')[0] === prevPath.split('?')[0] ||
      // Jos polku eroaa vain ID-parametrilla, ei transitiota 
      (currentPath.includes('/') && prevPath.includes('/') &&
       currentPath.split('/').length === prevPath.split('/').length);

    console.log(`Route change: ${prevPath} -> ${currentPath}`);
    console.log(`Groups: ${prevGroup} -> ${currentGroup}, Skip transition: 
${shouldSkipTransition}`);

    // Päivitä reittireferenssi
    prevPathRef.current = currentPath;

    if (shouldSkipTransition) {
      // Ohitetaan transitio, pidetään sisältö näkyvissä
      setIsReady(true);
      return;
    }

    // Näytetään transitio vain kun vaihdamme eri reittidomeenien välillä
    setIsReady(false);

    const timer = setTimeout(() => {
      console.log("Transition delay complete, showing content");
      setIsReady(true);
    }, minDelay);

    return () => clearTimeout(timer);
  }, [location.pathname, minDelay]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return <>{children}</>;
};

export default SimplePageTransition;
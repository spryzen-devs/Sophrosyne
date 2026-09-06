import { useState, useEffect } from 'react';

/**
 * Custom hook to fetch laptop battery level via Web Battery API
 * @returns {number|null} Battery percentage (0-100) or null if unavailable
 */
export function useLaptopBattery() {
  const [laptopBattery, setLaptopBattery] = useState(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      navigator.getBattery().then((batteryObj) => {
        setLaptopBattery(Math.round(batteryObj.level * 100));
        const handleLevelChange = () => {
          setLaptopBattery(Math.round(batteryObj.level * 100));
        };
        batteryObj.addEventListener('levelchange', handleLevelChange);
        return () => {
          batteryObj.removeEventListener('levelchange', handleLevelChange);
        };
      }).catch(() => {});
    }
  }, []);

  return laptopBattery;
}

export default useLaptopBattery;

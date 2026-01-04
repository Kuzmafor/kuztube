'use client';

import { useState, useEffect } from 'react';
import Snowfall from './Snowfall';
import Garland from './Garland';

export default function WinterEffects() {
  const [snowEnabled, setSnowEnabled] = useState(true);
  const [garlandEnabled, setGarlandEnabled] = useState(true);

  // Загрузка настроек из localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('kuztube-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setSnowEnabled(settings.snowEnabled ?? true);
      setGarlandEnabled(settings.garlandEnabled ?? true);
    }
  }, []);

  // Слушаем изменения настроек
  useEffect(() => {
    const handleSettingsChange = (event: CustomEvent) => {
      const settings = event.detail;
      setSnowEnabled(settings.snowEnabled ?? true);
      setGarlandEnabled(settings.garlandEnabled ?? true);
    };

    window.addEventListener('settings-changed', handleSettingsChange as EventListener);
    return () => window.removeEventListener('settings-changed', handleSettingsChange as EventListener);
  }, []);

  return (
    <>
      {snowEnabled && <Snowfall />}
      {garlandEnabled && <Garland />}
    </>
  );
}

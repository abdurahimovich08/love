import React, { createContext, useContext } from 'react';
import { AppConfig } from '../types';
import { DEFAULT_APP_CONFIG } from '../services/runtimeConfig';

interface AppRuntimeContextValue {
  config: AppConfig;
  campaignSlug: string | null;
  sessionId: string | null;
  trackEvent: (eventType: string, payload?: Record<string, unknown>) => void;
}

const noopTrack = (): void => {};

const AppRuntimeContext = createContext<AppRuntimeContextValue>({
  config: DEFAULT_APP_CONFIG,
  campaignSlug: null,
  sessionId: null,
  trackEvent: noopTrack,
});

export const AppRuntimeProvider = AppRuntimeContext.Provider;

export const useAppRuntime = (): AppRuntimeContextValue => useContext(AppRuntimeContext);

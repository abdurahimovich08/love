import { MY_NAME, PARTNER_FIRST_NAME, PARTNER_LAST_NAME } from '../constants';
import { AppConfig } from '../types';
import { getCampaignBySlug } from './sessionStore';

export interface ResolvedRuntimeConfig {
  config: AppConfig;
  campaignSlug: string | null;
  source: 'default' | 'query' | 'campaign';
}

export const DEFAULT_APP_CONFIG: AppConfig = {
  partnerFirstName: PARTNER_FIRST_NAME,
  partnerLastName: PARTNER_LAST_NAME,
  myName: MY_NAME,
  specialContestantName: PARTNER_FIRST_NAME,
  specialContestantImage: '',
  campaignTitle: `${PARTNER_FIRST_NAME} uchun maxsus sahifa`,
};

const sanitizeText = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const sanitizeImageSource = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return trimmed;
    }
  } catch {
    return '';
  }

  return '';
};

export const normalizeConfig = (partial?: Partial<AppConfig>): AppConfig => {
  const partnerFirstName = sanitizeText(partial?.partnerFirstName, DEFAULT_APP_CONFIG.partnerFirstName);
  const partnerLastName = sanitizeText(partial?.partnerLastName, DEFAULT_APP_CONFIG.partnerLastName);
  const myName = sanitizeText(partial?.myName, DEFAULT_APP_CONFIG.myName);
  const specialContestantName = sanitizeText(partial?.specialContestantName, partnerFirstName);
  const specialContestantImage = sanitizeImageSource(partial?.specialContestantImage);
  const campaignTitle = sanitizeText(partial?.campaignTitle, `${partnerFirstName} uchun maxsus sahifa`);

  return {
    partnerFirstName,
    partnerLastName,
    myName,
    specialContestantName,
    specialContestantImage,
    campaignTitle,
  };
};

const base64UrlEncode = (plainText: string): string => {
  const bytes = new TextEncoder().encode(plainText);
  let binary = '';
  bytes.forEach((value) => {
    binary += String.fromCharCode(value);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const base64UrlDecode = (encodedText: string): string => {
  const base64 = encodedText.replace(/-/g, '+').replace(/_/g, '/');
  const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`;
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

export const encodeConfigPayload = (config: AppConfig): string => {
  const normalized = normalizeConfig(config);
  return base64UrlEncode(JSON.stringify(normalized));
};

export const decodeConfigPayload = (payload: string): AppConfig | null => {
  try {
    const decoded = base64UrlDecode(payload.trim());
    const parsed = JSON.parse(decoded) as Partial<AppConfig>;
    return normalizeConfig(parsed);
  } catch {
    return null;
  }
};

export const isStudioModeSearch = (search: string): boolean => {
  const params = new URLSearchParams(search);
  const mode = (params.get('mode') ?? '').toLowerCase();
  const admin = (params.get('admin') ?? '').toLowerCase();
  const studio = (params.get('studio') ?? '').toLowerCase();

  return mode === 'studio' || admin === '1' || admin === 'true' || studio === '1' || studio === 'true';
};

export const isAdminModeSearch = (search: string): boolean => {
  const params = new URLSearchParams(search);
  const mode = (params.get('mode') ?? '').toLowerCase();
  const panel = (params.get('panel') ?? '').toLowerCase();
  const dashboard = (params.get('dashboard') ?? '').toLowerCase();

  return mode === 'admin' || panel === 'admin' || dashboard === 'admin';
};

export const getAdminKeyFromSearch = (search: string): string => {
  const params = new URLSearchParams(search);
  return (params.get('key') ?? params.get('adminKey') ?? '').trim();
};

export const resolveRuntimeConfig = async (search: string): Promise<ResolvedRuntimeConfig> => {
  const params = new URLSearchParams(search);
  const campaignSlug = params.get('campaign');

  if (campaignSlug) {
    const campaign = await getCampaignBySlug(campaignSlug);
    if (campaign?.config) {
      return {
        config: normalizeConfig(campaign.config),
        campaignSlug: campaign.slug,
        source: 'campaign',
      };
    }
  }

  const encodedConfig = params.get('cfg');
  if (encodedConfig) {
    const decodedConfig = decodeConfigPayload(encodedConfig);
    if (decodedConfig) {
      return {
        config: decodedConfig,
        campaignSlug: null,
        source: 'query',
      };
    }
  }

  return {
    config: normalizeConfig(DEFAULT_APP_CONFIG),
    campaignSlug: null,
    source: 'default',
  };
};

export const buildShareLink = (config: AppConfig): string => {
  const encoded = encodeConfigPayload(config);
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('cfg', encoded);
  return url.toString();
};

export const buildCampaignShareLink = (campaignSlug: string): string => {
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('campaign', campaignSlug);
  return url.toString();
};

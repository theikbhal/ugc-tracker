import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Settings, DEFAULT_SETTINGS } from './types';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(settings?: Settings): SupabaseClient | null {
  if (!settings) {
    settings = getSettings();
  }

  if (!settings.use_supabase || !settings.supabase_url || !settings.supabase_anon_key) {
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(settings.supabase_url, settings.supabase_anon_key);
  }

  return supabaseInstance;
}

function getSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem('ugc_settings');
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_CONFIG_KEY = 'obscura_supabase_config_v1';
const LOCAL_ADMIN_SESSION_KEY = 'obscura_admin_session_v1';

// Pure in-memory session variable - naturally resets to false on page refresh
let inMemoryAdminActive = false;

// Purge any stored persistent admin tokens from previous sessions on module initialization
try {
  localStorage.removeItem(LOCAL_ADMIN_SESSION_KEY);
  sessionStorage.removeItem(LOCAL_ADMIN_SESSION_KEY);
} catch {
  // Ignore storage access errors
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey && !envUrl.includes('your-supabase-project')) {
    return { url: envUrl, anonKey: envKey };
  }

  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading Supabase config from localStorage:', e);
  }

  return { url: '', anonKey: '' };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  try {
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event('supabase-config-updated'));
  } catch (e) {
    console.error('Error saving Supabase config to localStorage:', e);
  }
}

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey) {
    return null;
  }

  if (cachedClient && cachedUrl === url && cachedKey === anonKey) {
    return cachedClient;
  }

  try {
    // Disable session persistence so page refresh automatically terminates auth session
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
    cachedUrl = url;
    cachedKey = anonKey;
    return cachedClient;
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
    return null;
  }
}

// Session state management - Ephemeral in-memory session
export function isLocalAdminSessionActive(): boolean {
  return inMemoryAdminActive;
}

export function setLocalAdminSessionActive(active: boolean): void {
  inMemoryAdminActive = active;
  window.dispatchEvent(new Event('admin-session-changed'));
}

export async function signInAdmin(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setLocalAdminSessionActive(true);
        return { success: true };
      }
    } catch (e: any) {
      return { success: false, error: e.message || 'Authentication error' };
    }
  }

  // Fallback mode if Supabase credentials are not set up or offline
  if (email.trim().length > 0 && password.trim().length > 0) {
    setLocalAdminSessionActive(true);
    return { success: true };
  }

  return { success: false, error: 'Please enter valid credentials' };
}

export async function signOutAdmin(): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.auth.signOut();
    } catch (e) {
      console.error('Supabase signout error:', e);
    }
  }
  setLocalAdminSessionActive(false);
}

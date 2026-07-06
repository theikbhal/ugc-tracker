import { v4 as uuidv4 } from 'uuid';
import { UGCCreator, DMMessage, App, Settings, DEFAULT_SETTINGS, DMTemplate } from './types';
import { getSupabaseClient } from './supabase';

function getSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem('ugc_settings');
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function isLocalStorageEnabled(): boolean {
  const settings = getSettings();
  return settings.use_local_storage;
}

function isSupabaseEnabled(): boolean {
  const settings = getSettings();
  return settings.use_supabase;
}

// ============ CREATORS ============

export async function getCreators(): Promise<UGCCreator[]> {
  if (isSupabaseEnabled()) {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.from('creators').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
  }

  if (isLocalStorageEnabled()) {
    try {
      const stored = localStorage.getItem('ugc_creators');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  return [];
}

export async function getCreator(id: string): Promise<UGCCreator | null> {
  if (isSupabaseEnabled()) {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.from('creators').select('*').eq('id', id).single();
      if (!error && data) return data;
    }
  }

  if (isLocalStorageEnabled()) {
    const creators = await getCreators();
    return creators.find(c => c.id === id) || null;
  }

  return null;
}

export async function createCreator(data: Partial<UGCCreator>): Promise<UGCCreator> {
  const creator: UGCCreator = {
    id: uuidv4(),
    instagram_id: data.instagram_id || '',
    instagram_link: data.instagram_link || '',
    name: data.name || '',
    notes: data.notes || '',
    apps: data.apps || [],
    status: data.status || 'new',
    followers: data.followers || 0,
    following: data.following || 0,
    posts: data.posts || 0,
    related_creators: data.related_creators || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseEnabled()) {
    const client = getSupabaseClient();
    if (client) {
      const { data: inserted, error } = await client.from('creators').insert(creator).select().single();
      if (!error && inserted) return inserted;
    }
  }

  if (isLocalStorageEnabled()) {
    const creators = await getCreators();
    creators.unshift(creator);
    localStorage.setItem('ugc_creators', JSON.stringify(creators));
  }

  return creator;
}

export async function updateCreator(id: string, data: Partial<UGCCreator>): Promise<UGCCreator | null> {
  const updates = { ...data, updated_at: new Date().toISOString() };

  if (isSupabaseEnabled()) {
    const client = getSupabaseClient();
    if (client) {
      const { data: updated, error } = await client.from('creators').update(updates).eq('id', id).select().single();
      if (!error && updated) return updated;
    }
  }

  if (isLocalStorageEnabled()) {
    const creators = await getCreators();
    const index = creators.findIndex(c => c.id === id);
    if (index !== -1) {
      creators[index] = { ...creators[index], ...updates };
      localStorage.setItem('ugc_creators', JSON.stringify(creators));
      return creators[index];
    }
  }

  return null;
}

export async function deleteCreator(id: string): Promise<boolean> {
  if (isSupabaseEnabled()) {
    const client = getSupabaseClient();
    if (client) {
      const { error } = await client.from('creators').delete().eq('id', id);
      if (!error) return true;
    }
  }

  if (isLocalStorageEnabled()) {
    const creators = await getCreators();
    const filtered = creators.filter(c => c.id !== id);
    localStorage.setItem('ugc_creators', JSON.stringify(filtered));
    return true;
  }

  return false;
}

export async function bulkAddCreators(creators: Partial<UGCCreator>[]): Promise<UGCCreator[]> {
  const newCreators: UGCCreator[] = creators.map(data => ({
    id: uuidv4(),
    instagram_id: data.instagram_id || '',
    instagram_link: data.instagram_link || '',
    name: data.name || '',
    notes: data.notes || '',
    apps: data.apps || [],
    status: data.status || 'new',
    followers: data.followers || 0,
    following: data.following || 0,
    posts: data.posts || 0,
    related_creators: data.related_creators || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  if (isSupabaseEnabled()) {
    const client = getSupabaseClient();
    if (client) {
      const { data: inserted, error } = await client.from('creators').insert(newCreators).select();
      if (!error && inserted) return inserted;
    }
  }

  if (isLocalStorageEnabled()) {
    const existing = await getCreators();
    const all = [...newCreators, ...existing];
    localStorage.setItem('ugc_creators', JSON.stringify(all));
  }

  return newCreators;
}

export async function bulkAddNotesSuffix(creatorIds: string[], suffix: string): Promise<void> {
  if (isSupabaseEnabled()) {
    const client = getSupabaseClient();
    if (client) {
      for (const id of creatorIds) {
        const creator = await getCreator(id);
        if (creator) {
          await client.from('creators').update({
            notes: creator.notes ? `${creator.notes} ${suffix}` : suffix,
            updated_at: new Date().toISOString(),
          }).eq('id', id);
        }
      }
      return;
    }
  }

  if (isLocalStorageEnabled()) {
    const creators = await getCreators();
    const updated = creators.map(c => {
      if (creatorIds.includes(c.id)) {
        return {
          ...c,
          notes: c.notes ? `${c.notes} ${suffix}` : suffix,
          updated_at: new Date().toISOString(),
        };
      }
      return c;
    });
    localStorage.setItem('ugc_creators', JSON.stringify(updated));
  }
}

export async function bulkAddAppToCreators(creatorIds: string[], appName: string): Promise<void> {
  if (isSupabaseEnabled()) {
    const client = getSupabaseClient();
    if (client) {
      for (const id of creatorIds) {
        const creator = await getCreator(id);
        if (creator && !creator.apps.includes(appName)) {
          await client.from('creators').update({
            apps: [...creator.apps, appName],
            updated_at: new Date().toISOString(),
          }).eq('id', id);
        }
      }
      return;
    }
  }

  if (isLocalStorageEnabled()) {
    const creators = await getCreators();
    const updated = creators.map(c => {
      if (creatorIds.includes(c.id) && !c.apps.includes(appName)) {
        return {
          ...c,
          apps: [...c.apps, appName],
          updated_at: new Date().toISOString(),
        };
      }
      return c;
    });
    localStorage.setItem('ugc_creators', JSON.stringify(updated));
  }
}

// ============ DM TEMPLATES ============

export async function getDMTemplates(): Promise<DMTemplate[]> {
  if (isSupabaseEnabled()) {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.from('dm_templates').select('*').order('name');
      if (!error && data) return data;
    }
  }
  if (isLocalStorageEnabled()) {
    try {
      const stored = localStorage.getItem('ugc_dm_templates');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  }
  return [];
}

export async function createDMTemplate(data: Partial<DMTemplate>): Promise<DMTemplate> {
  const tmpl: DMTemplate = {
    id: uuidv4(),
    name: data.name || '',
    message: data.message || '',
    created_at: new Date().toISOString(),
  };
  if (isSupabaseEnabled()) {
    const client = getSupabaseClient();
    if (client) {
      const { data: inserted, error } = await client.from('dm_templates').insert(tmpl).select().single();
      if (!error && inserted) return inserted;
    }
  }
  if (isLocalStorageEnabled()) {
    const list = await getDMTemplates();
    list.push(tmpl);
    list.sort((a, b) => a.name.localeCompare(b.name));
    localStorage.setItem('ugc_dm_templates', JSON.stringify(list));
  }
  return tmpl;
}

export async function updateDMTemplate(id: string, data: Partial<DMTemplate>): Promise<DMTemplate | null> {
  if (isSupabaseEnabled()) {
    const client = getSupabaseClient();
    if (client) {
      const { data: updated, error } = await client.from('dm_templates').update(data).eq('id', id).select().single();
      if (!error && updated) return updated;
    }
  }
  if (isLocalStorageEnabled()) {
    const list = await getDMTemplates();
    const idx = list.findIndex(t => t.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      localStorage.setItem('ugc_dm_templates', JSON.stringify(list));
      return list[idx];
    }
  }
  return null;
}

export async function deleteDMTemplate(id: string): Promise<boolean> {
  if (isSupabaseEnabled()) {
    const client = getSupabaseClient();
    if (client) {
      const { error } = await client.from('dm_templates').delete().eq('id', id);
      if (!error) return true;
    }
  }
  if (isLocalStorageEnabled()) {
    const list = await getDMTemplates();
    localStorage.setItem('ugc_dm_templates', JSON.stringify(list.filter(t => t.id !== id)));
    return true;
  }
  return false;
}

// ============ DM MESSAGES ============

export async function getDMMessages(creatorId?: string): Promise<DMMessage[]> {
  if (isSupabaseEnabled()) {
    const client = getSupabaseClient();
    if (client) {
      let query = client.from('dm_messages').select('*').order('sent_at', { ascending: false });
      if (creatorId) query = query.eq('creator_id', creatorId);
      const { data, error } = await query;
      if (!error && data) return data;
    }
  }

  if (isLocalStorageEnabled()) {
    try {
      const stored = localStorage.getItem('ugc_dm_messages');
      const messages: DMMessage[] = stored ? JSON.parse(stored) : [];
      if (creatorId) return messages.filter(m => m.creator_id === creatorId);
      return messages;
    } catch {
      return [];
    }
  }

  return [];
}

export async function createDMMessage(data: Partial<DMMessage>): Promise<DMMessage> {
  const message: DMMessage = {
    id: uuidv4(),
    creator_id: data.creator_id || '',
    message: data.message || '',
    sent_at: data.sent_at || new Date().toISOString(),
    responded: data.responded || false,
    responded_at: data.responded_at || null,
    response_text: data.response_text || null,
    status: data.status || 'sent',
  };

  if (isSupabaseEnabled()) {
    const client = getSupabaseClient();
    if (client) {
      const { data: inserted, error } = await client.from('dm_messages').insert(message).select().single();
      if (!error && inserted) return inserted;
    }
  }

  if (isLocalStorageEnabled()) {
    const messages = await getDMMessages();
    messages.unshift(message);
    localStorage.setItem('ugc_dm_messages', JSON.stringify(messages));
  }

  return message;
}

export async function updateDMMessage(id: string, data: Partial<DMMessage>): Promise<DMMessage | null> {
  if (isSupabaseEnabled()) {
    const client = getSupabaseClient();
    if (client) {
      const { data: updated, error } = await client.from('dm_messages').update(data).eq('id', id).select().single();
      if (!error && updated) return updated;
    }
  }

  if (isLocalStorageEnabled()) {
    const messages = await getDMMessages();
    const index = messages.findIndex(m => m.id === id);
    if (index !== -1) {
      messages[index] = { ...messages[index], ...data };
      localStorage.setItem('ugc_dm_messages', JSON.stringify(messages));
      return messages[index];
    }
  }

  return null;
}

export async function deleteDMMessage(id: string): Promise<boolean> {
  if (isSupabaseEnabled()) {
    const client = getSupabaseClient();
    if (client) {
      const { error } = await client.from('dm_messages').delete().eq('id', id);
      if (!error) return true;
    }
  }

  if (isLocalStorageEnabled()) {
    const messages = await getDMMessages();
    const filtered = messages.filter(m => m.id !== id);
    localStorage.setItem('ugc_dm_messages', JSON.stringify(filtered));
    return true;
  }

  return false;
}

// ============ APPS ============

export async function getApps(): Promise<App[]> {
  if (isSupabaseEnabled()) {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.from('apps').select('*').order('name');
      if (!error && data) return data;
    }
  }

  if (isLocalStorageEnabled()) {
    try {
      const stored = localStorage.getItem('ugc_apps');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  return [];
}

export async function createApp(data: Partial<App>): Promise<App> {
  const app: App = {
    id: uuidv4(),
    name: data.name || '',
    description: data.description || '',
    created_at: new Date().toISOString(),
  };

  if (isSupabaseEnabled()) {
    const client = getSupabaseClient();
    if (client) {
      const { data: inserted, error } = await client.from('apps').insert(app).select().single();
      if (!error && inserted) return inserted;
    }
  }

  if (isLocalStorageEnabled()) {
    const apps = await getApps();
    apps.push(app);
    apps.sort((a, b) => a.name.localeCompare(b.name));
    localStorage.setItem('ugc_apps', JSON.stringify(apps));
  }

  return app;
}

export async function deleteApp(id: string): Promise<boolean> {
  if (isSupabaseEnabled()) {
    const client = getSupabaseClient();
    if (client) {
      const { error } = await client.from('apps').delete().eq('id', id);
      if (!error) return true;
    }
  }

  if (isLocalStorageEnabled()) {
    const apps = await getApps();
    const filtered = apps.filter(a => a.id !== id);
    localStorage.setItem('ugc_apps', JSON.stringify(filtered));
    return true;
  }

  return false;
}

// ============ SETTINGS ============

export function getSettingsValue(): Settings {
  return getSettings();
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem('ugc_settings', JSON.stringify(settings));
}



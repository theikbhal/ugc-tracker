'use client';

import { useState, useEffect } from 'react';
import { Settings, DEFAULT_SETTINGS } from '@/lib/types';
import { getSettingsValue, saveSettings } from '@/lib/storage';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(getSettingsValue());
  }, []);

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <div className={`toggle ${value ? 'active' : ''}`} onClick={() => onChange(!value)} />
  );

  return (
    <div style={{ padding: '16px', maxWidth: '500px', margin: '0 auto' }}>
      <div style={{ marginBottom: '16px' }}>
        <a href="/" style={{ color: 'var(--text-muted)', fontSize: '12px', textDecoration: 'none' }}>← Back</a>
        <h1 style={{ fontSize: '20px', fontWeight: '700' }}>Settings</h1>
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Storage</h2>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>Local Storage</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Store data in browser localStorage</div>
          </div>
          <Toggle value={settings.use_local_storage} onChange={v => setSettings(s => ({ ...s, use_local_storage: v }))} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>Supabase</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Use Supabase cloud database</div>
          </div>
          <Toggle value={settings.use_supabase} onChange={v => setSettings(s => ({ ...s, use_supabase: v }))} />
        </div>
      </div>

      {settings.use_supabase && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Supabase Config</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Project URL</label>
              <input value={settings.supabase_url} onChange={e => setSettings(s => ({ ...s, supabase_url: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Anon Key</label>
              <input type="password" value={settings.supabase_anon_key} onChange={e => setSettings(s => ({ ...s, supabase_anon_key: e.target.value }))} />
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Pagination</h2>
        <div>
          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Items per page</label>
          <select value={settings.page_size} onChange={e => setSettings(s => ({ ...s, page_size: Number(e.target.value) }))}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="btn-primary" onClick={handleSave} style={{ flex: 1 }}>
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Supabase SQL Schema</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Run this SQL in your Supabase SQL Editor to create the required tables:
        </p>
        <pre style={{ fontSize: '11px', background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
{`CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instagram_id TEXT NOT NULL DEFAULT '',
  instagram_link TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  apps TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'new',
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  posts INTEGER DEFAULT 0,
  related_creators UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  message TEXT NOT NULL DEFAULT '',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  responded BOOLEAN DEFAULT FALSE,
  responded_at TIMESTAMPTZ,
  response_text TEXT,
  status TEXT NOT NULL DEFAULT 'sent'
);

CREATE TABLE IF NOT EXISTS apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);`}
        </pre>
      </div>
    </div>
  );
}

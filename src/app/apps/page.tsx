'use client';

import { useState, useEffect, useCallback } from 'react';
import { App } from '@/lib/types';
import { getApps, createApp, deleteApp } from '@/lib/storage';
import { getCreators } from '@/lib/storage';
import { UGCCreator } from '@/lib/types';

export default function AppsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [creators, setCreators] = useState<UGCCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', website: '', play_store: '', app_store: '' });

  const load = useCallback(async () => {
    setLoading(true);
    const [a, c] = await Promise.all([getApps(), getCreators()]);
    setApps(a);
    setCreators(c);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    await createApp(form);
    setForm({ name: '', description: '', website: '', play_store: '', app_store: '' });
    setShowAdd(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this app?')) {
      await deleteApp(id);
      load();
    }
  };

  const getCreatorCount = (appName: string) => {
    return creators.filter(c => c.apps.includes(appName)).length;
  };

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <a href="/" style={{ color: 'var(--text-muted)', fontSize: '12px', textDecoration: 'none' }}>← Back</a>
          <h1 style={{ fontSize: '20px', fontWeight: '700' }}>Apps ({apps.length})</h1>
        </div>
        <button className="btn-primary btn-sm" onClick={() => { setForm({ name: '', description: '', website: '', play_store: '', app_store: '' }); setShowAdd(true); }}>+ Add App</button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Loading...</p>
      ) : apps.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No apps yet. Add one above.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {apps.map(app => (
            <div key={app.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{app.name}</h3>
                  {app.description && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{app.description}</p>}
                  <p style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '6px' }}>{getCreatorCount(app.name)} creators</p>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {app.website && <a href={app.website} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm" style={{ textDecoration: 'none', fontSize: '11px' }}>Website</a>}
                    {app.play_store && <a href={app.play_store} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm" style={{ textDecoration: 'none', fontSize: '11px' }}>Play Store</a>}
                    {app.app_store && <a href={app.app_store} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm" style={{ textDecoration: 'none', fontSize: '11px' }}>App Store</a>}
                  </div>
                </div>
                <button className="btn-danger btn-sm" onClick={() => handleDelete(app.id)}>Del</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Add App</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>App Name *</label>
                <input placeholder="e.g. Early Alarm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ padding: '10px 12px', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Description</label>
                <textarea rows={2} placeholder="What does this app do?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ padding: '10px 12px', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Website Link</label>
                <input placeholder="https://..." value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} style={{ padding: '10px 12px', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Play Store Link</label>
                <input placeholder="https://play.google.com/store/apps/..." value={form.play_store} onChange={e => setForm(f => ({ ...f, play_store: e.target.value }))} style={{ padding: '10px 12px', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>App Store Link</label>
                <input placeholder="https://apps.apple.com/app/..." value={form.app_store} onChange={e => setForm(f => ({ ...f, app_store: e.target.value }))} style={{ padding: '10px 12px', fontSize: '14px' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button className="btn-primary" disabled={!form.name.trim()} onClick={handleAdd}>Add App</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

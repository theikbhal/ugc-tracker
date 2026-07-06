'use client';

import { useState, useEffect, useCallback } from 'react';
import { App } from '@/lib/types';
import { getApps, createApp, deleteApp } from '@/lib/storage';
import { getCreators } from '@/lib/storage';
import { UGCCreator } from '@/lib/types';

export default function AppsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [creators, setCreators] = useState<UGCCreator[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [a, c] = await Promise.all([getApps(), getCreators()]);
    setApps(a);
    setCreators(c);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!name.trim()) return;
    await createApp({ name: name.trim(), description: description.trim() });
    setName('');
    setDescription('');
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
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Add App</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input placeholder="App name" value={name} onChange={e => setName(e.target.value)} style={{ flex: '1 1 150px' }} />
          <input placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} style={{ flex: '2 1 200px' }} />
          <button className="btn-primary" onClick={handleAdd}>Add</button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Loading...</p>
      ) : apps.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No apps yet. Add one above.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
          {apps.map(app => (
            <div key={app.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{app.name}</h3>
                  {app.description && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{app.description}</p>}
                  <p style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '6px' }}>{getCreatorCount(app.name)} creators</p>
                </div>
                <button className="btn-danger btn-sm" onClick={() => handleDelete(app.id)}>Del</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

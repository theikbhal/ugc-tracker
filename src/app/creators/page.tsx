'use client';

import { useState, useEffect, useCallback } from 'react';
import { UGCCreator, STATUS_OPTIONS, App } from '@/lib/types';
import { getCreators, createCreator, updateCreator, deleteCreator, bulkAddCreators, bulkAddNotesSuffix, getApps } from '@/lib/storage';
import { exportToJSON, exportToCSV } from '@/lib/export';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function CreatorsPage() {
  const [creators, setCreators] = useState<UGCCreator[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [appFilter, setAppFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showAdd, setShowAdd] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [showBulkNotes, setShowBulkNotes] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editCreator, setEditCreator] = useState<UGCCreator | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    instagram_id: '',
    instagram_link: '',
    name: '',
    notes: '',
    apps: [] as string[],
    status: 'new' as UGCCreator['status'],
    followers: 0,
    following: 0,
    posts: 0,
  });

  const [bulkText, setBulkText] = useState('');
  const [bulkNotesSuffix, setBulkNotesSuffix] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [c, a] = await Promise.all([getCreators(), getApps()]);
    setCreators(c);
    setApps(a);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = creators.filter(c => {
    if (search) {
      const q = search.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.instagram_id.toLowerCase().includes(q) && !c.instagram_link.toLowerCase().includes(q)) return false;
    }
    if (statusFilter && c.status !== statusFilter) return false;
    if (appFilter && !c.apps.includes(appFilter)) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [search, statusFilter, appFilter, pageSize]);

  const handleSave = async () => {
    if (editCreator) {
      await updateCreator(editCreator.id, form);
    } else {
      await createCreator(form);
    }
    setShowAdd(false);
    setEditCreator(null);
    resetForm();
    load();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this creator?')) {
      await deleteCreator(id);
      load();
    }
  };

  const extractInstagramId = (input: string): string => {
    const trimmed = input.trim();
    const urlMatch = trimmed.match(/instagram\.com\/([a-zA-Z0-9._]+)\/?/);
    if (urlMatch) return urlMatch[1];
    if (trimmed.startsWith('@')) return trimmed.slice(1);
    return trimmed;
  };

  const handleBulkAdd = async () => {
    const lines = bulkText.trim().split('\n').filter(Boolean);
    const newCreators = lines.map(line => {
      const instagram_id = extractInstagramId(line);
      const instagram_link = instagram_id ? `https://www.instagram.com/${instagram_id}/` : '';
      return { instagram_id, instagram_link, name: '', notes: '' };
    });
    await bulkAddCreators(newCreators);
    setBulkText('');
    setShowBulkAdd(false);
    load();
  };

  const handleBulkNotes = async () => {
    if (selectedIds.length === 0 || !bulkNotesSuffix) return;
    await bulkAddNotesSuffix(selectedIds, bulkNotesSuffix);
    setBulkNotesSuffix('');
    setSelectedIds([]);
    setShowBulkNotes(false);
    load();
  };

  const resetForm = () => {
    setForm({ instagram_id: '', instagram_link: '', name: '', notes: '', apps: [], status: 'new', followers: 0, following: 0, posts: 0 });
  };

  const openEdit = (c: UGCCreator) => {
    setForm({
      instagram_id: c.instagram_id,
      instagram_link: c.instagram_link,
      name: c.name,
      notes: c.notes,
      apps: c.apps,
      status: c.status,
      followers: c.followers,
      following: c.following,
      posts: c.posts,
    });
    setEditCreator(c);
    setShowAdd(true);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paged.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paged.map(c => c.id));
    }
  };

  const getStatusColor = (status: string) => {
    const opt = STATUS_OPTIONS.find(s => s.value === status);
    return opt?.color || 'bg-gray-100 text-gray-800';
  };

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <a href="/" style={{ color: 'var(--text-muted)', fontSize: '12px', textDecoration: 'none' }}>← Back</a>
          <h1 style={{ fontSize: '20px', fontWeight: '700' }}>Creators ({filtered.length})</h1>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button className="btn-primary btn-sm" onClick={() => { resetForm(); setEditCreator(null); setShowAdd(true); }}>+ Add</button>
          <button className="btn-secondary btn-sm" onClick={() => setShowBulkAdd(true)}>Bulk Add</button>
          {selectedIds.length > 0 && <button className="btn-secondary btn-sm" onClick={() => setShowBulkNotes(true)}>Bulk Notes ({selectedIds.length})</button>}
          <button className="btn-secondary btn-sm" onClick={() => exportToJSON(filtered, 'creators')}>JSON</button>
          <button className="btn-secondary btn-sm" onClick={() => exportToCSV(filtered, 'creators')}>CSV</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <input placeholder="Search name, instagram..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: '1 1 200px' }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto', minWidth: '120px' }}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={appFilter} onChange={e => setAppFilter(e.target.value)} style={{ width: 'auto', minWidth: '120px' }}>
          <option value="">All Apps</option>
          {apps.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
        </select>
        <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} style={{ width: 'auto', minWidth: '80px' }}>
          {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}/page</option>)}
        </select>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Loading...</p>
      ) : paged.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No creators found</p>
      ) : (
        <div className="table-container card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: '32px' }}><input type="checkbox" checked={selectedIds.length === paged.length && paged.length > 0} onChange={toggleSelectAll} /></th>
                <th>Creator</th>
                <th>Instagram</th>
                <th>Status</th>
                <th>Apps</th>
                <th>Followers</th>
                <th>Posts</th>
                <th>Notes</th>
                <th style={{ width: '80px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(c => (
                <tr key={c.id}>
                  <td><input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleSelect(c.id)} /></td>
                  <td>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>{c.name || '—'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.instagram_id || '—'}</div>
                  </td>
                  <td>
                    {c.instagram_link ? (
                      <a href={c.instagram_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: '13px', textDecoration: 'none' }}>
                        {c.instagram_link.replace('https://www.instagram.com/', '').replace('/', '')}
                      </a>
                    ) : '—'}
                  </td>
                  <td><span className={`badge ${getStatusColor(c.status)}`}>{c.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {c.apps.map(a => <span key={a} className="badge" style={{ background: 'var(--pastel-purple)', fontSize: '11px' }}>{a}</span>)}
                    </div>
                  </td>
                  <td style={{ fontSize: '13px' }}>{c.followers.toLocaleString()}</td>
                  <td style={{ fontSize: '13px' }}>{c.posts.toLocaleString()}</td>
                  <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--text-muted)' }}>{c.notes || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn-secondary btn-sm" onClick={() => openEdit(c)}>Edit</button>
                      <button className="btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
          <button className="btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
          <button className="btn-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}

      {showAdd && (
        <div className="modal-overlay" onClick={() => { setShowAdd(false); setEditCreator(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>{editCreator ? 'Edit Creator' : 'Add Creator'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Instagram ID</label>
                <input placeholder="e.g. earlyalarm" value={form.instagram_id} onChange={e => setForm(f => ({ ...f, instagram_id: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Instagram Link</label>
                <input placeholder="https://instagram.com/username" value={form.instagram_link} onChange={e => {
                  const link = e.target.value;
                  const id = extractInstagramId(link);
                  setForm(f => ({ ...f, instagram_link: link, instagram_id: id || f.instagram_id }));
                }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Name</label>
                <input placeholder="Creator name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as UGCCreator['status'] }))}>
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Apps</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {apps.map(a => (
                    <button
                      key={a.id}
                      type="button"
                      className={`btn-sm ${form.apps.includes(a.name) ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => {
                        setForm(f => ({
                          ...f,
                          apps: f.apps.includes(a.name) ? f.apps.filter(x => x !== a.name) : [...f.apps, a.name]
                        }));
                      }}
                    >
                      {a.name}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Followers</label>
                  <input type="number" value={form.followers} onChange={e => setForm(f => ({ ...f, followers: Number(e.target.value) }))} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Following</label>
                  <input type="number" value={form.following} onChange={e => setForm(f => ({ ...f, following: Number(e.target.value) }))} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Posts</label>
                  <input type="number" value={form.posts} onChange={e => setForm(f => ({ ...f, posts: Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Notes</label>
                <textarea rows={3} placeholder="Notes about this creator..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={() => { setShowAdd(false); setEditCreator(null); }}>Cancel</button>
                <button className="btn-primary" onClick={handleSave}>{editCreator ? 'Update' : 'Add'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBulkAdd && (
        <div className="modal-overlay" onClick={() => setShowBulkAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Bulk Add Creators</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Paste one Instagram link per line. ID auto-extracted, link auto-generated.</p>
            <textarea rows={8} placeholder="https://www.instagram.com/wakeupcallie/&#10;https://www.instagram.com/earlyalarm/&#10;https://www.instagram.com/creator3/" value={bulkText} onChange={e => setBulkText(e.target.value)} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button className="btn-secondary" onClick={() => setShowBulkAdd(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleBulkAdd}>Add All</button>
            </div>
          </div>
        </div>
      )}

      {showBulkNotes && (
        <div className="modal-overlay" onClick={() => setShowBulkNotes(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Add Notes Suffix ({selectedIds.length} creators)</h2>
            <input placeholder="Notes suffix to append..." value={bulkNotesSuffix} onChange={e => setBulkNotesSuffix(e.target.value)} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button className="btn-secondary" onClick={() => setShowBulkNotes(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleBulkNotes}>Add Notes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

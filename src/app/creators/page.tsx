'use client';

import { useState, useEffect, useCallback } from 'react';
import { UGCCreator, STATUS_OPTIONS, App } from '@/lib/types';
import { getCreators, createCreator, updateCreator, deleteCreator, bulkAddCreators, bulkAddNotesSuffix, bulkAddAppToCreators, getApps, linkRelatedCreators, unlinkRelatedCreator } from '@/lib/storage';
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
  const [showBulkApp, setShowBulkApp] = useState(false);
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
  const [bulkAppName, setBulkAppName] = useState('');
  const [relatedPasteText, setRelatedPasteText] = useState('');
  const [relatedResults, setRelatedResults] = useState<{ line: string; extractedId: string; matchedCreator: UGCCreator | null; matchType: string }[]>([]);
  const [linkedCreatorIds, setLinkedCreatorIds] = useState<Set<string>>(new Set());

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

  const handleBulkApp = async () => {
    if (selectedIds.length === 0 || !bulkAppName) return;
    await bulkAddAppToCreators(selectedIds, bulkAppName);
    setBulkAppName('');
    setSelectedIds([]);
    setShowBulkApp(false);
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
    setRelatedPasteText('');
    setRelatedResults([]);
    setLinkedCreatorIds(new Set());
    setShowAdd(true);
  };

  const extractId = (line: string): { id: string; name: string } => {
    const trimmed = line.trim();
    const urlMatch = trimmed.match(/instagram\.com\/([a-zA-Z0-9._]+)\/?/);
    if (urlMatch) return { id: urlMatch[1], name: '' };
    if (trimmed.startsWith('@')) return { id: trimmed.slice(1), name: '' };
    const parts = trimmed.split('|').map(s => s.trim());
    if (parts.length >= 2) {
      const possibleId = parts[0].replace(/[^a-zA-Z0-9._]/g, '');
      if (possibleId && /^[a-zA-Z0-9._]+$/.test(possibleId) && possibleId.length < 40) {
        return { id: possibleId, name: parts[1] };
      }
      return { id: '', name: trimmed };
    }
    if (/^[a-zA-Z0-9._]+$/.test(trimmed) && trimmed.length < 40) {
      return { id: trimmed, name: '' };
    }
    return { id: '', name: trimmed };
  };

  const handleFindRelated = () => {
    if (!editCreator || !relatedPasteText.trim()) return;
    const lines = relatedPasteText.split('\n').filter(l => l.trim());
    const results = lines.map(line => {
      const { id, name } = extractId(line);
      let found: UGCCreator | null = null;
      let matchType = '';

      if (id) {
        found = creators.find(c => c.id !== editCreator!.id && c.instagram_id.toLowerCase() === id.toLowerCase()) || null;
        if (found) matchType = 'instagram_id';
      }
      if (!found && name) {
        found = creators.find(c => c.id !== editCreator!.id && c.name.toLowerCase().includes(name.toLowerCase())) || null;
        if (found) matchType = 'name';
      }
      if (!found && !id && !name) {
        const q = line.toLowerCase();
        found = creators.find(c => c.id !== editCreator!.id && (c.notes.toLowerCase().includes(q) || c.instagram_id.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))) || null;
        if (found) matchType = 'notes';
      }

      return { line: line.trim(), extractedId: id, matchedCreator: found, matchType };
    });
    setRelatedResults(results);
  };

  const handleLinkRelated = async (creator: UGCCreator) => {
    if (!editCreator) return;
    await linkRelatedCreators(editCreator.id, [creator.id]);
    await linkRelatedCreators(creator.id, [editCreator.id]);
    setLinkedCreatorIds(prev => new Set(prev).add(creator.id));
    load();
  };

  const handleUnlinkRelated = async (creator: UGCCreator) => {
    if (!editCreator) return;
    await unlinkRelatedCreator(editCreator.id, creator.id);
    await unlinkRelatedCreator(creator.id, editCreator.id);
    setLinkedCreatorIds(prev => { const next = new Set(prev); next.delete(creator.id); return next; });
    load();
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
          {selectedIds.length > 0 && <button className="btn-secondary btn-sm" onClick={() => setShowBulkApp(true)}>Add App ({selectedIds.length})</button>}
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

              {editCreator && (
                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Find Related Creators</div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Paste following/follower list — matches against your other UGC creators.</p>
                  <textarea
                    rows={5}
                    placeholder={`alyssawakingup\nbrooke.wakeup\nBrookelyn☕️\nanniewakesup\nAnnie\nwake.up.rosie\nWake up Rosie`}
                    value={relatedPasteText}
                    onChange={e => setRelatedPasteText(e.target.value)}
                    style={{ fontSize: '12px' }}
                  />
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button className="btn-primary btn-sm" disabled={!relatedPasteText.trim()} onClick={handleFindRelated}>Find Matches</button>
                  </div>

                  {relatedResults.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      {relatedResults.filter(r => r.matchedCreator).map((r, i) => {
                        const isLinked = linkedCreatorIds.has(r.matchedCreator!.id) || editCreator.related_creators.includes(r.matchedCreator!.id);
                        return (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: isLinked ? 'var(--pastel-blue)' : 'var(--pastel-green)', borderRadius: '6px', marginBottom: '4px', fontSize: '12px' }}>
                            <div>
                              <span style={{ fontWeight: '600' }}>{r.matchedCreator!.instagram_id}</span>
                              {r.matchedCreator!.name && <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>{r.matchedCreator!.name}</span>}
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '4px' }}>({r.matchType})</span>
                            </div>
                            {isLinked ? (
                              <button className="btn-secondary btn-sm" onClick={() => handleUnlinkRelated(r.matchedCreator!)}>Unlink</button>
                            ) : (
                              <button className="btn-primary btn-sm" onClick={() => handleLinkRelated(r.matchedCreator!)}>Link</button>
                            )}
                          </div>
                        );
                      })}
                      {relatedResults.filter(r => !r.matchedCreator).length > 0 && (
                        <div style={{ marginTop: '6px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Not found ({relatedResults.filter(r => !r.matchedCreator).length}):</div>
                          {relatedResults.filter(r => !r.matchedCreator).map((r, i) => (
                            <div key={i} style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '2px 6px' }}>· {r.extractedId || r.line}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {editCreator.related_creators.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Currently linked:</div>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {editCreator.related_creators.map(rid => {
                          const rc = creators.find(c => c.id === rid);
                          return rc ? (
                            <span key={rid} className="badge" style={{ background: 'var(--pastel-purple)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {rc.instagram_id}
                              <span style={{ cursor: 'pointer', fontWeight: '700' }} onClick={() => handleUnlinkRelated(rc)}>×</span>
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

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

      {showBulkApp && (
        <div className="modal-overlay" onClick={() => setShowBulkApp(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Add App to {selectedIds.length} Creators</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Select an app to add to all selected creators (skips if already added).</p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {apps.map(a => (
                <button
                  key={a.id}
                  type="button"
                  className={`btn-sm ${bulkAppName === a.name ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setBulkAppName(a.name)}
                >
                  {a.name}
                </button>
              ))}
            </div>
            <input placeholder="Or type app name..." value={bulkAppName} onChange={e => setBulkAppName(e.target.value)} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button className="btn-secondary" onClick={() => setShowBulkApp(false)}>Cancel</button>
              <button className="btn-primary" disabled={!bulkAppName} onClick={handleBulkApp}>Add App</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

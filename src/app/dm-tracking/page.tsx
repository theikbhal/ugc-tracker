'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DMMessage, UGCCreator, DMTemplate } from '@/lib/types';
import { getDMMessages, createDMMessage, updateDMMessage, deleteDMMessage, getCreators, getDMTemplates } from '@/lib/storage';
import { exportToJSON, exportToCSV } from '@/lib/export';

function replacePlaceholders(template: string, creator: UGCCreator): string {
  return template
    .replace(/\{\{instagram_id\}\}/g, creator.instagram_id || '')
    .replace(/\{\{name\}\}/g, creator.name || '')
    .replace(/\{\{followers\}\}/g, creator.followers?.toLocaleString() || '0')
    .replace(/\{\{posts\}\}/g, creator.posts?.toLocaleString() || '0')
    .replace(/\{\{app\}\}/g, creator.apps?.[0] || '')
    .replace(/\{\{instagram_link\}\}/g, creator.instagram_link || '');
}

export default function DMTrackingPage() {
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [creators, setCreators] = useState<UGCCreator[]>([]);
  const [templates, setTemplates] = useState<DMTemplate[]>([]);
  const [creatorFilter, setCreatorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editMsg, setEditMsg] = useState<DMMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    creator_id: '',
    template_id: '',
    message: '',
    sent_at: new Date().toISOString().slice(0, 16),
    responded: false,
    response_text: '',
    status: 'sent' as DMMessage['status'],
  });

  const [creatorSearch, setCreatorSearch] = useState('');
  const [showCreatorDropdown, setShowCreatorDropdown] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [m, c, t] = await Promise.all([getDMMessages(), getCreators(), getDMTemplates()]);
    setMessages(m);
    setCreators(c);
    setTemplates(t);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectedCreator = useMemo(() => creators.find(c => c.id === form.creator_id), [creators, form.creator_id]);
  const selectedTemplate = useMemo(() => templates.find(t => t.id === form.template_id), [templates, form.template_id]);

  const filteredCreators = useMemo(() => {
    if (!creatorSearch.trim()) return creators.slice(0, 20);
    const q = creatorSearch.toLowerCase();
    return creators.filter(c =>
      c.instagram_id.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.instagram_link.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [creators, creatorSearch]);

  const previewMessage = useMemo(() => {
    if (!selectedCreator || !selectedTemplate) return form.message;
    return replacePlaceholders(selectedTemplate.message, selectedCreator);
  }, [selectedCreator, selectedTemplate, form.message]);

  const filtered = messages.filter(m => {
    if (creatorFilter && m.creator_id !== creatorFilter) return false;
    if (statusFilter && m.status !== statusFilter) return false;
    return true;
  });

  const handleSave = async () => {
    const msg = selectedTemplate && selectedCreator
      ? replacePlaceholders(selectedTemplate.message, selectedCreator)
      : form.message;
    const data = {
      creator_id: form.creator_id,
      message: msg,
      sent_at: new Date(form.sent_at).toISOString(),
      responded: form.responded,
      responded_at: form.responded ? new Date().toISOString() : null,
      response_text: form.response_text || null,
      status: form.status,
    };
    if (editMsg) {
      await updateDMMessage(editMsg.id, data);
    } else {
      await createDMMessage(data);
    }
    setShowAdd(false);
    setEditMsg(null);
    resetForm();
    load();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this message?')) {
      await deleteDMMessage(id);
      load();
    }
  };

  const resetForm = () => {
    setForm({ creator_id: '', template_id: '', message: '', sent_at: new Date().toISOString().slice(0, 16), responded: false, response_text: '', status: 'sent' });
    setCreatorSearch('');
    setShowCreatorDropdown(false);
  };

  const openEdit = (m: DMMessage) => {
    const creator = creators.find(c => c.id === m.creator_id);
    setForm({
      creator_id: m.creator_id,
      template_id: '',
      message: m.message,
      sent_at: m.sent_at.slice(0, 16),
      responded: m.responded,
      response_text: m.response_text || '',
      status: m.status,
    });
    setCreatorSearch(creator ? (creator.name || creator.instagram_id) : '');
    setEditMsg(m);
    setShowAdd(true);
  };

  const selectCreator = (c: UGCCreator) => {
    setForm(f => ({ ...f, creator_id: c.id }));
    setCreatorSearch(c.name || c.instagram_id);
    setShowCreatorDropdown(false);
  };

  const getCreatorName = (id: string) => {
    const c = creators.find(cr => cr.id === id);
    return c ? (c.name || c.instagram_id || id.slice(0, 8)) : id.slice(0, 8);
  };

  const copyMessage = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const statusColors: Record<string, string> = {
    sent: 'bg-blue-100 text-blue-800',
    delivered: 'bg-yellow-100 text-yellow-800',
    read: 'bg-purple-100 text-purple-800',
    responded: 'bg-green-100 text-green-800',
  };

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <a href="/" style={{ color: 'var(--text-muted)', fontSize: '12px', textDecoration: 'none' }}>← Back</a>
          <h1 style={{ fontSize: '20px', fontWeight: '700' }}>DM Tracking ({filtered.length})</h1>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <a href="/templates" className="btn-secondary btn-sm" style={{ textDecoration: 'none' }}>Templates</a>
          <button className="btn-primary btn-sm" onClick={() => { resetForm(); setEditMsg(null); setShowAdd(true); }}>+ New DM</button>
          <button className="btn-secondary btn-sm" onClick={() => exportToJSON(filtered, 'dm-messages')}>JSON</button>
          <button className="btn-secondary btn-sm" onClick={() => exportToCSV(filtered, 'dm-messages')}>CSV</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <select value={creatorFilter} onChange={e => setCreatorFilter(e.target.value)} style={{ flex: '1 1 200px' }}>
          <option value="">All Creators</option>
          {creators.map(c => <option key={c.id} value={c.id}>{c.name || c.instagram_id}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto', minWidth: '120px' }}>
          <option value="">All Status</option>
          <option value="sent">Sent</option>
          <option value="delivered">Delivered</option>
          <option value="read">Read</option>
          <option value="responded">Responded</option>
        </select>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No DM messages found</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(m => (
            <div key={m.id} className="card" style={{ padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '600', fontSize: '14px' }}>{getCreatorName(m.creator_id)}</span>
                    <span className={`badge ${statusColors[m.status] || ''}`}>{m.status}</span>
                    {m.responded && <span className="badge bg-green-100 text-green-800">Responded</span>}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '4px', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>{m.message}</p>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Sent: {new Date(m.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {' '}{new Date(m.sent_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    {m.responded_at && <> · Responded: {new Date(m.responded_at).toLocaleString()}</>}
                  </div>
                  {m.response_text && (
                    <div style={{ marginTop: '6px', padding: '8px', background: 'var(--pastel-green)', borderRadius: '8px', fontSize: '12px' }}>
                      Response: {m.response_text}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button className="btn-secondary btn-sm" onClick={() => copyMessage(m.message, m.id)}>
                    {copiedId === m.id ? 'Copied!' : 'Copy'}
                  </button>
                  <button className="btn-secondary btn-sm" onClick={() => openEdit(m)}>Edit</button>
                  <button className="btn-danger btn-sm" onClick={() => handleDelete(m.id)}>Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="modal-overlay" onClick={() => { setShowAdd(false); setEditMsg(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>{editMsg ? 'Edit DM' : 'New DM'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Search Instagram Creator</label>
                <input
                  placeholder="Search by name or instagram id..."
                  value={creatorSearch}
                  onChange={e => { setCreatorSearch(e.target.value); setShowCreatorDropdown(true); setForm(f => ({ ...f, creator_id: '' })); }}
                  onFocus={() => setShowCreatorDropdown(true)}
                />
                {showCreatorDropdown && creatorSearch && !form.creator_id && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', maxHeight: '200px', overflow: 'auto', zIndex: 10, marginTop: '4px' }}>
                    {filteredCreators.length === 0 ? (
                      <div style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--text-muted)' }}>No creators found</div>
                    ) : (
                      filteredCreators.map(c => (
                        <div
                          key={c.id}
                          onClick={() => selectCreator(c)}
                          style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: '13px' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-input)')}
                          onMouseLeave={e => (e.currentTarget.style.background = '')}
                        >
                          <div style={{ fontWeight: '600' }}>{c.instagram_id}</div>
                          {c.name && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.name}</div>}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {selectedCreator && (
                <div style={{ padding: '10px', background: 'var(--pastel-purple)', borderRadius: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: '600' }}>{selectedCreator.instagram_id}</span>
                      {selectedCreator.name && <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>{selectedCreator.name}</span>}
                    </div>
                    <button className="btn-secondary btn-sm" onClick={() => { setForm(f => ({ ...f, creator_id: '' })); setCreatorSearch(''); }}>Change</button>
                  </div>
                  <div style={{ marginTop: '4px', color: 'var(--text-muted)' }}>
                    {selectedCreator.followers.toLocaleString()} followers · {selectedCreator.posts.toLocaleString()} posts · {selectedCreator.following.toLocaleString()} following
                  </div>
                  {selectedCreator.apps.length > 0 && (
                    <div style={{ marginTop: '4px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {selectedCreator.apps.map(a => <span key={a} className="badge" style={{ background: 'var(--pastel-blue)', fontSize: '11px' }}>{a}</span>)}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Use Template (optional)</label>
                <select value={form.template_id} onChange={e => setForm(f => ({ ...f, template_id: e.target.value }))}>
                  <option value="">Write custom message</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              {selectedTemplate && selectedCreator && (
                <div style={{ padding: '10px', background: 'var(--pastel-blue)', borderRadius: '8px', fontSize: '12px' }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>Preview:</div>
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{previewMessage}</p>
                </div>
              )}

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {selectedTemplate ? 'Message (auto-filled from template)' : 'Message'}
                </label>
                <textarea rows={5} placeholder="DM message content..." value={selectedTemplate && selectedCreator ? previewMessage : form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} readOnly={!!selectedTemplate && !!selectedCreator} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Sent Date & Time (editable)</label>
                <input type="datetime-local" value={form.sent_at} onChange={e => setForm(f => ({ ...f, sent_at: e.target.value }))} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as DMMessage['status'] }))}>
                  <option value="sent">Sent</option>
                  <option value="delivered">Delivered</option>
                  <option value="read">Read</option>
                  <option value="responded">Responded</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <input type="checkbox" checked={form.responded} onChange={e => setForm(f => ({ ...f, responded: e.target.checked }))} />
                  Responded
                </label>
              </div>

              {form.responded && (
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Response Text</label>
                  <textarea rows={2} placeholder="What they replied..." value={form.response_text} onChange={e => setForm(f => ({ ...f, response_text: e.target.value }))} />
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={() => { setShowAdd(false); setEditMsg(null); }}>Cancel</button>
                <button className="btn-primary" disabled={!form.creator_id} onClick={handleSave}>{editMsg ? 'Update' : 'Send'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

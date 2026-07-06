'use client';

import { useState, useEffect, useCallback } from 'react';
import { DMMessage, UGCCreator } from '@/lib/types';
import { getDMMessages, createDMMessage, updateDMMessage, deleteDMMessage, getCreators } from '@/lib/storage';
import { exportToJSON, exportToCSV } from '@/lib/export';

export default function DMTrackingPage() {
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [creators, setCreators] = useState<UGCCreator[]>([]);
  const [creatorFilter, setCreatorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editMsg, setEditMsg] = useState<DMMessage | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    creator_id: '',
    message: '',
    sent_at: new Date().toISOString().slice(0, 16),
    responded: false,
    response_text: '',
    status: 'sent' as DMMessage['status'],
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [m, c] = await Promise.all([getDMMessages(), getCreators()]);
    setMessages(m);
    setCreators(c);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = messages.filter(m => {
    if (creatorFilter && m.creator_id !== creatorFilter) return false;
    if (statusFilter && m.status !== statusFilter) return false;
    return true;
  });

  const handleSave = async () => {
    const data = {
      ...form,
      sent_at: new Date(form.sent_at).toISOString(),
      responded_at: form.responded ? new Date().toISOString() : null,
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
    setForm({ creator_id: '', message: '', sent_at: new Date().toISOString().slice(0, 16), responded: false, response_text: '', status: 'sent' });
  };

  const openEdit = (m: DMMessage) => {
    setForm({
      creator_id: m.creator_id,
      message: m.message,
      sent_at: m.sent_at.slice(0, 16),
      responded: m.responded,
      response_text: m.response_text || '',
      status: m.status,
    });
    setEditMsg(m);
    setShowAdd(true);
  };

  const getCreatorName = (id: string) => {
    const c = creators.find(cr => cr.id === id);
    return c ? (c.name || c.instagram_id || id.slice(0, 8)) : id.slice(0, 8);
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
                  <p style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '4px', lineHeight: '1.4' }}>{m.message}</p>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Sent: {new Date(m.sent_at).toLocaleString()}
                    {m.responded_at && <> · Responded: {new Date(m.responded_at).toLocaleString()}</>}
                  </div>
                  {m.response_text && (
                    <div style={{ marginTop: '6px', padding: '8px', background: 'var(--pastel-green)', borderRadius: '8px', fontSize: '12px' }}>
                      Response: {m.response_text}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
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
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Creator</label>
                <select value={form.creator_id} onChange={e => setForm(f => ({ ...f, creator_id: e.target.value }))}>
                  <option value="">Select creator...</option>
                  {creators.map(c => <option key={c.id} value={c.id}>{c.name || c.instagram_id}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Message</label>
                <textarea rows={4} placeholder="DM message content..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Sent At</label>
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
                <button className="btn-primary" onClick={handleSave}>{editMsg ? 'Update' : 'Send'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { DMTemplate, DM_TEMPLATE_PLACEHOLDERS } from '@/lib/types';
import { getDMTemplates, createDMTemplate, updateDMTemplate, deleteDMTemplate } from '@/lib/storage';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<DMTemplate[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editTmpl, setEditTmpl] = useState<DMTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', message: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setTemplates(await getDMTemplates());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.message.trim()) return;
    if (editTmpl) {
      await updateDMTemplate(editTmpl.id, form);
    } else {
      await createDMTemplate(form);
    }
    setShowAdd(false);
    setEditTmpl(null);
    setForm({ name: '', message: '' });
    load();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this template?')) {
      await deleteDMTemplate(id);
      load();
    }
  };

  const openEdit = (t: DMTemplate) => {
    setForm({ name: t.name, message: t.message });
    setEditTmpl(t);
    setShowAdd(true);
  };

  const insertPlaceholder = (key: string) => {
    setForm(f => ({ ...f, message: f.message + key }));
  };

  return (
    <div style={{ padding: '16px', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <a href="/" style={{ color: 'var(--text-muted)', fontSize: '12px', textDecoration: 'none' }}>← Back</a>
          <h1 style={{ fontSize: '20px', fontWeight: '700' }}>DM Templates ({templates.length})</h1>
        </div>
        <button className="btn-primary btn-sm" onClick={() => { setForm({ name: '', message: '' }); setEditTmpl(null); setShowAdd(true); }}>+ New</button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Loading...</p>
      ) : templates.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No templates yet. Create one to use when sending DMs.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {templates.map(t => (
            <div key={t.id} className="card" style={{ padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{t.name}</div>
                  <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>{t.message}</p>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button className="btn-secondary btn-sm" onClick={() => openEdit(t)}>Edit</button>
                  <button className="btn-danger btn-sm" onClick={() => handleDelete(t.id)}>Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="modal-overlay" onClick={() => { setShowAdd(false); setEditTmpl(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>{editTmpl ? 'Edit Template' : 'New Template'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Template Name</label>
                <input placeholder="e.g. Early Alarm Outreach" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Message</label>
                <textarea rows={6} placeholder="Hey {{instagram_id}}! We love your content..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Insert Placeholder</label>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {DM_TEMPLATE_PLACEHOLDERS.map(p => (
                    <button key={p.key} type="button" className="btn-secondary btn-sm" onClick={() => insertPlaceholder(p.key)} title={p.desc}>
                      {p.key}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={() => { setShowAdd(false); setEditTmpl(null); }}>Cancel</button>
                <button className="btn-primary" onClick={handleSave}>{editTmpl ? 'Update' : 'Create'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { UGCCreator, DMMessage, STATUS_OPTIONS } from '@/lib/types';
import { getCreator, getCreators, getDMMessages } from '@/lib/storage';

export default function CreatorDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [creator, setCreator] = useState<UGCCreator | null>(null);
  const [allCreators, setAllCreators] = useState<UGCCreator[]>([]);
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [c, all, m] = await Promise.all([getCreator(id), getCreators(), getDMMessages(id)]);
    setCreator(c);
    setAllCreators(all);
    setMessages(m);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const getStatusColor = (status: string) => {
    const opt = STATUS_OPTIONS.find(s => s.value === status);
    return opt?.color || 'bg-gray-100 text-gray-800';
  };

  const getCreatorName = (cid: string) => {
    const c = allCreators.find(cr => cr.id === cid);
    return c ? (c.name || c.instagram_id) : cid.slice(0, 8);
  };

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-muted)', textAlign: 'center' }}>Loading...</div>;
  if (!creator) return <div style={{ padding: '40px', color: 'var(--text-muted)', textAlign: 'center' }}>Creator not found</div>;

  const related = creator.related_creators
    .map(rid => allCreators.find(c => c.id === rid))
    .filter(Boolean) as UGCCreator[];

  return (
    <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '16px' }}>
        <a href="/creators" style={{ color: 'var(--text-muted)', fontSize: '12px', textDecoration: 'none' }}>← Back to Creators</a>
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700' }}>{creator.name || creator.instagram_id}</h1>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>@{creator.instagram_id}</div>
          </div>
          <span className={`badge ${getStatusColor(creator.status)}`}>{creator.status}</span>
        </div>

        {creator.instagram_link && (
          <a href={creator.instagram_link} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '12px', fontSize: '13px' }}>
            Open Instagram ↗
          </a>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div style={{ textAlign: 'center', padding: '10px', background: 'var(--bg-input)', borderRadius: '8px' }}>
            <div style={{ fontSize: '20px', fontWeight: '700' }}>{creator.followers.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Followers</div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px', background: 'var(--bg-input)', borderRadius: '8px' }}>
            <div style={{ fontSize: '20px', fontWeight: '700' }}>{creator.posts.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Posts</div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px', background: 'var(--bg-input)', borderRadius: '8px' }}>
            <div style={{ fontSize: '20px', fontWeight: '700' }}>{creator.following.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Following</div>
          </div>
        </div>

        {creator.apps.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Apps</div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {creator.apps.map(a => <span key={a} className="badge" style={{ background: 'var(--pastel-purple)', fontSize: '12px' }}>{a}</span>)}
            </div>
          </div>
        )}

        {creator.notes && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Notes</div>
            <p style={{ fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{creator.notes}</p>
          </div>
        )}

        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Created: {new Date(creator.created_at).toLocaleDateString()} · Updated: {new Date(creator.updated_at).toLocaleDateString()}
        </div>
      </div>

      {related.length > 0 && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Related Creators ({related.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {related.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'var(--bg-input)', borderRadius: '6px', fontSize: '13px' }}>
                <div>
                  <span style={{ fontWeight: '600' }}>{c.instagram_id}</span>
                  {c.name && <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>{c.name}</span>}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {c.instagram_link && <a href={c.instagram_link} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm" style={{ textDecoration: 'none' }}>IG</a>}
                  <a href={`/creators/${c.id}`} className="btn-secondary btn-sm" style={{ textDecoration: 'none' }}>View</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {messages.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>DM History ({messages.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {messages.map(m => (
              <div key={m.id} style={{ padding: '8px', background: 'var(--bg-input)', borderRadius: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span className={`badge ${getStatusColor(m.status)}`}>{m.status}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{new Date(m.sent_at).toLocaleDateString()}</span>
                </div>
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{m.message}</p>
                {m.response_text && (
                  <div style={{ marginTop: '4px', padding: '6px', background: 'var(--pastel-green)', borderRadius: '4px' }}>
                    Response: {m.response_text}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

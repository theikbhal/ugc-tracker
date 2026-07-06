'use client';

import { useState, useEffect, useCallback } from 'react';
import { UGCCreator } from '@/lib/types';
import { getCreators, linkRelatedCreators, unlinkRelatedCreator } from '@/lib/storage';

interface MatchResult {
  line: string;
  extractedId: string;
  extractedName: string;
  matchedCreator: UGCCreator | null;
  matchType: 'instagram_id' | 'name' | 'notes' | null;
}

function extractIdFromLine(line: string): { id: string; name: string } {
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
}

export default function FindRelatedPage() {
  const [creators, setCreators] = useState<UGCCreator[]>([]);
  const [pasteText, setPasteText] = useState('');
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set());
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [sourceSearch, setSourceSearch] = useState('');
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setCreators(await getCreators());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredSourceCreators = creators.filter(c => {
    if (!sourceSearch.trim()) return true;
    const q = sourceSearch.toLowerCase();
    return c.instagram_id.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
  }).slice(0, 20);

  const handleParse = () => {
    const lines = pasteText.split('\n').filter(l => l.trim());
    const matched: MatchResult[] = lines.map(line => {
      const { id, name } = extractIdFromLine(line);
      let found: UGCCreator | null = null;
      let matchType: MatchResult['matchType'] = null;

      if (id) {
        found = creators.find(c => c.instagram_id.toLowerCase() === id.toLowerCase()) || null;
        if (found) matchType = 'instagram_id';
      }

      if (!found && name) {
        found = creators.find(c => c.name.toLowerCase().includes(name.toLowerCase())) || null;
        if (found) matchType = 'name';
      }

      if (!found && !id && !name) {
        const q = line.toLowerCase();
        found = creators.find(c =>
          c.notes.toLowerCase().includes(q) ||
          c.instagram_id.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q)
        ) || null;
        if (found) matchType = 'notes';
      }

      return { line: line.trim(), extractedId: id, extractedName: name, matchedCreator: found, matchType };
    });
    setResults(matched);
    setLinkedIds(new Set());
  };

  const handleLink = async (result: MatchResult) => {
    if (!selectedSourceId || !result.matchedCreator) return;
    if (selectedSourceId === result.matchedCreator.id) return;
    await linkRelatedCreators(selectedSourceId, [result.matchedCreator.id]);
    await linkRelatedCreators(result.matchedCreator.id, [selectedSourceId]);
    setLinkedIds(prev => new Set(prev).add(result.matchedCreator!.id));
    load();
  };

  const handleUnlink = async (result: MatchResult) => {
    if (!selectedSourceId || !result.matchedCreator) return;
    await unlinkRelatedCreator(selectedSourceId, result.matchedCreator.id);
    await unlinkRelatedCreator(result.matchedCreator.id, selectedSourceId);
    setLinkedIds(prev => {
      const next = new Set(prev);
      next.delete(result.matchedCreator!.id);
      return next;
    });
    load();
  };

  const matched = results.filter(r => r.matchedCreator);
  const unmatched = results.filter(r => !r.matchedCreator);

  return (
    <div style={{ padding: '16px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '16px' }}>
        <a href="/" style={{ color: 'var(--text-muted)', fontSize: '12px', textDecoration: 'none' }}>← Back</a>
        <h1 style={{ fontSize: '20px', fontWeight: '700' }}>Followers / Following Creators</h1>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Paste Instagram following/follower list — match against your UGC creators and link them.</p>
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Source Creator (who to link FROM)</label>
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <input
            placeholder="Search creator to link from..."
            value={sourceSearch}
            onChange={e => { setSourceSearch(e.target.value); setSelectedSourceId(''); setShowSourceDropdown(true); }}
            onFocus={() => setShowSourceDropdown(true)}
          />
          {showSourceDropdown && !selectedSourceId && (
            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', maxHeight: '180px', overflow: 'auto', marginTop: '4px' }}>
              {filteredSourceCreators.length === 0 ? (
                <div style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--text-muted)' }}>No creators found</div>
              ) : (
                filteredSourceCreators.map(c => (
                  <div
                    key={c.id}
                    onClick={() => { setSelectedSourceId(c.id); setSourceSearch(c.name || c.instagram_id); setShowSourceDropdown(false); }}
                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: '13px' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <div style={{ fontWeight: '600' }}>{c.instagram_id}</div>
                    {c.name && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.name} · {c.followers.toLocaleString()} followers</div>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Paste following/follower list</label>
        <textarea
          rows={10}
          placeholder={`heavyweighthitter\nTara | Postpartum Fitness | Nutrition | Mindset\nerly.app\nErly: Wake Up Early\nashleym_lin\nAshley\n...`}
          value={pasteText}
          onChange={e => setPasteText(e.target.value)}
          style={{ fontSize: '13px' }}
        />
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button className="btn-primary" disabled={!selectedSourceId || !pasteText.trim()} onClick={handleParse}>Find Matches</button>
        </div>
      </div>

      {results.length > 0 && (
        <>
          <div className="card" style={{ marginBottom: '12px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              Matched ({matched.length})
            </h2>
            {matched.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No matches found</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {matched.map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'var(--pastel-green)', borderRadius: '8px', fontSize: '13px' }}>
                    <div>
                      <div>
                        <span style={{ fontWeight: '600' }}>{r.matchedCreator!.instagram_id}</span>
                        {r.matchedCreator!.name && <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>{r.matchedCreator!.name}</span>}
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>({r.matchType})</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Matched: <span style={{ fontStyle: 'italic' }}>"{r.line}"</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      {linkedIds.has(r.matchedCreator!.id) || (creators.find(c => c.id === selectedSourceId)?.related_creators || []).includes(r.matchedCreator!.id) ? (
                        <button className="btn-secondary btn-sm" onClick={() => handleUnlink(r)}>Unlink</button>
                      ) : (
                        <button className="btn-primary btn-sm" onClick={() => handleLink(r)}>Link</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {unmatched.length > 0 && (
            <div className="card">
              <h2 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                Unmatched ({unmatched.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {unmatched.map((r, i) => (
                  <div key={i} style={{ padding: '6px 8px', background: 'var(--pastel-red)', borderRadius: '6px', fontSize: '12px' }}>
                    <span style={{ fontWeight: '500' }}>{r.extractedId || r.extractedName || r.line}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>(not in your creators)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

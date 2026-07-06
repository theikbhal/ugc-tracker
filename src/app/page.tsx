export default function Home() {
  return (
    <div style={{ padding: '16px' }}>
      <nav style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <a href="/creators" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>Creators</a>
        <a href="/dm-tracking" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-block' }}>DM Tracking</a>
        <a href="/templates" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-block' }}>Templates</a>
        <a href="/apps" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-block' }}>Apps</a>
        <a href="/settings" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-block' }}>Settings</a>
      </nav>
      <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>UGC Creator Tracker</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Track Instagram UGC creators, DM campaigns, and app collaborations.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        <a href="/creators" className="card" style={{ textDecoration: 'none', color: 'var(--text)', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>🎯</div>
          <div style={{ fontSize: '14px', marginTop: '4px' }}>Creators</div>
        </a>
        <a href="/dm-tracking" className="card" style={{ textDecoration: 'none', color: 'var(--text)', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>💬</div>
          <div style={{ fontSize: '14px', marginTop: '4px' }}>DM Tracking</div>
        </a>
        <a href="/templates" className="card" style={{ textDecoration: 'none', color: 'var(--text)', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>📝</div>
          <div style={{ fontSize: '14px', marginTop: '4px' }}>Templates</div>
        </a>
        <a href="/apps" className="card" style={{ textDecoration: 'none', color: 'var(--text)', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>📱</div>
          <div style={{ fontSize: '14px', marginTop: '4px' }}>Apps</div>
        </a>
        <a href="/settings" className="card" style={{ textDecoration: 'none', color: 'var(--text)', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>⚙️</div>
          <div style={{ fontSize: '14px', marginTop: '4px' }}>Settings</div>
        </a>
      </div>
    </div>
  );
}

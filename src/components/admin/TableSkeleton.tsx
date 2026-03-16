export function TableSkeleton() {
  return (
    <div className="admin-table-container glass" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div className="skeleton" style={{ width: '200px', height: '24px' }} />
        <div className="skeleton" style={{ width: '120px', height: '36px', borderRadius: '100px' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="skeleton" style={{ width: '100%', height: '40px' }} />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="skeleton" style={{ width: '100%', height: '60px', opacity: 1 - (i * 0.15) }} />
        ))}
      </div>
      <style>{`
        .skeleton {
          background: linear-gradient(90deg, var(--bg-2) 25%, var(--border) 50%, var(--bg-2) 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          border-radius: 4px;
        }
        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

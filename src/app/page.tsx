export default function DashboardPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', paddingTop: 100 }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#111827' }}>AI Debrief Engine</h1>
      <p style={{ fontSize: '1.2rem', color: '#6b7280', marginBottom: '2rem' }}>
        The backend service for aggregating, filtering, and summarizing overnight AI news for human-readable briefings.
      </p>
      <div style={{ padding: '20px', background: '#f3f4f6', borderRadius: '12px', display: 'inline-block' }}>
        <code>Status: Operational</code>
      </div>
      <p style={{ marginTop: '2rem', fontSize: '1rem', color: '#9ca3af' }}>
        Test the ingestion pipeline at <code>/api/test-pipeline</code>.
      </p>
    </div>
  );
}

const endpoints = [
  {
    method: 'POST',
    path: '/api/devices',
    description: 'Register device & push token',
  },
  {
    method: 'POST',
    path: '/api/parse',
    description: 'AI parse natural language → structured schedule',
  },
  {
    method: 'GET',
    path: '/api/schedules',
    description: 'List schedules by deviceId',
  },
  { method: 'POST', path: '/api/schedules', description: 'Create schedule' },
  { method: 'PUT', path: '/api/schedules/:id', description: 'Update schedule' },
  {
    method: 'DELETE',
    path: '/api/schedules/:id',
    description: 'Delete schedule',
  },
  {
    method: 'POST',
    path: '/api/cron/send-reminders',
    description: 'Cron-triggered push reminder sender',
  },
]

export default function Home() {
  return (
    <div
      style={{
        fontFamily: 'system-ui, sans-serif',
        maxWidth: 640,
        margin: '0 auto',
        padding: '48px 24px',
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>AI Calendar API</h1>
      <p style={{ color: '#666', margin: '8px 0 32px' }}>
        Backend service for AI Calendar. Parses natural language into schedules
        and sends push reminders.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
        Endpoints
      </h2>
      <table
        style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}
      >
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
            <th style={{ padding: '8px 12px 8px 0' }}>Method</th>
            <th style={{ padding: '8px 12px' }}>Path</th>
            <th style={{ padding: '8px 0 8px 12px' }}>Description</th>
          </tr>
        </thead>
        <tbody>
          {endpoints.map((ep) => (
            <tr
              key={`${ep.method} ${ep.path}`}
              style={{ borderBottom: '1px solid #f0f0f0' }}
            >
              <td style={{ padding: '8px 12px 8px 0' }}>
                <code
                  style={{
                    background: '#f5f5f5',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: 13,
                  }}
                >
                  {ep.method}
                </code>
              </td>
              <td style={{ padding: '8px 12px' }}>
                <code style={{ fontSize: 13 }}>{ep.path}</code>
              </td>
              <td style={{ padding: '8px 0 8px 12px', color: '#555' }}>
                {ep.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

'use client';

import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { RouteGuard } from '@/components/layout/RouteGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { LOE_SHEETS_QUERY } from '@/lib/graphql/documents';

export default function LoeMonthListPage() {
  const { user } = useAuth();
  const { data, refetch } = useQuery(LOE_SHEETS_QUERY);
  const rows = data?.loeSheets || [];

  useRealtimeRefresh(
    {
      topics: ['LOE'],
      userId: user?.id,
    },
    refetch,
    !user?.id,
  );

  return (
    <RouteGuard>
      <div className="app-shell">
        <Sidebar />
        <div className="shell-main">
          <Topbar user={user} title="LOE Tracker" />
          <main className="page stack">
            <div className="page-header">
              <div className="page-title">
                <div className="section-caption">My LOE</div>
                <h1>Monthly Sheets</h1>
                <p>Review current and historical sheets, then open any month for detailed entry.</p>
              </div>
            </div>

            <div className="card table-card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Status</th>
                    <th>Utilization</th>
                    <th>Delayed</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((sheet: any) => (
                    <tr key={sheet.id}>
                      <td>
                        {new Date(sheet.year, sheet.month - 1).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </td>
                      <td>
                        <Badge tone={sheet.status.toLowerCase()}>{sheet.status}</Badge>
                      </td>
                      <td>{sheet.utilizationPercent}%</td>
                      <td>{sheet.isDelayed ? <Badge tone="delayed">Overdue</Badge> : '—'}</td>
                      <td>
                        <Link href={`/loe/${sheet.year}/${sheet.month}`} className="button secondary">
                          View Sheet
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </main>
        </div>
      </div>
    </RouteGuard>
  );
}

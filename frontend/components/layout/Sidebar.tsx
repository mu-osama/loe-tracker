'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '◫' },
  { href: '/loe', label: 'My LOE', icon: '▦' },
  { href: '/review-loe', label: 'Review LOE', icon: '◩' },
  { href: '/admin/overview', label: 'Admin Overview', icon: '◧', adminOnly: true },
  { href: '/admin/users', label: 'User Management', icon: '◉', adminOnly: true },
  { href: '/admin/projects', label: 'Project Management', icon: '◬', adminOnly: true },
  { href: '/admin/allocations', label: 'Allocation Management', icon: '◎', adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">PE</div>
        <div>
          <div className="sidebar-brand-title">PixelEDGE</div>
        </div>
      </div>

      <nav>
        <div className="sidebar-section-label">Navigation</div>
        {navItems
          .filter((item) => !item.adminOnly || user?.role === 'ADMIN')
          .map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? 'sidebar-link active' : 'sidebar-link'}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
      </nav>

      <div className="sidebar-footer">
        <Link href="/dashboard" className="button" style={{ width: '100%' }}>
          Submit Daily Entry
        </Link>
      </div>
    </aside>
  );
}

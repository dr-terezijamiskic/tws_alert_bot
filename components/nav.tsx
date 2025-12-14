'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/new') return pathname === '/new';
    if (path === '/review') return pathname === '/review';
    if (path === '/trade') return pathname.startsWith('/trade/');
    return false;
  };

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/review" className="text-2xl font-bold">
            Exit-First Trading
          </Link>
          <div className="flex gap-6">
            <Link
              href="/new"
              className={`text-xl font-medium transition-colors ${
                isActive('/new')
                  ? 'text-primary'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              New Trade
            </Link>
            <Link
              href="/review"
              className={`text-xl font-medium transition-colors ${
                isActive('/review')
                  ? 'text-primary'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Review
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

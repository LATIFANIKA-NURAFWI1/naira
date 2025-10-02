"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/', label: 'Beranda' },
  { href: '/features', label: 'Fitur' },
  { href: '/challenge', label: 'Challenge' },
  { href: '/auth', label: 'Masuk' },
];

export default function Header() {
  const pathname = usePathname();
  return (
    <header className="nb-grad-header sticky top-0 z-50">
      <div className="container-max flex items-center justify-between py-3 relative header-inner">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="NafasBaru logo" width="36" height="36" className="rounded-full" />
          <span className="text-xl font-extrabold text-white">NafasBaru</span>
        </Link>

        {/* Mobile hamburger (CSS-only) */}
        <input id="nav-toggle" type="checkbox" className="nav-toggle sr-only" aria-label="Toggle navigation" />
        <label htmlFor="nav-toggle" className="hamburger md:hidden" aria-controls="primary-navigation" aria-expanded="false">
          <span></span>
          <span></span>
          <span></span>
        </label>

        <nav id="primary-navigation" className="nav-menu hidden md:flex items-center gap-2 text-sm">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`px-3 py-2 rounded-xl transition border-b-2 border-transparent ${
                pathname===n.href
                  ? 'text-cream font-semibold border-primary-dark'
                  : 'text-white hover:text-cream'
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}


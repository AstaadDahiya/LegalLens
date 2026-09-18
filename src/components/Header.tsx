'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navLinks = [
  { href: '/simplify', label: 'Simplify', icon: '📄' },
  { href: '/compare', label: 'Compare', icon: '⚖️' },
  { href: '/analyze', label: 'Analyze', icon: '🔍' },
  { href: '/chat', label: 'Chat', icon: '💬' },
  { href: '/checklist', label: 'Checklist', icon: '✅' },
  { href: '/glossary', label: 'Glossary', icon: '📖' },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="header" role="banner">
      <div className="header-inner">
        <Link href="/" className="logo" aria-label="LegalLens — Home">
          <span className="logo-icon" aria-hidden="true">⚖️</span>
          <span>Legal<span className="text-gradient">Lens</span></span>
        </Link>

        <button
          className="nav-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-controls="main-nav"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        <nav
          id="main-nav"
          className={`nav ${mobileMenuOpen ? 'open' : ''}`}
          role="navigation"
          aria-label="Main navigation"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${pathname === link.href ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
              aria-current={pathname === link.href ? 'page' : undefined}
            >
              <span aria-hidden="true">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

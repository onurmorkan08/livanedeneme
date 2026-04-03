import Link from "next/link";
import { ReactNode } from "react";

import { navLinks, serviceAreaCities } from "@/lib/site-data";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="site-frame">
      <div className="site-atmosphere" />
      <div className="site-grain" />

      <header className="site-header">
        <div className="site-header-inner">
          <Link href="/" className="brand-mark" aria-label="LIVANE home">
            <span className="brand-mark-symbol" />
            <span className="brand-mark-copy">
              <span className="brand-mark-title">LIVANE</span>
              <span className="brand-mark-meta">Miami & Fort Lauderdale Area</span>
            </span>
          </Link>

          <nav className="site-nav" aria-label="Primary">
            {navLinks.map((item) => (
              <Link key={item.href} href={item.href} className="site-nav-link">
                {item.label}
              </Link>
            ))}
          </nav>

          <Link href="/contact" className="nav-cta">
            Request a Free Site Visit
          </Link>
        </div>
      </header>

      <div className="site-content">{children}</div>

      <footer className="site-footer">
        <div className="site-footer-grid">
          <div>
            <p className="footer-kicker">LIVANE</p>
            <p className="footer-copy">
              Premium restoration, renovation, and surface improvement for spaces
              that need to look exceptional.
            </p>
          </div>

          <div>
            <p className="footer-heading">Navigation</p>
            <div className="footer-links">
              {navLinks.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="footer-heading">Service area</p>
            <p className="footer-copy">
              Serving Miami, Miami Beach, Coral Gables, Aventura, Fort Lauderdale,
              Hollywood, and surrounding cities across South Florida.
            </p>
          </div>

          <div>
            <p className="footer-heading">Contact</p>
            <div className="footer-links">
              <a href="mailto:hello@livane.com">hello@livane.com</a>
              <a href="tel:3055550148">(305) 555-0148</a>
              <span className="footer-note">
                Portfolio and social links can be added as the brand evolves.
              </span>
            </div>
          </div>
        </div>

        <div className="site-footer-bar">
          <span>Miami & Fort Lauderdale Area</span>
          <span>{serviceAreaCities.slice(0, 4).join(" / ")}</span>
        </div>
      </footer>
    </div>
  );
}

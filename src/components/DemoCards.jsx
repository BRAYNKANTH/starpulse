import { QRCodeSVG } from 'qrcode.react';
import { ExternalLink, Printer, Star } from 'lucide-react';
import ShopLanding from './ShopLanding';
import { DEMO_SHOP, DEMO_SHOP_ID } from '../data/demoShop';

// The demo shop's menu page, and its two printable 4x6 cards: a table menu card and a Google review card.
export function DemoShop() {
  return <ShopLanding businessProfile={DEMO_SHOP} initialView={new URLSearchParams(window.location.search).get('view') || 'menu'} />;
}

const QR_COLOR = '#451A03';

export default function DemoCards() {
  const params = new URLSearchParams(window.location.search);
  // ?base=https://your-domain lets the cards be printed for the live site from a local copy.
  const base = /^https?:\/\//.test(params.get('base') || '') ? params.get('base').replace(/\/$/, '') : window.location.origin;
  const menuLink = `${base}/demo?view=menu`;
  const reviewLink = DEMO_SHOP.googleReviewUrl;
  return <main className="demo-cards-page">
    <header className="demo-cards-head no-print">
      <div><h1>{DEMO_SHOP.name}: two printable cards</h1><p>Each card is 4 × 6 in, portrait. Print at 100% scale with margins set to None, one card per page.</p></div>
      <div className="demo-cards-actions"><button type="button" className="btn btn-primary" onClick={() => window.print()}><Printer size={16} aria-hidden="true" />Print both cards</button><a className="btn btn-secondary" href="/demo?view=menu" target="_blank" rel="noopener noreferrer">View demo menu <ExternalLink size={14} aria-hidden="true" /></a></div>
    </header>
    <p className="demo-cards-note no-print">Sample data: dishes and prices are examples. The review card’s QR still holds a placeholder Google place ID, so replace it with {DEMO_SHOP.name}’s own before printing for real.</p>
    <div className="demo-cards-row">
      <section className="demo-card-sheet" aria-label="Table menu card">
        <div className="poster-preview-card poster-theme-warm_bistro poster-format-tabletop">
          <div className="poster-header-block"><p className="demo-card-eyebrow">Biryani · Rice · Curries · Tandoor</p><h2 className="poster-business-name">{DEMO_SHOP.name}</h2></div>
          <div className="poster-cta-text-block"><h3 className="poster-main-title">Scan to view our menu</h3><p className="poster-subtitle">{DEMO_SHOP.menu.length} dishes, from dum biryani to 15 kinds of rice.</p></div>
          <div className="poster-qr-frame"><QRCodeSVG value={menuLink} size={216} level="H" marginSize={4} fgColor={QR_COLOR} bgColor="#FFFFFF" /><div className="poster-direct-link-badge"><ExternalLink size={12} color="#4285F4" aria-hidden="true" /><span>Our menu</span></div></div>
        </div>
      </section>
      <section className="demo-card-sheet" aria-label="Google review card">
        <div className="poster-preview-card poster-format-tabletop demo-review-card">
          <div className="poster-header-block"><p className="demo-card-eyebrow">Enjoyed your meal?</p><h2 className="poster-business-name">{DEMO_SHOP.name}</h2></div>
          <div className="demo-review-stars" role="img" aria-label="Five stars">{[0, 1, 2, 3, 4].map(n => <Star key={n} size={30} fill="currentColor" aria-hidden="true" />)}</div>
          <div className="poster-cta-text-block"><h3 className="poster-main-title">Rate us on Google</h3><p className="poster-subtitle">It takes under a minute and helps others find us.</p></div>
          <div className="poster-qr-frame"><QRCodeSVG value={reviewLink} size={216} level="H" marginSize={4} fgColor={QR_COLOR} bgColor="#FFFFFF" /><div className="poster-direct-link-badge"><ExternalLink size={12} color="#4285F4" aria-hidden="true" /><span>Scan to leave a review</span></div></div>
        </div>
      </section>
    </div>
    <p className="demo-cards-note no-print">Menu link: {menuLink} · Shop id: {DEMO_SHOP_ID}</p>
  </main>;
}

import { QRCodeSVG } from 'qrcode.react';
import { ExternalLink, Printer, Star } from 'lucide-react';
import ShopLanding from './ShopLanding';
import { DEMO_SHOP, DEMO_SHOP_ID } from '../data/demoShop';

// The demo shop's menu page, and its two printable 4x6 cards: a table menu card and a Google review card.
export function DemoShop() {
  return <ShopLanding businessProfile={DEMO_SHOP} initialView={new URLSearchParams(window.location.search).get('view') || 'menu'} />;
}

const HOSTED_URL = 'https://starpulse-beta.vercel.app';
const QR_COLOR = '#3b0d0d';

// A thin rule with a diamond in the middle, used under the shop name.
const Ornament = () => <svg className="pc-ornament" viewBox="0 0 120 10" aria-hidden="true"><path d="M0 5h50M70 5h50" stroke="currentColor" strokeWidth="1" /><path d="M60 0.5l4.5 4.5-4.5 4.5-4.5-4.5z" fill="currentColor" /></svg>;

export default function DemoCards() {
  const params = new URLSearchParams(window.location.search);
  // The cards always point at the hosted site, even when printed from a local copy. ?base=https://other-domain overrides it.
  const requested = params.get('base') || '';
  const base = /^https?:\/\//.test(requested) ? requested.replace(/\/$/, '') : /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname) ? HOSTED_URL : window.location.origin;
  const menuLink = `${base}/demo?view=menu`;
  const reviewLink = DEMO_SHOP.googleReviewUrl;
  return <main className="demo-cards-page">
    <header className="demo-cards-head no-print">
      <div><h1>{DEMO_SHOP.name}: two printable cards</h1><p>Each card is 4 × 6 in, portrait. Print at 100% scale with margins set to None, one card per page.</p></div>
      <div className="demo-cards-actions"><button type="button" className="btn btn-primary" onClick={() => window.print()}><Printer size={16} aria-hidden="true" />Print both cards</button><a className="btn btn-secondary" href="/demo?view=menu" target="_blank" rel="noopener noreferrer">View demo menu <ExternalLink size={14} aria-hidden="true" /></a></div>
    </header>
    <p className="demo-cards-note no-print">Sample data: dishes and prices are examples. The review card’s QR opens {DEMO_SHOP.name}’s Google review form using the place ID the owner supplied.</p>
    <div className="demo-cards-row">
      <section className="demo-card-sheet" aria-label="Table menu card">
        <div className="poster-preview-card poster-format-tabletop premium-card pc-menu">
          <div className="pc-arch"><h2 className="pc-name">{DEMO_SHOP.name}</h2><Ornament /><p className="pc-eyebrow">Biryani · Rice · Curries · Tandoor</p></div>
          <h3 className="pc-title">Scan to view our menu</h3>
          <div className="pc-qr"><QRCodeSVG value={menuLink} size={200} level="H" marginSize={2} fgColor={QR_COLOR} bgColor="#FFFFFF" /></div>
          <p className="pc-foot">{DEMO_SHOP.menu.length} dishes · 15 kinds of rice</p>
        </div>
      </section>
      <section className="demo-card-sheet" aria-label="Google review card">
        <div className="poster-preview-card poster-format-tabletop premium-card pc-review">
          <p className="pc-eyebrow">Enjoyed your meal?</p>
          <h2 className="pc-name pc-name-sm">{DEMO_SHOP.name}</h2>
          <Ornament />
          <div className="pc-stars" role="img" aria-label="Five stars">{[0, 1, 2, 3, 4].map(n => <Star key={n} size={34} fill="currentColor" aria-hidden="true" />)}</div>
          <h3 className="pc-title">Rate us on Google</h3>
          <p className="pc-sub">Scan, tap your stars and share a few words.</p>
          <div className="pc-qr"><QRCodeSVG value={reviewLink} size={200} level="H" marginSize={2} fgColor={QR_COLOR} bgColor="#FFFFFF" /></div>
          <p className="pc-foot">Thank you for dining with us</p>
        </div>
      </section>
    </div>
    <p className="demo-cards-note no-print">Menu link: {menuLink} · Shop id: {DEMO_SHOP_ID}</p>
  </main>;
}

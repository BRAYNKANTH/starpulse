import { useEffect } from 'react';
import './publicPages.css';

// Public pages are real paths, not studio hash routes, so each one can be
// linked, shared and indexed on its own URL. The studio itself lives at
// /signin (and /login); the previous root URL is now the public homepage.

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
];

const PAGES = {
  '/': {
    title: 'DQ.lk | Branded QR & Digital Menu Studio',
    description: 'DQ.lk is a branded QR and digital menu studio for restaurants, cafes and hotels: 23 designer menu templates, branded QR codes, a private feedback inbox and scan analytics.',
    heading: 'Your shop’s menu, QR codes and reviews in one studio.',
    intro: 'DQ.lk gives restaurants, cafés and hotels a digital menu customers can open by scanning a QR code — plus a private place to hear feedback before it becomes a public review.',
  },
  '/pricing': {
    title: 'Pricing | DQ.lk',
    description: 'DQ.lk plans: Free with 1 shop, Pro with 5 shops, Business with 50 shops. Prices are not published yet — contact the administrator to buy.',
    heading: 'Pricing',
    intro: 'Plans are based on how many shops you manage. Billing is not connected yet, so prices are not published here — contact the administrator to buy or upgrade, and your plan is set by the administrator.',
  },
  '/about': {
    title: 'About | DQ.lk',
    description: 'About DQ.lk: a branded QR and digital menu studio for shops in Sri Lanka, with editable menus, branded QR posters and a private feedback inbox.',
    heading: 'About DQ.lk',
    intro: 'DQ.lk is a studio for shops that want a menu on every table without reprinting it every time something changes.',
  },
  '/contact': {
    title: 'Contact | DQ.lk',
    description: 'Contact DQ.lk: accounts are created by an administrator. This page explains how to get an account; contact details are to be confirmed by the owner.',
    heading: 'Contact',
    intro: 'There is no self-service sign-up yet. Accounts are created by a DQ.lk administrator, who gives you a sign-in and a temporary password to replace on first sign-in.',
  },
  '/terms': {
    title: 'Terms of Service | DQ.lk',
    description: 'DQ.lk terms of service: what the studio provides, what shop owners are responsible for, and how plans and published shop pages work.',
    heading: 'Terms of Service',
    intro: 'These are the starter terms for using DQ.lk. By using the studio or a published shop page, you agree to the terms below.',
  },
  '/privacy': {
    title: 'Privacy Policy | DQ.lk',
    description: 'DQ.lk privacy policy: what shop, menu, feedback and scan data is collected, what is public on a published shop page, and what is not sold.',
    heading: 'Privacy Policy',
    intro: 'DQ.lk collects only what it needs to run shop pages, menus, feedback and scan counts. It does not sell your data.',
  },
};

function Layout({ path, children }) {
  const page = PAGES[path] || PAGES['/'];
  useEffect(() => {
    document.title = page.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', page.description);
  }, [page]);
  return <div className="public-site">
    <header className="public-nav">
      <a className="public-brand" href="/">DQ.lk</a>
      <nav aria-label="Public pages">
        {NAV.filter(item => item.href !== '/').map(item => <a key={item.href} href={item.href} aria-current={path === item.href ? 'page' : undefined}>{item.label}</a>)}
        <a className="public-signin" href="/signin">Sign in</a>
      </nav>
    </header>
    <main className="public-main">
      <h1>{page.heading}</h1>
      <p className="public-lead">{page.intro}</p>
      {children}
    </main>
    <footer className="public-footer">
      <nav aria-label="Footer">
        {NAV.map(item => <a key={item.href} href={item.href}>{item.label}</a>)}
        <a href="/signin">Sign in</a>
      </nav>
      <p>DQ.lk — Branded QR &amp; Digital Menu Studio. Already have an account? <a href="/signin">Sign in</a>.</p>
    </footer>
  </div>;
}

const PLANS = [
  { name: 'Free', shops: '1 shop', note: 'For trying DQ.lk with a single shop.' },
  { name: 'Pro', shops: '5 shops', note: 'For a small group of shops.' },
  { name: 'Business', shops: '50 shops', note: 'For agencies and larger groups, including client accounts.' },
];

export function PublicPage({ path }) {
  if (path === '/pricing') return <Layout path={path}>
    <section className="public-cards">
      {PLANS.map(plan => <article key={plan.name} className="public-card">
        <h2>{plan.name}</h2>
        <p><strong>{plan.shops}</strong></p>
        <p>{plan.note}</p>
        <p className="public-price">Contact to buy</p>
        <p className="public-note">No price is published yet and no payment is taken on this site. The administrator sets your plan after you contact them.</p>
      </article>)}
    </section>
    <p>Menus in the studio price items in LKR by default (other currencies are available in the menu settings). Plan limits are enforced in the studio: you cannot add shops beyond your plan.</p>
    <p><a href="/contact">Contact the administrator</a> to set up a plan, or <a href="/signin">sign in</a> if you already have an account.</p>
  </Layout>;

  if (path === '/about') return <Layout path={path}>
    <h2>What DQ.lk does</h2>
    <ul>
      <li><strong>Menus customers love</strong> — 23 designer templates, live on every table in minutes. Change items and prices in the studio; the customer menu updates without reprinting.</li>
      <li><strong>Branded QR</strong> — Print once, change the destination any time. A printed QR code can point to the shop page, the digital menu, the feedback page, or a custom website.</li>
      <li><strong>Private feedback inbox</strong> — Hear from guests before they post a review. Customers can leave a rating and note privately, or follow the shop’s Google review link.</li>
      <li><strong>Scan analytics</strong> — See scan totals for each shop over 7, 30 or 90 days. Scans are counted per shop; they do not identify individual visitors.</li>
      <li><strong>Printed posters</strong> — Design table stands, tent cards, stickers and wall posters from your QR code, then print them yourself.</li>
    </ul>
    <h2>What DQ.lk does not do</h2>
    <ul>
      <li>It is not an ordering, reservation or delivery system — it is a menu, QR and feedback studio.</li>
      <li>It does not write NFC tags for you. It gives you an NFC-ready link and poster wording; you program a physical tag yourself with an NFC-writing app.</li>
      <li>It does not import Google reviews. The Google review link is one you provide for your shop; a click on it is counted, but a click does not confirm that a review was posted.</li>
      <li>It does not break scans down by individual poster. Every poster for a shop uses that shop’s QR code, so scan counts are per shop.</li>
    </ul>
    <p>DQ.lk is built for restaurants, cafés, hotels and other shops in Sri Lanka that want a simple, branded menu on every table.</p>
  </Layout>;

  if (path === '/contact') return <Layout path={path}>
    <h2>How to get an account</h2>
    <ol>
      <li>Contact the DQ.lk administrator with your shop name and the plan you want (Free: 1 shop, Pro: 5 shops, Business: 50 shops).</li>
      <li>The administrator creates your account and gives you a temporary password.</li>
      <li>Sign in at <a href="/signin">/signin</a> and replace the temporary password on first sign-in.</li>
      <li>Set up your shop, build your menu, publish your customer page, then print your QR code.</li>
    </ol>
    <section className="public-card">
      <h2>Contact details</h2>
      <p>Contact details are to be confirmed by the owner — no phone number, email address or postal address is published here yet, because none has been confirmed for this page. This page will be updated once the owner confirms them. Until then, use the administrator contact you were given when your account was set up.</p>
      <p>There is no contact form on this page yet, so that a message cannot be sent into the void: a form will be added together with a confirmed contact address.</p>
    </section>
    <p>If you already have an account, <a href="/signin">sign in</a>. If you have forgotten your password, contact your DQ.lk administrator — self-service password recovery is not available yet.</p>
  </Layout>;

  if (path === '/terms') return <Layout path={path}>
    <h2>What the service provides</h2>
    <p>DQ.lk provides a studio to create and publish shop pages, digital menus, branded QR codes and posters, and to collect private customer feedback and scan counts. Billing is not connected yet: plans are set by an administrator, and no payment is taken through this site.</p>
    <h2>What shop owners are responsible for</h2>
    <ul>
      <li>The accuracy of their menu items, prices, opening hours and shop details.</li>
      <li>The Google review link they provide for their shop, and any claims made on their published page.</li>
      <li>Keeping their sign-in private. A password change signs you out on every other device.</li>
      <li>Printed material: once a QR code is printed, its destination can be changed in the studio, but the printed poster itself must be replaced if its wording or design is wrong.</li>
    </ul>
    <h2>Published pages</h2>
    <p>A published shop page is public. Its shop details, menu and any contact details on it can be seen by anyone with the link or QR code. Do not put private contact details on a published page unless you intend them to be public.</p>
    <h2>Availability and changes</h2>
    <p>DQ.lk is provided as-is and may change, including plan limits and features. Unpublished shops are hidden from customers, and a QR code for an unpublished shop shows an “isn’t available” page rather than the shop.</p>
  </Layout>;

  if (path === '/privacy') return <Layout path={path}>
    <h2>What is collected</h2>
    <ul>
      <li><strong>Account data:</strong> your name, email address, plan and sign-in session, so the studio can identify your shops.</li>
      <li><strong>Shop data:</strong> shop details, menu items, images, branding and settings you enter. Images are stored with your shop data.</li>
      <li><strong>Customer feedback:</strong> the rating, note and tags a customer leaves, and whether they clicked through to Google. Feedback is not tied to a customer account.</li>
      <li><strong>Scan counts:</strong> how many times a shop’s QR link was visited, and on which days. Scans do not identify individual visitors, and automated crawlers are filtered out.</li>
    </ul>
    <h2>What is public</h2>
    <p>Published shop pages are public by design: shop details, menu and contact details on a published page can be seen by anyone. Unpublished shops, draft menus and your feedback inbox are only visible to the signed-in shop owner and administrators.</p>
    <h2>What is not done with your data</h2>
    <p>Your data is not sold. It is used to run your shop pages, menus, feedback and scan counts, and to keep accounts secure (including rate limits on sign-in and feedback).</p>
    <h2>Cookies and sessions</h2>
    <p>Sign-in uses a session cookie so you stay signed in on your device. Changing your password signs you out on every other device.</p>
  </Layout>;

  return <Layout path={path}>
    <section className="public-cards">
      <article className="public-card"><h2>Menus customers love</h2><p>23 designer templates, live on every table in minutes.</p></article>
      <article className="public-card"><h2>Branded QR &amp; NFC</h2><p>Print once, change the destination any time. NFC-ready links for tags you program yourself.</p></article>
      <article className="public-card"><h2>Private feedback inbox</h2><p>Hear from guests before they post a review.</p></article>
      <article className="public-card"><h2>Scan analytics</h2><p>See scan totals for each shop.</p></article>
    </section>
    <h2>How it works</h2>
    <ol>
      <li><strong>Set up your shop</strong> — add your details, logo and cover photo, and your Google review link.</li>
      <li><strong>Build your menu</strong> — add items and prices (LKR by default), pick one of 23 templates, and customise layout, fonts and colours.</li>
      <li><strong>Print your QR code</strong> — design a table stand, tent card, sticker or wall poster, print it, and change its destination any time without reprinting.</li>
    </ol>
    <p>Accounts are created by a DQ.lk administrator — there is no self-service sign-up yet. <a href="/pricing">See plans</a>, <a href="/contact">contact the administrator</a>, or <a href="/signin">sign in</a> if you already have an account.</p>
  </Layout>;
}

export function PublicNotFound() {
  useEffect(() => { document.title = 'Page not found | DQ.lk'; }, []);
  return <div className="public-site">
    <header className="public-nav">
      <a className="public-brand" href="/">DQ.lk</a>
      <nav aria-label="Public pages">
        {NAV.filter(item => item.href !== '/').map(item => <a key={item.href} href={item.href}>{item.label}</a>)}
        <a className="public-signin" href="/signin">Sign in</a>
      </nav>
    </header>
    <main className="public-main">
      <h1>Page not found</h1>
      <p className="public-lead">That page does not exist. Try one of the pages below, or sign in to the studio.</p>
      <p><a href="/">Home</a> · <a href="/pricing">Pricing</a> · <a href="/about">About</a> · <a href="/contact">Contact</a> · <a href="/signin">Sign in</a></p>
    </main>
    <footer className="public-footer"><p>DQ.lk — Branded QR &amp; Digital Menu Studio.</p></footer>
  </div>;
}

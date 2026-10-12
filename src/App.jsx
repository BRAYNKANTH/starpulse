import { ImageUploadStatus } from './components/ImageUploadStatus';
import './components/foodMenus.css';
import './components/brandedStudio.css';
import './studio.css';
import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Loader2, Menu as MenuIcon } from 'lucide-react';
import BrandedQrStudio from './components/BrandedQrStudio';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import { PAGES } from './data/pages';
import AdminStudio from './components/AdminStudio';
import QrNfcGenerator from './components/QrNfcGenerator';
import SavedProfiles from './components/SavedProfiles';
import MenuBuilder from './components/MenuBuilder';
import ShopLanding from './components/ShopLanding';
import FeedbackInbox from './components/FeedbackInbox';
import AuthScreen, { ChoosePasswordScreen } from './components/AuthScreen';
import AdminAccounts from './components/AdminAccounts';
import AccountSettings from './components/AccountSettings';
import Toasts from './components/Toasts';
import { useToasts } from './components/useToasts';
import { createBusiness, getStoredBusinessProfile, saveStoredBusinessProfile } from './data/presets';
import { api, shopUrl } from './data/api';
import { resolveMenuDesign } from './data/menuDesign';

export default function App() {
  const bizId = new URLSearchParams(window.location.search).get('biz');
  return bizId ? <PublicShop id={bizId} /> : <OwnerStudio />;
}

function PublicShop({ id }) {
  const [result, setResult] = useState({ loading: true });
  useEffect(() => {
    let active = true;
    api(`/businesses/${encodeURIComponent(id)}`).then(profile => { if (active) setResult({ profile }); }).catch(error => { if (active) setResult({ error: error.message }); });
    return () => { active = false; };
  }, [id]);
  // A neutral page outline while the shop loads, so customers see structure instead of a blank screen.
  if (result.loading) return <main className="public-loading" aria-busy="true"><span className="sr-only" role="status">Opening the shop…</span>
    <div className="public-skeleton" aria-hidden="true"><i className="sk-bar sk-nav" /><i className="sk-bar sk-title" /><i className="sk-bar sk-line" />{[0, 1, 2].map(n => <i key={n} className="sk-card" />)}</div>
  </main>;
  if (!result.profile) return <main className="public-loading public-status"><h1>This shop isn’t available</h1><p>{result.error} If you scanned a QR code, ask the staff for help.</p></main>;
  return <ShopLanding businessProfile={result.profile} initialView={new URLSearchParams(window.location.search).get('view') || 'landing'} />;
}

const pageFromHash = () => {
  const id = window.location.hash.replace(/^#\/?/, '');
  return PAGES.some(page => page.id === id) ? id : 'dashboard';
};

function useHashPage() {
  const [page, setPage] = useState(pageFromHash);
  useEffect(() => {
    const sync = () => setPage(pageFromHash());
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  const navigate = useCallback(next => {
    if (pageFromHash() !== next) window.location.hash = `/${next}`;
    setPage(next);
    window.scrollTo({ top: 0 });
  }, []);
  return [page, navigate];
}

function useTheme() {
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('starpulse_theme') === 'dark' ? 'dark' : 'light'; } catch { return 'light'; } });
  const toggle = () => setTheme(current => {
    const next = current === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('starpulse_theme', next); } catch { /* theme resets next visit */ }
    return next;
  });
  return [theme, toggle];
}

function OwnerStudio() {
  const [activeTab, setActiveTab] = useHashPage();
  const [theme, toggleTheme] = useTheme();
  const [businessProfile, setBusinessProfile] = useState(getStoredBusinessProfile);
  const [profiles, setProfiles] = useState([]);
  const [overview, setOverview] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploads, setUploads] = useState(0);
  const trackUpload = useCallback(delta => setUploads(current => Math.max(0, current + delta)), []);
  const [account, setAccount] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState('loading'); // loading | signed-out | choose-password | ready
  const [navOpen, setNavOpen] = useState(false);
  const { toasts, notify, dismiss } = useToasts();

  const refreshOverview = useCallback(() => api('/admin/overview').then(setOverview).catch(() => { /* stats are optional */ }), []);
  const applyProfiles = useCallback(saved => {
    setProfiles(saved); setError(''); setStatus('ready'); setDirty(false);
    setBusinessProfile(current => saved.find(p => p.id === current.id) || saved[0] || current);
    refreshOverview();
  }, [refreshOverview]);
  const refreshAccount = useCallback(() => api('/auth/me').then(setAccount).catch(() => { /* usage figures are optional */ }), []);
  const openStudio = useCallback(async next => {
    // A draft cached by another account on this browser must not appear in this one.
    if (readDraftOwner() !== next.user.id) { clearDraft(); setBusinessProfile(createBusiness()); }
    setAccount(next);
    if (next.user.mustChangePassword) { setStatus('choose-password'); return; }
    applyProfiles(await api('/admin/profiles'));
  }, [applyProfiles]);
  useEffect(() => {
    let active = true;
    api('/auth/me').then(next => active && openStudio(next)).catch(() => { if (active) setStatus('signed-out'); });
    return () => { active = false; };
  }, [openStudio]);
  useEffect(() => {
    if (!dirty && !uploads) return;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, uploads]);

  const signedOut = () => {
    clearDraft();
    setAccount(null); setProfiles([]); setOverview([]); setBusinessProfile(createBusiness());
    setDirty(false); setError(''); setStatus('signed-out');
  };
  const signOut = async () => {
    if (dirty && !window.confirm('Discard unsaved changes and sign out?')) return;
    try { await api('/auth/logout', { method: 'POST', body: '{}' }); } catch { /* the session expires on its own */ }
    signedOut();
  };
  const update = profile => { setBusinessProfile(profile); setDirty(true); };
  const select = (profile, page) => {
    if (profile.id !== businessProfile.id && dirty && !window.confirm('Discard unsaved changes and open another shop?')) return;
    setBusinessProfile(profile); setDirty(false);
    if (page) setActiveTab(page);
  };
  const newBusiness = () => {
    if (account && profiles.length >= account.plan.shops) {
      notify(`Your ${account.plan.name} plan includes ${account.plan.shops} shop${account.plan.shops === 1 ? '' : 's'}. Upgrade to add more.`, 'error');
      setActiveTab('account'); return;
    }
    if (dirty && !window.confirm('Discard unsaved changes and create a new shop?')) return;
    setBusinessProfile(createBusiness()); setDirty(false); setActiveTab('register');
  };
  const save = async () => {
    setSaving(true); setError('');
    try {
      const accentColor = resolveMenuDesign(businessProfile.menuDesign).accent;
      const saved = await api(`/admin/businesses/${businessProfile.id}`, { method: 'PUT', body: JSON.stringify({ ...businessProfile, accentColor: /^#[0-9a-f]{6}$/i.test(accentColor) ? accentColor : businessProfile.accentColor }) });
      setBusinessProfile(saved);
      setProfiles(current => current.some(p => p.id === saved.id) ? current.map(p => p.id === saved.id ? saved : p) : [...current, saved]);
      saveStoredBusinessProfile(saved); saveDraftOwner(account.user.id); setDirty(false); refreshOverview(); refreshAccount();
      notify(saved.published ? 'Shop saved. Your public page is up to date.' : 'Draft saved. Turn on Published in the top bar and save when you’re ready to go live.');
    } catch (e) {
      if (e.status === 401) { notify('Your session has ended. Sign in again; unsaved changes were not kept.', 'error'); signedOut(); return; }
      setError(e.message); notify(e.message, 'error');
    } finally { setSaving(false); }
  };
  // After an administrator moves shops between accounts, the open shop may no longer be ours.
  const reloadShops = async () => {
    try {
      const saved = await api('/admin/profiles');
      setProfiles(saved); refreshOverview(); refreshAccount();
      if (!saved.some(p => p.id === businessProfile.id) && profiles.some(p => p.id === businessProfile.id)) { setBusinessProfile(saved[0] || createBusiness()); setDirty(false); }
    } catch { /* the list refreshes on the next load */ }
  };
  const deleteShop = async profile => {
    if (!window.confirm(`Delete “${profile.name}” with its menu, feedback and scan history? Its printed QR codes will stop working.`)) return;
    try {
      await api(`/admin/businesses/${profile.id}`, { method: 'DELETE', body: '{}' });
      const remaining = profiles.filter(p => p.id !== profile.id);
      setProfiles(remaining);
      if (businessProfile.id === profile.id) { setBusinessProfile(remaining[0] || createBusiness()); setDirty(false); }
      refreshOverview(); refreshAccount();
      notify(`${profile.name} deleted.`);
    } catch (e) { notify(e.message, 'error'); }
  };

  if (status !== 'ready') return <div className="studio studio-auth" data-theme={theme}>
    {status === 'loading' ? <Loader2 className="spin" size={28} aria-label="Loading studio" />
      : status === 'choose-password' ? <ChoosePasswordScreen account={account} onDone={next => openStudio(next).catch(e => setError(e.message))} onSignOut={signOut} />
      : <AuthScreen onAuthenticated={next => openStudio(next).catch(e => setError(e.message))} />}
  </div>;

  const savedProfile = profiles.find(p => p.id === businessProfile.id);
  const stats = overview.find(s => s.id === businessProfile.id);
  const unreadTotal = overview.reduce((sum, s) => sum + (s.feedback?.unread || 0), 0);
  const state = uploads ? ['Preparing image…', 'neutral'] : dirty ? ['Unsaved changes', 'warning'] : !savedProfile ? ['Not saved yet', 'neutral'] : ['All changes saved', 'success'];
  const canSave = (dirty || !savedProfile) && !uploads;
  const navigate = page => { setActiveTab(page); setNavOpen(false); };

  return <div className="studio" data-theme={theme}>
    <Sidebar active={activeTab} onNavigate={navigate} unread={unreadTotal} theme={theme} onToggleTheme={toggleTheme} onSignOut={signOut} user={account.user} open={navOpen} onClose={() => setNavOpen(false)} />
    <div className="sp-main">
      <header className="sp-topbar no-print">
        <button type="button" className="btn btn-ghost btn-icon sp-menu-toggle" aria-label="Open navigation" onClick={() => setNavOpen(true)}><MenuIcon size={20} /></button>
        <label className="sr-only" htmlFor="shop-switcher">Current shop</label>
        <select id="shop-switcher" className="sp-shop-switcher" value={businessProfile.id} onChange={event => { if (event.target.value === '__new') newBusiness(); else { const next = profiles.find(p => p.id === event.target.value); if (next) select(next); } }}>
          {!savedProfile && <option value={businessProfile.id}>{businessProfile.name || 'New shop'} (unsaved)</option>}
          {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          <option value="__new">+ Create new shop</option>
        </select>
        <label className="switch sp-publish" title={businessProfile.published ? 'Customers can see this shop' : 'Hidden from customers'}><input type="checkbox" role="switch" checked={businessProfile.published === true} onChange={event => update({ ...businessProfile, published: event.target.checked })} /><span aria-hidden="true" /><small className="sp-publish-label">{businessProfile.published ? 'Published' : 'Draft'}</small></label>
        <span className={`badge badge-${state[1]}`} role="status">{state[0]}</span>
        <div className="sp-topbar-actions">
          {savedProfile?.published && <a className="btn btn-ghost" href={shopUrl(businessProfile.id)} target="_blank" rel="noopener noreferrer" aria-label="View page (opens in a new tab)" title="View customer page"><ExternalLink size={16} aria-hidden="true" /><span className="hide-sm">View page</span></a>}
          <button type="button" className={`btn ${canSave ? 'btn-primary' : 'btn-secondary'}`} onClick={save} disabled={saving || !canSave}>{saving ? 'Saving…' : canSave ? <>Save<span className="hide-sm"> changes</span></> : 'Saved'}</button>
        </div>
      </header>
      <main className="sp-content">
        {error && <div className="notice error" role="alert"><span>{error}</span><button type="button" className="btn btn-ghost btn-sm" onClick={() => setError('')}>Dismiss</button></div>}
        <ImageUploadStatus.Provider value={trackUpload}><fieldset disabled={saving || uploads > 0} className="studio-fieldset">
          {activeTab === 'dashboard' && <Dashboard profile={businessProfile} savedProfile={savedProfile} profiles={profiles} overview={overview} stats={stats} onNavigate={navigate} onSelect={select} onRefresh={refreshOverview} onPublish={() => update({ ...businessProfile, published: true })} />}
          {activeTab === 'qr' && <BrandedQrStudio key={businessProfile.id} businessProfile={businessProfile} setBusinessProfile={update} savedProfile={savedProfile} dirty={dirty} />}
          {activeTab === 'register' && <AdminStudio businessProfile={businessProfile} setBusinessProfile={update} onNavigateToPrint={() => navigate('print')} onNavigate={navigate} />}
          {activeTab === 'menu' && <MenuBuilder key={businessProfile.id} businessProfile={businessProfile} setBusinessProfile={update} />}
          {activeTab === 'print' && <QrNfcGenerator businessProfile={businessProfile} savedProfile={savedProfile} dirty={dirty} onNavigate={navigate} />}
          {activeTab === 'profiles' && <SavedProfiles profiles={profiles} overview={overview} activeProfile={businessProfile} onSelect={profile => select(profile, 'dashboard')} onNew={newBusiness} onDelete={deleteShop} plan={account.plan} />}
          {activeTab === 'account' && <AccountSettings account={account} onAccountChange={setAccount} notify={notify} />}
          {activeTab === 'accounts' && account.user.role === 'admin' && <AdminAccounts currentUser={account.user} notify={notify} onShopsChanged={reloadShops} />}
          {activeTab === 'inbox' && <FeedbackInbox key={businessProfile.id} businessProfile={businessProfile} onChange={refreshOverview} notify={notify} />}
        </fieldset></ImageUploadStatus.Provider>
      </main>
    </div>
    <Toasts toasts={toasts} onDismiss={dismiss} />
  </div>;
}

// The last-opened shop is cached in the browser; remember which account it belongs to.
const DRAFT_OWNER_KEY = 'starpulse_profile_owner';
function readDraftOwner() { try { return localStorage.getItem(DRAFT_OWNER_KEY); } catch { return null; } }
function saveDraftOwner(id) { try { localStorage.setItem(DRAFT_OWNER_KEY, id); } catch { /* cache is optional */ } }
function clearDraft() { try { localStorage.removeItem('starpulse_business_profile'); localStorage.removeItem(DRAFT_OWNER_KEY); } catch { /* cache is optional */ } }

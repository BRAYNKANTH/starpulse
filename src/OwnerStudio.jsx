import { ImageUploadStatus } from './components/ImageUploadStatus';
import './components/brandedStudio.css';
import './studio.css';
import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, EyeOff, Loader2, Menu as MenuIcon } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import { PAGES, PAGE_ALIASES } from './data/pages';
import AdminStudio from './components/AdminStudio';
import QrPrintStudio from './components/QrPrintStudio';
import SavedProfiles from './components/SavedProfiles';
import MenuBuilder from './components/MenuBuilder';
import FeedbackInbox from './components/FeedbackInbox';
import ShopSetup from './components/ShopSetup';
import ActionMenu from './components/ActionMenu';
import AuthScreen, { ChoosePasswordScreen } from './components/AuthScreen';
import AdminAccounts from './components/AdminAccounts';
import AccountSettings from './components/AccountSettings';
import Toasts from './components/Toasts';
import { useToasts } from './components/useToasts';
import { createBusiness, getStoredBusinessProfile, saveStoredBusinessProfile } from './data/presets';
import { api, shopUrl } from './data/api';
import { normalizeMenuDesign, resolveMenuDesign } from './data/menuDesign';
import { newId } from './utils/ids';

// The owner studio. Loaded separately from the customer pages, so a QR scan never downloads it.
const pageFromHash = () => {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const id = PAGE_ALIASES[raw] || raw;
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

export default function OwnerStudio() {
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
      notify(`Your ${account.plan.name} plan includes ${account.plan.shops} shop${account.plan.shops === 1 ? '' : 's'}. Contact your administrator to add more.`, 'error');
      setActiveTab('account'); return;
    }
    if (dirty && !window.confirm('Discard unsaved changes and create a new shop?')) return;
    setDirty(false); setActiveTab('new');
  };
  // Saves the open shop. `changes` lets Publish and Unpublish save and switch state in one step.
  const save = async (changes = {}, message) => {
    setSaving(true); setError('');
    try {
      const next = { ...businessProfile, ...changes };
      const accentColor = resolveMenuDesign(next.menuDesign).accent;
      const saved = await api(`/admin/businesses/${next.id}`, { method: 'PUT', body: JSON.stringify({ ...next, accentColor: /^#[0-9a-f]{6}$/i.test(accentColor) ? accentColor : next.accentColor }) });
      setBusinessProfile(saved);
      setProfiles(current => current.some(p => p.id === saved.id) ? current.map(p => p.id === saved.id ? saved : p) : [...current, saved]);
      saveStoredBusinessProfile(saved); saveDraftOwner(account.user.id); setDirty(false); refreshOverview(); refreshAccount();
      notify(message || (saved.published ? 'Saved. Your live page is up to date.' : 'Draft saved. Only you can see it until you publish.'));
      return saved;
    } catch (e) {
      if (e.status === 401) { notify('Your session has ended. Sign in again; unsaved changes were not kept.', 'error'); signedOut(); return null; }
      setError(e.message); notify(e.message, 'error'); return null;
    } finally { setSaving(false); }
  };
  const publish = () => save({ published: true }, 'Your shop is live. Customers can now open it from your QR code.');
  const unpublish = () => { if (window.confirm('Hide this shop from customers? Its QR codes will say the shop is not available until you publish again.')) save({ published: false }, 'Your shop is hidden from customers.'); };
  const createShop = async ({ name, category, currency, template, items }) => {
    const menuDesign = normalizeMenuDesign({ template });
    const profile = { ...createBusiness(), name, category, currency, menuDesign, accentColor: resolveMenuDesign(menuDesign).accent,
      menu: items.map(item => ({ id: newId(), ...item, description: '', image: '', available: true, soldOut: false, tags: [] })) };
    setSaving(true); setError('');
    try {
      const saved = await api(`/admin/businesses/${profile.id}`, { method: 'PUT', body: JSON.stringify(profile) });
      setProfiles(current => [...current, saved]); setBusinessProfile(saved); setDirty(false);
      saveStoredBusinessProfile(saved); saveDraftOwner(account.user.id); refreshOverview(); refreshAccount();
      setActiveTab('dashboard');
      notify(`${saved.name} is ready as a draft. Add your details and photos, then publish.`);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
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
      if (!remaining.length) setActiveTab('dashboard');
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
  const page = PAGES.find(p => p.id === activeTab);
  // With no saved shop yet, every shop page shows the setup steps instead of an empty, unsaved shop.
  const settingUp = activeTab === 'new' || (page?.shop && !profiles.length);
  const shopPage = page?.shop && !settingUp && !!savedProfile;
  const live = !!savedProfile?.published;
  const navigate = next => { setActiveTab(next); setNavOpen(false); };

  return <div className="studio" data-theme={theme}>
    <Sidebar active={settingUp && activeTab !== 'new' ? 'dashboard' : activeTab} onNavigate={navigate} unread={unreadTotal} theme={theme} onToggleTheme={toggleTheme} onSignOut={signOut} user={account.user} open={navOpen} onClose={() => setNavOpen(false)} />
    <div className="sp-main">
      <header className="sp-topbar no-print">
        <button type="button" className="btn btn-ghost btn-icon sp-menu-toggle" aria-label="Open navigation" onClick={() => setNavOpen(true)}><MenuIcon size={20} /></button>
        {shopPage ? <>
          <label className="sr-only" htmlFor="shop-switcher">Current shop</label>
          <select id="shop-switcher" className="sp-shop-switcher" value={businessProfile.id} onChange={event => { if (event.target.value === '__new') newBusiness(); else { const next = profiles.find(p => p.id === event.target.value); if (next) select(next); } }}>
            {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            <option value="__new">+ Add a new shop</option>
          </select>
          <span className={`badge badge-${live ? 'success' : 'neutral'}`} title={live ? 'Customers can open this shop' : 'Only you can see this shop'}>{live ? 'Live' : 'Draft'}</span>
          {(dirty || uploads > 0) && <span className="badge badge-warning hide-sm" role="status">{uploads ? 'Preparing image…' : 'Unsaved changes'}</span>}
          <div className="sp-topbar-actions">
            {live && <a className="btn btn-ghost" href={shopUrl(businessProfile.id)} target="_blank" rel="noopener noreferrer" aria-label="View your live page (opens in a new tab)" title="View your live page"><ExternalLink size={16} aria-hidden="true" /><span className="hide-sm">View page</span></a>}
            {live ? <>
              <button type="button" className={`btn ${dirty ? 'btn-primary' : 'btn-secondary'}`} onClick={() => save()} disabled={saving || !dirty || uploads > 0}>{saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}</button>
              <ActionMenu label="More shop actions" actions={[{ label: 'Unpublish (hide from customers)', icon: EyeOff, onSelect: unpublish, disabled: saving }]} />
            </> : <>
              <button type="button" className="btn btn-secondary hide-sm" onClick={() => save()} disabled={saving || !dirty || uploads > 0}>{saving ? 'Saving…' : dirty ? 'Save draft' : 'Draft saved'}</button>
              <button type="button" className="btn btn-primary" onClick={publish} disabled={saving || uploads > 0}>{saving ? 'Saving…' : 'Publish'}</button>
            </>}
          </div>
        </> : <span className="sp-topbar-title">{settingUp ? 'New shop' : page?.label}</span>}
      </header>
      <main className="sp-content">
        {error && !settingUp && <div className="notice error" role="alert"><span>{error}</span><button type="button" className="btn btn-ghost btn-sm" onClick={() => setError('')}>Dismiss</button></div>}
        <ImageUploadStatus.Provider value={trackUpload}><fieldset disabled={saving || uploads > 0} className="studio-fieldset">
          {settingUp ? <ShopSetup first={!profiles.length} busy={saving} error={error} onCreate={createShop} onCancel={() => navigate('dashboard')} /> : <>
            {activeTab === 'dashboard' && <Dashboard profile={businessProfile} savedProfile={savedProfile} profiles={profiles} overview={overview} stats={stats} onNavigate={navigate} onSelect={select} onRefresh={refreshOverview} onPublish={publish} />}
            {activeTab === 'qr' && <QrPrintStudio key={businessProfile.id} businessProfile={businessProfile} setBusinessProfile={update} savedProfile={savedProfile} dirty={dirty} onPublish={publish} />}
            {activeTab === 'register' && <AdminStudio businessProfile={businessProfile} setBusinessProfile={update} onNavigateToPrint={() => navigate('qr')} />}
            {activeTab === 'menu' && <MenuBuilder key={businessProfile.id} businessProfile={businessProfile} setBusinessProfile={update} />}
            {activeTab === 'profiles' && <SavedProfiles profiles={profiles} overview={overview} activeProfile={businessProfile} onSelect={profile => select(profile, 'dashboard')} onNew={newBusiness} onDelete={deleteShop} plan={account.plan} />}
            {activeTab === 'account' && <AccountSettings account={account} onAccountChange={setAccount} notify={notify} />}
            {activeTab === 'accounts' && account.user.role === 'admin' && <AdminAccounts currentUser={account.user} notify={notify} onShopsChanged={reloadShops} />}
            {activeTab === 'inbox' && <FeedbackInbox key={businessProfile.id} businessProfile={businessProfile} onChange={refreshOverview} notify={notify} />}
          </>}
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

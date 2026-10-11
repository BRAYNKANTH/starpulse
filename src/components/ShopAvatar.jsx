import { contrastRatio } from '../data/qrDesign';

// Shop logo, or its initial on the accent colour with whichever text colour stays readable.
export default function ShopAvatar({ profile, showLogo = true }) {
  if (showLogo && profile.logo) return <img className="sp-avatar" src={profile.logo} alt="" />;
  const accent = /^#[0-9a-f]{6}$/i.test(profile.accentColor || '') ? profile.accentColor : '#667085';
  return <span className="sp-avatar" aria-hidden="true" style={{ background: accent, color: contrastRatio('#ffffff', accent) >= 4.5 ? '#ffffff' : '#101828' }}>{(profile.name || '?').slice(0, 1)}</span>;
}

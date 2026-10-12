import { useState, useId } from 'react';
import { Star, ShieldCheck } from 'lucide-react';
import { api } from '../data/api';

const RATING_WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

const GoogleG = () => <svg className="fb-google-g" viewBox="0 0 24 24" aria-hidden="true">
  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
</svg>;

// Feedback page, styled with the shop's menu template. The Google review link and private feedback
// are offered to every customer at every rating; neither depends on how the customer rated the shop.
export default function CustomerFunnel({ businessProfile, preview = false }) {
  const noteId = useId(), ratingId = useId();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const shown = hoverRating || rating;
  const tags = businessProfile.quickTags || [];

  const toggleTag = tag => setSelectedTags(current => current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag]);

  const openGoogle = () => {
    const text = [selectedTags.join(' • '), noteText].filter(Boolean).join('\n\n');
    if (text && navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    window.open(businessProfile.googleReviewUrl, '_blank', 'noopener,noreferrer');
    if (rating && !preview) api(`/businesses/${businessProfile.id}/feedback`, { method: 'POST', body: JSON.stringify({ rating, selectedTags, note: noteText, redirectedToGoogle: true }) }).catch(() => { /* Opening Google must not depend on analytics. */ });
  };

  const sendPrivately = async event => {
    event.preventDefault();
    if (preview) { setError('This is a preview. Feedback can be sent from the published page.'); return; }
    if (!rating) { setError('Choose a star rating first.'); return; }
    setBusy(true); setError('');
    try {
      await api(`/businesses/${businessProfile.id}/feedback`, { method: 'POST', body: JSON.stringify({ rating, selectedTags, note: noteText, redirectedToGoogle: false }) });
      setSent(true);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return <div className="fb-page">
    <form className="fb-card" onSubmit={sendPrivately}>
      {businessProfile.logo && <img className="fb-logo" src={businessProfile.logo} alt="" />}
      <p className="fb-kicker">{businessProfile.name}</p>
      <h1 className="fb-title">{businessProfile.customPrompt || 'How was your experience today?'}</h1>
      <p className="fb-lead">{businessProfile.googleReviewUrl ? 'Every rating is welcome. Share it with our team, on Google, or both.' : 'Your feedback goes straight to our team.'}</p>

      <div className="fb-stars" role="group" aria-labelledby={ratingId}>
        <span id={ratingId} className="sr-only">Your rating</span>
        {[1, 2, 3, 4, 5].map(n => <button key={n} type="button" className={`fb-star ${n <= shown ? 'on' : ''}`} aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`} aria-pressed={rating === n}
          onMouseEnter={() => setHoverRating(n)} onMouseLeave={() => setHoverRating(0)} onClick={() => { setRating(n); setError(''); }}>
          <Star size={34} aria-hidden="true" />
        </button>)}
      </div>
      <p className="fb-rating-word" aria-live="polite">{RATING_WORDS[shown] || 'Tap a star to rate'}</p>

      {tags.length > 0 && <div className="fb-tags" role="group" aria-label="What stood out?">
        {tags.map(tag => <button key={tag} type="button" className={`fb-tag ${selectedTags.includes(tag) ? 'on' : ''}`} aria-pressed={selectedTags.includes(tag)} onClick={() => toggleTag(tag)}>{tag}</button>)}
      </div>}

      <label htmlFor={noteId} className="fb-label">Add a note <span>(optional)</span></label>
      <textarea id={noteId} className="fb-note" maxLength={3000} rows={3} placeholder={businessProfile.notePlaceholder || 'Tell us what you enjoyed or what we could do better…'} value={noteText} onChange={e => setNoteText(e.target.value)} />

      {sent ? <p className="fb-sent" role="status"><ShieldCheck size={18} aria-hidden="true" />Thank you. Your feedback has reached the team.</p>
        : <div className="fb-actions">
          <button type="submit" className="fb-button fb-primary" disabled={busy}>{busy ? 'Sending…' : 'Send to the team'}</button>
          {businessProfile.googleReviewUrl && <button type="button" className="fb-button fb-secondary" disabled={preview} onClick={openGoogle}><GoogleG />Post a Google review</button>}
        </div>}
      {businessProfile.googleReviewUrl && !sent && <p className="fb-hint">Opening Google copies your note, so you can paste it into your review.</p>}
      {error && <p role="alert" className="fb-error">{error}</p>}
    </form>
  </div>;
}

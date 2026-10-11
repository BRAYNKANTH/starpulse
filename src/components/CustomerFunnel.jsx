import React, { useState, useId } from 'react';
import { Star, ExternalLink, Sparkles, ShieldCheck } from 'lucide-react';
import { api } from '../data/api';

export default function CustomerFunnel({ businessProfile, preview = false }) {
  const noteId = useId();
  const [rating, setRating] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [showFeedbackSuccess, setShowFeedbackSuccess] = useState(false);

  const activeStarCount = hoverRating || rating;

  // Google reviews and private feedback are available at every rating.
  const handleStarClick = (starNum) => {
    setRating(starNum);
  };

  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleDirectGoogleReviewClick = () => {
    const tagsString = selectedTags.length > 0 ? selectedTags.join(' • ') : '';
    const fullReviewText = [tagsString, noteText].filter(Boolean).join('\n\n');

    if (fullReviewText && navigator.clipboard) {
      navigator.clipboard.writeText(fullReviewText).catch(() => {});
    }

    window.open(businessProfile.googleReviewUrl, '_blank', 'noopener,noreferrer');
    if (rating && !preview) api(`/businesses/${businessProfile.id}/feedback`, { method: 'POST', body: JSON.stringify({ rating, selectedTags, note: noteText, redirectedToGoogle: true }) }).catch(() => { /* Opening Google must not depend on analytics. */ });
  };

  const handlePrivateSubmit = async (e) => {
    e.preventDefault();
    if (preview) { setError('This is a preview. Feedback is available on the published page.'); return; }
    if (!rating) { setError('Please choose a rating first.'); return; }
    setBusy(true); setError('');
    try {
      await api(`/businesses/${businessProfile.id}/feedback`, { method: 'POST', body: JSON.stringify({ rating, selectedTags, note: noteText, redirectedToGoogle: false }) });
      setShowFeedbackSuccess(true);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="carrd-mobile-wrapper">
      <div className="carrd-card" style={{ '--primary-accent': businessProfile.accentColor || '#F59E0B' }}>
        
        {/* Cover Header */}
        <div
          className="carrd-cover"
          style={{ backgroundImage: businessProfile.coverImage ? `url("${businessProfile.coverImage}")` : 'linear-gradient(135deg, #315541, #192d25)' }}
        >
          <div className="carrd-cover-overlay"></div>
        </div>

        {/* Business Branding */}
        <div className="carrd-header-content">
          <div className="carrd-logo-wrapper">
            {businessProfile.logo && <img
              src={businessProfile.logo}
              alt={businessProfile.name}
              className="carrd-logo-img"
            />}
          </div>

          <h1 className="carrd-business-name">{businessProfile.name}</h1>
          <p className="carrd-business-tagline">{businessProfile.tagline}</p>

          {businessProfile.googleReviewUrl && <div className="carrd-badge-row">
            <span className="google-review-badge">
              <svg className="google-g-logo" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Official Google Review</span>
            </span>
          </div>}
        </div>

        {/* Action Content */}
        <div className="carrd-rating-section">
          
          <h2 className="rating-prompt-title">
            {businessProfile.customPrompt || 'How was your experience today?'}
          </h2>

          {/* Interactive Star Buttons */}
          <div className="stars-interactive-wrapper">
            {[1, 2, 3, 4, 5].map((starNum) => (
              <button
                type="button"
                key={starNum}
                className="star-btn"
                onMouseEnter={() => setHoverRating(starNum)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => handleStarClick(starNum)}
                aria-label={`Rate ${starNum} stars`}
                aria-pressed={rating === starNum}
              >
                <Star
                  className={`star-icon ${starNum <= activeStarCount ? 'filled' : 'empty'}`}
                />
              </button>
            ))}
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem', textAlign: 'center' }}>
            {businessProfile.googleReviewUrl ? 'Share your honest experience. Every rating is welcome.' : 'Share your experience with our team.'}
          </p>

          {/* Big Direct Google Review Button — shown identically to every
              customer regardless of the star rating they picked. */}
          {businessProfile.googleReviewUrl && <button
            type="button"
            className="carrd-submit-btn"
            style={{ marginBottom: '1.25rem' }}
            onClick={handleDirectGoogleReviewClick}
            disabled={!businessProfile.googleReviewUrl || preview}
          >
            <Sparkles size={18} />
            <span>Post Your Google Review</span>
            <ExternalLink size={16} />
          </button>}

          {/* Optional Short Note */}
          <div className="note-textarea-wrapper">
            <label htmlFor={noteId} className="section-sublabel">Optional: Add a note</label>
            
            {businessProfile.quickTags && businessProfile.quickTags.length > 0 && (
              <div className="quick-tags-flex" style={{ marginBottom: '0.5rem' }}>
                {businessProfile.quickTags.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    className={`tag-pill ${selectedTags.includes(tag) ? 'active' : ''}`}
                    onClick={() => handleTagToggle(tag)}
                    aria-pressed={selectedTags.includes(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            <textarea
              id={noteId}
              maxLength={3000}
              className="carrd-textarea"
              placeholder={businessProfile.notePlaceholder || 'Type your experience here...'}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={2}
            ></textarea>
          </div>

          {/* Available to every customer, at any rating — an additional
              channel alongside the Google review, never offered as a
              substitute for it based on how the customer rated us. */}
          {!showFeedbackSuccess && (
            <button
              type="button"
              className="carrd-submit-btn"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-main)', boxShadow: 'none' }}
              onClick={handlePrivateSubmit}
              disabled={busy}
            >
              <span>{busy ? 'Sending…' : 'Send Private Feedback to Owner'}</span>
            </button>
          )}

          {showFeedbackSuccess && (
            <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid var(--success)', padding: '0.85rem', borderRadius: '12px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--success)' }}>
              <ShieldCheck size={18} style={{ display: 'block', margin: '0 auto 0.25rem auto' }} />
              Thank you! Your feedback has been received in the shop’s inbox.
            </div>
          )}
          {error && <p role="alert" className="notice error">{error}</p>}

        </div>

      </div>
    </div>
  );
}

import { Star } from 'lucide-react';

export default function Stars({ rating, size = 14 }) {
  return <span className="sp-stars" role="img" aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map(n => <Star key={n} size={size} className={n <= rating ? 'on' : ''} aria-hidden="true" />)}
  </span>;
}

import React from 'react';

interface StarRatingProps {
  /** Current rating. Can be fractional (e.g. 4.5) in read-only display mode. */
  value: number;
  /** If provided, renders clickable stars and calls this with the picked whole number 1-5. */
  onChange?: (value: number) => void;
  size?: number;
}

// Renders a single star at a given fill percentage (0-100) using two stacked
// copies of the same outline ti-star glyph — a muted base star, and an
// accent-colored star clipped to `fillPercent` width on top. This achieves a
// partial/half-star fill without depending on ti-star-filled or
// ti-star-half-filled, which the Tabler webfont CDN build doesn't reliably
// serve (only the outline set ships in the plain webfont css).
const Star: React.FC<{ fillPercent: number; size: number }> = ({ fillPercent, size }) => (
  <span
    className="star-rating-star"
    style={{ fontSize: size, width: size, height: size }}
  >
    <i className="ti ti-star star-rating-icon star-rating-icon-base" aria-hidden="true"></i>
    <span className="star-rating-fill-clip" style={{ width: `${fillPercent}%` }}>
      <i className="ti ti-star star-rating-icon star-rating-icon-fill" aria-hidden="true"></i>
    </span>
  </span>
);

const StarRating: React.FC<StarRatingProps> = ({ value, onChange, size = 18 }) => {
  const interactive = Boolean(onChange);

  return (
    <div className="star-rating" role={interactive ? 'radiogroup' : undefined} aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => {
        const fillPercent = Math.max(0, Math.min(1, value - (n - 1))) * 100;

        if (!interactive) {
          return <Star key={n} fillPercent={fillPercent} size={size} />;
        }

        return (
          <button
            key={n}
            type="button"
            className="star-rating-btn"
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            aria-pressed={value >= n}
            onClick={() => onChange && onChange(n)}
          >
            <Star fillPercent={value >= n ? 100 : 0} size={size} />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;

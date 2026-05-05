import React from 'react';

type RatingStarsProps = {
  rating: number;
  max?: number;
  readOnly?: boolean;
  onChange?: (rating: number) => void;
  size?: number;
};

export default function RatingStars({
  rating,
  max = 5,
  readOnly = false,
  onChange,
  size = 24,
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = React.useState(0);

  const displayRating = hoverRating || rating;

  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => {
        const star = i + 1;
        const filled = displayRating >= star;

        if (readOnly) {
          return (
            <span
              key={star}
              className={`material-symbols-outlined ${filled ? 'text-amber-400' : 'text-slate-300'}`}
              style={{ fontSize: `${size}px`, ...(filled ? { fontVariationSettings: "'FILL' 1" } : {}) }}
            >
              star
            </span>
          );
        }

        return (
          <button
            key={star}
            type="button"
            className="p-0.5"
            onClick={() => onChange?.(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
          >
            <span
              className={`material-symbols-outlined ${filled ? 'text-amber-400' : 'text-slate-300'}`}
              style={{ fontSize: `${size}px`, ...(filled ? { fontVariationSettings: "'FILL' 1" } : {}) }}
            >
              star
            </span>
          </button>
        );
      })}
    </div>
  );
}

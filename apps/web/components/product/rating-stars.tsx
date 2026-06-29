import { Star } from "lucide-react";

interface RatingStarsProps {
  rating: number;
  count?: number;
  size?: number;
}

export function RatingStars({ rating, count, size = 16 }: RatingStarsProps) {
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex" aria-label={`${rating} de 5 estrellas`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            style={{ width: size, height: size }}
            className={i < rounded ? "fill-[#f59e0b] text-[#f59e0b]" : "text-border"}
          />
        ))}
      </div>
      {count !== undefined && <span className="text-sm text-muted">({count})</span>}
    </div>
  );
}

import { Star } from "lucide-react";

type RatingProps = {
  rating: number;
};

export function Rating({ rating }: RatingProps) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const fill = Math.min(Math.max(rating - i, 0), 1); // clamp between 0 and 1
    return (
      <div key={i} className="w-5 h-5 relative">
        <Star aria-hidden fill="currentColor" className="text-gray-300 absolute inset-0 w-full h-full" />
        <Star aria-hidden fill="currentColor"
          className="text-yellow-400 absolute inset-0 w-full h-full"
          style={{
            clipPath: `inset(0 ${100 - fill * 100}% 0 0)`, // left-to-right fill
          }}
        />
      </div>
    );
  });

  return (
    <div className="flex items-center gap-1">
      <div className="flex">{stars}</div>
      <span className="text-sm text-gray-600 dark:text-gray-400">{rating.toFixed(1)}/5</span>
    </div>
  );
}

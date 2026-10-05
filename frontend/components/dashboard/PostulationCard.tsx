interface PostulationCardProps {
  name: string;
  role: string;
  stars: number;
  onView?: () => void;
}

function StarRating({ stars }: { stars: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.floor(stars);
        const half = !filled && i - 0.5 === stars;
        return (
          <svg key={i} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              <linearGradient id={`half-${i}`}>
                <stop offset="50%" stopColor="#f97316" />
                <stop offset="50%" stopColor="#e5e7eb" />
              </linearGradient>
            </defs>
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={filled ? "#f97316" : half ? `url(#half-${i})` : "#e5e7eb"}
              stroke="#f97316"
              strokeWidth="1"
            />
          </svg>
        );
      })}
    </div>
  );
}

export default function PostulationCard({ name, role, stars, onView }: PostulationCardProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-orange-300 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {name[0]}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-800">{name}</p>
          <p className="text-[10px] text-gray-400">{role}</p>
        </div>
      </div>
      <StarRating stars={stars} />
      <button
        onClick={onView}
        className="w-full rounded-lg py-1.5 text-white text-xs font-semibold hover:opacity-90 transition mt-1"
        style={{ backgroundColor: "#2d6a4f" }}
      >
        Ver
      </button>
    </div>
  );
}

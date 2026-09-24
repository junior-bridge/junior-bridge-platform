export default function StarDisplay({ stars }: { stars: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    size={12}
                    fill={i <= stars ? "#f97316" : "none"}
                    stroke={i <= stars ? "#f97316" : "#d1d5db"}
                />
            ))}
        </div>
    );
}


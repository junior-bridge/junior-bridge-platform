import { ChevronRight } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  onDetailClick?: () => void;
}

export default function StatCard({ label, value, onDetailClick }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <p className="text-[10px] text-gray-400 font-semibold tracking-wide uppercase mb-2">
        {label}
      </p>
      <p className="text-3xl font-bold text-gray-800 mb-3">{value}</p>
      <button
        onClick={onDetailClick}
        className="text-xs text-[#2d6a4f] font-medium hover:underline flex items-center gap-1"
      >
        Ver Detalle <ChevronRight size={12} />
      </button>
    </div>
  );
}

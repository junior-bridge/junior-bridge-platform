interface ProjectItemProps {
  name: string;
  description: string;
  status: string;
  progress: number;
  statusColor: string;
}

export default function ProjectItem({
  name,
  description,
  status,
  progress,
  statusColor,
}: ProjectItemProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <span className="text-sm font-semibold text-gray-800">{name}</span>
          {description && (
            <span className="text-xs text-gray-400 ml-2">{description}</span>
          )}
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
          {status}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full transition-all"
            style={{ width: `${progress}%`, backgroundColor: "#2d6a4f" }}
          />
        </div>
        <span className="text-xs text-gray-400 w-8 text-right">{progress}%</span>
      </div>
    </div>
  );
}

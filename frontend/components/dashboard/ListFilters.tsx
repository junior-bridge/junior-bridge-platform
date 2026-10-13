import { CalendarDays, Search, X } from "lucide-react";

type ListFiltersProps = {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    dateFilter: string;
    onDateChange: (value: string) => void;
    placeholder: string;
};

export default function ListFilters({
    searchTerm,
    onSearchChange,
    dateFilter,
    onDateChange,
    placeholder,
}: ListFiltersProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 w-full sm:w-72 border border-gray-200">
                <Search size={15} className="text-gray-400 shrink-0" />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(event) => onSearchChange(event.target.value)}
                    className="bg-transparent text-sm outline-none w-full placeholder-gray-400"
                />
            </div>

            <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 w-full sm:w-auto border border-gray-200">
                <CalendarDays size={15} className="text-gray-400 shrink-0" />
                <input
                    type="date"
                    aria-label="Filtrar por fecha de creación"
                    value={dateFilter}
                    onChange={(event) => onDateChange(event.target.value)}
                    className="bg-transparent text-sm outline-none w-full text-gray-600"
                />
                {dateFilter && (
                    <button
                        type="button"
                        onClick={() => onDateChange("")}
                        aria-label="Limpiar filtro de fecha"
                        title="Limpiar fecha"
                        className="text-gray-400 hover:text-gray-600 transition"
                    >
                        <X size={15} />
                    </button>
                )}
            </div>
        </div>
    );
}

import { ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';

interface SortableColumnHeaderProps {
    label: string;
    sortKey: string;
    currentSortKey: string | null;
    direction: 'asc' | 'desc';
    onSort: (key: string) => void;
}

export function SortableColumnHeader({
    label,
    sortKey,
    currentSortKey,
    direction,
    onSort
}: SortableColumnHeaderProps) {
    const isActive = currentSortKey === sortKey;

    return (
        <div className="flex items-center gap-1">
            <span>{label}</span>
            <button
                onClick={() => onSort(sortKey)}
                className={`ml-1 transition-colors p-1 rounded-md hover:bg-gray-200/50 ${isActive ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'}`}
                aria-label={`Ordenar por ${label}`}
            >
                {!isActive && <ChevronsUpDown size={14} />}
                {isActive && direction === 'asc' && <ChevronUp size={14} />}
                {isActive && direction === 'desc' && <ChevronDown size={14} />}
            </button>
        </div>
    );
}

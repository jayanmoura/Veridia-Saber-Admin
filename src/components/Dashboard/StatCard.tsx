import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
    color?: string; // Hex or Tailwind class prefix if we change approach, sticking to hex prop passed or class
    className?: string; // Allow extra styling
    loading?: boolean;
    onClick?: () => void;
}

export function StatCard({ title, value, icon: Icon, color = "emerald", loading = false, onClick }: StatCardProps) {
    // Mapping color prop to tailwind classes (simplified)
    const colorClasses = {
        emerald: "bg-emerald-50 text-emerald-600",
        blue: "bg-blue-50 text-blue-600",
        purple: "bg-purple-50 text-purple-600",
        amber: "bg-amber-50 text-amber-600",
        orange: "bg-orange-50 text-orange-600",
    }[color] || "bg-emerald-50 text-emerald-600";

    return (
        <div
            onClick={onClick}
            className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between transition-all hover:shadow-md ${onClick ? 'cursor-pointer active:scale-95' : ''}`}
        >
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                {loading ? (
                    <div className="h-8 w-16 bg-gray-100 rounded animate-pulse"></div>
                ) : (
                    <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
                )}
            </div>
            <div className={`p-3 rounded-lg ${colorClasses}`}>
                <Icon size={24} />
            </div>
        </div>
    );
}

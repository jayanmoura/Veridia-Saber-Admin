import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

export function DashboardLayout() {
    const { profile } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />

            {/* Main Content Wrapper - Added margin-left to account for fixed sidebar */}
            <div className="flex-1 ml-64 flex flex-col min-h-screen transition-all duration-300">
                <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-40 flex items-center justify-between px-8 shadow-sm/50 backdrop-blur-sm bg-white/90">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 font-light">/</span>
                        <h2 className="text-sm font-medium text-gray-700">Visão Geral</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
                            <p className="text-xs text-gray-500 capitalize">{profile?.role?.replace('_', ' ')}</p>
                        </div>
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full border border-gray-200 object-cover ring-2 ring-gray-100" />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold ring-2 ring-emerald-50">
                                {profile?.full_name?.charAt(0) || 'U'}
                            </div>
                        )}
                    </div>
                </header>

                <main className="flex-1 p-8">
                    <div className="max-w-7xl mx-auto animate-fade-in-up">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

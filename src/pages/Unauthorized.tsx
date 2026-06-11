import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
    const navigate = useNavigate();

    return (
        <div className="min-h-[60vh] flex items-center justify-center px-6">
            <div className="max-w-md w-full bg-white border border-gray-100 rounded-xl shadow-sm p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                    <ShieldAlert size={32} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Acesso não autorizado</h1>
                <p className="mt-3 text-sm text-gray-500">
                    Você não tem permissão para acessar esta página.
                </p>
                <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="mt-6 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm"
                >
                    Voltar ao painel
                </button>
            </div>
        </div>
    );
}

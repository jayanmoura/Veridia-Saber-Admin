import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { X, Plus, Trash2, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BetaTester {
    id: string;
    email: string;
    added_at: string;
    downloaded_at?: string | null;
    is_active: boolean;
}

interface BetaTestersModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function BetaTestersModal({ isOpen, onClose }: BetaTestersModalProps) {
    const [testers, setTesters] = useState<BetaTester[]>([]);
    const [loading, setLoading] = useState(true);
    const [newEmail, setNewEmail] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchTesters();
        }
    }, [isOpen]);

    const fetchTesters = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('beta_testers')
                .select('*')
                .order('added_at', { ascending: false });

            if (error) throw error;
            setTesters(data || []);
        } catch (error) {
            console.error('Error fetching beta testers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail.trim()) return;

        setAdding(true);
        try {
            const { error } = await supabase
                .from('beta_testers')
                .insert([{ email: newEmail.trim().toLowerCase(), is_active: true }]);

            if (error) throw error;

            setNewEmail('');
            fetchTesters();
        } catch (error: any) {
            console.error('Error adding tester:', error);
            alert('Erro ao adicionar testador: ' + error.message);
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este testador?')) return;

        try {
            const { error } = await supabase
                .from('beta_testers')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setTesters(prev => prev.filter(t => t.id !== id));
        } catch (error: any) {
            console.error('Error deleting tester:', error);
            alert('Erro ao remover: ' + error.message);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Beta Testers</h2>
                            <p className="text-sm text-gray-500">Gerenciar acesso ao aplicativo Android</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Add New */}
                    <form onSubmit={handleAdd} className="flex gap-3">
                        <div className="flex-1 relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="Email do novo testador..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={adding || !newEmail}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {adding ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                            Adicionar
                        </button>
                    </form>

                    {/* List */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            Cadastrados ({testers.length})
                        </h3>

                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="animate-spin text-purple-600" size={24} />
                            </div>
                        ) : testers.length === 0 ? (
                            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-gray-500">Nenhum beta tester cadastrado.</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                                {testers.map(tester => (
                                    <div key={tester.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${tester.downloaded_at ? 'bg-green-500' : 'bg-amber-400'}`} title={tester.downloaded_at ? 'Download realizado' : 'Pendente'} />
                                            <div>
                                                <p className="font-medium text-gray-900">{tester.email}</p>
                                                <p className="text-xs text-gray-500 flex gap-2">
                                                    <span>Adicionado {formatDistanceToNow(new Date(tester.added_at), { addSuffix: true, locale: ptBR })}</span>
                                                    {tester.downloaded_at && (
                                                        <span className="text-emerald-600 font-medium">• Baixou o App</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(tester.id)}
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Remover acesso"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-between items-center text-xs text-gray-500 px-6">
                    <span>Emails são removidos após o download por segurança.</span>
                    <button onClick={onClose} className="text-gray-600 hover:text-gray-900 font-medium">
                        Fechar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

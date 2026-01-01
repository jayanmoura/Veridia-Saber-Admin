import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Shield,
    RefreshCw,
    Clock,
    User,
    Database
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLog {
    id: number;
    created_at: string;
    action_type: 'INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE';
    table_name: string;
    record_id: string;
    old_data: any; // JSON with previous data
    details: string | null;
    // user_id is now the expanded relation
    user_id: { full_name: string; email: string } | { full_name: string; email: string }[];
}

export default function AuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [restoring, setRestoring] = useState<number | null>(null);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        // Using 'user_id' to join with 'profiles' table
        const { data, error } = await supabase
            .from('audit_logs')
            .select(`
                *,
                user_id (
                    full_name,
                    email
                )
            `)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Error fetching audit logs:', error);
        } else {
            setLogs(data || []);
        }
        setLoading(false);
    };

    const handleRestore = async (log: AuditLog) => {
        if (!log.old_data) {
            alert('Não há dados antigos disponíveis para restauração.');
            return;
        }

        if (!confirm(`Deseja restaurar este registro em '${log.table_name}'?`)) return;

        setRestoring(log.id);
        try {
            // Attempt to insert old_data back into table_name
            const { error } = await supabase
                .from(log.table_name)
                .insert(log.old_data);

            if (error) throw error;

            alert('Registro restaurado com sucesso!');
            fetchLogs(); // Refresh logs to maybe show the restoration action
        } catch (err: any) {
            console.error('Restore Error:', err);
            // Handle common FK errors
            if (err.code === '23503') {
                alert('Erro: Impossível restaurar. O registro depende de outro dado que não existe mais (Chave Estrangeira).');
            } else if (err.code === '23505') {
                alert('Erro: Registro duplicado. Este ID já existe na tabela.');
            } else {
                alert(`Erro ao restaurar: ${err.message}`);
            }
        } finally {
            setRestoring(null);
        }
    };

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'INSERT':
                return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Criação</span>;
            case 'UPDATE':
                return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Edição</span>;
            case 'DELETE':
                return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Exclusão</span>;
            default:
                return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{action}</span>;
        }
    };

    const parseDetails = (details: string | null, oldData: any) => {
        if (!details && !oldData) return '-';
        // Try to show a meaningful name from old_data if possible
        if (oldData) {
            if (oldData.nome) return `Nome: ${oldData.nome}`;
            if (oldData.nome_cientifico) return `Espécie: ${oldData.nome_cientifico}`;
            if (oldData.familia_nome) return `Família: ${oldData.familia_nome}`;
            if (oldData.titulo) return `Título: ${oldData.titulo}`;
        }
        return details || '-';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 rounded-lg">
                    <Shield className="text-indigo-600" size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Auditoria e Segurança</h1>
                    <p className="text-gray-500">Histórico completo de alterações no sistema.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data/Hora</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuário</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ação</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tabela</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Detalhes</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 animate-pulse">Carregando logs...</td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Nenhum registro de auditoria encontrado.</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} />
                                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                                            </div>
                                            <span className="text-xs text-gray-400 block mt-0.5">
                                                {new Date(log.created_at).toLocaleString('pt-BR')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                                    {(Array.isArray(log.user_id) ? log.user_id[0]?.full_name : log.user_id?.full_name)?.charAt(0) || <User size={12} />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {(Array.isArray(log.user_id) ? log.user_id[0]?.full_name : log.user_id?.full_name) || 'Desconhecido'}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {(Array.isArray(log.user_id) ? log.user_id[0]?.email : log.user_id?.email)}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getActionBadge(log.action_type)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1.5">
                                                <Database size={14} className="text-gray-400" />
                                                <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                                    {log.table_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate" title={JSON.stringify(log.old_data || {}, null, 2)}>
                                            {parseDetails(log.details, log.old_data)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {log.action_type === 'DELETE' && log.old_data && (
                                                <button
                                                    onClick={() => handleRestore(log)}
                                                    disabled={restoring === log.id}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors disabled:opacity-50"
                                                >
                                                    {restoring === log.id ? (
                                                        <RefreshCw size={12} className="animate-spin" />
                                                    ) : (
                                                        <RefreshCw size={12} />
                                                    )}
                                                    Restaurar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

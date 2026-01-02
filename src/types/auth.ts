export type UserRole =
    | 'Curador Mestre'
    | 'Coordenador Científico'
    | 'Gestor de Acervo'
    | 'Taxonomista Sênior'
    | 'Taxonomista de Campo'
    | 'Consulente';

export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    institution_id: string | null;
    local_id: number | null;
    avatar_url: string | null;
}

export interface RoleConfig {
    level: number;
    label: string;
    color: string;
    bgColor: string;
    isGlobal: boolean;
}

// TAREFA 1: Configuração de Pesos e Cores
// Níveis: 1 (maior autoridade) a 6 (menor autoridade)
export const ROLES_CONFIG: Record<UserRole, RoleConfig> = {
    'Curador Mestre': {
        level: 1,
        label: 'Curador Mestre',
        color: '#311B92',
        bgColor: '#EDE7F6',
        isGlobal: true,
    },
    'Coordenador Científico': {
        level: 2,
        label: 'Coordenador Científico',
        color: '#E65100',
        bgColor: '#FFF3E0',
        isGlobal: true,
    },
    'Taxonomista Sênior': {
        level: 3,
        label: 'Taxonomista Sênior',
        color: '#01579B',
        bgColor: '#E1F5FE',
        isGlobal: true,
    },
    'Gestor de Acervo': {
        level: 4,
        label: 'Gestor de Acervo',
        color: '#7B1FA2',
        bgColor: '#F3E5F5',
        isGlobal: false,
    },
    'Taxonomista de Campo': {
        level: 5,
        label: 'Taxonomista de Campo',
        color: '#1976D2',
        bgColor: '#E3F2FD',
        isGlobal: false,
    },
    'Consulente': {
        level: 6,
        label: 'Consulente',
        color: '#616161',
        bgColor: '#F5F5F5',
        isGlobal: false,
    },
};

// Helper: Obter o nível numérico de um cargo (1 = maior, 6 = menor)
export const getRoleLevel = (role?: UserRole | null): number => {
    if (!role) return 6; // Sem cargo = menor nível
    return ROLES_CONFIG[role]?.level ?? 6;
};

// TAREFA 3: Lógica de Promoção/Rebaixamento
// Retorna true se o usuário logado pode gerenciar o usuário alvo
// Regra: Nível do Logado deve ser MENOR que o Nível do Alvo
export const canManage = (myRole?: UserRole | null, targetRole?: UserRole | null): boolean => {
    const myLevel = getRoleLevel(myRole);
    const targetLevel = getRoleLevel(targetRole);
    return myLevel < targetLevel;
};

// Helper: Verifica se o cargo tem pelo menos o nível mínimo exigido
// Exemplo: hasMinLevel('Gestor de Acervo', 4) = true (4 <= 4)
export const hasMinLevel = (role?: UserRole | null, minLevel: number = 6): boolean => {
    return getRoleLevel(role) <= minLevel;
};

// Helper: Obter configuração completa de um cargo
export const getRoleConfig = (role?: UserRole | null): RoleConfig => {
    if (!role) return ROLES_CONFIG['Consulente'];
    return ROLES_CONFIG[role] ?? ROLES_CONFIG['Consulente'];
};

// Lista ordenada de cargos para seleção
export const ROLES_LIST = Object.entries(ROLES_CONFIG)
    .sort((a, b) => a[1].level - b[1].level)
    .map(([value, config]) => ({
        value: value as UserRole,
        label: config.label,
        level: config.level,
    }));

// Deprecated: Mantido para compatibilidade temporária
export interface RoleDisplayInfo {
    label: string;
    color: string;
    bgColor: string;
    isGlobal: boolean;
}

export const getRoleDisplayInfo = (role: UserRole): RoleDisplayInfo => {
    const config = ROLES_CONFIG[role] ?? ROLES_CONFIG['Consulente'];
    return {
        label: config.label,
        color: config.color,
        bgColor: config.bgColor,
        isGlobal: config.isGlobal,
    };
};

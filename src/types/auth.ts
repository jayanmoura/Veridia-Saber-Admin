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

export interface RoleDisplayInfo {
    label: string;
    color: string;
    bgColor: string;
    isGlobal: boolean;
}

// Helper to get display info (colors) based on the role string
export const getRoleDisplayInfo = (role: UserRole): RoleDisplayInfo => {
    switch (role) {
        case 'Curador Mestre':
            return { label: 'Curador Mestre', color: '#311B92', bgColor: '#EDE7F6', isGlobal: true };
        case 'Coordenador Científico':
            return { label: 'Coordenador Científico', color: '#E65100', bgColor: '#FFF3E0', isGlobal: true };
        case 'Gestor de Acervo':
            return { label: 'Gestor de Acervo', color: '#7B1FA2', bgColor: '#F3E5F5', isGlobal: false };
        case 'Taxonomista Sênior':
            return { label: 'Taxonomista Sênior', color: '#01579B', bgColor: '#E1F5FE', isGlobal: true };
        case 'Taxonomista de Campo':
            return { label: 'Taxonomista de Campo', color: '#1976D2', bgColor: '#E3F2FD', isGlobal: false };
        case 'Consulente':
        default:
            return { label: 'Consulente', color: '#616161', bgColor: '#F5F5F5', isGlobal: false };
    }
};

import { describe, it, expect } from 'vitest';
import {
  getRoleLevel,
  canManage,
  hasMinLevel,
  getRoleConfig,
  ROLES_LIST,
} from '../../types/auth';

// ---------------------------------------------------------------------------
// getRoleLevel
// ---------------------------------------------------------------------------
describe('getRoleLevel', () => {
  it('retorna 1 para Curador Mestre', () => {
    expect(getRoleLevel('Curador Mestre')).toBe(1);
  });

  it('retorna 2 para Coordenador Científico', () => {
    expect(getRoleLevel('Coordenador Científico')).toBe(2);
  });

  it('retorna 3 para Taxonomista Sênior', () => {
    expect(getRoleLevel('Taxonomista Sênior')).toBe(3);
  });

  it('retorna 4 para Gestor de Acervo', () => {
    expect(getRoleLevel('Gestor de Acervo')).toBe(4);
  });

  it('retorna 5 para Taxonomista de Campo', () => {
    expect(getRoleLevel('Taxonomista de Campo')).toBe(5);
  });

  it('retorna 6 para Consulente', () => {
    expect(getRoleLevel('Consulente')).toBe(6);
  });

  it('retorna 6 para null (fallback de menor nivel)', () => {
    expect(getRoleLevel(null)).toBe(6);
  });

  it('retorna 6 para undefined (fallback de menor nivel)', () => {
    expect(getRoleLevel(undefined)).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// canManage
// ---------------------------------------------------------------------------
describe('canManage', () => {
  it('Curador Mestre gerencia Coordenador Científico (1 < 2)', () => {
    expect(canManage('Curador Mestre', 'Coordenador Científico')).toBe(true);
  });

  it('Curador Mestre gerencia Consulente (1 < 6)', () => {
    expect(canManage('Curador Mestre', 'Consulente')).toBe(true);
  });

  it('Gestor de Acervo gerencia Taxonomista de Campo (4 < 5)', () => {
    expect(canManage('Gestor de Acervo', 'Taxonomista de Campo')).toBe(true);
  });

  it('Gestor de Acervo NÃO gerencia Taxonomista Sênior (4 não é < 3)', () => {
    expect(canManage('Gestor de Acervo', 'Taxonomista Sênior')).toBe(false);
  });

  it('Consulente NÃO gerencia outro Consulente (mesmo nível: 6 não é < 6)', () => {
    expect(canManage('Consulente', 'Consulente')).toBe(false);
  });

  it('Taxonomista de Campo NÃO gerencia Curador Mestre (5 não é < 1)', () => {
    expect(canManage('Taxonomista de Campo', 'Curador Mestre')).toBe(false);
  });

  it('null NÃO gerencia Consulente (nível 6 não é < 6)', () => {
    expect(canManage(null, 'Consulente')).toBe(false);
  });

  it('Curador Mestre gerencia usuário sem role (1 < 6 do fallback)', () => {
    expect(canManage('Curador Mestre', null)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// hasMinLevel
// ---------------------------------------------------------------------------
describe('hasMinLevel', () => {
  it('Curador Mestre (nível 1) passa no minLevel 4 (1 ≤ 4)', () => {
    expect(hasMinLevel('Curador Mestre', 4)).toBe(true);
  });

  it('Taxonomista Sênior (nível 3) passa no minLevel 4 (3 ≤ 4)', () => {
    expect(hasMinLevel('Taxonomista Sênior', 4)).toBe(true);
  });

  it('Gestor de Acervo (nível 4) passa no minLevel 4 — limite exato (4 ≤ 4)', () => {
    expect(hasMinLevel('Gestor de Acervo', 4)).toBe(true);
  });

  it('Taxonomista de Campo (nível 5) NÃO passa no minLevel 4 (5 > 4)', () => {
    expect(hasMinLevel('Taxonomista de Campo', 4)).toBe(false);
  });

  it('Consulente (nível 6) NÃO passa no minLevel 4 (6 > 4)', () => {
    expect(hasMinLevel('Consulente', 4)).toBe(false);
  });

  it('null NÃO passa no minLevel 4 (fallback nível 6 > 4)', () => {
    expect(hasMinLevel(null, 4)).toBe(false);
  });

  it('regra de acesso à página Users: Taxonomista Sênior é bloqueado mesmo passando no hasMinLevel', () => {
    const role = 'Taxonomista Sênior';
    const passesMinLevel = hasMinLevel(role, 4);       // true (nível 3 ≤ 4)
    const blockedByLevelRule = getRoleLevel(role) === 3; // true — nível 3 é excluído

    // hasMinLevel retorna true, mas a regra composta exclui nível 3 e 5
    const canAccessUsersPage =
      passesMinLevel &&
      getRoleLevel(role) !== 3 &&
      getRoleLevel(role) !== 5;

    expect(passesMinLevel).toBe(true);
    expect(blockedByLevelRule).toBe(true);
    expect(canAccessUsersPage).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getRoleConfig
// ---------------------------------------------------------------------------
describe('getRoleConfig', () => {
  it('retorna config com level 1 e isGlobal true para Curador Mestre', () => {
    const config = getRoleConfig('Curador Mestre');
    expect(config.level).toBe(1);
    expect(config.isGlobal).toBe(true);
  });

  it('retorna config de Consulente como fallback para null', () => {
    const config = getRoleConfig(null);
    expect(config.level).toBe(6);
    expect(config.label).toBe('Consulente');
  });

  it('retorna config de Consulente como fallback para undefined', () => {
    const config = getRoleConfig(undefined);
    expect(config.level).toBe(6);
    expect(config.label).toBe('Consulente');
  });
});

// ---------------------------------------------------------------------------
// ROLES_LIST
// ---------------------------------------------------------------------------
describe('ROLES_LIST', () => {
  it('tem exatamente 6 itens', () => {
    expect(ROLES_LIST).toHaveLength(6);
  });

  it('está ordenado por level crescente (primeiro level 1, último level 6)', () => {
    expect(ROLES_LIST[0].level).toBe(1);
    expect(ROLES_LIST[ROLES_LIST.length - 1].level).toBe(6);
  });

  it('é estritamente crescente em cada posição', () => {
    for (let i = 1; i < ROLES_LIST.length; i++) {
      expect(ROLES_LIST[i].level).toBeGreaterThan(ROLES_LIST[i - 1].level);
    }
  });

  it('cada item possui as propriedades value, label e level', () => {
    for (const item of ROLES_LIST) {
      expect(item).toHaveProperty('value');
      expect(item).toHaveProperty('label');
      expect(item).toHaveProperty('level');
    }
  });
});

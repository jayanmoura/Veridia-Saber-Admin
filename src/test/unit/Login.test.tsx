import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock do InstallPWA antes de qualquer import do componente
vi.mock('../../components/InstallPWA', () => ({
  InstallPWA: () => null,
}));

// Mock do supabase — padrão compartilhado com os outros testes
vi.mock('../../lib/supabase');
import '../mocks/supabase'; // registra o mockSupabase como implementação do módulo
import { supabase } from '../../lib/supabase';

// Mock do react-router-dom (preserva o restante, sobrescreve useNavigate)
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Componente testado — importado APÓS os mocks
import Login from '../../pages/admin/Login';

// ============================================================
// HELPERS
// ============================================================

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

/**
 * Preenche os campos com email/senha e clica em "Acessar Painel".
 * O placeholder da senha no componente é "Sua senha".
 */
const submitForm = (email = 'user@test.com', password = 'senha123') => {
  fireEvent.change(screen.getByPlaceholderText('seu@email.com'), {
    target: { value: email },
  });
  fireEvent.change(screen.getByPlaceholderText(/sua senha/i), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole('button', { name: /acessar painel/i }));
};

// ============================================================
// SETUP
// ============================================================

beforeEach(() => {
  vi.clearAllMocks();
  mockNavigate.mockClear();

  // Default: invoke retorna erro de rede (sobrescrito por grupo)
  (supabase.functions.invoke as Mock).mockResolvedValue({
    data: null,
    error: { message: 'network error' },
  });

  // setSession default: sucesso
  (supabase.auth.setSession as Mock).mockResolvedValue({ error: null });

  // signInWithOAuth default: sem erro
  (supabase.auth.signInWithOAuth as Mock).mockResolvedValue({ error: null });

  // onAuthStateChange: dispara SIGNED_IN imediatamente via setTimeout
  (supabase.auth.onAuthStateChange as Mock).mockImplementation((callback: unknown) => {
    const cb = callback as (event: string, session: unknown) => void;
    setTimeout(() => cb('SIGNED_IN', {}), 0);
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });
});

// ============================================================
// GRUPO 1 — Renderização
// ============================================================

describe('Login — Renderização', () => {

  it('renderiza o formulário com campos de email e senha', () => {
    renderLogin();

    expect(screen.getByPlaceholderText('seu@email.com')).toBeTruthy();
    expect(screen.getByPlaceholderText(/sua senha/i)).toBeTruthy();
    expect(screen.getByText('Veridia Saber')).toBeTruthy();
  });

  it('renderiza o botão de submit "Acessar Painel"', () => {
    renderLogin();

    const btn = screen.getByRole('button', { name: /acessar painel/i });
    expect(btn).toBeTruthy();
    expect((btn as HTMLButtonElement).type).toBe('submit');
  });

  it('não exibe mensagem de erro por padrão', () => {
    renderLogin();

    expect(screen.queryByText('E-mail ou senha incorretos.')).toBeNull();
    expect(screen.queryByText(/ocorreu um erro/i)).toBeNull();
  });
});

// ============================================================
// GRUPO 2 — Login com sucesso
// ============================================================

describe('Login — Sucesso (credenciais válidas)', () => {

  const mockSession = { access_token: 'tok123', refresh_token: 'ref123' };

  beforeEach(() => {
    (supabase.functions.invoke as Mock).mockResolvedValue({
      data: { data: { session: mockSession } },
      error: null,
    });
  });

  it('chama setSession com a sessão retornada pela Edge Function', async () => {
    renderLogin();
    submitForm();

    await waitFor(() => {
      expect(supabase.auth.setSession).toHaveBeenCalledWith(mockSession);
    });
  });

  it('navega para "/" após receber evento SIGNED_IN', async () => {
    renderLogin();
    submitForm();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('botão exibe "Entrando..." durante o processo de login', async () => {
    // Faz o invoke demorar um tick para capturar o estado de loading
    (supabase.functions.invoke as Mock).mockImplementation(
      () => new Promise(resolve =>
        setTimeout(() => resolve({ data: { data: { session: mockSession } }, error: null }), 50)
      )
    );

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/sua senha/i), { target: { value: 'senha123' } });
    fireEvent.click(screen.getByRole('button', { name: /acessar painel/i }));

    // Imediatamente após o click, o botão deve mostrar "Entrando..."
    expect(screen.getByRole('button', { name: /entrando/i })).toBeTruthy();

    // Aguarda o processo terminar
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});

// ============================================================
// GRUPO 3 — Credenciais inválidas
// ============================================================

describe('Login — Credenciais inválidas', () => {

  it('data.error "Invalid login credentials" → exibe "E-mail ou senha incorretos."', async () => {
    (supabase.functions.invoke as Mock).mockResolvedValue({
      data: { error: 'Invalid login credentials' },
      error: null,
    });

    renderLogin();
    submitForm();

    await waitFor(() => {
      expect(screen.getByText('E-mail ou senha incorretos.')).toBeTruthy();
    });
  });

  it('data.error com "Invalid login" em qualquer formato → exibe msg pt-BR', async () => {
    (supabase.functions.invoke as Mock).mockResolvedValue({
      data: { error: 'Invalid login credentials for email/password' },
      error: null,
    });

    renderLogin();
    submitForm();

    await waitFor(() => {
      expect(screen.getByText('E-mail ou senha incorretos.')).toBeTruthy();
    });
  });

  it('não navega após erro de credenciais', async () => {
    (supabase.functions.invoke as Mock).mockResolvedValue({
      data: { error: 'Invalid login credentials' },
      error: null,
    });

    renderLogin();
    submitForm();

    await waitFor(() => {
      expect(screen.getByText('E-mail ou senha incorretos.')).toBeTruthy();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

// ============================================================
// GRUPO 4 — Erro de rede
// ============================================================

describe('Login — Erro de rede', () => {

  beforeEach(() => {
    (supabase.functions.invoke as Mock).mockResolvedValue({
      data: null,
      error: { message: 'Failed to fetch' },
    });
  });

  it('functionError (rede) → exibe mensagem genérica ao usuário', async () => {
    renderLogin();
    submitForm();

    await waitFor(() => {
      expect(
        screen.getByText('Ocorreu um erro ao fazer login. Tente novamente.')
      ).toBeTruthy();
    });
  });

  it('não exibe mensagem técnica/stack trace ao usuário', async () => {
    renderLogin();
    submitForm();

    await waitFor(() => {
      expect(screen.queryByText(/Failed to fetch/i)).toBeNull();
      expect(screen.queryByText(/stack/i)).toBeNull();
    });
  });

  it('não navega após erro de rede', async () => {
    renderLogin();
    submitForm();

    await waitFor(() => {
      expect(
        screen.getByText('Ocorreu um erro ao fazer login. Tente novamente.')
      ).toBeTruthy();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

// ============================================================
// GRUPO 5 — Estado de loading
// ============================================================

describe('Login — Estado de loading', () => {

  it('loading: true durante o invoke → botão mostra "Entrando..."', async () => {
    // Invoke que demora para resolver
    (supabase.functions.invoke as Mock).mockImplementation(
      () => new Promise(resolve =>
        setTimeout(() => resolve({ data: null, error: { message: 'err' } }), 100)
      )
    );

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'u@t.com' } });
    fireEvent.change(screen.getByPlaceholderText(/sua senha/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /acessar painel/i }));

    expect(screen.getByRole('button', { name: /entrando/i })).toBeTruthy();

    // Aguarda resolver
    await waitFor(() => {
      expect(screen.getByText('Ocorreu um erro ao fazer login. Tente novamente.')).toBeTruthy();
    });
  });

  it('loading: false após resposta → botão volta para "Acessar Painel"', async () => {
    (supabase.functions.invoke as Mock).mockResolvedValue({
      data: { error: 'Invalid login credentials' },
      error: null,
    });

    renderLogin();
    submitForm();

    // Aguarda o processamento completar
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /acessar painel/i })).toBeTruthy();
    });

    // Garante que o botão voltou ao estado normal (sem loading)
    const btn = screen.getByRole('button', { name: /acessar painel/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });
});

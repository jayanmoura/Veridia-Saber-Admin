import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVersionCheck } from '../../hooks/useVersionCheck';

describe('useVersionCheck', () => {
  const originalEnvDev = import.meta.env.DEV;

  beforeEach(() => {
    vi.restoreAllMocks();
    (import.meta.env as { DEV: boolean }).DEV = false;
  });

  afterEach(() => {
    (import.meta.env as { DEV: boolean }).DEV = originalEnvDev;
  });

  it('inicializa com updateAvailable como false', async () => {
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0' }),
      } as Response)
    );

    let hookResult: { current: ReturnType<typeof useVersionCheck> };
    await act(async () => {
      const rendered = renderHook(() => useVersionCheck());
      hookResult = rendered.result;
    });

    expect(hookResult!.current.updateAvailable).toBe(false);
  });


  it('marca updateAvailable como true quando a versao remota for diferente', async () => {
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ version: 'versao-nova-999' }),
      } as Response)
    );

    const { result } = renderHook(() => useVersionCheck());

    await act(async () => {
      await result.current.checkVersion();
    });

    expect(result.current.updateAvailable).toBe(true);
    expect(result.current.latestVersion).toBe('versao-nova-999');
  });

  it('ignora erros de conexao em silencio sem disparar excecao', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Falha de rede simulada'));

    const { result } = renderHook(() => useVersionCheck());

    await act(async () => {
      await result.current.checkVersion();
    });

    expect(result.current.updateAvailable).toBe(false);
  });
});

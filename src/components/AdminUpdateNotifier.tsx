import { useEffect, useRef } from 'react';
import { useToast } from '../hooks/useToast';
import { useVersionCheck } from '../hooks/useVersionCheck';

export function AdminUpdateNotifier() {
  const { updateAvailable } = useVersionCheck();
  const { showToast } = useToast();
  const hasNotifiedRef = useRef<boolean>(false);

  useEffect(() => {
    if (updateAvailable && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true;
      showToast('Nova versão disponível', 'info', Infinity, {
        label: 'Atualizar',
        onClick: () => {
          window.location.reload();
        },
      });
    }
  }, [updateAvailable, showToast]);

  return null;
}

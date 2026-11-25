'use client';

import { useEffect } from 'react';

export default function AccountSwitchListener() {
  useEffect(() => {
    // Earlier versions kept locally registered accounts and their passwords here.
    try {
      window.localStorage.removeItem('registered_accounts');
    } catch {
      // Storage may be disabled in this browser.
    }
    const refresh = (event: StorageEvent) => {
      if (event.key === 'library_account_change') window.location.reload();
    };
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);
  return null;
}

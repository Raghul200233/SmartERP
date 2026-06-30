import React, { useEffect } from 'react';
import { AppRoutes } from './AppRoutes';
import { useMainStore } from './store/mainStore';
import { useCompanyStore } from './store/companyStore';
import { useDataSync } from './hooks/useDataSync';

function App() {
  const { currentCompany } = useCompanyStore();
  const { clearLastCreated } = useMainStore();
  const { refreshAll } = useDataSync(currentCompany?.id);

  // Auto-refresh when company changes
  useEffect(() => {
    if (currentCompany) {
      refreshAll();
    }
  }, [currentCompany]);

  // Clear last created items periodically
  useEffect(() => {
    const interval = setInterval(() => {
      clearLastCreated();
    }, 30000); // Clear after 30 seconds

    return () => clearInterval(interval);
  }, []);

  return <AppRoutes />;
}

export default App;
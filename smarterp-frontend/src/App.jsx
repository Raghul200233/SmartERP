import React from 'react';
import { AppRoutes } from './AppRoutes';
import { useUIStore } from './store/uiStore';
import { KeyboardShortcutsHelp } from './components/shared/KeyboardShortcutsHelp';

function App() {
  const { isDarkMode } = useUIStore();

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <>
      <AppRoutes />
      <KeyboardShortcutsHelp />
    </>
  );
}

export default App;
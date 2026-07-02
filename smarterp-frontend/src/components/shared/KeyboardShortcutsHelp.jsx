import React, { useState } from 'react';
import { Keyboard } from 'lucide-react';

export const KeyboardShortcutsHelp = () => {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { keys: 'F1', description: 'Company Selection' },
    { keys: 'F3', description: 'Company Information' },
    { keys: 'F4', description: 'Calculator' },
    { keys: 'F5', description: 'Refresh' },
    { keys: 'ESC', description: 'Previous Screen' },
    { keys: 'Ctrl+Q', description: 'Logout' },
    { keys: 'Ctrl+H', description: 'Home' },
    { keys: 'Ctrl+K', description: 'Command Search' },
    { keys: 'Alt+L', description: 'Create Ledger' },
    { keys: 'Alt+G', description: 'Create Group' },
    { keys: 'Alt+S', description: 'Create Stock Item' },
    { keys: 'Alt+U', description: 'Create Unit' },
    { keys: 'F8', description: 'Sales Voucher' },
    { keys: 'F9', description: 'Purchase Voucher' },
    { keys: 'Ctrl+F', description: 'Search' },
    { keys: 'Ctrl+Shift+F', description: 'Global Search' },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors z-50"
        title="Keyboard Shortcuts"
      >
        <Keyboard className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg"
                >
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {shortcut.description}
                  </span>
                  <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-400">
              Press the shortcut keys to quickly navigate and perform actions
            </div>
          </div>
        </div>
      )}
    </>
  );
};
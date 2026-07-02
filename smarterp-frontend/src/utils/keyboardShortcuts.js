class KeyboardShortcutManager {
  constructor() {
    this.shortcuts = {};
    this.context = 'global';
    this.isInputFocused = false;
  }

  register(keys, callback, context = 'global') {
    const key = `${context}:${keys}`;
    this.shortcuts[key] = callback;
  }

  unregister(keys, context = 'global') {
    const key = `${context}:${keys}`;
    delete this.shortcuts[key];
  }

  setContext(context) {
    this.context = context;
  }

  isInputElement(target) {
    return target.tagName === 'INPUT' || 
           target.tagName === 'TEXTAREA' || 
           target.tagName === 'SELECT' ||
           target.isContentEditable;
  }

  handleKeyDown(event) {
    const target = event.target;
    
      // Allow arrow keys in inputs for text navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        return; // Let the input handle it
      }

      if (this.isInputElement(target) && event.key.length === 1) {
      return;
    }

    const keys = this.getKeyCombination(event);
    
    // Check global shortcuts first
    const globalKey = `global:${keys}`;
    if (this.shortcuts[globalKey]) {
      event.preventDefault();
      this.shortcuts[globalKey]();
      return;
    }

    // Check context-specific shortcuts
    const contextKey = `${this.context}:${keys}`;
    if (this.shortcuts[contextKey]) {
      event.preventDefault();
      this.shortcuts[contextKey]();
      return;
    }
  }

  getKeyCombination(event) {
    const keys = [];
    if (event.ctrlKey) keys.push('Ctrl');
    if (event.shiftKey) keys.push('Shift');
    if (event.altKey) keys.push('Alt');
    if (event.metaKey) keys.push('Meta');
    
    // ✅ Handle arrow keys properly
    let key = event.key;
    if (key === ' ') key = 'Space';
    else if (key === 'ArrowUp') key = 'ArrowUp';
    else if (key === 'ArrowDown') key = 'ArrowDown';
    else if (key === 'ArrowLeft') key = 'ArrowLeft';
    else if (key === 'ArrowRight') key = 'ArrowRight';
    
    keys.push(key);
    return keys.join('+');
  }
}

export const shortcutManager = new KeyboardShortcutManager();
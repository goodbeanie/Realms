import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// React 19: Clear pre-existing content and add a flag to prevent double-init in ESM
if (!rootElement.getAttribute('data-react-initialized')) {
  rootElement.innerHTML = '';
  rootElement.setAttribute('data-react-initialized', 'true');
  const root = createRoot(rootElement);
  root.render(<App />);
}

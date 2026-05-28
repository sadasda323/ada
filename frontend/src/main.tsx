import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { bootstrapTheme } from './stores/theme.store';
import './styles/index.css';

bootstrapTheme();

const renderApp = () => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
};

if (import.meta.env.VITE_DEV_NOAUTH === '1') {
  import('./lib/mockApi').then(({ installMockApi }) => {
    installMockApi();
    renderApp();
  });
} else {
  renderApp();
}

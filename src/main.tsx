import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './styles.css';

registerSW({ immediate: true });

// Sin StrictMode: el doble montaje crearía dos conexiones PeerJS con el mismo código
createRoot(document.getElementById('root')!).render(<App />);

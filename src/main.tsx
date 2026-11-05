import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import '@fontsource/silkscreen/400.css';
import '@fontsource/silkscreen/700.css';
import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/700.css';
import './styles.css';

registerSW({ immediate: true });

// Sin StrictMode: el doble montaje crearía dos conexiones PeerJS con el mismo código
createRoot(document.getElementById('root')!).render(<App />);

import '../css/app.css';
import React from 'react';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';

createInertiaApp({
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.tsx');
        const importFn = pages[`./Pages/${name}.tsx`];
        if (!importFn) {
            console.error(`Page ${name} not found`);
            return Promise.resolve({ default: () => React.createElement('div', null, `Halaman ${name} tidak ditemukan.`) });
        }
        return importFn();
    },
    setup({ el, App, props }) {
        createRoot(el).render(React.createElement(App, props));
    },
});
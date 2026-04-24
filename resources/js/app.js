import '../css/app.css';
import React from 'react';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';

createInertiaApp({
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.tsx', { eager: true });
        const page = pages[`./Pages/${name}.tsx`];

        if (!page) {
            console.error(`Page ${name} not found`);
            return { default: () => null };
        }

        return page;
    },
    setup({ el, App, props }) {
        createRoot(el).render(React.createElement(App, props));
    },
});
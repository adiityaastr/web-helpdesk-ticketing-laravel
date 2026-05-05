import '../css/app.css';
import React from 'react';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import type { Page } from '@inertiajs/core';

createInertiaApp({
    resolve: (name: string): Promise<{ default: React.ComponentType }> => {
        const pages = import.meta.glob<Page>('./Pages/**/*.tsx');
        const importFn = pages[`./Pages/${name}.tsx`];
        if (!importFn) {
            console.error(`Page ${name} not found`);
            return Promise.resolve({ default: () => React.createElement('div', null, `Halaman ${name} tidak ditemukan.`) });
        }
        return importFn();
    },
    setup({ el, App, props }): void {
        createRoot(el).render(React.createElement(App, props));
    },
});
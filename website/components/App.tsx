import React from 'react';
import { NextUIProvider } from '@nextui-org/react';
import { Router } from './Router';

/**
 * Create the web app housing, with all necessary providers.
 * @returns An HTML element containing the entire web app
 */
export default function App() {
    return (
        // Provide functionality for NextUI components and serve the site
        // router
        <NextUIProvider>
            <Router />
        </NextUIProvider>
    );
};
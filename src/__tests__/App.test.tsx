import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { ThemeProvider } from '../contexts/ThemeContext';

describe('App Component', () => {
    it('renders without crashing', () => {
        render(
            <MemoryRouter>
                <ThemeProvider>
                    <App />
                </ThemeProvider>
            </MemoryRouter>
        );
        // You can add more specific assertions based on your App's content
        // For example, checking for a navbar or initial page content
        expect(document.body).toBeInTheDocument();
    });
});

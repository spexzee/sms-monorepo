// apps/web-ui/src/pages/SchoolAdmin/Fees/Categories/__tests__/Categories.test.tsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FeeCategories from '../index';
import useApi from '../../../../../queries/useApi';

// Mock TokenService
vi.mock('../../../../../queries/token/tokenService', () => ({
    default: {
        getSchoolId: () => 'school-123',
        getUser: () => ({ firstName: 'Admin', lastName: 'User' })
    }
}));

// Mock useApi
vi.mock('../../../../../queries/useApi', () => ({
    default: vi.fn()
}));

const mockCategories = [
    {
        feeCategoryId: 'cat-1',
        schoolId: 'school-123',
        name: 'Tuition Fee Class 6',
        categoryType: 'tuition',
        isRecurring: true,
        isMandatory: true,
        isActive: true,
        description: 'Monthly tuition charge'
    },
    {
        feeCategoryId: 'cat-2',
        schoolId: 'school-123',
        name: 'Admission Registration',
        categoryType: 'admission',
        isRecurring: false,
        isMandatory: true,
        isActive: false,
        description: 'One-time registration fee'
    }
];

describe('FeeCategories Page Component', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });
        vi.clearAllMocks();
        // Mock get categories API response
        (useApi as any).mockResolvedValue({
            data: mockCategories,
            message: 'Success'
        });
    });

    const renderWithProviders = (ui: React.ReactElement) => {
        return render(
            <QueryClientProvider client={queryClient}>
                {ui}
            </QueryClientProvider>
        );
    };

    it('renders the header title and description text', async () => {
        renderWithProviders(<FeeCategories />);
        expect(screen.getByText('Fee Categories')).toBeInTheDocument();
        expect(screen.getByText(/Configure school fee ledger items/i)).toBeInTheDocument();
    });

    it('renders the list of category templates from mocked query hook data', async () => {
        renderWithProviders(<FeeCategories />);
        expect(await screen.findByText('Tuition Fee Class 6')).toBeInTheDocument();
        expect(screen.getByText('Admission Registration')).toBeInTheDocument();
        expect(screen.getByText('ACTIVE')).toBeInTheDocument();
        expect(screen.getByText('INACTIVE')).toBeInTheDocument();
    });

    it('opens the Create Category dialog when clicking the create button', async () => {
        renderWithProviders(<FeeCategories />);
        const createBtn = screen.getByRole('button', { name: /create category/i });
        await userEvent.click(createBtn);

        // Dialogue title should be visible
        expect(screen.getByRole('heading', { name: 'Create Category' })).toBeInTheDocument();
    });
});

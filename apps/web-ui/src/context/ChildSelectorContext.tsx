import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { useGetMyChildren } from '../queries/ParentPortal';
import { useAuth } from './AuthContext';
import type { Student } from '../types';

interface ChildSelectorContextType {
    selectedChild: (Student & { className?: string; sectionName?: string }) | null;
    setSelectedChild: (child: Student & { className?: string; sectionName?: string }) => void;
    children: (Student & { className?: string; sectionName?: string })[];
    isLoading: boolean;
    error: Error | null;
}

const ChildSelectorContext = createContext<ChildSelectorContextType | undefined>(undefined);

const STORAGE_KEY = 'sms_selected_child';

interface ChildSelectorProviderProps {
    children: ReactNode;
}

export const ChildSelectorProvider: React.FC<ChildSelectorProviderProps> = ({ children }) => {
    const { user } = useAuth();
    const schoolId = user?.schoolId || '';
    const isParent = user?.role === 'parent';

    // Only fetch children for parent role
    const { data, isLoading, error } = useGetMyChildren(isParent ? schoolId : '');

    const [selectedChild, setSelectedChildState] = useState<(Student & { className?: string; sectionName?: string }) | null>(null);
    // True until we have resolved selectedChild after the children list has loaded
    const [isInitializing, setIsInitializing] = useState(true);

    // Reset initialization when auth state changes (login/logout/role change)
    useEffect(() => {
        setIsInitializing(true);
        setSelectedChildState(null);
    }, [isParent, schoolId]);

    // Get children from API response
    const childrenList = useMemo(() => {
        if (data?.data) {
            return data.data;
        }
        return [];
    }, [data]);

    // Initialize selected child from localStorage or first child
    useEffect(() => {
        // Still waiting for the API
        if (isLoading) return;

        if (childrenList.length > 0 && !selectedChild) {
            // Try to restore from localStorage
            const storedChildId = localStorage.getItem(STORAGE_KEY);
            if (storedChildId) {
                const found = childrenList.find(c => c.studentId === storedChildId);
                if (found) {
                    setSelectedChildState(found);
                    setIsInitializing(false);
                    return;
                }
            }
            // Default to first child
            setSelectedChildState(childrenList[0]);
        }
        // Either children arrived (and we just set one) or the list is empty — either way we're done initializing
        setIsInitializing(false);
    }, [childrenList, isLoading, selectedChild]);

    const setSelectedChild = (child: Student & { className?: string; sectionName?: string }) => {
        setSelectedChildState(child);
        localStorage.setItem(STORAGE_KEY, child.studentId);
    };

    const value = useMemo(() => ({
        selectedChild,
        setSelectedChild,
        children: childrenList,
        isLoading: isLoading || isInitializing,
        error: error as Error | null,
    }), [selectedChild, childrenList, isLoading, isInitializing, error]);

    return (
        <ChildSelectorContext.Provider value={value}>
            {children}
        </ChildSelectorContext.Provider>
    );
};

export const useChildSelector = (): ChildSelectorContextType => {
    const context = useContext(ChildSelectorContext);
    if (context === undefined) {
        throw new Error('useChildSelector must be used within a ChildSelectorProvider');
    }
    return context;
};

export default ChildSelectorContext;

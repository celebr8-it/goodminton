import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable Loading Spinner Component
 * Displays a centered, animated loading indicator
 */
export const LoadingSpinner = ({ size = 36 }) => {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '80px 0'
        }}>
            <Loader2
                className="animate-spin"
                size={size}
                style={{ color: 'var(--accent-primary)' }}
            />
        </div>
    );
};

export default LoadingSpinner;

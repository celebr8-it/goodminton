import React from 'react';

/**
 * Reusable Empty State Component
 * Displays an icon, title, and optional description when no data is available
 */
export const EmptyState = ({
    icon: Icon,
    title,
    description,
    action
}) => {
    return (
        <div className="empty-state">
            {Icon && (
                <Icon
                    size={56}
                    className="empty-state-icon"
                    style={{ color: 'var(--accent-primary)' }}
                />
            )}
            {title && (
                <h3 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    marginBottom: '8px',
                    color: 'var(--text-primary)'
                }}>
                    {title}
                </h3>
            )}
            {description && (
                <p style={{
                    color: 'var(--text-muted)',
                    fontSize: '15px',
                    marginBottom: action ? '20px' : '0'
                }}>
                    {description}
                </p>
            )}
            {action && action}
        </div>
    );
};

export default EmptyState;

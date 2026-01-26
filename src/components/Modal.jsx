import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Reusable Modal Component
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback when modal should close
 * @param {string} title - Modal title
 * @param {string} description - Optional subtitle/description
 * @param {React.ReactNode} children - Modal content
 * @param {string} size - Modal size: 'sm', 'md', 'lg', 'xl'
 * @param {boolean} showCloseButton - Show X button in header
 * @param {boolean} closeOnBackdropClick - Close when clicking outside
 */
const Modal = ({
    isOpen = false,
    onClose,
    title,
    description,
    children,
    size = 'md',
    showCloseButton = true,
    closeOnBackdropClick = true,
}) => {
    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleBackdropClick = () => {
        if (closeOnBackdropClick) {
            onClose();
        }
    };

    // Size configurations
    const sizeClasses = {
        sm: '400px',
        md: '560px',
        lg: '720px',
        xl: '960px',
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="modal-backdrop"
                onClick={handleBackdropClick}
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 1000,
                    animation: 'fadeIn 0.2s ease-out',
                }}
            />

            {/* Modal Container */}
            <div
                className="modal-container"
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 1001,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    overflowY: 'auto',
                }}
            >
                {/* Modal Content */}
                <div
                    className="modal-content card"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: '100%',
                        maxWidth: sizeClasses[size],
                        margin: 'auto',
                        position: 'relative',
                        animation: 'slideUp 0.3s ease-out',
                    }}
                >
                    {/* Header */}
                    {(title || showCloseButton) && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            marginBottom: description ? '8px' : '24px',
                        }}>
                            {title && (
                                <div style={{ flex: 1 }}>
                                    <h2 style={{
                                        fontSize: '20px',
                                        fontWeight: 700,
                                        color: 'var(--text-primary)',
                                        marginBottom: description ? '4px' : '0',
                                        lineHeight: 1.3,
                                    }}>
                                        {title}
                                    </h2>
                                    {description && (
                                        <p style={{
                                            fontSize: '14px',
                                            color: 'var(--text-muted)',
                                            lineHeight: 1.5,
                                        }}>
                                            {description}
                                        </p>
                                    )}
                                </div>
                            )}

                            {showCloseButton && (
                                <button
                                    onClick={onClose}
                                    aria-label="Close modal"
                                    style={{
                                        padding: '8px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        color: 'var(--text-muted)',
                                        transition: 'background-color 0.2s',
                                        flexShrink: 0,
                                        marginLeft: '12px',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <X size={22} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Body */}
                    <div style={{
                        paddingTop: (title || description) ? '0' : '0',
                    }}>
                        {children}
                    </div>
                </div>
            </div>

            {/* Animations */}
            <style>
                {`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
            </style>
        </>
    );
};

/**
 * Modal Footer Component
 * Use this for consistent action buttons at the bottom
 */
export const ModalFooter = ({ children, align = 'right' }) => {
    return (
        <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: align === 'right' ? 'flex-end' : align === 'left' ? 'flex-start' : 'space-between',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-color)',
            marginTop: '24px',
        }}>
            {children}
        </div>
    );
};

/**
 * Modal Body Component
 * Use this for consistent spacing
 */
export const ModalBody = ({ children }) => {
    return (
        <div style={{ marginBottom: '0' }}>
            {children}
        </div>
    );
};

export default Modal;

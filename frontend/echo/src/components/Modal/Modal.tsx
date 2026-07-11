import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from '../Icons';
import { Button } from '../Button/Button.tsx';
import styles from './Modal.module.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    confirmText?: string;
    onConfirm?: () => void;
    cancelText?: string;
    isDanger?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
                                                isOpen,
                                                onClose,
                                                title,
                                                children,
                                                confirmText,
                                                onConfirm,
                                                cancelText = 'Скасувати',
                                                isDanger = false
                                            }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3 className={styles.title}>{title}</h3>
                    <button className={styles.closeButton} onClick={onClose}>
                        <CloseIcon width="20" height="20" />
                    </button>
                </div>

                <div className={styles.content}>
                    {children}
                </div>

                {(onConfirm || cancelText) && (
                    <div className={styles.actions}>
                        <Button
                            variant="secondary"
                            size="sm"
                            fullWidth
                            onClick={onClose}>
                            {cancelText}
                        </Button>

                        {onConfirm && confirmText && (
                            <Button
                                variant={isDanger ? 'danger' : 'primary'}
                                size="sm"
                                fullWidth
                                onClick={onConfirm}
                            >
                                {confirmText}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};
import React, { type ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    variant?: 'primary' | 'secondary' | 'danger' | 'dropdownPrimary' | 'dropdownDanger';
    size?: 'sm' | 'md';
    fullWidth?: boolean;
    rounded?: boolean;
    icon?: React.ReactNode;
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
                                                  isLoading,
                                                  variant = 'primary',
                                                  size = 'md',
                                                  fullWidth = false,
                                                  rounded = false,
                                                  icon,
                                                  children,
                                                  className = '',
                                                  disabled,
                                                  ...props
                                              }) => {
    const buttonClass = [
        styles.button,
        styles[variant],
        variant.startsWith('dropdown') ? '' : styles[size],
        fullWidth ? styles.fullWidth : '',
        rounded ? styles.rounded : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            className={buttonClass}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading ? (
                'Завантаження...'
            ) : (
                <>
                    {icon && <span className={styles.btnIcon}>{icon}</span>}
                    {children}
                </>
            )}
        </button>
    );
};
import React, { type InputHTMLAttributes, useId, useState } from 'react';
import { ErrorIcon, EyeIcon, EyeOffIcon } from '../Icons.tsx';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

const Input: React.FC<InputProps> = ({
                                         label,
                                         error,
                                         className = '',
                                         type = 'text',
                                         ...props
                                     }) => {
    const inputId = useId();
    const [showPassword, setShowPassword] = useState(false);

    const isPasswordType = type === 'password';
    const inputType = isPasswordType && showPassword ? 'text' : type;

    return (
        <div className={`${styles.wrapper} ${error ? styles.hasError : ''} ${className}`}>
            <div className={styles.inputContainer}>
                <input
                    id={inputId}
                    type={inputType}
                    className={`${styles.input} ${isPasswordType ? styles.inputPassword : ''}`}
                    placeholder=" "
                    {...props}
                />
                <label htmlFor={inputId} className={styles.label}>
                    {label}
                </label>

                {isPasswordType && (
                    <button
                        type="button"
                        className={styles.eyeButton}
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                        aria-label={showPassword ? "Приховати пароль" : "Показати пароль"}
                    >
                        {showPassword ? (
                            <EyeOffIcon width="20" height="20" />
                        ) : (
                            <EyeIcon width="20" height="20" />
                        )}
                    </button>
                )}
            </div>

            {error && (
                <div className={styles.errorText}>
                    <ErrorIcon width="14" height="14" />
                    {error}
                </div>
            )}
        </div>
    );
};

export default Input;
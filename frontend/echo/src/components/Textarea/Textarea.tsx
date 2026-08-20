import React, { type TextareaHTMLAttributes, useId } from 'react';
import { ErrorIcon } from '../Icons';
import styles from './Textarea.module.css';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    error?: string;
    currentLength?: number;
    maxLength?: number;
}

const Textarea: React.FC<TextareaProps> = ({
                                               label,
                                               error,
                                               className = '',
                                               currentLength,
                                               maxLength,
                                               ...props
                                           }) => {
    const inputId = useId();

    return (
        <div className={`${styles.wrapper} ${error ? styles.hasError : ''} ${className}`}>
            <div className={styles.inputContainer}>
                <textarea
                    id={inputId}
                    className={styles.textarea}
                    placeholder=" "
                    maxLength={maxLength}
                    {...props}
                />
                <label htmlFor={inputId} className={styles.label}>
                    {label}
                </label>
            </div>

            <div className={styles.footer}>
                <div className={styles.errorContainer}>
                    {error && (
                        <div className={styles.errorText}>
                            <ErrorIcon width="14" height="14" />
                            {error}
                        </div>
                    )}
                </div>

                {(currentLength !== undefined && maxLength !== undefined) && (
                    <div className={styles.charCount}>
                        {currentLength}/{maxLength}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Textarea;
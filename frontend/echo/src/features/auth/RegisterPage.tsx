import axios from 'axios';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../store/useAuthStore';
import Input from '../../components/Input/Input.tsx';
import { Button } from '../../components/Button/Button.tsx';
import styles from './Auth.module.css';

interface RegisterErrors {
    username?: string;
    email?: string;
    password?: string;
}

export const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [fieldErrors, setFieldErrors] = useState<RegisterErrors>({});
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    const validateForm = (): boolean => {
        const errors: RegisterErrors = {};
        let isValid = true;

        if (!username.trim()) {
            errors.username = 'Псевдонім є обов\'язковим';
            isValid = false;
        } else if (username.length < 3) {
            errors.username = 'Має бути не менше 3 символів';
            isValid = false;
        }

        if (!email.trim()) {
            errors.email = 'Електронна пошта є обов\'язковою';
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            errors.email = 'Введіть коректний формат email';
            isValid = false;
        }

        if (!password) {
            errors.password = 'Пароль є обов\'язковим';
            isValid = false;
        } else if (password.length < 6) {
            errors.password = 'Пароль має містити мінімум 6 символів';
            isValid = false;
        }

        setFieldErrors(errors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGlobalError(null);

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await authApi.register({ username, email, password });
            setAuth(response.user, response.accessToken);
            navigate('/');
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setGlobalError(err.response?.data || 'Помилка під час реєстрації');
            } else if (err instanceof Error) {
                setGlobalError(err.message);
            } else {
                setGlobalError('Сталася невідома помилка');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
                <h2 className={styles.title}>Створити акаунт</h2>

                {globalError && <div className={styles.error}>{globalError}</div>}

                <Input
                    label="Псевдонім"
                    type="text"
                    value={username}
                    onChange={(e) => {
                        setUsername(e.target.value);
                        if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: undefined });
                    }}
                    error={fieldErrors.username}
                />

                <Input
                    label="Електронна пошта"
                    type="email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
                    }}
                    error={fieldErrors.email}
                />

                <Input
                    label="Пароль"
                    type="password"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                    }}
                    error={fieldErrors.password}
                />

                <Button
                    type="submit"
                    isLoading={isLoading}
                    size="md"
                    rounded
                >
                    Зареєструватися
                </Button>

                <p className={styles.footerText}>
                    Вже є акаунт?
                    <Link to="/login" className={styles.link}>Увійти</Link>
                </p>
            </form>
        </div>
    );
};
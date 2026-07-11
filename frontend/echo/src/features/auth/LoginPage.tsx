import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../store/useAuthStore';
import Input from '../../components/Input/Input.tsx';
import { Button } from '../../components/Button/Button.tsx';
import styles from './Auth.module.css';

interface LoginErrors {
    login?: string;
    password?: string;
}

export const LoginPage = () => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');

    const [fieldErrors, setFieldErrors] = useState<LoginErrors>({});
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    const isFormEmpty = !login.trim() || !password.trim();

    const validateForm = (): boolean => {
        const errors: LoginErrors = {};
        let isValid = true;

        if (!login.trim()) {
            errors.login = 'Введіть електронну пошту або псевдонім';
            isValid = false;
        }

        if (!password) {
            errors.password = 'Пароль є обов\'язковим';
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
            const response = await authApi.login({ login, password });
            setAuth(response.user, response.accessToken);
            navigate('/');
        } catch {
            setGlobalError('Неправильний логін або пароль');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
                <h2 className={styles.title}>З поверненням</h2>

                {globalError && <div className={styles.error}>{globalError}</div>}

                <Input
                    label="Електронна пошта або псевдонім"
                    type="text"
                    value={login}
                    onChange={(e) => {
                        setLogin(e.target.value);
                        if (fieldErrors.login) setFieldErrors({ ...fieldErrors, login: undefined });
                    }}
                    error={fieldErrors.login}
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
                    disabled={isFormEmpty}
                >
                    Увійти
                </Button>

                <p className={styles.footerText}>
                    Ще не маєте акаунту?
                    <Link to="/register" className={styles.link}>Створити</Link>
                </p>
            </form>
        </div>
    );
};
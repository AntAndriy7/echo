import React, { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { authApi } from '../api/authApi';

export const AuthInit: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { setAuth, setAuthLoading, isAuthLoading } = useAuthStore();

    useEffect(() => {
        const attemptSilentLogin = async () => {
            const delay = new Promise(resolve => setTimeout(resolve, 1000));

            try {
                const { accessToken, user } = await authApi.refresh();
                await delay;
                setAuth(user, accessToken);
            } catch {
                await delay;
                setAuthLoading(false);
            }
        };

        attemptSilentLogin();
    }, [setAuth, setAuthLoading]);

    if (isAuthLoading) {
        return (
            <div style={{
                height: '100vh',
                width: '100vw',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-main, #313338)',
            }}>
                <style>
                    {`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                        .loading-spinner {
                            width: 50px;
                            height: 50px;
                            border: 4px solid #856404;
                            border-top-color: var(--accent-yellow, #fee75c);
                            border-radius: 50%;
                            animation: spin 1s linear infinite;
                        }
                    `}
                </style>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return <>{children}</>;
};
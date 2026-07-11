import axios from 'axios';
import { api, BASE_URL } from './axios';
import type { AuthResponse } from '../types';

export const authApi = {
    login: async (credentials: Record<'login' | 'password', string>) => {
        const response = await api.post<AuthResponse>('/auth/login', credentials);
        return response.data;
    },

    register: async (data: Record<'username' | 'email' | 'password', string>) => {
        const response = await api.post<AuthResponse>('/auth/register', data);
        return response.data;
    },

    refresh: async () => {
        const response = await axios.post<AuthResponse>(
            `${BASE_URL}/auth/refresh`,
            {},
            { withCredentials: true }
        );
        return response.data;
    }
};
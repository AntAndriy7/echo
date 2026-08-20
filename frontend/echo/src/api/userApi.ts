import { api } from './axios';
import type {User, UpdateProfileRequest} from '../types';

export const userApi = {
    getByUsername: async (username: string) => {
        const response = await api.get<User>(`/users/${username}`);
        return response.data;
    },

    updateProfile: async (data: UpdateProfileRequest) => {
        const response = await api.patch<User>('/users/me', data);
        return response.data;
    }
};
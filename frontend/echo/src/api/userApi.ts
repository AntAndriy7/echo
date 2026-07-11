import { api } from './axios';
import type {User} from '../types';

export const userApi = {
    getByUsername: async (username: string) => {
        const response = await api.get<User>(`/users/${username}`);
        return response.data;
    }
};
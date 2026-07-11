import { api } from './axios';
import type {PostResponse} from '../types';

export const postApi = {
    getAll: async () => {
        const response = await api.get<{ content: PostResponse[] }>('/posts');
        return response.data.content;
    },

    getByUsername: async (username: string) => {
        const response = await api.get<{ content: PostResponse[] }>(`/users/${username}/posts`);
        return response.data.content;
    },

    create: async (content: string) => {
        const response = await api.post<PostResponse>('/posts', { content });
        return response.data;
    },

    toggleLike: async (postId: string) => {
        const response = await api.post<PostResponse>(`/posts/${postId}/like`);
        return response.data;
    },

    update: async (postId: string, content: string) => {
        const response = await api.put<PostResponse>(`/posts/${postId}`, { content });
        return response.data;
    },

    delete: async (postId: string) => {
        await api.delete(`/posts/${postId}`);
    }
};
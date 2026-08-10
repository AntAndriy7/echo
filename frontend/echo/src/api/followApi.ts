import { api } from './axios';
import type {PageResponse, FollowUserResponse} from '../types';

export const followApi = {
    toggleFollow: async (targetUserId: string) => {
        await api.post(`/users/${targetUserId}/follow`);
    },

    getFollowers: async (userId: string, page = 0, size = 20) => {
        const response = await api.get<PageResponse<FollowUserResponse>>(`/users/${userId}/followers`, {
            params: { page, size }
        });
        return response.data;
    },

    getFollowing: async (userId: string, page = 0, size = 20) => {
        const response = await api.get<PageResponse<FollowUserResponse>>(`/users/${userId}/following`, {
            params: { page, size }
        });
        return response.data;
    },

    getFollowStatus: async (targetUserId: string) => {
        const response = await api.get<boolean>(`/users/${targetUserId}/follow-status`);
        return response.data;
    }
};
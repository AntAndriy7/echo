import { api } from './axios';
import type {ChatResponse, MessageResponse} from '../types';

export const chatApi = {
    getChats: async () => {
        const response = await api.get<ChatResponse[]>('/chats');
        return response.data;
    },

    getMessages: async (chatId: string) => {
        const response = await api.get<{ content: MessageResponse[] }>(`/chats/${chatId}/messages`);
        return response.data.content.reverse();
    },

    getOrCreate: async (targetUsername: string) => {
        const response = await api.post<ChatResponse>(`/chats?targetUsername=${targetUsername}`);
        return response.data;
    },

    markAsRead: async (chatId: string) => {
        await api.put(`/chats/${chatId}/read`);
    },

    checkUnread: async () => {
        const response = await api.get<boolean>('/chats/unread');
        return response.data;
    },

    getOnlineUsers: async () => {
        const response = await api.get<string[]>('/chats/presence');
        return response.data;
    }
};
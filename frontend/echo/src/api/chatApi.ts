import { api } from './axios';
import type {ChatResponse, MessageResponse, PageResponse} from '../types';

export const chatApi = {
    getChats: async () => {
        const response = await api.get<ChatResponse[]>('/chats');
        return response.data;
    },

    getMessages: async (chatId: string, page: number = 0, size: number = 40) => {
        const response = await api.get<PageResponse<MessageResponse>>(
            `/chats/${chatId}/messages?page=${page}&size=${size}`
        );

        const data = response.data;
        data.content.reverse();

        return data;
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
    },

    sendMessage: async (chatId: string, content: string) => {
        const response = await api.post<MessageResponse>(`/chats/${chatId}/messages`, { content });
        return response.data;
    }
};
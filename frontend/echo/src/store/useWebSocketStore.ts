import { create } from 'zustand';
import { Client } from '@stomp/stompjs';
import type {MessageResponse} from '../types';

interface WebSocketState {
    client: Client | null;
    isConnected: boolean;
    globalMessages: MessageResponse[];
    onlineUsers: string[];
    readReceipt: { chatId: string; timestamp: number } | null;
    hasUnread: boolean;

    setClient: (client: Client) => void;
    setIsConnected: (status: boolean) => void;
    addGlobalMessage: (message: MessageResponse) => void;
    clearGlobalMessages: () => void;
    setOnlineUsers: (users: string[]) => void;
    updateUserPresence: (username: string, isOnline: boolean) => void;
    setReadReceipt: (receipt: { chatId: string; timestamp: number } | null) => void;
    setHasUnread: (status: boolean) => void;
    activeChatId: string | null;
    setActiveChatId: (id: string | null) => void;
    disconnect: () => void;
}

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
    client: null,
    isConnected: false,
    globalMessages: [],
    onlineUsers: [],
    readReceipt: null,
    hasUnread: false,
    activeChatId: null,

    setReadReceipt: (receipt) => set({ readReceipt: receipt }),

    setHasUnread: (hasUnread) => set({ hasUnread }),
    setActiveChatId: (id) => set({ activeChatId: id }),

    setClient: (client) => set({ client }),
    setIsConnected: (isConnected) => set({ isConnected }),

    addGlobalMessage: (message) => set((state) => ({
        globalMessages: [...state.globalMessages, message]
    })),

    clearGlobalMessages: () => set({ globalMessages: [] }),

    setOnlineUsers: (users) => set({ onlineUsers: users }),

    updateUserPresence: (username, isOnline) => set((state) => {
        if (isOnline) {
            return {
                onlineUsers: state.onlineUsers.includes(username)
                    ? state.onlineUsers
                    : [...state.onlineUsers, username]
            };
        } else {
            return {
                onlineUsers: state.onlineUsers.filter(u => u !== username)
            };
        }
    }),

    disconnect: () => {
        const { client } = get();
        if (client) client.deactivate();
        set({ client: null, isConnected: false, globalMessages: [], onlineUsers: [], readReceipt: null, hasUnread: false, activeChatId: null });
    }
}));
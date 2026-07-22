import { useEffect, useState } from 'react';
import { useWebSocketStore } from '../store/useWebSocketStore';
import { useAuthStore } from '../store/useAuthStore';
import type {MessageResponse} from '../types';
import { chatApi } from '../api/chatApi';

export const useChatWebSocket = (chatId: string | undefined) => {
    const { user } = useAuthStore();
    const { client, latestMessage, readReceipt } = useWebSocketStore();
    const [messages, setMessages] = useState<MessageResponse[]>([]);

    useEffect(() => {
        if (!chatId) return;
        let isMounted = true;

        const fetchHistory = async () => {
            try {
                const history = await chatApi.getMessages(chatId);
                if (isMounted) setMessages(history);
            } catch (error) {
                console.error('Помилка завантаження історії:', error);
            }
        };

        fetchHistory();
        return () => { isMounted = false; };
    }, [chatId]);

    useEffect(() => {
        if (!chatId || !latestMessage || latestMessage.chatId !== chatId) return;

        setMessages(prev => {
            if (prev.some(m => m.id === latestMessage.id)) return prev;
            return [...prev, latestMessage];
        });

        if (latestMessage.senderId !== user?.id) {
            chatApi.markAsRead(chatId).catch(err =>
                console.error('Помилка автопрочитання:', err)
            );
        }

        useWebSocketStore.getState().setLatestMessage(null);
    }, [latestMessage, chatId, user?.id]);

    useEffect(() => {
        if (!readReceipt || readReceipt.chatId !== chatId) return;

        setMessages(prevMessages =>
            prevMessages.map(msg =>
                msg.senderId === user?.id ? { ...msg, isRead: true } : msg
            )
        );
    }, [readReceipt, chatId, user?.id]);

    const sendMessage = (content: string) => {
        if (client && client.connected && chatId) {
            client.publish({
                destination: `/app/chat/${chatId}`,
                body: JSON.stringify({ content }),
            });
        }
    };

    return { messages, sendMessage };
};
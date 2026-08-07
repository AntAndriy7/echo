import { useEffect, useState, useRef } from 'react';
import { useWebSocketStore } from '../store/useWebSocketStore';
import { useAuthStore } from '../store/useAuthStore';
import type {MessageResponse} from '../types';
import { chatApi } from '../api/chatApi';

export const useChatWebSocket = (chatId: string | undefined) => {
    const { user } = useAuthStore();
    const { client, latestMessage, readReceipt } = useWebSocketStore();
    const [messages, setMessages] = useState<MessageResponse[]>([]);
    const [isSending, setIsSending] = useState(false);

    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const [typingUser, setTypingUser] = useState<string | null>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const typingBurstStartRef = useRef<number | null>(null);
    const stopTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastTypingTimeRef = useRef<number>(0);

    useEffect(() => {
        if (!chatId) return;
        let isMounted = true;

        setPage(0);
        setHasMore(true);
        setMessages([]);

        const fetchHistory = async () => {
            try {
                const data = await chatApi.getMessages(chatId, 0);
                if (isMounted) {
                    setMessages(data.content);
                    setHasMore(!data.last);
                }
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

            setTypingUser(null);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
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

    useEffect(() => {
        if (!client || !client.connected || !chatId) return;

        const typingSub = client.subscribe(`/topic/chat/${chatId}/typing`, (message) => {
            const payload = JSON.parse(message.body);

            if (payload.username !== user?.username) {
                setTypingUser(payload.username);

                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }

                typingTimeoutRef.current = setTimeout(() => {
                    setTypingUser(null);
                }, 3000);
            }
        });

        return () => {
            typingSub.unsubscribe();
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            setTypingUser(null);
        };
    }, [client, chatId, user?.username]);

    const notifyTyping = () => {
        if (!client || !client.connected || !chatId) return;

        const now = Date.now();

        if (typingBurstStartRef.current === null) {
            typingBurstStartRef.current = now;
        }

        if (now - typingBurstStartRef.current >= 500) {
            if (now - lastTypingTimeRef.current > 2000) {
                client.publish({
                    destination: `/app/chat/${chatId}/typing`,
                    body: JSON.stringify({}),
                });
                lastTypingTimeRef.current = now;
            }
        }

        if (stopTypingTimerRef.current) clearTimeout(stopTypingTimerRef.current);

        stopTypingTimerRef.current = setTimeout(() => {
            typingBurstStartRef.current = null;
        }, 1500);
    };

    const sendMessage = async (content: string) => {
        if (!chatId || !content.trim() || isSending) return;

        typingBurstStartRef.current = null;
        if (stopTypingTimerRef.current) {
            clearTimeout(stopTypingTimerRef.current);
        }

        setIsSending(true);
        try {
            const sentMessage = await chatApi.sendMessage(chatId, content);

            setMessages(prev => {
                if (prev.some(m => m.id === sentMessage.id)) return prev;
                return [...prev, sentMessage];
            });
        } catch (error) {
            console.error('Помилка відправки повідомлення:', error);
        } finally {
            setIsSending(false);
        }
    };

    const loadMore = async () => {
        if (!chatId || isLoadingMore || !hasMore || messages.length === 0) return;

        setIsLoadingMore(true);
        try {
            const nextPage = page + 1;
            const data = await chatApi.getMessages(chatId, nextPage);

            setMessages(prev => [...data.content, ...prev]);
            setPage(nextPage);
            setHasMore(!data.last);
        } catch (error) {
            console.error('Помилка підвантаження старих повідомлень:', error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    return { messages, sendMessage, isSending, typingUser, notifyTyping, loadMore, hasMore, isLoadingMore };
};
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatWebSocket } from '../../hooks/useChatWebSocket';
import { useWebSocketStore } from '../../store/useWebSocketStore';
import type { ChatResponse } from '../../types';
import { chatApi } from '../../api/chatApi';
import { Button } from '../../components/Button/Button.tsx';
import { DoubleCheckIcon } from '../../components/Icons';
import styles from './Chat.module.css';

export const ChatPage = () => {
    const location = useLocation();
    const { user: currentUser } = useAuthStore();

    const [chats, setChats] = useState<ChatResponse[]>([]);
    const [isLoadingChats, setIsLoadingChats] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedChat, setSelectedChat] = useState<ChatResponse | null>(null);
    const [typedMessage, setTypedMessage] = useState('');

    const { onlineUsers, globalMessages, setActiveChatId } = useWebSocketStore();
    const { messages, sendMessage } = useChatWebSocket(selectedChat?.id);

    const lastProcessedMessageId = useRef<string | null>(
        globalMessages.length > 0 ? globalMessages[globalMessages.length - 1].id : null
    );
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isPartnerOnline = selectedChat ? onlineUsers.includes(selectedChat.username) : false;

    const filteredChats = useMemo(() => {
        return chats.filter(chat =>
            chat.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [chats, searchQuery]);

    useEffect(() => {
        if (selectedChat) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        }
    }, [messages, selectedChat?.id]);

    useEffect(() => {
        const fetchChats = async () => {
            try {
                setIsLoadingChats(true);
                const data = await chatApi.getChats();
                setChats(data);

                useWebSocketStore.getState().setHasUnread(data.some(c => c.unreadCount > 0));

                const passedChatId = location.state?.activeChatId;
                if (passedChatId) {
                    const chatToSelect = data.find(c => c.id === passedChatId);
                    if (chatToSelect) {
                        setSelectedChat(chatToSelect);
                        window.history.replaceState({}, document.title);
                    }
                }
            } catch (error) {
                console.error('Помилка при завантаженні списку чатів:', error);
            } finally {
                setIsLoadingChats(false);
            }
        };
        fetchChats();
    }, [location.state?.activeChatId]);

    useEffect(() => {
        if (globalMessages.length === 0) return;

        const latestMessage = globalMessages[globalMessages.length - 1];
        if (lastProcessedMessageId.current === latestMessage.id) return;

        const isChatExists = chats.some(c => c.id === latestMessage.chatId);

        if (!isChatExists) {
            chatApi.getChats()
                .then(data => {
                    setChats(data);
                    useWebSocketStore.getState().setHasUnread(true);
                })
                .catch(err => console.error("Помилка завантаження нових чатів:", err));

            lastProcessedMessageId.current = latestMessage.id;
            return;
        }

        lastProcessedMessageId.current = latestMessage.id;

        setChats(prevChats => {
            const chatIndex = prevChats.findIndex(c => c.id === latestMessage.chatId);
            if (chatIndex !== -1) {
                const isNotCurrentlyOpen = selectedChat?.id !== latestMessage.chatId;
                const isNotFromMe = latestMessage.senderId !== currentUser?.id;

                const updatedChat = {
                    ...prevChats[chatIndex],
                    lastMessage: latestMessage.content,
                    lastMessageAt: latestMessage.createdAt,
                    unreadCount: (isNotCurrentlyOpen && isNotFromMe)
                        ? (prevChats[chatIndex].unreadCount || 0) + 1
                        : (prevChats[chatIndex].unreadCount || 0)
                };

                const newChats = [...prevChats];
                newChats.splice(chatIndex, 1);
                const finalChats = [updatedChat, ...newChats];

                useWebSocketStore.getState().setHasUnread(finalChats.some(c => c.unreadCount > 0));

                return finalChats;
            }
            return prevChats;
        });
    }, [globalMessages, selectedChat, currentUser?.id]);

    useEffect(() => {
        if (!selectedChat) return;

        if (selectedChat.unreadCount > 0) {
            chatApi.markAsRead(selectedChat.id).catch(err => console.error(err));
            setChats(prevChats => {
                const updated = prevChats.map(c =>
                    c.id === selectedChat.id ? { ...c, unreadCount: 0 } : c
                );

                useWebSocketStore.getState().setHasUnread(updated.some(c => c.unreadCount > 0));

                return updated;
            });
        }
    }, [selectedChat]);

    useEffect(() => {
        setActiveChatId(selectedChat?.id || null);
        return () => setActiveChatId(null);
    }, [selectedChat?.id, setActiveChatId]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!typedMessage.trim()) return;
        sendMessage(typedMessage);
        setTypedMessage('');
    };

    const isSameDay = (dateStr1: string, dateStr2: string) => {
        const d1 = new Date(dateStr1);
        const d2 = new Date(dateStr2);
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    const formatDateDivider = (isoString: string) => {
        const date = new Date(isoString);
        const now = new Date();

        if (date.getFullYear() === now.getFullYear()) {
            return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
        } else {
            return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
        }
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    };

    const formatChatListTime = (isoString?: string | null) => {
        if (!isoString) return '';

        const date = new Date(isoString);
        const now = new Date();

        const isToday = date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();

        const isThisYear = date.getFullYear() === now.getFullYear();

        if (isToday) {
            return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
        } else if (isThisYear) {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            return `${day}.${month}`;
        } else {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear().toString().slice(-2);
            return `${day}.${month}.${year}`;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.sidebar}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Чат</h2>
                    <input
                        type="text"
                        placeholder="Пошук..."
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className={styles.chatList}>
                    {isLoadingChats ? (
                        <div className={styles.listStatusMessage}>Завантаження...</div>
                    ) : filteredChats.map(chat => (
                        <div
                            key={chat.id}
                            className={`${styles.chatItem} ${selectedChat?.id === chat.id ? styles.activeChatItem : ''}`}
                            onClick={() => setSelectedChat(chat)}
                        >
                            <div className={styles.avatar}>
                                {chat.avatarUrl ? (
                                    <img src={chat.avatarUrl} alt={chat.username} className={styles.avatarImg} />
                                ) : (
                                    chat.username.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className={styles.chatInfo}>
                                <div className={styles.chatTopRow}>
                                    <span className={styles.chatName}>{chat.username}</span>
                                    {chat.lastMessageAt && (
                                        <span className={styles.chatListTime}>
                                            {formatChatListTime(chat.lastMessageAt)}
                                        </span>
                                    )}
                                </div>

                                <div className={styles.chatBottomRow}>
                                    <span className={styles.chatPreview}>
                                        {chat.lastMessage}
                                    </span>
                                    {chat.unreadCount > 0 && (
                                        <div className={styles.unreadBadge}>
                                            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {!isLoadingChats && filteredChats.length === 0 && (
                        <div className={styles.listStatusMessage}>
                            {searchQuery ? 'Користувачів не знайдено' : 'У вас ще немає повідомлень'}
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.chatArea}>
                {selectedChat ? (
                    <div className={styles.activeChatWindow}>
                        <div className={styles.chatHeader}>
                            <div className={`${styles.avatar} ${styles.avatarHeader}`}>
                                {selectedChat.avatarUrl ? (
                                    <img src={selectedChat.avatarUrl} alt={selectedChat.username} className={styles.avatarImg} />
                                ) : (
                                    selectedChat.username.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className={styles.headerMeta}>
                                <span className={styles.chatName}>{selectedChat.username}</span>
                                <span className={`${styles.statusOnline} ${isPartnerOnline ? styles.online : ''}`}>
                                    {isPartnerOnline ? 'В мережі' : 'Десь між думками'}
                                </span>
                            </div>
                        </div>

                        <div className={styles.messagesContainer}>
                            {messages.map((msg, index) => {
                                const showDateDivider = index === 0 || !isSameDay(msg.createdAt, messages[index - 1].createdAt);
                                const isMyMessage = msg.senderId === currentUser?.id;

                                return (
                                    <React.Fragment key={msg.id}>
                                        {showDateDivider && (
                                            <div className={styles.dateDivider}>
                                                <span>{formatDateDivider(msg.createdAt)}</span>
                                            </div>
                                        )}

                                        <div className={`${styles.messageRow} ${isMyMessage ? styles.messageRowMy : styles.messageRowTheir}`}>
                                            <div className={`${styles.messageBox} ${isMyMessage ? styles.messageMy : styles.messageTheir}`}>
                                                <span className={styles.messageText}>
                                                    {msg.content}
                                                    <span className={styles.metaSpacer}></span>
                                                </span>

                                                <div className={styles.messageMeta}>
                                                    <span className={styles.messageTime}>
                                                        {formatTime(msg.createdAt)}
                                                    </span>

                                                    {isMyMessage && (
                                                        <DoubleCheckIcon
                                                            width="16"
                                                            height="16"
                                                            color={msg.isRead ? 'var(--accent-yellow)' : 'var(--text-muted)'}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <form className={styles.inputContainer} onSubmit={handleSend}>
                            <input
                                type="text"
                                placeholder="Напишіть повідомлення..."
                                className={styles.inputField}
                                value={typedMessage}
                                onChange={(e) => setTypedMessage(e.target.value)}
                            />
                            <Button
                                type="submit"
                                variant="primary"
                                size="sm"
                                rounded
                                disabled={!typedMessage.trim()}
                            >
                                Надіслати
                            </Button>
                        </form>
                    </div>
                ) : (
                    <div className={styles.chatEmptyState}>
                        <h2 className={styles.emptyStateTitle}>Ваші повідомлення</h2>
                        <p className={styles.emptyStateSubtitle}>
                            Надсилайте приватні світлини та повідомлення другу або групі
                        </p>
                        <Button
                            variant="primary"
                            size="md"
                            rounded
                            onClick={() => alert("Тут відкриється модалка для вибору користувача")}
                        >
                            Надіслати повідомлення
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
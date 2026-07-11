import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Client, type StompSubscription } from '@stomp/stompjs';
import { useAuthStore } from '../store/useAuthStore';
import { useWebSocketStore } from '../store/useWebSocketStore';
import { chatApi } from '../api/chatApi';
import { SidebarNav } from './SidebarNav/SidebarNav';
import { Modal } from '../components/Modal/Modal';
import styles from './DashboardLayout.module.css';

export const DashboardLayout = () => {
    const { user, accessToken, logout } = useAuthStore();
    const navigate = useNavigate();
    const { setClient, setIsConnected, addGlobalMessage, disconnect, setOnlineUsers, updateUserPresence, hasUnread, setHasUnread } = useWebSocketStore();
    const presenceSubRef = useRef<StompSubscription | null>(null);
    const globalSubRef = useRef<StompSubscription | null>(null);

    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const handleConfirmLogout = () => {
        logout();
        setIsLogoutModalOpen(false);
        navigate('/login');
    };

    const fallbackAvatar = user?.username ? user.username.charAt(0).toUpperCase() : '?';

    useEffect(() => {
        if (!accessToken) return;

        chatApi.getOnlineUsers()
            .then(users => setOnlineUsers(users))
            .catch(err => console.error("Не вдалося завантажити статус користувачів", err));

        chatApi.checkUnread()
            .then(hasUnread => setHasUnread(hasUnread))
            .catch(err => console.error("Не вдалося перевірити непрочитані повідомлення", err));

        const stompClient = new Client({
            brokerURL: import.meta.env.VITE_WS_URL,
            connectHeaders: { Authorization: `Bearer ${accessToken}` },
            onConnect: () => {
                setIsConnected(true);
                setClient(stompClient);

                const userTopic = `/topic/user/${user?.username}`;
                globalSubRef.current = stompClient.subscribe(userTopic, (message) => {
                    const newMsg = JSON.parse(message.body);
                    addGlobalMessage(newMsg);

                    const currentActiveChatId = useWebSocketStore.getState().activeChatId;
                    if (newMsg.senderId !== user?.id && newMsg.chatId !== currentActiveChatId) {
                        setHasUnread(true);
                    }
                });

                const readTopic = `/topic/user/${user?.username}/read`;
                stompClient.subscribe(readTopic, (message) => {
                    const payload = JSON.parse(message.body);
                    useWebSocketStore.getState().setReadReceipt({
                        chatId: payload.chatId,
                        timestamp: Date.now()
                    });
                });

                presenceSubRef.current = stompClient.subscribe('/topic/presence', (message) => {
                    const payload = JSON.parse(message.body);
                    const isUserOnline = payload.isOnline ?? payload.online;
                    updateUserPresence(payload.username, isUserOnline);
                });
            },
            onDisconnect: () => {
                setIsConnected(false);
            },
        });

        stompClient.activate();

        return () => {
            if (globalSubRef.current) globalSubRef.current.unsubscribe();
            if (presenceSubRef.current) presenceSubRef.current.unsubscribe();
            disconnect();
        };
    }, [accessToken]);

    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <div className={styles.logo}>
                    echo<span className={styles.logoAccent}>.</span>
                </div>

                <SidebarNav
                    hasUnread={hasUnread}
                    onLogoutClick={() => setIsLogoutModalOpen(true)}
                    showLogout={true}
                />

                <div
                    className={styles.profileSection}
                    onClick={() => navigate(`/profile/${user?.username}`)}
                >
                    <div className={styles.avatar}>
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" className={styles.avatarImg} />
                        ) : (
                            fallbackAvatar
                        )}
                    </div>
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>{user?.username || 'Користувач'}</span>
                        <span className={styles.userEmail}>{user?.email || 'Невідомий email'}</span>
                    </div>
                </div>
            </aside>

            <main className={styles.mainContent}>
                <Outlet />
            </main>

            <Modal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                title="Вихід з акаунту"
                confirmText="Вийти"
                onConfirm={handleConfirmLogout}
                isDanger={true}
            >
                Ви впевнені, що хочете вийти з акаунту? Вам доведеться ввести свої дані знову для входу.
            </Modal>
        </div>
    );
};
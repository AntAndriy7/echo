import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { followApi } from '../../api/followApi';
import { useAuthStore } from '../../store/useAuthStore';
import type { FollowUserResponse } from '../../types';
import { Skeleton } from '../Skeleton/Skeleton';
import { Button } from '../Button/Button';
import { CloseIcon } from '../Icons';
import styles from './FollowModal.module.css';

interface FollowModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    type: 'followers' | 'following';
    title: string;
}

export const FollowModal = ({ isOpen, onClose, userId, type, title }: FollowModalProps) => {
    const navigate = useNavigate();
    const { user: currentUser } = useAuthStore();

    const [users, setUsers] = useState<FollowUserResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const modalRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const fetchInitialData = async () => {
            setIsLoading(true);
            setPage(0);

            try {
                const [response] = await Promise.all([
                    type === 'followers'
                        ? followApi.getFollowers(userId, 0)
                        : followApi.getFollowing(userId, 0),
                    new Promise(resolve => setTimeout(resolve, 500)),
                ]);

                setUsers(response.content);
                setHasMore(!response.last);
            } catch (error) {
                console.error('Помилка при завантаженні списку:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();

        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
            setUsers([]);
            setSearchQuery('');
        };
    }, [isOpen, userId, type]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const handleToggleFollow = async (e: React.MouseEvent, targetUserId: string) => {
        e.stopPropagation();

        try {
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id === targetUserId
                        ? { ...user, isFollowing: !user.isFollowing }
                        : user
                )
            );

            await followApi.toggleFollow(targetUserId);
        } catch (error) {
            console.error('Помилка при зміні статусу підписки:', error);
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id === targetUserId
                        ? { ...user, isFollowing: !user.isFollowing }
                        : user
                )
            );
        }
    };

    const handleScroll = async () => {
        if (!listRef.current || isLoadingMore || !hasMore || isLoading) return;

        const { scrollTop, scrollHeight, clientHeight } = listRef.current;

        if (scrollHeight - scrollTop - clientHeight < 50) {
            setIsLoadingMore(true);
            const nextPage = page + 1;
            try {
                const response = type === 'followers'
                    ? await followApi.getFollowers(userId, nextPage)
                    : await followApi.getFollowing(userId, nextPage);

                setUsers(prev => [...prev, ...response.content]);
                setPage(nextPage);
                setHasMore(!response.last);
            } catch (error) {
                console.error('Помилка при завантаженні наступної сторінки:', error);
            } finally {
                setIsLoadingMore(false);
            }
        }
    };

    const handleUserClick = (username: string) => {
        onClose();
        navigate(`/profile/${username}`);
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal} ref={modalRef}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{title}</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <CloseIcon width="20" height="20" />
                    </button>
                </div>

                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Пошук..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className={styles.listContainer} ref={listRef} onScroll={handleScroll}>
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className={styles.userRow}>
                                <Skeleton
                                    variant="circular"
                                    width={44}
                                    height={44}
                                    className={styles.skeletonAvatar}
                                />

                                <div className={styles.skeletonTextContainer}>
                                    <Skeleton width="40%" height={14} />
                                    <Skeleton width="70%" height={12} />
                                </div>

                                <Skeleton
                                    variant="rectangular"
                                    width={96}
                                    height={32}
                                    className={styles.skeletonBtn}
                                />
                            </div>
                        ))
                    ) : filteredUsers.length === 0 ? (
                        <div className={styles.emptyState}>
                            {searchQuery ? 'Користувачів не знайдено' : 'Список порожній'}
                        </div>
                    ) : (
                        filteredUsers.map(user => (
                            <div
                                key={user.id}
                                className={styles.userRow}
                                onClick={() => handleUserClick(user.username)}
                            >
                                <div className={styles.avatar}>
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt={user.username} className={styles.avatarImg} />
                                    ) : (
                                        user.username.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className={styles.userInfo}>
                                    <span className={styles.username}>{user.username}</span>
                                    {user.email && <span className={styles.email}>{user.email}</span>}
                                </div>

                                {currentUser?.id !== user.id && (
                                    <div className={styles.actionBtn}>
                                        <Button
                                            variant={user.isFollowing ? "secondary" : "primary"}
                                            size="sm"
                                            rounded
                                            onClick={(e) => handleToggleFollow(e, user.id)}
                                        >
                                            {user.isFollowing ? 'Відписатися' : 'Стежити'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}

                    {isLoadingMore && (
                        <div className={styles.loadingMore}>Завантаження...</div>
                    )}
                </div>
            </div>
        </div>
    );
};
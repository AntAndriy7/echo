import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { userApi } from '../../api/userApi';
import { postApi } from '../../api/postApi';
import { chatApi } from '../../api/chatApi';
import type { User, PostResponse } from '../../types';
import { Button } from '../../components/Button/Button';
import { Tabs } from '../../components/Tabs/Tabs';
import { PostCard } from '../feed/PostCard';
import { formatDate } from '../../utils/formatDate';
import styles from './Profile.module.css';

type ProfileTab = 'posts' | 'likes' | 'media';

const profileTabs = [
    { id: 'posts', label: 'Дописи' },
    { id: 'likes', label: 'Вподобання' },
    { id: 'media', label: 'Медіа' }
] as const;

export const ProfilePage = () => {
    const navigate = useNavigate();
    const { username } = useParams<{ username: string }>();
    const { user: currentUser } = useAuthStore();

    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [posts, setPosts] = useState<PostResponse[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ProfileTab>('posts');

    const [isCreatingChat, setIsCreatingChat] = useState(false);

    const isMyProfile = currentUser?.username === username;

    useEffect(() => {
        const fetchProfileData = async () => {
            if (!username) return;
            try {
                setIsLoading(true);
                const [userData, userPosts] = await Promise.all([
                    userApi.getByUsername(username),
                    postApi.getByUsername(username)
                ]);

                setProfileUser(userData);
                setPosts(userPosts);
            } catch (error) {
                console.error('Не вдалося завантажити профіль:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileData();
    }, [username]);

    const handlePostDeleted = (deletedPostId: string) => {
        setPosts(prev => prev.filter(post => post.id !== deletedPostId));
    };

    const handlePostUpdated = (updatedPostId: string, newContent: string) => {
        setPosts(prev => prev.map(post =>
            post.id === updatedPostId ? { ...post, content: newContent } : post
        ));
    };

    if (isLoading) {
        return <div className={styles.loading}>Завантаження профілю...</div>;
    }

    if (!profileUser) {
        return <div className={styles.placeholder}>Користувача не знайдено</div>;
    }

    const fallbackAvatar = profileUser.username.charAt(0).toUpperCase();

    const handleMessageClick = async () => {
        if (!profileUser) return;

        setIsCreatingChat(true);
        try {
            const chat = await chatApi.getOrCreate(profileUser.username);
            navigate('/chat', { state: { activeChatId: chat.id } });
        } catch (error) {
            console.error('Помилка при створенні чату:', error);
            alert('Не вдалося відкрити чат');
        } finally {
            setIsCreatingChat(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.avatarLarge}>
                    {profileUser.avatarUrl ? (
                        <img src={profileUser.avatarUrl} alt={profileUser.username} className={styles.avatarImg} />
                    ) : (
                        fallbackAvatar
                    )}
                </div>
                <h1 className={styles.username}>{profileUser.username}</h1>
                <p className={styles.email}>{profileUser.email}</p>

                <div className={styles.profileActions}>
                    {isMyProfile ? (
                        <Button
                            variant="primary"
                            size="sm"
                            rounded
                            onClick={() => alert('Модалка редагування профілю буде тут')}
                        >
                            Редагувати профіль
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="primary"
                                size="sm"
                                rounded
                                onClick={() => alert('Заглушка: Підписатись')}
                            >
                                Стежити
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                rounded
                                onClick={handleMessageClick}
                                isLoading={isCreatingChat}
                            >
                                Повідомлення
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <Tabs
                options={profileTabs}
                activeTab={activeTab}
                onChange={setActiveTab}
            />

            {activeTab === 'posts' && (
                posts.length === 0 ? (
                    <div className={styles.placeholder}>У користувача ще немає дописів.</div>
                ) : (
                    posts.map(post => (
                        <PostCard
                            key={post.id}
                            id={post.id}
                            author={{
                                id: post.author.id,
                                username: post.author.username,
                                avatarUrl: post.author.avatarUrl
                            }}
                            content={post.content}
                            createdAt={formatDate(post.createdAt)}
                            initialLikes={post.likesCount || 0}
                            initialLikedByMe={post.isLikedByMe || false}
                            onDelete={handlePostDeleted}
                            onUpdate={handlePostUpdated}
                        />
                    ))
                )
            )}

            {activeTab === 'likes' && (
                <div className={styles.placeholder}>
                    Тут будуть відображатися дописи, які вподобав користувач.
                </div>
            )}

            {activeTab === 'media' && (
                <div className={styles.placeholder}>
                    Тут будуть фото та відео користувача.
                </div>
            )}
        </div>
    );
};
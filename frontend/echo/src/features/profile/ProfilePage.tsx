import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { userApi } from '../../api/userApi';
import { postApi } from '../../api/postApi';
import { chatApi } from '../../api/chatApi';
import { followApi } from '../../api/followApi';
import type { User, PostResponse } from '../../types';
import { Button } from '../../components/Button/Button';
import { Tabs } from '../../components/Tabs/Tabs';
import { PostCard } from '../feed/PostCard';
import { formatDate } from '../../utils/formatDate';
import { EditIcon } from '../../components/Icons';
import { FollowModal } from '../../components/FollowModal/FollowModal';
import { EditProfileModal } from '../../components/EditProfileModal/EditProfileModal';
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

    const [isFollowing, setIsFollowing] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ProfileTab>('posts');

    const [isCreatingChat, setIsCreatingChat] = useState(false);

    const isMyProfile = currentUser?.username === username;

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'followers' | 'following';
        title: string;
    }>({
        isOpen: false,
        type: 'followers',
        title: ''
    });

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

                if (currentUser && currentUser.username !== username) {
                    const status = await followApi.getFollowStatus(userData.id);
                    setIsFollowing(status);
                }
            } catch (error) {
                console.error('Не вдалося завантажити профіль:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileData();
    }, [username, currentUser]);

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

    const handleFollowToggle = async () => {
        if (!profileUser) return;

        setIsFollowLoading(true);
        try {
            await followApi.toggleFollow(profileUser.id);

            setIsFollowing(prev => !prev);
            setProfileUser(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    followersCount: isFollowing
                        ? Math.max(0, prev.followersCount - 1)
                        : prev.followersCount + 1
                };
            });
        } catch (error) {
            console.error('Помилка при зміні статусу підписки:', error);
        } finally {
            setIsFollowLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.profileMain}>
                    <div className={styles.avatarLarge}>
                        {profileUser.avatarUrl ? (
                            <img src={profileUser.avatarUrl} alt={profileUser.username} className={styles.avatarImg} />
                        ) : (
                            fallbackAvatar
                        )}
                    </div>

                    <div className={styles.userInfo}>
                        <h1 className={styles.username}>{profileUser.username}</h1>
                        <p className={styles.email}>{profileUser.email}</p>

                        <div className={styles.stats}>
                            <span className={styles.statItem}>
                                <span className={styles.statNumber}>{posts.length}</span> дописів
                            </span>
                            <button
                                className={styles.statBtn}
                                onClick={() => setModalConfig({ isOpen: true, type: 'followers', title: 'Читачі' })}
                            >
                                <span className={styles.statNumber}>{profileUser.followersCount || 0}</span> читачів
                            </button>

                            <button
                                className={styles.statBtn}
                                onClick={() => setModalConfig({ isOpen: true, type: 'following', title: 'Відстежуються' })}
                            >
                                <span className={styles.statNumber}>{profileUser.followingCount || 0}</span> стежить
                            </button>
                        </div>
                        <FollowModal
                            isOpen={modalConfig.isOpen}
                            onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                            userId={profileUser.id}
                            type={modalConfig.type}
                            title={modalConfig.title}
                        />
                        {profileUser && isMyProfile && (
                            <EditProfileModal
                                isOpen={isEditModalOpen}
                                onClose={() => setIsEditModalOpen(false)}
                                user={profileUser}
                                onUpdate={(updatedUser) => setProfileUser(updatedUser)}
                            />
                        )}
                    </div>

                    {isMyProfile && (
                        <button
                            className={styles.editIconBtn}
                            onClick={() => setIsEditModalOpen(true)}
                            title="Редагувати профіль"
                        >
                            <EditIcon />
                        </button>
                    )}
                </div>

                {profileUser.bio && (
                    <div className={styles.bioContainer}>
                        <p className={styles.bio}>{profileUser.bio}</p>
                    </div>
                )}

                {!isMyProfile && (
                    <div className={styles.profileActions}>
                        <div className={styles.actionBtnWrapper}>
                            <Button
                                variant={isFollowing ? "secondary" : "primary"}
                                size="sm"
                                rounded
                                onClick={handleFollowToggle}
                                isLoading={isFollowLoading}
                            >
                                {isFollowing ? 'Відписатися' : 'Стежити'}
                            </Button>
                        </div>
                        <div className={styles.actionBtnWrapper}>
                            <Button
                                variant="primary"
                                size="sm"
                                rounded
                                onClick={handleMessageClick}
                                isLoading={isCreatingChat}
                            >
                                Повідомлення
                            </Button>
                        </div>
                    </div>
                )}
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
                            author={post.author}
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
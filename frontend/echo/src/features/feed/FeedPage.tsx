import { useState, useEffect } from 'react';
import { CreatePost } from './CreatePost';
import { PostCard } from './PostCard';
import { Tabs } from '../../components/Tabs/Tabs';
import { postApi } from '../../api/postApi';
import type { PostResponse } from '../../types';
import { formatDate } from '../../utils/formatDate';
import styles from './Feed.module.css';

type TabType = 'for-you' | 'following';

const feedTabs = [
    { id: 'for-you', label: 'Для вас' },
    { id: 'following', label: 'Відстежуються' }
] as const;

export const FeedPage = () => {
    const [activeTab, setActiveTab] = useState<TabType>('for-you');

    const [posts, setPosts] = useState<PostResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setIsLoading(true);
                const data = await postApi.getAll();
                setPosts(data);
            } catch (err) {
                console.error(err);
                setError('Не вдалося завантажити стрічку');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPosts();
    }, []);

    const handlePostCreated = (newPost: PostResponse) => {
        setPosts(prevPosts => [newPost, ...prevPosts]);
    };

    const handlePostDeleted = (deletedPostId: string) => {
        setPosts(prevPosts => prevPosts.filter(post => post.id !== deletedPostId));
    };

    const handlePostUpdated = (updatedPostId: string, newContent: string) => {
        setPosts(prevPosts => prevPosts.map(post =>
            post.id === updatedPostId
                ? { ...post, content: newContent }
                : post
        ));
    };

    return (
        <div className={styles.container}>
            <Tabs
                options={feedTabs}
                activeTab={activeTab}
                onChange={setActiveTab}
            />

            <CreatePost onPostCreated={handlePostCreated} />

            {activeTab === 'for-you' ? (
                isLoading ? (
                    <div className={styles.placeholder}>Завантаження...</div>
                ) : error ? (
                    <div className={styles.placeholder} style={{ color: 'var(--error)' }}>{error}</div>
                ) : posts.length === 0 ? (
                    <div className={styles.placeholder}>Стрічка порожня. Будьте першим, хто напише щось!</div>
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
            ) : (
                <div className={styles.placeholder}>
                    Ви поки ні за ким не стежите.<br />
                    Підпишіться на інших користувачів, щоб бачити їхні дописи тут.
                </div>
            )}
        </div>
    );
};
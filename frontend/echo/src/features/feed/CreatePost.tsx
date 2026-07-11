import React, { useState, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/Button/Button.tsx';
import { postApi } from '../../api/postApi';
import type {PostResponse} from '../../types';
import styles from './Feed.module.css';

interface CreatePostProps {
    onPostCreated: (newPost: PostResponse) => void;
}

export const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
    const { user } = useAuthStore();
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const fallbackAvatar = user?.username ? user.username.charAt(0).toUpperCase() : '?';

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    const handleSubmit = async () => {
        if (!content.trim()) return;

        setIsLoading(true);
        try {
            const newPost = await postApi.create(content);
            onPostCreated(newPost);

            setContent('');
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        } catch (error) {
            console.error('Помилка при створенні посту:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.createPostCard}>
            <div className={styles.createPostTop}>
                <div className={styles.avatar}>
                    {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.username} className={styles.avatarImg} />
                    ) : (
                        fallbackAvatar
                    )}
                </div>

                <div className={styles.textareaWrapper}>
                    <textarea
                        ref={textareaRef}
                        className={styles.textarea}
                        placeholder="Що у вас нового?"
                        value={content}
                        onChange={handleInput}
                        rows={1}
                        disabled={isLoading}
                    />
                </div>
            </div>

            <div className={styles.createPostFooter}>
                <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    rounded
                    onClick={handleSubmit}
                    disabled={!content.trim() || isLoading}
                    isLoading={isLoading}
                >
                    Опублікувати
                </Button>
            </div>
        </div>
    );
};
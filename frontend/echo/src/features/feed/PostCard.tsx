import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreIcon, HeartFilledIcon, HeartIcon } from '../../components/Icons';
import { postApi } from '../../api/postApi';
import { useAuthStore } from '../../store/useAuthStore';
import { Modal } from '../../components/Modal/Modal';
import { Button } from '../../components/Button/Button.tsx';
import styles from './Feed.module.css';

interface PostCardProps {
    id: string;
    author: { id: string; username: string; avatarUrl?: string | null };
    content: string;
    createdAt: string;
    initialLikes: number;
    initialLikedByMe: boolean;
    onDelete?: (id: string) => void;
    onUpdate?: (id: string, newContent: string) => void;
}

const MAX_POST_LENGTH = 280;

export const PostCard: React.FC<PostCardProps> = ({
                                                      id, author, content, createdAt, initialLikes, initialLikedByMe, onDelete, onUpdate
                                                  }) => {
    const { user } = useAuthStore();
    const isMyPost = user?.id === author.id;

    const [isLiked, setIsLiked] = useState(initialLikedByMe);
    const [likesCount, setLikesCount] = useState(initialLikes);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(content);
    const [isUpdating, setIsUpdating] = useState(false);
    const editTextareaRef = useRef<HTMLTextAreaElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isEditing && editTextareaRef.current) {
            editTextareaRef.current.style.height = 'auto';
            editTextareaRef.current.style.height = `${editTextareaRef.current.scrollHeight}px`;
        }
    }, [isEditing, editContent]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLikeClick = async () => {
        if (isSubmitting) return;
        const previousIsLiked = isLiked;
        const previousLikesCount = likesCount;

        setIsLiked(!isLiked);
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
        setIsSubmitting(true);

        try {
            await postApi.toggleLike(id);
        } catch {
            setIsLiked(previousIsLiked);
            setLikesCount(previousLikesCount);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = () => {
        setIsMenuOpen(false);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await postApi.delete(id);
            if (onDelete) onDelete(id);
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error('Помилка при видаленні:', error);
        }
    };

    const handleEditClick = () => {
        setIsMenuOpen(false);
        setEditContent(content);
        setIsEditing(true);
    };

    const handleSaveEdit = async () => {
        if (!editContent.trim() || editContent === content) {
            setIsEditing(false);
            return;
        }

        setIsUpdating(true);
        try {
            await postApi.update(id, editContent);
            if (onUpdate) onUpdate(id, editContent);
            setIsEditing(false);
        } catch (error) {
            console.error('Помилка при редагуванні:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleProfileClick = () => {
        navigate(`/profile/${author.username}`);
    };

    const fallbackAvatar = author.username.charAt(0).toUpperCase();
    const isLongPost = content.length > MAX_POST_LENGTH;
    const displayContent = isLongPost && !isExpanded
        ? content.slice(0, MAX_POST_LENGTH).trim() + '...'
        : content;

    return (
        <div className={styles.postCard}>
            <div className={styles.postHeader}>
                <div className={styles.authorInfo} onClick={handleProfileClick}>
                    <div className={styles.avatar}>
                        {author.avatarUrl ? (
                            <img src={author.avatarUrl} alt={author.username} className={styles.avatarImg} />
                        ) : (
                            fallbackAvatar
                        )}
                    </div>
                    <div className={styles.meta}>
                        <span className={styles.authorName}>{author.username}</span>
                        <span className={styles.postDate}>{createdAt}</span>
                    </div>
                </div>

                <div className={styles.optionsWrapper} ref={menuRef}>
                    <button
                        className={styles.optionsButton}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <MoreIcon width="20" height="20" />
                    </button>

                    {isMenuOpen && (
                        <div className={styles.dropdown}>
                            {isMyPost ? (
                                <>
                                    <Button variant="dropdownPrimary" onClick={handleEditClick}>
                                        Редагувати допис
                                    </Button>
                                    <Button variant="dropdownDanger" onClick={handleDeleteClick}>
                                        Видалити допис
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button variant="dropdownPrimary" onClick={() => setIsMenuOpen(false)}>
                                        Не цікаво в цьому дописі
                                    </Button>
                                    <Button variant="dropdownPrimary" onClick={() => setIsMenuOpen(false)}>
                                        Поскаржитись на допис
                                    </Button>
                                    <Button variant="dropdownDanger" onClick={() => setIsMenuOpen(false)}>
                                        Вимкнути сповіщення
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.postContent}>
                {isEditing ? (
                    <div className={styles.inlineEditContainer}>
                        <textarea
                            ref={editTextareaRef}
                            className={styles.inlineEditTextarea}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            disabled={isUpdating}
                        />
                        <div className={styles.inlineEditActions}>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setIsEditing(false)}
                                disabled={isUpdating}
                            >
                                Скасувати
                            </Button>

                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleSaveEdit}
                                disabled={!editContent.trim()}
                                isLoading={isUpdating}
                            >
                                Зберегти
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        {displayContent}
                        {isLongPost && (
                            <button
                                className={styles.showMoreButton}
                                onClick={() => setIsExpanded(!isExpanded)}
                            >
                                {isExpanded ? 'згорнути' : 'більше'}
                            </button>
                        )}
                    </>
                )}
            </div>

            <div className={styles.postFooter}>
                <button
                    className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`}
                    onClick={handleLikeClick}
                    disabled={isSubmitting}
                    style={{ cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                >
                    {isLiked ? <HeartFilledIcon width="18" height="18" /> : <HeartIcon width="18" height="18" />}
                    <span>{likesCount}</span>
                </button>
            </div>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Видалення допису"
                confirmText="Видалити"
                onConfirm={confirmDelete}
                isDanger={true}
            >
                Ви впевнені, що хочете назавжди видалити цей допис? Цю дію неможливо скасувати.
            </Modal>
        </div>
    );
};
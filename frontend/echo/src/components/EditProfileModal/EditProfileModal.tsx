import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../../api/userApi';
import { useAuthStore } from '../../store/useAuthStore';
import type { User } from '../../types';
import { Button } from '../Button/Button';
import { CloseIcon } from '../Icons';
import Input from '../Input/Input';
import Textarea from '../Textarea/Textarea';
import styles from './EditProfileModal.module.css';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onUpdate: (updatedUser: User) => void;
}

interface FieldErrors {
    username?: string;
    bio?: string;
    general?: string;
}

export const EditProfileModal = ({ isOpen, onClose, user, onUpdate }: EditProfileModalProps) => {
    const navigate = useNavigate();
    const { setAuth, accessToken } = useAuthStore();

    const [username, setUsername] = useState(user.username);
    const [bio, setBio] = useState(user.bio || '');
    const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');

    const [errors, setErrors] = useState<FieldErrors>({});
    const [isLoading, setIsLoading] = useState(false);

    const modalRef = useRef<HTMLDivElement>(null);

    const hasChanges = username !== user.username ||
        bio !== (user.bio || '') ||
        avatarUrl !== (user.avatarUrl || '');

    useEffect(() => {
        if (isOpen) {
            setUsername(user.username);
            setBio(user.bio || '');
            setAvatarUrl(user.avatarUrl || '');
            setErrors({});
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, user]);

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

    const validate = (): FieldErrors => {
        const newErrors: FieldErrors = {};

        if (username.length < 3 || username.length > 50) {
            newErrors.username = 'Має містити від 3 до 50 символів';
        } else if (!/^[a-z0-9_]+$/.test(username)) {
            newErrors.username = 'Тільки a-z, 0-9 та _';
        }

        if (bio && bio.length > 150) {
            newErrors.bio = 'Перевищено ліміт у 150 символів';
        }

        return newErrors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!hasChanges) {
            onClose();
            return;
        }

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            const updateData: any = {};
            if (username !== user.username) updateData.username = username;
            if (bio !== (user.bio || '')) updateData.bio = bio;
            if (avatarUrl !== (user.avatarUrl || '')) updateData.avatarUrl = avatarUrl;

            const updatedUser = await userApi.updateProfile(updateData);

            setAuth(updatedUser, accessToken!);
            onUpdate(updatedUser);
            onClose();

            if (updateData.username) {
                navigate(`/profile/${updateData.username}`, { replace: true });
            }

        } catch (err: any) {
            setErrors({ general: err.response?.data?.message || 'Помилка при оновленні профілю' });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal} ref={modalRef}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Редагувати профіль</h2>
                    <button className={styles.closeBtn} onClick={onClose} disabled={isLoading}>
                        <CloseIcon width="20" height="20" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {errors.general && <div className={styles.errorBanner}>{errors.general}</div>}

                    <Input
                        label="Посилання на аватар"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                    />

                    <Input
                        label="Нікнейм"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        error={errors.username}
                    />

                    <Textarea
                        label="Про себе"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        error={errors.bio}
                        currentLength={bio.length}
                        maxLength={150}
                    />

                    <div className={styles.footer}>
                        <Button
                            variant="primary"
                            rounded
                            fullWidth
                            type="submit"
                            isLoading={isLoading}
                            disabled={!hasChanges}
                        >
                            Зберегти
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
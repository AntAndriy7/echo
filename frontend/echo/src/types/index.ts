export type UserStatus = 'ONLINE' | 'OFFLINE' | 'AWAY';
export type UserRole = 'USER' | 'ADMIN';

export interface User {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
    bio: string | null;
    activeDaysCount: number;
    status: UserStatus;
    lastSeen: string | null;
    role: UserRole;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export interface PostAuthor {
    id: string;
    username: string;
    avatarUrl: string | null;
}

export interface PostResponse {
    id: string;
    content: string;
    author: PostAuthor;
    createdAt: string;
    likesCount: number;
    isLikedByMe: boolean;
}

export interface ChatResponse {
    id: string;
    username: string;
    avatarUrl: string | null;
    lastMessage: string;
    unreadCount: number;
    lastMessageAt: string | null;
}

export interface MessageResponse {
    id: string;
    chatId: string;
    content: string;
    senderId: string;
    senderUsername: string;
    createdAt: string;
    isRead: boolean;
}
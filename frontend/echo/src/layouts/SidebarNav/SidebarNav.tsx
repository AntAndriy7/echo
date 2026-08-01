import { NavLink } from 'react-router-dom';
import {
    FeedIcon,
    FeedFilledIcon,
    MessageIcon,
    MessageFilledIcon,
    LogoutIcon
} from '../../components/Icons.tsx';
import styles from './SidebarNav.module.css';

interface SidebarNavProps {
    hasUnread: boolean;
    onLogoutClick?: () => void;
    showLogout?: boolean;
    user?: {
        username?: string;
        email?: string;
        avatarUrl?: string | null;
    } | null;
    onProfileClick?: () => void;
}

interface SidebarButtonProps {
    to?: string;
    onClick?: () => void;
    children: React.ReactNode | ((props: { isActive: boolean }) => React.ReactNode);
}

const SidebarButton = ({ to, onClick, children }: SidebarButtonProps) => {
    if (to) {
        return (
            <NavLink
                to={to}
                className={({ isActive }) => `${styles.sidebarBtn} ${isActive ? styles.activeBtn : ''}`}
            >
                {typeof children === 'function' ? (renderProps) => children(renderProps) : children}
            </NavLink>
        );
    }

    return (
        <button onClick={onClick} className={styles.sidebarBtn}>
            {typeof children === 'function' ? children({ isActive: false }) : children}
        </button>
    );
};

export const SidebarNav = ({ hasUnread, onLogoutClick, showLogout = true, user, onProfileClick }: SidebarNavProps) => {
    const fallbackAvatar = user?.username ? user.username.charAt(0).toUpperCase() : '?';

    return (
        <>
            <div className={styles.logo}>
                e<span className={styles.logoText}>cho</span><span className={styles.logoAccent}>.</span>
            </div>

            <nav className={styles.nav}>
                <SidebarButton to="/">
                    {({ isActive }) => (
                        <>
                            <div className={styles.iconWrapper}>
                                {isActive ? <FeedFilledIcon width="20" height="20" /> : <FeedIcon width="20" height="20" />}
                            </div>
                            <span>Стрічка</span>
                        </>
                    )}
                </SidebarButton>

                <SidebarButton to="/chat">
                    {({ isActive }) => (
                        <>
                            <div className={styles.iconWrapper}>
                                {isActive ? <MessageFilledIcon width="20" height="20" /> : <MessageIcon width="20" height="20" />}
                                {hasUnread && <div className={styles.unreadBadge} />}
                            </div>
                            <span>Повідомлення</span>
                        </>
                    )}
                </SidebarButton>

                {showLogout && onLogoutClick && (
                    <SidebarButton onClick={onLogoutClick}>
                        <div className={styles.iconWrapper}>
                            <LogoutIcon width="20" height="20" />
                        </div>
                        <span>Вийти</span>
                    </SidebarButton>
                )}
            </nav>

            <div
                className={styles.profileSection}
                onClick={onProfileClick}
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
        </>
    );
};
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
}

interface SidebarButtonProps {
    to?: string;
    onClick?: () => void;
    variant?: 'default' | 'danger';
    children: React.ReactNode | ((props: { isActive: boolean }) => React.ReactNode);
}

const SidebarButton = ({ to, onClick, variant = 'default', children }: SidebarButtonProps) => {
    const isDanger = variant === 'danger';
    const baseClass = `${styles.sidebarBtn} ${isDanger ? styles.sidebarBtnDanger : styles.sidebarBtnDefault}`;

    if (to) {
        return (
            <NavLink
                to={to}
                className={({ isActive }) => `${baseClass} ${isActive ? styles.activeBtn : ''}`}
            >
                {typeof children === 'function' ? (renderProps) => children(renderProps) : children}
            </NavLink>
        );
    }

    return (
        <button onClick={onClick} className={baseClass}>
            {typeof children === 'function' ? children({ isActive: false }) : children}
        </button>
    );
};

export const SidebarNav = ({ hasUnread, onLogoutClick, showLogout = true }: SidebarNavProps) => {
    return (
        <nav className={styles.nav}>

            <SidebarButton to="/">
                {({ isActive }) => (
                    <>
                        {isActive ? <FeedFilledIcon width="20" height="20" /> : <FeedIcon width="20" height="20" />}
                        <span>Стрічка</span>
                    </>
                )}
            </SidebarButton>

            <SidebarButton to="/chat">
                {({ isActive }) => (
                    <div className={styles.chatLinkWrapper}>
                        <div className={styles.chatLinkContent}>
                            {isActive ? <MessageFilledIcon width="20" height="20" /> : <MessageIcon width="20" height="20" />}
                            <span>Повідомлення</span>
                        </div>
                        {hasUnread && <div className={styles.unreadBadge} />}
                    </div>
                )}
            </SidebarButton>

            {showLogout && onLogoutClick && (
                <SidebarButton variant="danger" onClick={onLogoutClick}>
                    <LogoutIcon width="20" height="20" />
                    <span>Вийти</span>
                </SidebarButton>
            )}

        </nav>
    );
};
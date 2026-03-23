'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import Avatar from './Avatar';
import styles from './Sidebar.module.css';

const navItems = [
  { path: '/', icon: '>', label: 'Чат' },
  { path: '/global', icon: '#', label: 'Общий' },
  { path: '/profile', icon: '@', label: 'Профиль' },
  { path: '/friends', icon: '★', label: 'Друзья' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { onlineUsers } = useSocket();

  if (!user) return null;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>◆</span>
        <span className={styles.logoText}>Nyamagram</span>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <button
            key={item.path}
            className={`${styles.navItem} ${pathname === item.path ? styles.active : ''}`}
            onClick={() => router.push(item.path)}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className={styles.onlineSection}>
        <h4 className={styles.sectionTitle}>В сети ({onlineUsers.size})</h4>
      </div>

      <div className={styles.userSection}>
        <div className={styles.userInfo} onClick={() => router.push('/profile')}>
          <Avatar src={user.avatar} alt={user.username} size="sm" online />
          <div className={styles.userDetails}>
            <span className={styles.username}>{user.username}</span>
            <span className={styles.status}>В сети</span>
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={logout} title="Выйти">
          ⨉
        </button>
      </div>
    </aside>
  );
}
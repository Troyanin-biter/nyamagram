'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import Sidebar from '@/components/Sidebar';
import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import GlassCard from '@/components/GlassCard';
import styles from './profile.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ProfileUser {
  id: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  isOnline: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const params = useParams();
  const { user: currentUser, token, updateUser } = useAuth();
  const { onlineUsers } = useSocket();
  const router = useRouter();
  
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [loading, setLoading] = useState(true);

  const isOwnProfile = !params.id || params.id === currentUser?.id;

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchProfile();
  }, [token, params.id]);

  const fetchProfile = async () => {
    try {
      const userId = params.id || currentUser?.id;
      if (!userId) return;
      
      const res = await fetch(`${API_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setProfileUser(data);
      setEditUsername(data.username);
      setEditBio(data.bio || '');
    } catch (err) {
      console.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ username: editUsername, bio: editBio })
      });
      const data = await res.json();
      setProfileUser({ ...profileUser!, ...data });
      updateUser({ username: editUsername, bio: editBio });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile');
    }
  };

  const handleFriendRequest = async () => {
    try {
      await fetch(`${API_URL}/api/friends/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId: profileUser?.id })
      });
      alert('Заявка отправлена!');
    } catch (err) {
      console.error('Failed to send friend request');
    }
  };

  if (!currentUser) return null;

  return (
    <div className={styles.layout}>
      <Sidebar />
      
      <main className={styles.main}>
        <GlassCard className={styles.profileCard}>
          {loading ? (
            <div className={styles.loading}>Загрузка...</div>
          ) : (
            <>
              <div className={styles.avatarSection}>
                <div className={styles.avatarWrapper}>
                  <Avatar 
                    src={profileUser?.avatar} 
                    alt={profileUser?.username || ''} 
                    size="xl"
                    online={isOwnProfile ? true : onlineUsers.has(profileUser?.id || '')}
                  />
                </div>
                
                {!isOwnProfile && (
                  <Button onClick={handleFriendRequest} className={styles.friendBtn}>
                    Добавить в друзья
                  </Button>
                )}
              </div>

              <div className={styles.infoSection}>
                {isEditing ? (
                  <div className={styles.editForm}>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className={styles.editInput}
                      placeholder="Имя пользователя"
                    />
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      className={styles.editTextarea}
                      placeholder="Расскажите о себе..."
                      rows={3}
                    />
                    <div className={styles.editActions}>
                      <Button onClick={handleSave}>Сохранить</Button>
                      <Button variant="ghost" onClick={() => setIsEditing(false)}>Отмена</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className={styles.username}>{profileUser?.username}</h1>
                    <p className={styles.bio}>{profileUser?.bio || 'Пока нет информации'}</p>
                    
                    <div className={styles.meta}>
                      <span className={styles.status}>
                        {isOwnProfile ? 'В сети' : (onlineUsers.has(profileUser?.id || '') ? 'В сети' : 'Не в сети')}
                      </span>
                      <span className={styles.joined}>
                        Присоединился {new Date(profileUser?.createdAt || '').toLocaleDateString()}
                      </span>
                    </div>

                    {isOwnProfile && (
                      <Button onClick={() => setIsEditing(true)} className={styles.editBtn}>
                        Редактировать профиль
                      </Button>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </GlassCard>
      </main>
    </div>
  );
}
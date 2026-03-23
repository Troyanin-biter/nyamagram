'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import Sidebar from '@/components/Sidebar';
import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import GlassCard from '@/components/GlassCard';
import styles from './friends.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface User {
  id: string;
  username: string;
  avatar: string | null;
  isOnline: boolean;
}

type TabType = 'friends' | 'requests';

export default function FriendsPage() {
  const { token, user: currentUser } = useAuth();
  const { onlineUsers } = useSocket();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<User[]>([]);
  const [requests, setRequests] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [token, router]);

  const fetchData = async () => {
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        fetch(`${API_URL}/api/friends`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/friends/requests`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setFriends(await friendsRes.json());
      setRequests(await requestsRes.json());
    } catch (err) {
      console.error('Failed to fetch friends');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (userId: string) => {
    try {
      await fetch(`${API_URL}/api/friends/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });
      fetchData();
    } catch (err) {
      console.error('Failed to accept request');
    }
  };

  const handleDecline = async (userId: string) => {
    try {
      await fetch(`${API_URL}/api/friends/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });
      fetchData();
    } catch (err) {
      console.error('Failed to decline request');
    }
  };

  if (!currentUser) return null;

  return (
    <div className={styles.layout}>
      <Sidebar />
      
      <main className={styles.main}>
        <GlassCard className={styles.card}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'friends' ? styles.active : ''}`}
              onClick={() => setActiveTab('friends')}
            >
              Друзья ({friends.length})
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'requests' ? styles.active : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              Заявки ({requests.length})
            </button>
          </div>

          <div className={styles.content}>
            {loading ? (
              <p className={styles.empty}>Загрузка...</p>
            ) : activeTab === 'friends' ? (
              friends.length === 0 ? (
                <p className={styles.empty}>Пока нет друзей. Начните добавлять!</p>
              ) : (
                <div className={styles.list}>
                  {friends.map(friend => (
                    <div key={friend.id} className={styles.item}>
                      <div
                        className={styles.itemInfo}
                        onClick={() => router.push(`/profile/${friend.id}`)}
                      >
                        <Avatar 
                          src={friend.avatar} 
                          alt={friend.username} 
                          size="md" 
                          online={onlineUsers.has(friend.id)}
                        />
                        <span className={styles.itemName}>{friend.username}</span>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => router.push(`/?user=${friend.id}`)}>
                        Написать
                      </Button>
                    </div>
                  ))}
                </div>
              )
            ) : (
              requests.length === 0 ? (
                <p className={styles.empty}>Нет новых заявок</p>
              ) : (
                <div className={styles.list}>
                  {requests.map(request => (
                    <div key={request.id} className={styles.item}>
                      <div
                        className={styles.itemInfo}
                        onClick={() => router.push(`/profile/${request.id}`)}
                      >
                        <Avatar 
                          src={request.avatar} 
                          alt={request.username} 
                          size="md" 
                          online={onlineUsers.has(request.id)}
                        />
                        <span className={styles.itemName}>{request.username}</span>
                      </div>
                      <div className={styles.actions}>
                        <Button size="sm" onClick={() => handleAccept(request.id)}>
                          Принять
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDecline(request.id)}>
                          Отклонить
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </GlassCard>
      </main>
    </div>
  );
}
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import Sidebar from '@/components/Sidebar';
import Avatar from '@/components/Avatar';
import GlassCard from '@/components/GlassCard';
import styles from './main.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface User {
  id: string;
  username: string;
  avatar: string | null;
  isOnline: boolean;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  sender: { id: string; username: string; avatar: string | null };
}

export default function ChatPage() {
  const { user, token } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchUsers();
  }, [token, router]);

  useEffect(() => {
    if (socket) {
      socket.on('new-message', (message: Message) => {
        if (
          (message.senderId === selectedUser?.id && message.receiverId === user?.id) ||
          (message.senderId === user?.id && message.receiverId === selectedUser?.id)
        ) {
          setMessages(prev => [...prev, message]);
        }
      });
      return () => { socket.off('new-message'); };
    }
  }, [socket, selectedUser, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(data);
      
      const friendsRes = await fetch(`${API_URL}/api/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const friends = await friendsRes.json();
      
      setUsers(prev => [...prev.filter(u => !friends.some((f: User) => f.id === u.id)), ...friends]);
    } catch (err) {
      console.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const selectUser = async (selectedUser: User) => {
    setSelectedUser(selectedUser);
    setMessages([]);
    
    const res = await fetch(`${API_URL}/api/messages/${selectedUser.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setMessages(data);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !socket) return;

    socket.emit('send-message', {
      receiverId: selectedUser.id,
      content: newMessage.trim()
    });
    setNewMessage('');
  };

  if (!user) return null;

  return (
    <div className={styles.layout}>
      <Sidebar />
      
      <main className={styles.main}>
        <div className={styles.usersList}>
<h2 className={styles.sectionTitle}>Сообщения</h2>
            <div className={styles.userItems}>
              {loading ? (
                <p className={styles.empty}>Загрузка...</p>
              ) : users.length === 0 ? (
                <p className={styles.empty}>Пользователей пока нет</p>
            ) : (
              users.map(u => (
                <div
                  key={u.id}
                  className={`${styles.userItem} ${selectedUser?.id === u.id ? styles.active : ''}`}
                  onClick={() => selectUser(u)}
                >
                  <Avatar src={u.avatar} alt={u.username} size="md" online={onlineUsers.has(u.id)} />
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>{u.username}</span>
                    <span className={styles.userStatus}>
                      {onlineUsers.has(u.id) ? 'В сети' : 'Не в сети'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.chatArea}>
          {selectedUser ? (
            <>
              <div className={styles.chatHeader}>
                <Avatar src={selectedUser.avatar} alt={selectedUser.username} size="md" online={onlineUsers.has(selectedUser.id)} />
                <div className={styles.chatHeaderInfo}>
                  <span className={styles.chatUserName}>{selectedUser.username}</span>
                  <span className={styles.chatUserStatus}>
                    {onlineUsers.has(selectedUser.id) ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              <div className={styles.messages}>
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`${styles.message} ${msg.senderId === user.id ? styles.sent : styles.received}`}
                  >
                    <div className={styles.messageContent}>{msg.content}</div>
                    <span className={styles.messageTime}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} className={styles.messageForm}>
                <input
                  type="text"
                  placeholder="Введите сообщение..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className={styles.messageInput}
                />
                <button type="submit" className={styles.sendButton}>➤</button>
              </form>
            </>
          ) : (
            <div className={styles.noChat}>
              <GlassCard className={styles.welcomeCard}>
                <h2>Добро пожаловать в Nyamagram</h2>
                <p>Выберите собеседника, чтобы начать общение</p>
              </GlassCard>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import Sidebar from '@/components/Sidebar';
import Avatar from '@/components/Avatar';
import GlassCard from '@/components/GlassCard';
import styles from './global.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface GlobalMessage {
  id: string;
  content: string;
  senderId: string;
  sender: { id: string; username: string; avatar: string | null };
  createdAt: string;
}

export default function GlobalChatPage() {
  const { user, token } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<GlobalMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchMessages();
  }, [token, router]);

  useEffect(() => {
    if (socket) {
      socket.on('new-global-message', (message: GlobalMessage) => {
        setMessages(prev => [...prev, message]);
      });
      return () => { socket.off('new-global-message'); };
    }
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_URL}/api/global-messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await fetch(`${API_URL}/api/global-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: newMessage.trim() })
      });
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message');
    }
  };

  if (!user) return null;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={styles.layout}>
      <Sidebar />
      
      <main className={styles.main}>
        <GlassCard className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Общий чат</h1>
            <p className={styles.subtitle}>Общайтесь со всеми участниками</p>
          </div>

          <div className={styles.messages}>
            {loading ? (
              <p className={styles.empty}>Загрузка сообщений...</p>
            ) : messages.length === 0 ? (
              <p className={styles.empty}>Пока нет сообщений. Будьте первым!</p>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`${styles.message} ${msg.senderId === user.id ? styles.own : ''}`}
                >
                  <Avatar src={msg.sender.avatar} alt={msg.sender.username} size="sm" />
                  <div className={styles.messageContent}>
                    <div className={styles.messageHeader}>
                      <span className={styles.senderName}>{msg.sender.username}</span>
                      <span className={styles.messageTime}>{formatTime(msg.createdAt)}</span>
                    </div>
                    <p className={styles.messageText}>{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className={styles.form}>
            <input
              type="text"
              placeholder="Введите сообщение..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className={styles.input}
            />
            <button type="submit" className={styles.sendButton}>➤</button>
          </form>
        </GlassCard>
      </main>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  addDoc 
} from 'firebase/firestore';
import { Message, User } from './types';
import LoginScreen from './components/LoginScreen';
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [partner, setPartner] = useState<User | null>(null);
  const [roomId, setRoomId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply dark mode theme on mount and when changed
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Load active session from local storage if exists
  useEffect(() => {
    const savedName = localStorage.getItem('chat_name');
    const savedAvatar = localStorage.getItem('chat_avatar');
    const savedRoomId = localStorage.getItem('chat_room_id');
    const savedUserId = localStorage.getItem('chat_user_id');

    if (savedName && savedAvatar && savedRoomId && savedUserId) {
      handleLogin(savedName, savedAvatar, savedRoomId, savedUserId);
    }
  }, []);

  const handleLogin = async (
    name: string, 
    avatarUrl: string, 
    selectedRoomId: string,
    existingUserId?: string
  ) => {
    setIsLoggingIn(true);
    try {
      const uId = existingUserId || localStorage.getItem('chat_user_id') || Math.random().toString(36).substring(2, 10);
      const cleanRoomId = selectedRoomId.trim().toLowerCase() || 'lobby';

      // Persist user details in localStorage
      localStorage.setItem('chat_name', name);
      localStorage.setItem('chat_avatar', avatarUrl);
      localStorage.setItem('chat_room_id', cleanRoomId);
      localStorage.setItem('chat_user_id', uId);

      setRoomId(cleanRoomId);

      const userDocId = `${cleanRoomId}_${uId}`;
      const userRef = doc(db, 'users', userDocId);

      const loggedUser: User = {
        id: uId,
        name,
        avatarUrl,
        isOnline: true,
        lastSeen: Date.now(),
        typingIn: null
      };

      await setDoc(userRef, loggedUser);
      setCurrentUser(loggedUser);
    } catch (err) {
      console.error('Failed to log in:', err);
      alert('Connection failed. Please verify your internet and try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (currentUser && roomId) {
      try {
        const userDocId = `${roomId}_${currentUser.id}`;
        const userRef = doc(db, 'users', userDocId);
        await updateDoc(userRef, {
          isOnline: false,
          lastSeen: Date.now(),
          typingIn: null
        });
      } catch (err) {
        console.warn('Failed to update offline status on logout:', err);
      }
    }

    // Clear local storage session
    localStorage.removeItem('chat_name');
    localStorage.removeItem('chat_avatar');
    localStorage.removeItem('chat_room_id');
    // Note: Keep chat_user_id to keep identity on future logins if they want

    setCurrentUser(null);
    setPartner(null);
    setRoomId('');
    setMessages([]);
  };

  // Heartbeat & Unload Listeners for presence synchronization
  useEffect(() => {
    if (!currentUser || !roomId) return;

    const userDocId = `${roomId}_${currentUser.id}`;
    const userRef = doc(db, 'users', userDocId);

    // Keep active user online with a heartbeat interval
    const heartbeat = setInterval(() => {
      updateDoc(userRef, {
        isOnline: true,
        lastSeen: Date.now()
      }).catch(err => console.warn('Heartbeat update failed:', err));
    }, 10000);

    // Mark offline before page leaves
    const handleBeforeUnload = () => {
      // Use standard sync updateDoc if possible
      updateDoc(userRef, {
        isOnline: false,
        lastSeen: Date.now(),
        typingIn: null
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser, roomId]);

  // Synchronize Users & Messages in real-time
  useEffect(() => {
    if (!currentUser || !roomId) return;

    // 1. Listen to active users in this room to find our chat partner
    const usersQuery = query(collection(db, 'users'), where('roomId', '==', roomId));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const roomUsers: User[] = [];
      snapshot.forEach((doc) => {
        roomUsers.push(doc.data() as User);
      });

      // Filter out current user and find the most active other user as partner
      const others = roomUsers.filter(u => u.id !== currentUser.id);
      if (others.length > 0) {
        // Sort by lastSeen descending to get the most recently active user
        others.sort((a, b) => b.lastSeen - a.lastSeen);
        setPartner(others[0]);
      } else {
        setPartner(null);
      }
    }, (error) => {
      console.error('Real-time users snapshot error:', error);
    });

    // 2. Listen to messages in this room
    const messagesQuery = query(collection(db, 'messages'), where('roomId', '==', roomId));
    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const roomMsgs: Message[] = [];
      snapshot.forEach((doc) => {
        roomMsgs.push({ id: doc.id, ...doc.data() } as Message);
      });

      // Sort messages chronologically in-memory to avoid needing composite indexes!
      roomMsgs.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(roomMsgs);
    }, (error) => {
      console.error('Real-time messages snapshot error:', error);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeMessages();
    };
  }, [currentUser, roomId]);

  // Handle sending a new message
  const handleSendMessage = async (
    text: string, 
    attachment?: { name: string; type: 'image' | 'file' | 'audio'; url: string; size: number; duration?: number }
  ) => {
    if (!currentUser || !roomId) return;

    try {
      const messagesRef = collection(db, 'messages');
      await addDoc(messagesRef, {
        roomId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        text,
        timestamp: Date.now(),
        ...(attachment ? { attachment } : {})
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please check connection.');
    }
  };

  // Handle updating user typing indicator status
  const handleTypingStatus = async (isTyping: boolean) => {
    if (!currentUser || !roomId) return;

    try {
      const userDocId = `${roomId}_${currentUser.id}`;
      const userRef = doc(db, 'users', userDocId);
      await updateDoc(userRef, {
        typingIn: isTyping ? roomId : null,
        typingAt: isTyping ? Date.now() : null
      });
    } catch (err) {
      console.warn('Failed to update typing status:', err);
    }
  };

  const handleToggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#eff3f6] dark:bg-[#070b13] text-zinc-800 dark:text-zinc-100 font-sans flex flex-col justify-center items-center p-0 md:p-6 transition-colors duration-500">
      {/* Background glow blobs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/15 rounded-full blur-[120px] transition-all duration-1000" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-500/15 rounded-full blur-[120px] transition-all duration-1000" />
      </div>

      <AnimatePresence mode="wait">
        {!currentUser ? (
          /* Login page */
          <motion.div
            key="login"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md z-10 p-4 flex justify-center items-center"
          >
            <LoginScreen onLogin={handleLogin} isLoggingIn={isLoggingIn} />
          </motion.div>
        ) : (
          /* Chat Interface page */
          <motion.div
            key="chat"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 w-full max-w-5xl h-screen md:h-[88vh] flex flex-col bg-white/20 dark:bg-slate-900/40 backdrop-blur-3xl rounded-none md:rounded-[32px] border-0 md:border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden transition-all duration-300"
          >
            {/* Header */}
            <ChatHeader
              currentUser={currentUser}
              partner={partner}
              roomId={roomId}
              isDarkMode={isDarkMode}
              onToggleTheme={handleToggleTheme}
              onLogout={handleLogout}
            />

            {/* Message Feed */}
            <MessageList
              messages={messages}
              currentUser={currentUser}
              partner={partner}
              isPartnerTyping={partner?.typingIn === roomId}
            />

            {/* Input Bar */}
            <MessageInput
              onSendMessage={handleSendMessage}
              onTyping={handleTypingStatus}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

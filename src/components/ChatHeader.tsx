import { Sun, Moon, LogOut, Copy, Check, Users } from 'lucide-react';
import { useState } from 'react';
import { User } from '../types';

interface ChatHeaderProps {
  currentUser: User | null;
  partner: User | null;
  roomId: string;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
}

export function renderAvatar(avatarUrl: string, sizeClass = 'w-10 h-10 text-xl rounded-full') {
  if (avatarUrl && avatarUrl.startsWith('emoji:')) {
    const parts = avatarUrl.split(':');
    const emoji = parts[1] || '😊';
    const bg = parts[2] || 'from-emerald-400 to-teal-400';
    return (
      <div className={`${sizeClass} bg-gradient-to-br ${bg} flex items-center justify-center select-none shadow-sm shrink-0 font-sans`}>
        {emoji}
      </div>
    );
  }
  return (
    <div className={`${sizeClass} bg-gradient-to-br from-zinc-400 to-zinc-500 flex items-center justify-center text-white shadow-sm font-semibold shrink-0`}>
      {avatarUrl ? avatarUrl.substring(0, 2).toUpperCase() : '👤'}
    </div>
  );
}

export default function ChatHeader({
  currentUser,
  partner,
  roomId,
  isDarkMode,
  onToggleTheme,
  onLogout,
}: ChatHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId.toUpperCase());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusText = () => {
    if (!partner) return 'Waiting for partner...';
    if (partner.typingIn === roomId) {
      return 'typing...';
    }
    if (partner.isOnline) {
      return 'Online';
    }
    
    if (partner.lastSeen) {
      const diffMs = Date.now() - partner.lastSeen;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      
      if (diffSec < 60) {
        return 'Last seen just now';
      } else if (diffMin < 60) {
        return `Last seen ${diffMin}m ago`;
      } else {
        const date = new Date(partner.lastSeen);
        return `Last seen at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
    }
    return 'Offline';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/30 dark:bg-slate-900/40 backdrop-blur-md border-b border-white/20 dark:border-white/10 px-6 py-4 shadow-sm transition-colors duration-300">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        
        {/* User Info (Left side) */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {partner ? (
            <div className="relative">
              {renderAvatar(partner.avatarUrl, "w-11 h-11 text-2xl rounded-full")}
              {partner.isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm animate-pulse" />
              )}
            </div>
          ) : (
            <div className="w-11 h-11 rounded-full bg-white/30 dark:bg-white/5 border border-white/20 dark:border-white/10 flex items-center justify-center text-zinc-500 dark:text-zinc-400 shrink-0">
              <Users className="w-5 h-5 animate-pulse-slow" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-zinc-900 dark:text-white leading-tight truncate">
              {partner ? partner.name : `Room: ${roomId.toUpperCase()}`}
            </h3>
            <p className={`text-[11px] font-medium leading-none mt-1 transition-all ${
              partner?.typingIn === roomId 
                ? 'text-emerald-500 dark:text-emerald-400 font-semibold animate-pulse' 
                : partner?.isOnline 
                  ? 'text-emerald-600 dark:text-emerald-400 font-medium' 
                  : 'text-zinc-500 dark:text-zinc-400'
            }`}>
              {getStatusText()}
            </p>
          </div>
        </div>

        {/* Room ID Badge & Actions (Right side) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Room ID Badge */}
          <button
            id="copy-room-id-btn"
            onClick={handleCopyRoomId}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-white/30 hover:bg-white/50 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-mono font-semibold rounded-xl border border-white/30 dark:border-white/10 transition-all select-none active:scale-95 cursor-pointer"
            title="Click to copy Room Code"
          >
            <span className="text-zinc-500 dark:text-zinc-400">ROOM:</span>
            <span className="uppercase text-zinc-800 dark:text-zinc-100">{roomId}</span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
            )}
          </button>

          {/* Theme Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={onToggleTheme}
            className="w-9 h-9 rounded-xl bg-white/30 hover:bg-white/50 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center text-zinc-700 dark:text-zinc-300 border border-white/20 dark:border-white/10 transition-all active:scale-95 cursor-pointer"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-400 fill-amber-400/20" /> : <Moon className="w-5 h-5 text-zinc-600 fill-zinc-100" />}
          </button>

          {/* Leave/Logout Button */}
          <button
            id="logout-btn"
            onClick={onLogout}
            className="w-9 h-9 rounded-xl bg-white/30 hover:bg-white/50 dark:bg-white/5 dark:hover:bg-white/10 hover:text-red-500 dark:hover:text-red-400 flex items-center justify-center text-zinc-700 dark:text-zinc-300 border border-white/20 dark:border-white/10 transition-all active:scale-95 cursor-pointer"
            title="Leave Chat Room"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

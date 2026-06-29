import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, Key, User as UserIcon, RefreshCw } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (name: string, avatarUrl: string, roomId: string) => void;
  isLoggingIn: boolean;
}

const PRESET_AVATARS = [
  '😊', '😎', '🐱', '🐶', '🦊', '🦁', '🦖', '🦄', '🐼', '🐨', '🤖', '👾', '🚀', '⭐', '🍀', '🍎'
];

const BG_GRADIENTS = [
  'from-pink-400 to-red-400',
  'from-orange-400 to-amber-400',
  'from-emerald-400 to-teal-400',
  'from-cyan-400 to-blue-400',
  'from-indigo-400 to-purple-400',
  'from-fuchsia-400 to-pink-400',
];

export default function LoginScreen({ onLogin, isLoggingIn }: LoginScreenProps) {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('lobby');
  const [selectedAvatarIdx, setSelectedAvatarIdx] = useState(0);
  const [selectedBgIdx, setSelectedBgIdx] = useState(0);

  const handleRandomizeRoom = () => {
    const rId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(rId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Build unique avatarUrl with base64 svg or simply a text-based styled element,
    // or we can pass a composite string that our header can parse: "emoji:😊:gradient-index"
    const avatarUrl = `emoji:${PRESET_AVATARS[selectedAvatarIdx]}:${BG_GRADIENTS[selectedBgIdx]}`;
    const cleanRoomId = roomId.trim().toLowerCase() || 'lobby';
    onLogin(name.trim(), avatarUrl, cleanRoomId);
  };

  return (
    <div className="w-full max-w-md bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[32px] shadow-2xl border border-white/25 dark:border-white/10 overflow-hidden transition-all duration-300">
      <div className="p-8 sm:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20 mb-4">
            <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Real-Time Chat Room
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">
            Enter your name and join the chat room
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
              Choose Your Avatar
            </label>
            <div className="flex flex-col items-center gap-4 p-4 bg-white/40 dark:bg-slate-950/30 rounded-2xl border border-white/20 dark:border-white/5">
              {/* Big Preview */}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${BG_GRADIENTS[selectedBgIdx]} shadow-md flex items-center justify-center text-3xl select-none animate-pulse-slow`}>
                {PRESET_AVATARS[selectedAvatarIdx]}
              </div>
              
              {/* Options lists */}
              <div className="w-full">
                <div className="text-[10px] text-center text-zinc-400 dark:text-zinc-500 mb-1">ELEGANT EMOJIS</div>
                <div className="flex justify-center flex-wrap gap-2 max-h-20 overflow-y-auto p-1 scrollbar-thin">
                  {PRESET_AVATARS.map((emoji, idx) => (
                    <button
                      key={emoji}
                      type="button"
                      id={`avatar-emoji-${idx}`}
                      onClick={() => setSelectedAvatarIdx(idx)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors ${selectedAvatarIdx === idx ? 'ring-2 ring-emerald-500 bg-white/60 dark:bg-white/10' : ''}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div className="text-[10px] text-center text-zinc-400 dark:text-zinc-500 mt-3 mb-1">COLOR PALETTES</div>
                <div className="flex justify-center gap-2">
                  {BG_GRADIENTS.map((gradient, idx) => (
                    <button
                      key={idx}
                      type="button"
                      id={`avatar-bg-${idx}`}
                      onClick={() => setSelectedBgIdx(idx)}
                      className={`w-6 h-6 rounded-full bg-gradient-to-br ${gradient} hover:scale-110 transition-transform ${selectedBgIdx === idx ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Display Name Input */}
          <div className="space-y-1.5">
            <label htmlFor="display-name" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
              Display Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500 dark:text-zinc-400">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                id="display-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name (e.g., Sarah)"
                className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-slate-950/40 hover:bg-white/60 dark:hover:bg-slate-950/60 text-zinc-900 dark:text-white rounded-2xl border border-white/30 dark:border-white/10 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium text-sm"
                maxLength={20}
              />
            </div>
          </div>

          {/* Room Code Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="room-code" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Room ID / Code
              </label>
              <button
                type="button"
                id="randomize-room-btn"
                onClick={handleRandomizeRoom}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Generate Random
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500 dark:text-zinc-400">
                <Key className="w-4 h-4" />
              </span>
              <input
                id="room-code"
                type="text"
                required
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="lobby"
                className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-slate-950/40 hover:bg-white/60 dark:hover:bg-slate-950/60 text-zinc-900 dark:text-white rounded-2xl border border-white/30 dark:border-white/10 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono text-sm uppercase"
                maxLength={12}
              />
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
              Enter the same Room ID on another device or window to chat together instantly.
            </p>
          </div>

          {/* Submit Button */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={isLoggingIn || !name.trim()}
            className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white font-medium rounded-2xl shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 text-sm cursor-pointer"
          >
            {isLoggingIn ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Join Room
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

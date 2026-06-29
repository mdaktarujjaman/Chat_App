import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize2, X, Check, CheckCheck } from 'lucide-react';
import { Message, User } from '../types';
import { renderAvatar } from './ChatHeader';
import AudioPlayer from './AudioPlayer';
import FileCard from './FileCard';

interface MessageListProps {
  messages: Message[];
  currentUser: User | null;
  partner: User | null;
  isPartnerTyping: boolean;
}

export default function MessageList({
  messages,
  currentUser,
  partner,
  isPartnerTyping,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxName, setLightboxName] = useState('');

  // Auto-scroll to the bottom of the list when new messages or typing state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

  const formatMessageTime = (timestamp: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleOpenLightbox = (url: string, name: string) => {
    setLightboxUrl(url);
    setLightboxName(name);
  };

  const handleCloseLightbox = () => {
    setLightboxUrl(null);
    setLightboxName('');
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 bg-transparent transition-colors duration-300 relative scrollbar-thin scroll-smooth">
      {/* Background WhatsApp Doodle Motif Overlay (Generated in Tailwind via CSS opacity) */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.015] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="max-w-4xl mx-auto space-y-4 relative z-10">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            /* Empty Chat State */
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-20 h-20 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full flex items-center justify-center text-4xl mb-4 shadow-inner border border-emerald-500/20">
                💬
              </div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                End-to-End Chat Room Connected
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-2 max-w-sm">
                No messages yet. Send a greetings text, an image, a file card, or press and hold the mic to record a voice message!
              </p>
            </motion.div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUser?.id;
              
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className={`flex items-end gap-2 w-full ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Left avatar for other users */}
                  {!isMe && partner && (
                    <div className="shrink-0 mb-1">
                      {renderAvatar(partner.avatarUrl, "w-8 h-8 text-sm rounded-full")}
                    </div>
                  )}

                  {/* Message Bubble Column */}
                  <div className="flex flex-col max-w-[80%] sm:max-w-[70%]">
                    {/* Bubble */}
                    <div
                      className={`px-4 py-2.5 shadow-sm relative backdrop-blur-md border ${
                        isMe
                          ? 'bg-emerald-500/20 dark:bg-emerald-500/15 border-emerald-500/30 dark:border-emerald-500/20 text-zinc-900 dark:text-white rounded-[20px] rounded-br-sm'
                          : 'bg-white/45 dark:bg-slate-900/45 border-white/30 dark:border-white/5 text-zinc-900 dark:text-zinc-100 rounded-[20px] rounded-bl-sm'
                      }`}
                    >
                      {/* Name for received message */}
                      {!isMe && (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                          {msg.senderName}
                        </span>
                      )}

                      {/* Attachment Rendering */}
                      {msg.attachment && (
                        <div className="mb-2 rounded-xl overflow-hidden">
                          {msg.attachment.type === 'image' && (
                            <div className="relative group overflow-hidden rounded-xl border border-white/20 dark:border-white/5 bg-white/20 dark:bg-slate-950/20 shadow-sm max-w-[240px] sm:max-w-[280px]">
                              <img
                                src={msg.attachment.url}
                                alt={msg.attachment.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-auto max-h-[220px] object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                                onClick={() => handleOpenLightbox(msg.attachment!.url, msg.attachment!.name)}
                              />
                              <button
                                id={`lightbox-trigger-${msg.id}`}
                                onClick={() => handleOpenLightbox(msg.attachment!.url, msg.attachment!.name)}
                                className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity active:scale-95 cursor-pointer"
                              >
                                <Maximize2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}

                          {msg.attachment.type === 'file' && (
                            <FileCard
                              name={msg.attachment.name}
                              size={msg.attachment.size}
                              url={msg.attachment.url}
                            />
                          )}

                          {msg.attachment.type === 'audio' && (
                            <AudioPlayer
                              src={msg.attachment.url}
                              duration={msg.attachment.duration}
                            />
                          )}
                        </div>
                      )}

                      {/* Message Text */}
                      {msg.text && (
                        <p className="text-sm leading-relaxed playbook-message-text whitespace-pre-wrap break-words pr-2">
                          {msg.text}
                        </p>
                      )}

                      {/* Time and Checkmarks Footer */}
                      <div className="flex items-center justify-end gap-1 mt-1 leading-none text-right">
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                          {formatMessageTime(msg.timestamp)}
                        </span>
                        {isMe && (
                          <span className="text-emerald-600 dark:text-emerald-400 shrink-0">
                            {partner?.isOnline ? (
                              <CheckCheck className="w-3.5 h-3.5" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}

          {/* typing status bubble bottom */}
          {isPartnerTyping && partner && (
            <motion.div
              key="typing-indicator"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-end gap-2 w-full justify-start"
            >
              <div className="shrink-0 mb-1">
                {renderAvatar(partner.avatarUrl, "w-8 h-8 text-sm rounded-full")}
              </div>
              <div className="bg-white/40 dark:bg-slate-900/40 border border-white/20 dark:border-white/5 backdrop-blur-md rounded-[20px] rounded-bl-sm px-4 py-3 shadow-sm max-w-[120px]">
                <div className="flex items-center gap-1.5 h-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Full-Screen Lightbox Image Overlay */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-md"
          >
            {/* Close buttons */}
            <button
              id="close-lightbox-btn"
              onClick={handleCloseLightbox}
              className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors active:scale-95"
              title="Close image"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Img frame */}
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="max-w-full max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl relative border border-white/10"
            >
              <img
                src={lightboxUrl}
                alt={lightboxName}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[80vh] object-contain"
              />
            </motion.div>
            
            <p className="text-zinc-400 text-sm mt-4 font-medium truncate max-w-md text-center">
              {lightboxName}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

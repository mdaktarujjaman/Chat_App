export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  isOnline: boolean;
  lastSeen: number; // timestamp
  typingIn: string | null; // room ID or null
  typingAt?: number; // timestamp
}

export type AttachmentType = 'image' | 'file' | 'audio';

export interface Attachment {
  name: string;
  type: AttachmentType;
  url: string;
  size: number;
  duration?: number; // for audio
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  attachment?: Attachment;
}

export interface Room {
  id: string;
  users: string[]; // list of user IDs
}

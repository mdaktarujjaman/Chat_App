import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Send, Mic, Square, X, Check, Loader2 } from 'lucide-react';
import { uploadFile } from '../utils/uploader';
import { formatDuration } from '../utils/fileUtils';

interface MessageInputProps {
  onSendMessage: (text: string, attachment?: { name: string; type: 'image' | 'file' | 'audio'; url: string; size: number; duration?: number }) => void;
  onTyping: (isTyping: boolean) => void;
}

export default function MessageInput({ onSendMessage, onTyping }: MessageInputProps) {
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState('');

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [liveMicLevels, setLiveMicLevels] = useState<number[]>([10, 15, 10, 20, 10]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Clean up timers and recording animations
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Handle typing status updates
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    
    // Trigger typing state
    onTyping(true);
    
    // Clear existing timer
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    
    // Set timer to clear typing state after 3 seconds of inactivity
    typingTimerRef.current = setTimeout(() => {
      onTyping(false);
    }, 3000);
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isUploading || isRecording) return;
    
    onSendMessage(text.trim());
    setText('');
    onTyping(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  };

  // Trigger hidden file picker
  const handleTriggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection and uploading
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    // Keep files under 10MB just for performance, though Base64 fallback compress images anyway
    if (file.size > 10 * 1024 * 1024) {
      alert('File is too large. Please select a file smaller than 10MB.');
      return;
    }

    setUploadFileName(file.name);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const type = file.type.startsWith('image/') ? 'image' : 'file';
      const downloadUrl = await uploadFile(file, file.name, (prog) => {
        setUploadProgress(prog);
      });

      onSendMessage('', {
        name: file.name,
        type: type,
        url: downloadUrl,
        size: file.size
      });
    } catch (err) {
      console.error('File upload failed', err);
      alert('Failed to send file. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Voice recording: start
  const handleStartRecording = async () => {
    if (isRecording) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all track streams to release the mic
        stream.getTracks().forEach(track => track.stop());

        // Cancel mic level animation
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioCtxRef.current) {
          audioCtxRef.current.close().catch(() => {});
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Start live mic level visualization
      setupMicAudioAnalysis(stream);

    } catch (err) {
      console.error('Error starting audio recording:', err);
      alert('Could not access microphone. Please check system permissions.');
    }
  };

  // Set up real AudioContext analysis for true live waveform
  const setupMicAudioAnalysis = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 32; // small for snappy levels
      source.connect(analyser);
      
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevels = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Map frequency bins to heights (5 bars)
        const levels: number[] = [];
        const step = Math.max(1, Math.floor(bufferLength / 5));
        
        for (let i = 0; i < 5; i++) {
          const val = dataArray[i * step] || 0;
          // Scale to percentage height (between 10% and 100%)
          levels.push(Math.max(12, Math.round((val / 255) * 100)));
        }
        
        // Mirror the bars for a neat symmetrical look
        setLiveMicLevels([...levels].reverse().concat(levels));
        animationFrameRef.current = requestAnimationFrame(updateLevels);
      };

      updateLevels();
    } catch (e) {
      console.warn('Real audio analyzer not supported, using fallback visualizer', e);
      // Fallback: animated levels
      let interval = setInterval(() => {
        setLiveMicLevels(Array.from({ length: 10 }, () => Math.floor(Math.random() * 80) + 20));
      }, 100);
      
      audioChunksRef.current.push = new Proxy(audioChunksRef.current.push, {
        apply(target, thisArg, argList) {
          clearInterval(interval);
          return Reflect.apply(target, thisArg, argList);
        }
      });
    }
  };

  // Voice recording: cancel/throw away
  const handleCancelRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) return;

    // Reset recorder onstop to not save
    mediaRecorderRef.current.onstop = () => {
      // Clear tracks
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setRecordingTime(0);
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  // Voice recording: stop and send
  const handleStopAndSendRecording = async () => {
    if (!isRecording || !mediaRecorderRef.current) return;

    const finalDuration = recordingTime;

    // Trigger promise on stop completion
    const voiceSendPromise = new Promise<void>((resolve, reject) => {
      if (!mediaRecorderRef.current) return;
      
      mediaRecorderRef.current.onstop = async () => {
        // Release mic stream tracks
        if (mediaRecorderRef.current?.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }

        // Bundle audio chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const voiceFileName = `voice_note_${Date.now()}.webm`;

        setUploadFileName('Recording Voice Note');
        setIsUploading(true);
        setUploadProgress(10);

        try {
          // Upload audio file
          const downloadUrl = await uploadFile(audioBlob, voiceFileName, (prog) => {
            setUploadProgress(prog);
          });

          onSendMessage('', {
            name: voiceFileName,
            type: 'audio',
            url: downloadUrl,
            size: audioBlob.size,
            duration: finalDuration
          });
          resolve();
        } catch (err) {
          console.error('Failed to send voice recording', err);
          alert('Could not upload voice note. Please try again.');
          reject(err);
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
          setUploadFileName('');
        }
      };
    });

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setRecordingTime(0);

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    await voiceSendPromise;
  };

  return (
    <div className="bg-white/30 dark:bg-slate-900/40 backdrop-blur-md border-t border-white/20 dark:border-white/10 px-6 py-4 pb-safe shadow-md transition-colors duration-300">
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        {/* Upload Progress Bar Overlay */}
        {isUploading && (
          <div className="flex items-center gap-3 bg-emerald-500/10 dark:bg-emerald-950/20 px-3 py-2 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">Uploading {uploadFileName}...</p>
              <div className="w-full bg-emerald-200 dark:bg-emerald-900/60 h-1.5 rounded-full mt-1 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-150" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
            <span className="font-mono text-[10px] font-bold shrink-0">{uploadProgress}%</span>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          id="chat-file-input"
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,application/pdf,.docx,.doc,.txt,.zip,.rar"
        />

        {/* Active Typing & Controls Layout */}
        <div className="flex items-center gap-2">
          {isRecording ? (
            /* Voice Recording Panel */
            <div className="flex-1 flex items-center justify-between bg-red-500/10 dark:bg-red-950/20 px-4 py-2.5 rounded-2xl border border-red-500/20">
              <div className="flex items-center gap-3">
                {/* Pulsing red dot */}
                <div className="w-3 h-3 rounded-full bg-red-500 animate-ping shadow" />
                
                {/* Timer */}
                <span className="text-sm font-semibold text-red-600 dark:text-red-400 font-mono">
                  {formatDuration(recordingTime)}
                </span>

                {/* Real Moving Waveform */}
                <div className="flex items-center gap-[2px] h-6 px-2">
                  {liveMicLevels.map((val, idx) => (
                    <div
                      key={idx}
                      className="w-[2.5px] bg-red-400 dark:bg-red-500 rounded-full transition-all duration-100"
                      style={{ height: `${val}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Recording Controls */}
              <div className="flex items-center gap-2">
                <button
                  id="cancel-record-btn"
                  type="button"
                  onClick={handleCancelRecording}
                  className="w-9 h-9 bg-white/50 dark:bg-zinc-800 hover:bg-white/80 dark:hover:bg-zinc-700 text-red-500 dark:text-red-400 rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-all cursor-pointer"
                  title="Cancel and Delete"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  id="stop-record-btn"
                  type="button"
                  onClick={handleStopAndSendRecording}
                  className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
                  title="Stop and Send"
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            /* Normal Typing Input */
            <form onSubmit={handleSendText} className="flex-1 flex items-center gap-2 min-w-0">
              {/* Clip / Attachment Button */}
              <button
                id="attachment-btn"
                type="button"
                onClick={handleTriggerFilePicker}
                disabled={isUploading}
                className="w-11 h-11 bg-white/30 hover:bg-white/50 dark:bg-white/5 dark:hover:bg-white/10 disabled:opacity-50 text-zinc-700 dark:text-zinc-300 rounded-2xl flex items-center justify-center shrink-0 transition-colors active:scale-95 border border-white/20 dark:border-white/10 cursor-pointer"
                title="Attach image or file"
              >
                <Paperclip className="w-5 h-5 rotate-45" />
              </button>

              {/* Text Input */}
              <div className="flex-1 relative min-w-0">
                <input
                  id="chat-message-input"
                  type="text"
                  value={text}
                  onChange={handleTextChange}
                  disabled={isUploading}
                  placeholder="Type a message..."
                  className="w-full pl-4 pr-4 py-3 bg-white/40 dark:bg-slate-950/40 hover:bg-white/60 dark:hover:bg-slate-950/60 disabled:opacity-75 text-zinc-900 dark:text-white rounded-2xl border border-white/30 dark:border-white/10 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium text-sm"
                />
              </div>

              {/* Send or Voice Button */}
              {text.trim() ? (
                /* Text Send Button */
                <button
                  id="send-message-btn"
                  type="submit"
                  disabled={isUploading}
                  className="w-11 h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                  title="Send message"
                >
                  <Send className="w-4.5 h-4.5 fill-current" />
                </button>
              ) : (
                /* Microphone Record Button */
                <button
                  id="record-audio-btn"
                  type="button"
                  onClick={handleStartRecording}
                  disabled={isUploading}
                  className="w-11 h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                  title="Record voice message"
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

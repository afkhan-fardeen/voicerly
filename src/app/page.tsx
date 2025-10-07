"use client";

import React, { useState, useRef, useCallback, useMemo, Suspense, lazy, useEffect } from "react";
import Navigation from "@/components/Navigation";

// Lazy load heavy components for better initial load performance
const LazyQRCode = lazy(() => import("qrcode.react").then(module => ({ default: module.QRCodeSVG })));

// Social Share Component - loaded lazily when needed
const LazySocialShareComponent = lazy(async () => {
  const reactShareModule = await import("react-share");
  return {
    default: function SocialShareComponent({ url }: { url: string }) {
      const {
        FacebookShareButton, FacebookIcon,
        TwitterShareButton, TwitterIcon,
        LinkedinShareButton, LinkedinIcon,
        WhatsappShareButton, WhatsappIcon,
        EmailShareButton, EmailIcon
      } = reactShareModule;

      return (
        <div className="flex justify-center space-x-4">
          <FacebookShareButton url={url}>
            <FacebookIcon size={40} round />
          </FacebookShareButton>
          <TwitterShareButton url={url}>
            <TwitterIcon size={40} round />
          </TwitterShareButton>
          <LinkedinShareButton url={url}>
            <LinkedinIcon size={40} round />
          </LinkedinShareButton>
          <WhatsappShareButton url={url}>
            <WhatsappIcon size={40} round />
          </WhatsappShareButton>
          <EmailShareButton url={url}>
            <EmailIcon size={40} round />
          </EmailShareButton>
        </div>
      );
    }
  };
});

// Loading component for lazy loaded elements
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  </div>
);

interface ErrorState {
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'record' | 'upload'>('record');
  const [recording, setRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordAudioURL, setRecordAudioURL] = useState<string | null>(null);
  const [recordShareLink, setRecordShareLink] = useState<string | null>(null);
  const [showRecordShareOptions, setShowRecordShareOptions] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadAudioURL, setUploadAudioURL] = useState<string | null>(null);
  const [uploadShareLink, setUploadShareLink] = useState<string | null>(null);
  const [showUploadShareOptions, setShowUploadShareOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string>('');

  // Memoize supported MIME types
  const supportedTypes = useMemo(() => [
    'audio/mp4;codecs=mp4a.40.2',
    'audio/mp4',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/wav'
  ], []);

  // Persist share links in localStorage
  useEffect(() => {
    const savedRecordLink = localStorage.getItem('recordShareLink');
    const savedUploadLink = localStorage.getItem('uploadShareLink');
    
    if (savedRecordLink) {
      setRecordShareLink(savedRecordLink);
      setShowRecordShareOptions(true);
    }
    if (savedUploadLink) {
      setUploadShareLink(savedUploadLink);
      setShowUploadShareOptions(true);
    }
  }, []);

  // Cleanup MediaRecorder on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        mediaRecorderRef.current = null;
      }
    };
  }, []);

  const resetAdvancedOptions = useCallback(() => {
    setShowQRCode(false);
    setShowEmbedCode(false);
    setCopyFeedback('');
  }, []);

  const showError = useCallback((message: string, type: ErrorState['type'] = 'error') => {
    setError({ message, type });
    setTimeout(() => setError(null), 5000);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      clearError();
      
      // Check for MediaRecorder support
      if (!window.MediaRecorder) {
        showError("Your browser doesn't support audio recording. Please use a modern browser.", 'error');
        return;
      }

      // Check for mediaDevices support (iOS Safari compatibility)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showError("Microphone access is not available. Please use HTTPS or a supported browser.", 'error');
        return;
      }

      // Check if we're on HTTPS (required for iOS Safari)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        showError("Microphone access requires HTTPS. Please use a secure connection.", 'error');
        return;
      }

      // Detect iOS Safari for simplified constraints
      const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      
      let stream: MediaStream;
      
      if (isIOSSafari) {
        // Use simplified constraints for iOS Safari
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            } 
          });
        } catch (iosError) {
          console.log("iOS Safari advanced constraints failed, trying basic:", iosError);
          // Fallback to most basic constraints for iOS
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
      } else {
        // Use advanced constraints for other browsers
        const audioConstraints = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1,
          sampleSize: 16,
          latency: 0.01
        };

        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
        } catch (constraintError) {
          console.log("Advanced constraints failed, trying basic constraints:", constraintError);
          stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        }
      }

      let mimeType = '';
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      if (!mimeType) {
        showError("Your browser doesn't support audio recording. Please use a modern browser.", 'error');
        return;
      }

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = handleRecordStop;
      mediaRecorderRef.current.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        showError("Recording failed. Please try again.", 'error');
        setRecording(false);
        setIsPaused(false);
      };

      mediaRecorderRef.current.start(1000);
      setRecording(true);
      setIsPaused(false);
      setRecordedBlob(null);
      setRecordAudioURL(null);
      setRecordShareLink(null);
      setShowRecordShareOptions(false);
    } catch (error) {
      console.error("Error starting recording:", error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          showError("Microphone access denied. Please allow microphone access in your browser settings and try again.", 'error');
        } else if (error.name === 'NotFoundError') {
          showError("No microphone found. Please connect a microphone and try again.", 'error');
        } else if (error.name === 'NotSupportedError') {
          showError("Microphone access is not supported. Please use HTTPS or a supported browser.", 'error');
        } else if (error.name === 'SecurityError') {
          showError("Microphone access blocked by security settings. Please use HTTPS and allow microphone access.", 'error');
        } else {
          showError(`Could not access microphone: ${error.message}. Please check your device settings.`, 'error');
        }
      } else {
        showError("Could not access microphone. Please check permissions and try again.", 'error');
      }
    }
  }, [showError, supportedTypes, clearError]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && recording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  }, [recording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && recording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  }, [recording, isPaused]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setIsPaused(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  }, [recording]);

  const handleRecordStop = useCallback(() => {
    try {
      if (audioChunksRef.current.length === 0) {
        showError("No audio data recorded. Please try again.", 'warning');
        return;
      }

      const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

      if (audioBlob.size === 0) {
        showError("Recording is empty. Please try again.", 'warning');
        return;
      }

      setRecordedBlob(audioBlob);
      setRecordAudioURL(URL.createObjectURL(audioBlob));
      audioChunksRef.current = [];
    } catch (error) {
      console.error("Error processing recording:", error);
      showError("Failed to process recording. Please try again.", 'error');
    }
  }, [showError]);

  const retakeRecording = useCallback((startNew: boolean = false) => {
    setRecordedBlob(null);
    setRecordAudioURL(null);
    setRecordShareLink(null);
    setShowRecordShareOptions(false);
    setIsPaused(false);
    localStorage.removeItem('recordShareLink');
    resetAdvancedOptions();
    if (startNew) {
      startRecording();
    }
  }, [resetAdvancedOptions, startRecording]);

  const saveAndShareRecording = useCallback(async () => {
    if (!recordedBlob) {
      showError("No recording to save. Please record audio first.", 'warning');
      return;
    }

    setIsUploading(true);
    clearError();

    try {
      const link = await uploadAudio(recordedBlob);
      if (link) {
        setRecordShareLink(link);
        setShowRecordShareOptions(true);
        localStorage.setItem('recordShareLink', link);
        showError("Audio link generated successfully!", 'success');
      }
    } catch (error) {
      console.error("Error saving recording:", error);
      showError("Failed to save recording. Please try again.", 'error');
    } finally {
      setIsUploading(false);
    }
  }, [recordedBlob, showError, clearError]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadAudioURL(URL.createObjectURL(file));
      setUploadShareLink(null);
      setShowUploadShareOptions(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, []);

  const uploadAndShare = useCallback(async () => {
    if (!uploadFile) {
      showError("No file selected. Please choose an audio file first.", 'warning');
      return;
    }

    setIsUploading(true);
    clearError();

    try {
      const link = await uploadAudio(uploadFile);
      if (link) {
        setUploadShareLink(link);
        setShowUploadShareOptions(true);
        localStorage.setItem('uploadShareLink', link);
        showError("Audio link generated successfully!", 'success');
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      showError("Failed to upload file. Please try again.", 'error');
    } finally {
      setIsUploading(false);
    }
  }, [uploadFile, showError, clearError]);

  const reupload = useCallback((startNew: boolean = false) => {
    setUploadFile(null);
    setUploadAudioURL(null);
    setUploadShareLink(null);
    setShowUploadShareOptions(false);
    localStorage.removeItem('uploadShareLink');
    resetAdvancedOptions();
    if (startNew && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [resetAdvancedOptions]);

  const uploadAudio = useCallback(async (file: Blob | File): Promise<string | null> => {
    const formData = new FormData();
    const audioFile = new File([file], `recording-${Date.now()}.${file.type.split('/')[1] || 'webm'}`, {
      type: file.type || 'audio/webm'
    });
    formData.append("audio", audioFile);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data.url) {
        throw new Error("No URL returned from server");
      }
      return data.url;
    } catch (error) {
      console.error("Upload error:", error);
      if (error instanceof Error) {
        if (error.message.includes("Rate limit")) {
          showError("Upload limit reached. Please try again later.", 'warning');
        } else if (error.message.includes("File too large")) {
          showError("File is too large. Maximum size is 10MB.", 'error');
        } else if (error.message.includes("Invalid file")) {
          showError("Invalid file format. Please upload a valid audio file.", 'error');
        } else if (error.message.includes("File is empty")) {
          showError("Recording is empty. Please try recording again.", 'error');
        } else {
          showError(`Upload failed: ${error.message}`, 'error');
        }
      } else {
        showError("Failed to upload audio. Please check your connection and try again.", 'error');
      }
      throw error;
    }
  }, [showError]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      // Check if we're in a secure context (HTTPS or localhost)
      if (!window.isSecureContext) {
        throw new Error('Clipboard requires secure context');
      }

      // Modern Clipboard API (preferred method)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopyFeedback("Link copied to clipboard!");
        showError("Link copied to clipboard!", 'success');
        setTimeout(() => setCopyFeedback(''), 2000);
        return;
      }

      // Fallback method for older browsers or restricted environments
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      
      // Focus and select the text
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, 99999); // For mobile devices
      
      // Try to copy using execCommand
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopyFeedback("Link copied to clipboard!");
        showError("Link copied to clipboard!", 'success');
        setTimeout(() => setCopyFeedback(''), 2000);
      } else {
        throw new Error('execCommand failed');
      }
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      
      // Show the text for manual copying on mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Create a modal-like overlay for mobile users to manually copy
        const overlay = document.createElement('div');
        overlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
          box-sizing: border-box;
        `;
        
        const modal = document.createElement('div');
        modal.style.cssText = `
          background: white;
          padding: 20px;
          border-radius: 12px;
          max-width: 90%;
          text-align: center;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        `;
        
        modal.innerHTML = `
          <h3 style="margin: 0 0 15px 0; color: #333;">Copy Link</h3>
          <input type="text" value="${text}" readonly style="
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            margin-bottom: 15px;
            box-sizing: border-box;
          " id="copyInput">
          <div>
            <button onclick="
              document.getElementById('copyInput').select();
              document.getElementById('copyInput').setSelectionRange(0, 99999);
              document.execCommand('copy');
              this.textContent = 'Copied!';
              setTimeout(() => document.body.removeChild(document.getElementById('copyOverlay')), 1000);
            " style="
              background: #007AFF;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 6px;
              margin-right: 10px;
              cursor: pointer;
            ">Copy</button>
            <button onclick="document.body.removeChild(document.getElementById('copyOverlay'))" style="
              background: #666;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 6px;
              cursor: pointer;
            ">Close</button>
          </div>
        `;
        
        overlay.id = 'copyOverlay';
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Auto-select the text
        setTimeout(() => {
          const input = document.getElementById('copyInput') as HTMLInputElement;
          if (input) {
            input.focus();
            input.select();
            input.setSelectionRange(0, 99999);
          }
        }, 100);
      } else {
        showError("Failed to copy link. Please copy manually from the address bar.", 'warning');
      }
    }
  }, [showError]);

  const getEmbedCode = useCallback((url: string) => {
    return `<audio controls src="${url}"></audio>`;
  }, []);

  const getErrorColor = useCallback((type: ErrorState['type']) => {
    switch (type) {
      case 'error': return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20 border-red-200 dark:border-red-500/30';
      case 'warning': return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-500/30';
      case 'info': return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20 border-blue-200 dark:border-blue-500/30';
      case 'success': return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20 border-green-200 dark:border-green-500/30';
      default: return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20 border-red-200 dark:border-red-500/30';
    }
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />
      <main>
        <section className="py-14 sm:py-16 bg-white dark:bg-black">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl sm:text-6xl font-light text-black dark:text-white mb-3 tracking-tight">
                Record & share
                <span className="block text-blue-600 dark:text-orange-400 font-normal">audio instantly</span>
              </h1>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                Capture or upload audio from any device and get a secure link to share or embed.
              </p>
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {error && (
            <div className={`mb-8 p-4 rounded-lg border ${getErrorColor(error.type)} transition-all duration-300`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {error.type === 'error' && (
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  {error.type === 'success' && (
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {error.type === 'warning' && (
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  {error.type === 'info' && (
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium">{error.message}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={clearError}
                    className="inline-flex text-current hover:opacity-75 focus:outline-none transition-opacity"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center mb-2">
            <div className="inline-flex bg-gray-100/70 dark:bg-white/5 rounded-xl p-1 border border-gray-200/60 dark:border-white/10">
              <button
                onClick={() => {
                  setActiveTab('record');
                  resetAdvancedOptions();
                }}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'record'
                    ? 'bg-[var(--color-primary)] text-white dark:text-black shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white'
                }`}
              >
                Record
              </button>
              <button
                onClick={() => {
                  setActiveTab('upload');
                  resetAdvancedOptions();
                }}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'upload'
                    ? 'bg-[var(--color-primary)] text-white dark:text-black shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white'
                }`}
              >
                Upload
              </button>
            </div>
          </div>

          <section id="core-interface" className="space-y-8 mb-16">
            {activeTab === 'record' && !showRecordShareOptions && (
              <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-xl p-5 sm:p-6 md:p-8 border border-gray-200/60 dark:border-white/10 shadow-sm">
                <div className="text-center">
                  {!recording && !recordedBlob && (
                    <div className="space-y-6">
                      <p className="text-gray-600 dark:text-gray-400">Start a new recording</p>
                      <button
                        onClick={startRecording}
                        className="px-8 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white dark:text-black rounded-lg transition"
                      >
                        Start Recording
                      </button>
                      {/* iOS Safari Help */}
                      <div className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                        <p className="mb-1">📱 <strong>iOS Safari users:</strong></p>
                        <p>If microphone access fails, please:</p>
                        <ul className="text-left mt-2 space-y-1">
                          <li>• Ensure you're using HTTPS</li>
                          <li>• Allow microphone when prompted</li>
                          <li>• Check Settings → Safari → Microphone</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {recording && (
                    <div className="space-y-5">
                      <div className="flex justify-center items-center gap-2 text-red-600">
                        <span className="inline-block h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse"></span>
                        <span className="text-sm">{isPaused ? 'Paused' : 'Recording…'}</span>
                      </div>
                      <div className="flex gap-3 justify-center">
                        {!isPaused ? (
                          <button
                            onClick={pauseRecording}
                            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition"
                          >
                            Pause
                          </button>
                        ) : (
                          <button
                            onClick={resumeRecording}
                            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
                          >
                            Resume
                          </button>
                        )}
                        <button
                          onClick={stopRecording}
                          className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                        >
                          Stop
                        </button>
                      </div>
                    </div>
                  )}

                  {recordedBlob && recordAudioURL && !isUploading && (
                    <div className="space-y-5">
                      <audio controls src={recordAudioURL} className="w-full rounded-lg" />
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={() => retakeRecording(true)}
                          className="px-5 py-2.5 bg-white/60 dark:bg-white/10 text-black dark:text-white rounded-lg border border-gray-200/60 dark:border-white/15 hover:bg-white/80 dark:hover:bg-white/20 transition"
                        >
                          Retake
                        </button>
                        <button
                          onClick={saveAndShareRecording}
                          disabled={isUploading}
                          className="px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:bg-gray-300 disabled:cursor-not-allowed text-white dark:text-black rounded-lg transition flex items-center gap-2"
                        >
                          {isUploading ? (
                            <>
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              <span>Saving…</span>
                            </>
                          ) : (
                            'Save & Share'
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {isUploading && (
                    <div className="space-y-5 text-center">
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin h-8 w-8 text-[var(--color-primary)]" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">Generating share link...</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'upload' && !showUploadShareOptions && (
              <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-xl p-5 sm:p-6 md:p-8 border border-gray-200/60 dark:border-white/10 shadow-sm">
                <div className="text-center">
                  {!uploadFile && !isUploading && (
                    <div className="space-y-6">
                      <p className="text-gray-600 dark:text-gray-400">Upload an audio file (MP3, WAV, M4A, AAC, OGG, FLAC, etc.)</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.wma,.aiff,.au,.ra,.3gp,.amr,.opus"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-8 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white dark:text-black rounded-lg transition"
                      >
                        Choose File
                      </button>
                    </div>
                  )}

                  {uploadFile && uploadAudioURL && !isUploading && (
                    <div className="space-y-5">
                      <p className="text-gray-600 dark:text-gray-400">File ready: {uploadFile.name}</p>
                      <audio controls src={uploadAudioURL} className="w-full rounded-lg" />
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={() => reupload(true)}
                          className="px-5 py-2.5 bg-white/60 dark:bg-white/10 text-black dark:text-white rounded-lg border border-gray-200/60 dark:border-white/15 hover:bg-white/80 dark:hover:bg-white/20 transition"
                        >
                          Choose Different File
                        </button>
                        <button
                          onClick={uploadAndShare}
                          disabled={isUploading}
                          className="px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:bg-gray-300 disabled:cursor-not-allowed text-white dark:text-black rounded-lg transition flex items-center gap-2"
                        >
                          {isUploading ? (
                            <>
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              <span>Uploading…</span>
                            </>
                          ) : (
                            'Upload & Share'
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {isUploading && (
                    <div className="space-y-5 text-center">
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin h-8 w-8 text-[var(--color-primary)]" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">Generating share link...</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(showRecordShareOptions || showUploadShareOptions) && (
              <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-xl p-5 sm:p-6 md:p-8 border border-gray-200/60 dark:border-white/10 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-light text-black dark:text-white text-center flex-1">Share Your Audio</h3>
                  <button
                    onClick={() => (showRecordShareOptions ? retakeRecording(true) : reupload(true))}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition text-sm"
                  >
                    New {showRecordShareOptions ? 'Recording' : 'Upload'}
                  </button>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-light text-gray-600 dark:text-gray-400 mb-3">Share Link</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={showRecordShareOptions ? recordShareLink : uploadShareLink}
                        readOnly
                        className="flex-1 px-4 py-3 bg-gray-100/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-l-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)_/_50] font-mono text-sm"
                      />
                      <button
                        onClick={() => copyToClipboard(showRecordShareOptions ? recordShareLink! : uploadShareLink!)}
                        className="px-6 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white dark:text-black rounded-r-lg transition-all duration-300 font-light"
                      >
                        {copyFeedback ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-light text-gray-600 dark:text-gray-400 mb-3">Social Share</label>
                    <div className="flex justify-center">
                      <Suspense fallback={<LoadingSpinner />}>
                        <LazySocialShareComponent url={showRecordShareOptions ? recordShareLink! : uploadShareLink!} />
                      </Suspense>
                    </div>
                  </div>

                  <div className="border-t border-gray-200/50 dark:border-white/10 pt-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setShowQRCode(!showQRCode)}
                        className="flex-1 px-4 py-2 bg-gray-100/50 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200/50 dark:border-white/10 hover:bg-gray-200/50 dark:hover:bg-white/10 transition-all duration-300 font-light text-sm"
                      >
                        {showQRCode ? 'Hide QR Code' : 'Show QR Code'}
                      </button>
                      <button
                        onClick={() => setShowEmbedCode(!showEmbedCode)}
                        className="flex-1 px-4 py-2 bg-gray-100/50 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200/50 dark:border-white/10 hover:bg-gray-200/50 dark:hover:bg-white/10 transition-all duration-300 font-light text-sm"
                      >
                        {showEmbedCode ? 'Hide Embed Code' : 'Show Embed Code'}
                      </button>
                    </div>
                  </div>

                  {showQRCode && (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                      <label className="block text-sm font-light text-gray-600 dark:text-gray-400 mb-4">QR Code</label>
                      <div className="flex justify-center">
                        <Suspense fallback={<LoadingSpinner />}>
                          <LazyQRCode value={showRecordShareOptions ? recordShareLink! : uploadShareLink!} size={128} />
                        </Suspense>
                      </div>
                    </div>
                  )}

                  {showEmbedCode && (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                      <label className="block text-sm font-light text-gray-600 dark:text-gray-400 mb-3">Embed Code</label>
                      <div className="flex">
                        <input
                          type="text"
                          value={getEmbedCode(showRecordShareOptions ? recordShareLink! : uploadShareLink!)}
                          readOnly
                          className="flex-1 px-4 py-3 bg-gray-100/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-l-lg text-black dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)_/_50] font-mono"
                        />
                        <button
                          onClick={() => copyToClipboard(getEmbedCode(showRecordShareOptions ? recordShareLink! : uploadShareLink!))}
                          className="px-6 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white dark:text-black rounded-r-lg transition-all duration-300 font-light"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="bg-white/50 dark:bg-black/50 backdrop-blur-md py-6 border-t border-gray-200/50 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-600 dark:text-gray-400">&copy; {new Date().getFullYear()} Voicerly. All rights reserved.</p>
          <ul className="flex justify-center space-x-4 mt-2">
            <li><a href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-[var(--color-primary)] dark:hover:text-orange-400 transition">Privacy Policy</a></li>
            <li><a href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-[var(--color-primary)] dark:hover:text-orange-400 transition">Terms of Service</a></li>
            <li><a href="/about" className="text-gray-600 dark:text-gray-400 hover:text-[var(--color-primary)] dark:hover:text-orange-400 transition">About Us</a></li>
          </ul>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">The best online voice recorder for seamless audio sharing and collaboration.</p>
        </div>
      </footer>
    </div>
  );
}
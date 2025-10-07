"use client";

import React, { useState, useRef, useCallback, useMemo, memo } from "react";
import { QRCodeSVG as QRCode } from "qrcode.react";
import { 
  FacebookShareButton, FacebookIcon,
  TwitterShareButton, TwitterIcon,
  LinkedinShareButton, LinkedinIcon,
  WhatsappShareButton, WhatsappIcon,
  EmailShareButton, EmailIcon
} from "react-share";

interface ErrorState {
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'record' | 'upload'>('record');
  const [recording, setRecording] = useState(false);
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

  // Error handling utility
  const showError = useCallback((message: string, type: ErrorState['type'] = 'error') => {
    setError({ message, type });
    setTimeout(() => setError(null), 5000);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Recording functions
  const startRecording = async () => {
    try {
      clearError();
      
      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        showError("Your browser doesn't support audio recording. Please use a modern browser.", 'error');
        return;
      }
      
      // Check for iOS Safari and provide specific guidance
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      
      // iOS Safari requires more specific audio constraints
      const audioConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100,
        channelCount: 1, // Mono for better compatibility
        // iOS Safari specific constraints
        sampleSize: 16,
        latency: 0.01
      };
      
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: audioConstraints
        });
      } catch (constraintError) {
        console.log("Advanced constraints failed, trying basic constraints:", constraintError);
        // Fallback to basic constraints for older iOS versions
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }
        });
      }
      
      // iOS Safari compatibility: Check for supported MIME types in order of preference
      let mimeType = '';
      const supportedTypes = [
        'audio/mp4;codecs=mp4a.40.2', // MP4 with AAC - best compatibility
        'audio/mp4', // MP4 without codec specification
        'audio/webm;codecs=opus', // WebM with Opus
        'audio/webm', // WebM without codec specification
        'audio/wav', // WAV as last resort
      ];
      
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
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: mimeType
      });
      
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
      };
      
      mediaRecorderRef.current.start(1000); // Collect data every second
      setRecording(true);
      setRecordedBlob(null);
      setRecordAudioURL(null);
      setRecordShareLink(null);
      setShowRecordShareOptions(false);
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          showError("Microphone access denied. Please allow microphone access and try again.", 'error');
        } else if (error.name === 'NotFoundError') {
          showError("No microphone found. Please connect a microphone and try again.", 'error');
        } else {
          showError("Could not access microphone. Please check your device settings.", 'error');
        }
      } else {
        showError("Could not access microphone. Please check permissions.", 'error');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      
      // Stop all tracks to release microphone
      const stream = mediaRecorderRef.current.stream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleRecordStop = () => {
    try {
      if (audioChunksRef.current.length === 0) {
        showError("No audio data recorded. Please try again.", 'warning');
        return;
      }

      // Determine the correct MIME type based on what was recorded
      const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      
      // Check if blob is valid
      if (audioBlob.size === 0) {
        showError("Recording is empty. Please try again.", 'warning');
        return;
      }

      setRecordedBlob(audioBlob);
      const localURL = URL.createObjectURL(audioBlob);
      setRecordAudioURL(localURL);
      audioChunksRef.current = [];
    } catch (error) {
      console.error("Error processing recording:", error);
      showError("Failed to process recording. Please try again.", 'error');
    }
  };

  const retakeRecording = () => {
    setRecordedBlob(null);
    setRecordAudioURL(null);
    setRecordShareLink(null);
    setShowRecordShareOptions(false);
    startRecording();
  };

  const saveAndShareRecording = async () => {
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
        showError("Recording saved and shared successfully!", 'success');
      }
    } catch (error) {
      console.error("Error saving recording:", error);
      showError("Failed to save recording. Please try again.", 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Upload functions
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
      const localURL = URL.createObjectURL(file);
      setUploadAudioURL(localURL);
      setUploadShareLink(null);
      setShowUploadShareOptions(false);

      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const uploadAndShare = async () => {
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
        showError("File uploaded and shared successfully!", 'success');
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      showError("Failed to upload file. Please try again.", 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const reupload = () => {
    setUploadFile(null);
    setUploadAudioURL(null);
    setUploadShareLink(null);
    setShowUploadShareOptions(false);
    fileInputRef.current?.click();
  };

  const uploadAudio = async (file: Blob | File): Promise<string | null> => {
    const formData = new FormData();
    
    // Create a proper File object with correct name and type for better compatibility
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
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showError("Link copied to clipboard!", 'success');
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      showError("Failed to copy link. Please copy manually.", 'warning');
    }
  };

  const getEmbedCode = useCallback((url: string) => {
    return `<audio controls src="${url}"></audio>`;
  }, []);

  // Memoized QR Code component
  const MemoizedQRCode = memo(({ value }: { value: string }) => (
    <div className="bg-white p-3 rounded-lg inline-block">
      <QRCode value={value} size={128} />
    </div>
  ));

  const getErrorColor = (type: ErrorState['type']) => {
    switch (type) {
      case 'error': return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'warning': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'info': return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
      case 'success': return 'text-green-400 bg-green-900/20 border-green-500/30';
      default: return 'text-red-400 bg-red-900/20 border-red-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">
              Record & Share
              <span className="block bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                Audio Instantly
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              The modern way to record voice memos, upload audio files, and share them with anyone. 
              No downloads required, works on all devices.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Error Display */}
        {error && (
          <div className={`mb-6 p-4 rounded-lg border ${getErrorColor(error.type)}`}>
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
              <div className="ml-3">
                <p className="text-sm font-medium">{error.message}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={clearError}
                  className="inline-flex text-current hover:opacity-75 focus:outline-none"
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

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-1 border border-gray-700/50">
            <button
              onClick={() => setActiveTab('record')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'record'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              🎤 Record
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'upload'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              📁 Upload
            </button>
          </div>
        </div>

        {/* Record Tab */}
        {activeTab === 'record' && (
          <div className="space-y-8">
            {/* Recording Interface */}
            <div className="bg-black/20 backdrop-blur-lg rounded-3xl p-8 border border-gray-700/50">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-6">Record Audio</h2>
                
                {!recording && !recordedBlob && (
                  <div className="space-y-6">
                    <div className="w-32 h-32 mx-auto bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-2xl">
                      <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-gray-300">Click the button below to start recording</p>
                    <button
                      onClick={startRecording}
                      className="px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-full transition-all duration-200 shadow-lg hover:shadow-orange-500/25"
                    >
                      Start Recording
                    </button>
                  </div>
                )}

                {recording && (
                  <div className="space-y-6">
                    <div className="w-32 h-32 mx-auto bg-red-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                      <div className="w-16 h-16 bg-white rounded-full"></div>
                    </div>
                    <p className="text-red-400 font-medium">Recording... Click to stop</p>
                    <button
                      onClick={stopRecording}
                      className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full transition-all duration-200 shadow-lg hover:shadow-red-500/25"
                    >
                      Stop Recording
                    </button>
                  </div>
                )}

                {recordedBlob && recordAudioURL && !showRecordShareOptions && (
                  <div className="space-y-6">
                    <div className="w-32 h-32 mx-auto bg-green-500 rounded-full flex items-center justify-center shadow-2xl">
                      <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-green-400 font-medium">Recording complete!</p>
                    <audio controls src={recordAudioURL} className="w-full max-w-md mx-auto rounded-lg" />
                    <div className="flex space-x-4 justify-center">
                      <button
                        onClick={retakeRecording}
                        className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-full transition-all duration-200"
                      >
                        Retake
                      </button>
                      <button
                        onClick={saveAndShareRecording}
                        disabled={isUploading}
                        className="px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-full transition-all duration-200 flex items-center space-x-2"
                      >
                        {isUploading ? (
                          <>
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>Saving...</span>
                          </>
                        ) : (
                          'Save & Share'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Share Options */}
            {showRecordShareOptions && recordShareLink && (
              <div className="bg-black/20 backdrop-blur-lg rounded-3xl p-8 border border-gray-700/50">
                <h3 className="text-xl font-bold text-white mb-6 text-center">Share Your Recording</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Share Link</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={recordShareLink}
                        readOnly
                        className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-l-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <button
                        onClick={() => copyToClipboard(recordShareLink)}
                        className="px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-r-lg transition-colors duration-200"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-gray-300 mb-4">QR Code</p>
                    <MemoizedQRCode value={recordShareLink} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Embed Code</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={getEmbedCode(recordShareLink)}
                        readOnly
                        className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-l-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <button
                        onClick={() => copyToClipboard(getEmbedCode(recordShareLink))}
                        className="px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-r-lg transition-colors duration-200"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-center space-x-4">
                    <FacebookShareButton url={recordShareLink}>
                      <FacebookIcon size={40} round />
                    </FacebookShareButton>
                    <TwitterShareButton url={recordShareLink}>
                      <TwitterIcon size={40} round />
                    </TwitterShareButton>
                    <LinkedinShareButton url={recordShareLink}>
                      <LinkedinIcon size={40} round />
                    </LinkedinShareButton>
                    <WhatsappShareButton url={recordShareLink}>
                      <WhatsappIcon size={40} round />
                    </WhatsappShareButton>
                    <EmailShareButton url={recordShareLink}>
                      <EmailIcon size={40} round />
                    </EmailShareButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-8">
            {/* Upload Interface */}
            <div className="bg-black/20 backdrop-blur-lg rounded-3xl p-8 border border-gray-700/50">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-6">Upload Audio</h2>
                
                {!uploadFile && (
                  <div className="space-y-6">
                    <div className="w-32 h-32 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-2xl">
                      <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-gray-300">Choose an audio file to upload</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
                    >
                      Choose File
                    </button>
                  </div>
                )}

                {uploadFile && uploadAudioURL && !showUploadShareOptions && (
                  <div className="space-y-6">
                    <div className="w-32 h-32 mx-auto bg-green-500 rounded-full flex items-center justify-center shadow-2xl">
                      <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-green-400 font-medium">File selected: {uploadFile.name}</p>
                    <audio controls src={uploadAudioURL} className="w-full max-w-md mx-auto rounded-lg" />
                    <div className="flex space-x-4 justify-center">
                      <button
                        onClick={reupload}
                        className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-full transition-all duration-200"
                      >
                        Choose Different File
                      </button>
                      <button
                        onClick={uploadAndShare}
                        disabled={isUploading}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-full transition-all duration-200 flex items-center space-x-2"
                      >
                        {isUploading ? (
                          <>
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>Uploading...</span>
                          </>
                        ) : (
                          'Upload & Share'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Share Options */}
            {showUploadShareOptions && uploadShareLink && (
              <div className="bg-black/20 backdrop-blur-lg rounded-3xl p-8 border border-gray-700/50">
                <h3 className="text-xl font-bold text-white mb-6 text-center">Share Your Audio</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Share Link</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={uploadShareLink}
                        readOnly
                        className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-l-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <button
                        onClick={() => copyToClipboard(uploadShareLink)}
                        className="px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-r-lg transition-colors duration-200"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-gray-300 mb-4">QR Code</p>
                    <MemoizedQRCode value={uploadShareLink} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Embed Code</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={getEmbedCode(uploadShareLink)}
                        readOnly
                        className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-l-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <button
                        onClick={() => copyToClipboard(getEmbedCode(uploadShareLink))}
                        className="px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-r-lg transition-colors duration-200"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-center space-x-4">
                    <FacebookShareButton url={uploadShareLink}>
                      <FacebookIcon size={40} round />
                    </FacebookShareButton>
                    <TwitterShareButton url={uploadShareLink}>
                      <TwitterIcon size={40} round />
                    </TwitterShareButton>
                    <LinkedinShareButton url={uploadShareLink}>
                      <LinkedinIcon size={40} round />
                    </LinkedinShareButton>
                    <WhatsappShareButton url={uploadShareLink}>
                      <WhatsappIcon size={40} round />
                    </WhatsappShareButton>
                    <EmailShareButton url={uploadShareLink}>
                      <EmailIcon size={40} round />
                    </EmailShareButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">High Quality</h3>
            <p className="text-gray-400">Record crystal clear audio with professional quality</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Instant Share</h3>
            <p className="text-gray-400">Get shareable links immediately after recording or uploading</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Mobile Ready</h3>
            <p className="text-gray-400">Works perfectly on all devices, optimized for mobile</p>
          </div>
        </div>
      </div>
    </div>
  );
}

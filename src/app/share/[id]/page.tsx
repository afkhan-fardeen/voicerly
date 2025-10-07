"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { 
  updateDownloadCount,
  getStorageFileUrl,
  findAudioRecordByFileName
} from "@/lib/supabase";

interface SharePageProps {
  params: Promise<{ id: string }>;
}

// Validate ID format to prevent path traversal
function validateId(id: string): boolean {
  // Only allow alphanumeric characters and hyphens, 10 characters max
  const idRegex = /^[a-zA-Z0-9_-]{1,10}$/;
  return idRegex.test(id);
}

export default function SharePage({ params: paramsPromise }: SharePageProps) {
  const [audioFile, setAudioFile] = useState<any>(null);
  const [audioSrc, setAudioSrc] = useState<string>('');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [uniqueId, setUniqueId] = useState<string>('');
  const [downloadCount, setDownloadCount] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  useEffect(() => {
    async function loadAudioFile() {
      let params;
      try {
        params = await paramsPromise;
      } catch (error) {
        console.error("Error awaiting params:", error);
        notFound();
        return;
      }

      const id = params?.id;
      console.log("SharePage: Processing ID:", id);

      // Validate ID format
      if (!id || !validateId(id)) {
        console.log("SharePage: Invalid ID format:", id);
        notFound();
        return;
      }

      setUniqueId(id);

      try {
        // Find the audio file by unique ID in the database
        const fileNamePattern = `${id}.%`;
        console.log("SharePage: Querying for file pattern:", fileNamePattern);
        
        const file = await findAudioRecordByFileName(fileNamePattern);

        if (!file) {
          console.log("SharePage: No audio file found for ID:", id);
          setIsDeleted(true);
          return;
        }

        console.log("SharePage: Found audio file:", file.id, file.file_name);

        // Compute share URL on client
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
        const url = `${baseUrl}/share/${id}`;
        setShareUrl(url);

        // Get the file URL from Supabase Storage
        const src = getStorageFileUrl(file.storage_path);
        console.log("SharePage: Generated audioSrc:", src);

        setAudioFile(file);
        setAudioSrc(src);
        setDownloadCount(file.download_count || 0);

      } catch (error) {
        console.error("SharePage: Error fetching audio file:", error);
        setIsDeleted(true);
      }
    }

    loadAudioFile();
  }, [paramsPromise]);

  const handleDownload = async () => {
    if (!audioFile || !audioSrc) return;

    try {
      // Update download count in database
      await updateDownloadCount(audioFile.id);
      setDownloadCount(prev => prev + 1);

      // Force download as MP3
      const response = await fetch(audioSrc);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `recording-${uniqueId}.mp3`; // Always download as MP3
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log("SharePage: Download initiated and count updated");
    } catch (error) {
      console.error("SharePage: Error during download:", error);
    }
  };

  const copyToClipboard = async () => {
    try {
      // Check if we're in a secure context (HTTPS or localhost)
      if (!window.isSecureContext) {
        throw new Error('Clipboard requires secure context');
      }

      // Modern Clipboard API (preferred method)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }

      // Fallback method for older browsers or restricted environments
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
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
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
          <input type="text" value="${shareUrl}" readonly style="
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
      }
    }
  };

  if (isDeleted) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-2xl">
            <div className="text-center bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-xl p-8 sm:p-12 border border-gray-200/60 dark:border-white/10 shadow-sm">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h1 className="text-3xl sm:text-4xl font-light text-black dark:text-white mb-4 tracking-tight">
                Audio Deleted
              </h1>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                This audio recording has been permanently deleted and is no longer available.
              </p>
              <Link 
                href="/" 
                className="inline-flex items-center space-x-2 px-6 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-lg transition-all duration-300 font-light"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create New Recording</span>
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white/50 dark:bg-black/50 backdrop-blur-md py-6 border-t border-gray-200/50 dark:border-white/10 mt-auto">
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

  if (!audioFile) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading audio...</p>
        </div>
      </div>
    );
  }

  // Extract file extension for download
  const fileExtension = audioFile.file_name.split('.').pop() || 'webm';

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />
      <main>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-6xl font-light text-black dark:text-white mb-3 tracking-tight">
            Shared Audio
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Listen to this audio recording and download it if you'd like.
          </p>
        </div>

        {/* Audio Player Card */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-xl p-5 sm:p-6 md:p-8 border border-gray-200/60 dark:border-white/10 shadow-sm mb-8">
          {/* Audio Player */}
          <div className="mb-8">
            <audio 
              controls 
              src={audioSrc} 
              className="w-full rounded-lg"
              preload="metadata"
            />
          </div>

          {/* Download Button */}
          <div className="flex justify-center mb-8">
            <button
              onClick={handleDownload}
              className="px-8 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white dark:text-black rounded-lg transition-all duration-300 flex items-center space-x-3 font-light"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span>Download Audio</span>
            </button>
          </div>

          {/* File Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-100/50 dark:bg-white/5 rounded-lg p-4 border border-gray-200/50 dark:border-white/10 text-center">
              <div className="text-2xl font-light text-[var(--color-primary)] mb-1">
                {downloadCount}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm font-light">Downloads</div>
            </div>
            <div className="bg-gray-100/50 dark:bg-white/5 rounded-lg p-4 border border-gray-200/50 dark:border-white/10 text-center">
              <div className="text-2xl font-light text-[var(--color-primary)] mb-1">
                {(audioFile.file_size / 1024 / 1024).toFixed(1)} MB
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm font-light">File Size</div>
            </div>
          </div>
        </div>

        {/* Share Info */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-xl p-5 sm:p-6 md:p-8 border border-gray-200/60 dark:border-white/10 shadow-sm">
          <h3 className="text-xl font-light text-black dark:text-white mb-6 text-center">Share This Audio</h3>
          
          <div>
            <label className="block text-sm font-light text-gray-600 dark:text-gray-400 mb-3">Share Link</label>
            <div className="flex">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-4 py-3 bg-gray-100/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-l-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)_/_50] font-mono text-sm"
              />
              <button
                onClick={copyToClipboard}
                className="px-6 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white dark:text-black rounded-r-lg transition-all duration-300 font-light"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-light">
              Anyone with this link can listen to and download this audio recording.
            </p>
          </div>
        </div>

        {/* Create Your Own */}
        <div className="text-center mt-12">
          <Link 
            href="/" 
            className="inline-flex items-center space-x-2 px-6 py-3 bg-white/60 dark:bg-white/10 text-black dark:text-white rounded-lg border border-gray-200/60 dark:border-white/15 hover:bg-white/80 dark:hover:bg-white/20 transition-all duration-300 font-light"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Create Your Own Recording</span>
          </Link>
        </div>
      </div>
      </main>

      {/* Footer */}
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
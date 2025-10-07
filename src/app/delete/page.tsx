'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Navigation from "@/components/Navigation";

interface ErrorState {
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
}

export default function DeletePage() {
  const [url, setUrl] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);

  const showError = useCallback((message: string, type: ErrorState['type'] = 'error') => {
    setError({ message, type });
    setTimeout(() => setError(null), 5000);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleDelete = async () => {
    if (!url.trim()) {
      showError("Please enter a valid audio URL", 'warning');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      showError("Please enter a valid URL", 'error');
      return;
    }

    setIsDeleting(true);
    clearError();

    try {
      const response = await fetch('/api/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete audio');
      }

      showError("Audio file deleted successfully!", 'success');
      setUrl('');
    } catch (error) {
      console.error('Delete error:', error);
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          showError("Audio file not found. Please check the URL.", 'error');
        } else if (error.message.includes('Invalid')) {
          showError("Invalid audio ID format.", 'error');
        } else {
          showError(`Delete failed: ${error.message}`, 'error');
        }
      } else {
        showError("Failed to delete audio. Please try again.", 'error');
      }
    } finally {
      setIsDeleting(false);
    }
  };

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
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      <Navigation />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-light text-black dark:text-white mb-3 tracking-tight">Delete Recording</h1>
            <p className="text-gray-600 dark:text-gray-400">Paste your audio link to delete it permanently</p>
          </div>

          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-xl p-6 sm:p-8 border border-gray-200/60 dark:border-white/10 shadow-sm">
          <div className="space-y-5">
            <div>
              <label htmlFor="url" className="block text-sm font-light text-gray-700 dark:text-gray-400 mb-2">
                Audio URL
              </label>
              <input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://yoursite.com/share/abc123"
                className="w-full px-4 py-3 bg-gray-100/60 dark:bg-white/10 border border-gray-200/70 dark:border-white/15 rounded-lg text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)_/_50] focus:border-transparent transition-all duration-300 font-mono text-sm"
                disabled={isDeleting}
              />
            </div>

            {error && (
              <div className={`p-4 rounded-lg border ${getErrorColor(error.type)}`}>
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

            <button
              onClick={handleDelete}
              disabled={isDeleting || !url.trim()}
              className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-light py-3.5 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Deleting…</span>
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>Delete Audio</span>
                </>
              )}
            </button>

            <div className="text-center">
              <Link 
                href="/" 
                className="text-gray-400 hover:text-white transition-colors duration-300 text-sm font-light"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-gray-500 dark:text-gray-400 text-sm font-light">
          <p>This action cannot be undone.</p>
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

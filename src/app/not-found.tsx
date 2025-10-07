import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 sm:p-12 border border-white/10 text-center space-y-8">
          {/* Broken audio/file SVG icon */}
          <div className="flex justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 64 64"
              className="w-20 h-20 text-orange-400"
            >
              <rect x="8" y="16" width="48" height="32" rx="8" fill="currentColor" opacity="0.15" />
              <path
                d="M16 24v16m32-16v16M24 32h16M28 36l8-8"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.7"
              />
              <line x1="20" y1="44" x2="44" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl font-light text-white mb-4">Audio Unavailable</h1>

          {/* Description - For deleted files */}
          <p className="text-gray-400 text-lg font-light">
            This audio file has been permanently deleted.
          </p>

          {/* Back to Home Button */}
          <div className="pt-2">
            <Link href="/" className="inline-flex items-center px-12 py-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white dark:text-black rounded-full font-light transition-all duration-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="w-5 h-5 mr-2"
              >
                <path
                  d="M15 19l-7-7 7-7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
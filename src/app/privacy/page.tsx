import Navigation from "@/components/Navigation";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />
      <main className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-light text-black dark:text-white mb-3">
              Privacy Policy
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Your privacy matters to us. Learn how we protect your data when using our voice recording service.
            </p>
          </div>

          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-xl p-8 border border-gray-200/60 dark:border-white/10 shadow-sm">
            <h2 className="text-xl font-medium text-[var(--color-primary)] dark:text-orange-400 mb-3">Information We Collect</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              - <strong>Audio Recordings:</strong> When you record or upload audio using our free voice recorder, the files are temporarily stored on our servers to generate shareable links. We do not access or listen to your recordings.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              - <strong>Usage Data:</strong> We may collect anonymous usage statistics to improve our browser voice recording features, such as device type and browser information.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              - <strong>No Personal Data:</strong> Voicerly does not require sign-ups, so we don't collect emails, names, or other personal identifiers.
            </p>
            
            <h2 className="text-xl font-medium text-[var(--color-primary)] dark:text-orange-400 mb-3">How We Use Your Information</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Your audio files are used solely to provide our voice sharing service. We generate secure links for sharing and may create QR codes for easy access. Files are automatically deleted after a reasonable period.
            </p>
            
            <h2 className="text-xl font-medium text-[var(--color-primary)] dark:text-orange-400 mb-3">Third-Party Services</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              When you share links via social media, those platforms may collect data according to their own policies. Voicerly is not responsible for third-party practices.
            </p>
            
            <h2 className="text-xl font-medium text-[var(--color-primary)] dark:text-orange-400 mb-3">Changes to This Policy</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              We may update this policy periodically. Continued use of our online voice sharing tool constitutes acceptance of changes.
            </p>
            
            <p className="text-gray-700 dark:text-gray-300">
              For questions about our privacy practices, contact us at privacy@voicerly.com.
            </p>
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

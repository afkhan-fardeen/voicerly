import Navigation from "@/components/Navigation";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />
      <main>
        <div className="mx-auto max-w-4xl pt-16 sm:pt-20 pb-12 px-4">
      <h1 className="text-3xl sm:text-4xl font-light text-black dark:text-white mb-6 text-center">Terms of Service</h1>
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-xl p-5 sm:p-6 md:p-8 shadow-sm border border-gray-200/60 dark:border-white/10">
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Welcome to Voicerly. By using our online voice recorder and audio sharing services, you agree to these Terms of Service. If you do not agree, please do not use our platform.
        </p>
        <h2 className="text-xl font-medium text-[var(--color-primary)] dark:text-orange-400 mb-3">Use of Service</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Voicerly provides a free browser-based voice memo tool for recording, uploading, and sharing audio. You may not use our service for illegal activities, harassment, or distribution of harmful content.
        </p>
        <h2 className="text-xl font-medium text-[var(--color-primary)] dark:text-orange-400 mb-3">User Content</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          You retain ownership of your audio recordings. By uploading to our free audio recorder, you grant Voicerly a limited license to store and distribute your content via shareable links.
        </p>
        <h2 className="text-xl font-medium text-[var(--color-primary)] dark:text-orange-400 mb-3">Limitations</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          We reserve the right to remove content or suspend access if it violates these terms. Voicerly is provided "as is" without warranties.
        </p>
        <h2 className="text-xl font-medium text-[var(--color-primary)] dark:text-orange-400 mb-3">Intellectual Property</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          All Voicerly content, including our online voice sharing interface, is protected by copyright. You may not copy or distribute our materials without permission.
        </p>
        <h2 className="text-xl font-medium text-[var(--color-primary)] dark:text-orange-400 mb-3">Changes to Terms</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          We may modify these terms at any time. Continued use constitutes acceptance.
        </p>
        <p className="text-gray-700 dark:text-gray-300">
          For questions, contact us at terms@voicerly.com.
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
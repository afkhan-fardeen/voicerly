import Navigation from "@/components/Navigation";
import Link from "next/link";

export default function About() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />
      <main className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-light text-black dark:text-white mb-3">
              About <span className="bg-gradient-to-r from-[var(--color-primary)] to-cyan-400 bg-clip-text text-transparent">Voicerly</span>
            </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            The modern way to record, upload, and share audio instantly. 
            No downloads, no sign-ups, just pure audio sharing magic.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Mission */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-gray-200/60 dark:border-white/10 shadow-sm">
            <div className="w-12 h-12 bg-[color:var(--color-primary)_/_15] rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[var(--color-primary)]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-black dark:text-white mb-2">Our Mission</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              At Voicerly, we aim to democratize audio creation and sharing. We believe everyone should have access to professional-grade voice recording tools without barriers. That&apos;s why our online audio recorder is completely free, mobile-optimized, and packed with features like QR code sharing, social media integration, and embed options.
            </p>
          </div>

          {/* Vision */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-gray-200/60 dark:border-white/10 shadow-sm">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-black dark:text-white mb-2">Our Vision</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We envision a world where sharing audio is as simple as sending a text message. Whether you&apos;re a podcaster capturing ideas on the fly, a professional sharing meeting notes, or a student recording lectures, Voicerly provides a secure, user-friendly solution for all your audio needs.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-light text-black dark:text-white text-center mb-8">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-8 h-8 text-[var(--color-primary)]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                ),
                title: "High Quality Recording",
                description: "Crystal-clear audio recording with professional quality"
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                ),
                title: "Instant Sharing",
                description: "Generate shareable links, QR codes, and embed codes instantly"
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                ),
                title: "Easy Upload",
                description: "Upload existing audio files for quick sharing"
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                ),
                title: "Secure & Private",
                description: "Your recordings are yours alone - complete privacy"
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                ),
                title: "Social Integration",
                description: "One-click sharing to popular social platforms"
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.666.804 4.332A1 1 0 0113 20H7a1 1 0 01-.985-.802L5.123 15.666 5.22 15H3a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                  </svg>
                ),
                title: "Mobile Optimized",
                description: "Responsive design for seamless use on all devices"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-xl p-5 border border-gray-200/60 dark:border-white/10 shadow-sm hover:shadow transition-all duration-200">
                <div className="w-10 h-10 bg-gray-100/80 dark:bg-white/10 rounded-lg flex items-center justify-center mb-3">
                  {feature.icon}
                </div>
                <h3 className="text-base font-medium text-black dark:text-white mb-1.5">{feature.title}</h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-xl p-8 border border-gray-200/60 dark:border-white/10 shadow-sm">
          <h2 className="text-2xl font-light text-black dark:text-white mb-3">Ready to get started?</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Join thousands of users who trust Voicerly as their preferred online voice memo tool.
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center space-x-2 px-6 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-lg transition-all duration-200 shadow-sm"
          >
            <span>Start Recording Now</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
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
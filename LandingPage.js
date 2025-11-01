import React from 'react';
import { Link } from 'react-router-dom';

// --- SVG Icon Components for a clean, modern look ---
const VideoIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className="h-10 w-10 mb-4 text-[#e94560]" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 7h8a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z" />
  </svg>
);


const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" 
    className="h-10 w-10 mb-4 text-[#e94560]" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const AudioIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" 
    className="h-10 w-10 mb-4 text-[#e94560]" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.108 12 5v14c0 .892-1.077 1.337-1.707.707L5.586 15z" />
  </svg>
);

const LandingPage = () => {
  return (
    <div className="bg-[#1a1a2e] text-white overflow-x-hidden">
      {/* --- Hero Section --- */}
      <div className="relative h-screen flex items-center justify-center">
        <video 
          autoPlay 
          muted 
          loop 
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
          style={{ filter: 'blur(8px) brightness(0.4)' }}
          src="/deepfake-background.mp4"
        >
          Your browser does not support the video tag.
        </video>
        <div className="relative z-10 text-center px-4">
          <h1 
            className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-[#e94560] to-[#ff6b81]"
            style={{ textShadow: '0 0 25px rgba(233, 69, 96, 0.5)' }}
          >
            Deepfake Guard
          </h1>
          <p className="mt-4 text-lg md:text-2xl text-[#a3bffa] max-w-3xl mx-auto">
            Unmask the Truth. Protect Your Reality with AI-Powered Deepfake Detection.
          </p>
          <Link to="/login">
            <button className="mt-10 px-8 py-4 bg-gradient-to-r from-[#e94560] to-[#ff6b81] text-white font-bold text-lg rounded-full shadow-lg hover:scale-105 transform transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-[#e94560]/50">
              Get Started Now
            </button>
          </Link>
        </div>
      </div>

      {/* --- Features Section --- */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#16213e]">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-white">Advanced Detection Capabilities</h2>
          <p className="mt-4 text-lg text-[#a3bffa]">We analyze every pixel, frame, and sound wave.</p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="bg-[#252a44]/50 p-8 rounded-2xl border border-transparent hover:border-[#e94560] transition-colors duration-300 transform hover:-translate-y-2">
              <VideoIcon />
              <h3 className="text-2xl font-bold text-white">Video Analysis</h3>
              <p className="mt-2 text-[#a3bffa]">Our AI meticulously scans video files for artifacts, inconsistencies, and manipulation patterns invisible to the human eye.</p>
            </div>
            <div className="bg-[#252a44]/50 p-8 rounded-2xl border border-transparent hover:border-[#e94560] transition-colors duration-300 transform hover:-translate-y-2">
              <ImageIcon />
              <h3 className="text-2xl font-bold text-white">Image Scanning</h3>
              <p className="mt-2 text-[#a3bffa]">Detect facial morphing, background tampering, and other signs of digital alteration in still images with high precision.</p>
            </div>
            <div className="bg-[#252a44]/50 p-8 rounded-2xl border border-transparent hover:border-[#e94560] transition-colors duration-300 transform hover:-translate-y-2">
              <AudioIcon />
              <h3 className="text-2xl font-bold text-white">Audio Verification</h3>
              <p className="mt-2 text-[#a3bffa]">Identify synthesized voices and manipulated audio clips by analyzing vocal patterns and background noise signatures.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- How It Works Section --- */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-white">Simple, Fast, and Effective</h2>
          <p className="mt-4 text-lg text-[#a3bffa]">Three easy steps to a safer digital feed.</p>
          <div className="mt-12 flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0 md:space-x-8">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center h-24 w-24 rounded-full bg-[#e94560] text-white text-4xl font-bold shadow-lg">1</div>
              <h3 className="mt-4 text-xl font-semibold">Upload Media</h3>
              <p className="mt-1 text-[#a3bffa]">Securely upload any suspicious file.</p>
            </div>
            <div className="hidden md:block flex-grow border-t-2 border-dashed border-gray-600"></div>
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center h-24 w-24 rounded-full bg-[#e94560] text-white text-4xl font-bold shadow-lg">2</div>
              <h3 className="mt-4 text-xl font-semibold">AI Analysis</h3>
              <p className="mt-1 text-[#a3bffa]">Our engine processes it in seconds.</p>
            </div>
            <div className="hidden md:block flex-grow border-t-2 border-dashed border-gray-600"></div>
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center h-24 w-24 rounded-full bg-[#e94560] text-white text-4xl font-bold shadow-lg">3</div>
              <h3 className="mt-4 text-xl font-semibold">Get Results</h3>
              <p className="mt-1 text-[#a3bffa]">Receive a clear, actionable report.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Final CTA Section --- */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#16213e]">
        <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-extrabold text-white">Ready to Secure Your Feed?</h2>
            <p className="mt-4 text-lg text-[#a3bffa]">
                Don't let digital deception compromise your integrity. Join us in the fight for truth and transparency.
            </p>
            <Link to="/login">
                <button className="mt-10 px-8 py-4 bg-gradient-to-r from-[#e94560] to-[#ff6b81] text-white font-bold text-lg rounded-full shadow-lg hover:scale-105 transform transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-[#e94560]/50">
                    Create a Free Account
                </button>
            </Link>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;

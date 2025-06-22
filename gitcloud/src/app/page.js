'use client';

import React from 'react';
import './globals.css';
import { useState } from "react";
import Background from '@/components/Background';

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (

    <div className="bg-black text-white scroll-smooth">
       <Background/>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4 border-b border-gray-800 bg-black bg-opacity-80 backdrop-blur-md flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-wide text-white">🌩️ GitCloud</h1>

        {/* Hamburger for mobile */}
        <button
          className="md:hidden text-white focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>

        {/* Nav links */}
        <div className={`flex-col md:flex-row md:flex items-center space-y-4 md:space-y-0 md:space-x-6 text-sm absolute md:static top-full left-0 w-full md:w-auto bg-black md:bg-transparent px-6 md:px-0 py-4 md:py-0 ${menuOpen ? "flex" : "hidden"}`}>
          <a href="#home" className="text-white hover:text-gray-400">Home</a>
          <a href="#features" className="text-white hover:text-gray-400">Features</a>
          <a href="#how-it-works" className="text-white hover:text-gray-400">How it Works</a>
          <a href="#start" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white">Launch App</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="home"
        className="h-screen flex flex-col justify-center items-center text-center px-6 relative overflow-hidden"
      >
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10 animate-[gradientShift_10s_ease_infinite] bg-gradient-to-r from-purple-900 via-black to-blue-900 bg-[length:400%_400%] opacity-40"></div>

        <h2 className="text-5xl font-bold mb-4 z-10">Your GitHub, Now a Cloud Drive</h2>
        <p className="text-gray-300 max-w-2xl mb-8 z-10">
          GitCloud turns your GitHub repositories into a sleek cloud-based file manager. Preview media, upload files, and manage everything visually.
        </p>
        <a
          href="/dashboard"
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded text-lg z-10"
        >
          Launch GitCloud
        </a>
      </section>


      <section
        id="features"
        className="h-screen bg-gradient-to-br from-blue-700 via-purple-800 to-black px-4 md:px-8 py-20 flex items-center justify-center"
      >
        <div className="max-w-7xl w-full flex flex-col justify-center">
          <h3 className="text-4xl font-bold text-center mb-10 text-white">Features</h3>
          {/* Horizontal scroll with fade effect */}
          <div className="relative">
            <div
              className="flex md:grid md:grid-cols-3 items-center gap-8 md:gap-12 overflow-x-auto md:overflow-visible snap-x snap-mandatory px-6 md:px-0 py-4 md:py-0 relative z-10"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {/* Feature Card 1 */}
              <div
                className="bg-black bg-opacity-40 p-6 aspect-square rounded-2xl border border-gray-700 shadow-xl hover:scale-105 transition-transform flex flex-col justify-center items-center flex-shrink-0 w-[70%] sm:w-[50%] md:w-auto snap-center mx-2 md:mx-0"
              >
                <h4 className="text-2xl font-semibold mb-4 text-white text-center">Browse Repos</h4>
                <p className="text-gray-300 text-base leading-relaxed text-center">
                  List all your GitHub repositories and navigate through folders just like a traditional cloud drive.
                </p>
              </div>

              {/* Feature Card 2 */}
              <div
                className="bg-black bg-opacity-40 p-6 aspect-square rounded-2xl border border-gray-700 shadow-xl hover:scale-105 transition-transform flex flex-col justify-center items-center flex-shrink-0 w-[70%] sm:w-[50%] md:w-auto snap-center mx-2 md:mx-0"
              >
                <h4 className="text-2xl font-semibold mb-4 text-white text-center">Preview Media</h4>
                <p className="text-gray-300 text-base leading-relaxed text-center">
                  Instantly preview images, videos, and audio files stored in your GitHub repo with fullscreen options.
                </p>
              </div>

              {/* Feature Card 3 */}
              <div
                className="bg-black bg-opacity-40 p-6 aspect-square rounded-2xl border border-gray-700 shadow-xl hover:scale-105 transition-transform flex flex-col justify-center items-center flex-shrink-0 w-[70%] sm:w-[50%] md:w-auto snap-center mx-2 md:mx-0"
              >
                <h4 className="text-2xl font-semibold mb-4 text-white text-center">Upload with Ease</h4>
                <p className="text-gray-300 text-base leading-relaxed text-center">
                  Upload files to your GitHub repo directly using an intuitive UI. Auto-commits handled under the hood.
                </p>
              </div>
            </div>
            {/* Scroll instruction text */}
            <p className="text-gray-300 text-sm text-center mb-4 md:hidden animate-pulse mt-10">
              Swipe to explore →
            </p>
          </div>
        </div>
      </section>




      {/* How It Works */}
      <section id="how-it-works" className="h-screen px-8 py-20 flex items-center justify-center bg-black border-t border-gray-800">
        <div className="max-w-4xl text-center">
          <h3 className="text-3xl font-bold mb-8">🔧 How It Works</h3>
          <ul className="space-y-6 text-gray-400 text-lg">
            <li>1. Login using your GitHub account.</li>
            <li>2. Choose a repository to explore.</li>
            <li>3. Preview and manage your media files.</li>
            <li>4. Upload new files — committed directly to GitHub.</li>
          </ul>
        </div>
      </section>

      {/* CTA Section */}
      <section id="start" className="h-screen bg-gradient-to-br from-blue-700 via-purple-800 to-black px-8 py-20 flex flex-col justify-center items-center text-center">
        <h2 className="text-4xl font-bold mb-4">Ready to Git Cloud?</h2>
        <p className="text-gray-200 max-w-xl mb-6">
          Join the developers managing their GitHub like Google Drive. Experience GitCloud.
        </p>
        <a href="/dashboard" className="bg-white text-black font-semibold px-8 py-3 rounded hover:bg-gray-200 transition">
          Get Started Now
        </a>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 px-6 py-6 text-center text-gray-500 text-sm">
        <div className="mb-2">© {new Date().getFullYear()} GitCloud. Powered by the GitHub API.</div>
        <div className="space-x-4">
          <a href="https://github.com" target="https://github.com/SameerMatoria" className="hover:text-white">GitHub</a>
        </div>
      </footer>
    </div>
  );
}

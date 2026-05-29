import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Shield, CheckCircle, Award } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* NAVBAR */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Wrench className="w-6 h-6 text-orange-500" />
            <span className="font-extrabold text-xl tracking-tight text-white">
              Trade<span className="text-orange-500">Connect</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
            <Link to="/directory" className="text-zinc-300 hover:text-white transition-colors">Find a Tradie</Link>
            <Link to="/categories" className="text-zinc-300 hover:text-white transition-colors">Services</Link>
            <Link to="/about" className="text-white">About Us</Link>
            <Link to="/contact" className="text-zinc-300 hover:text-white transition-colors">Contact</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-zinc-300 hover:text-white">Log In</Link>
            <Link to="/register" className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all">Sign Up</Link>
          </div>
        </div>
      </header>

      {/* VIEW */}
      <main className="max-w-4xl mx-auto px-4 py-16 flex-grow">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-white">About TradeConnect</h1>
          <p className="mt-4 text-zinc-400 font-medium">Reimagining on-demand trade services across Australia.</p>
        </div>

        <div className="space-y-12">
          
          <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-2xl">
            <h2 className="text-xl font-bold text-orange-500 flex items-center gap-2 mb-4">
              <Award className="w-5 h-5" /> Our Mission
            </h2>
            <p className="text-zinc-300 text-sm leading-relaxed">
              TradeConnect was created with a clear objective: to eliminate the friction in sourcing reliable local tradespeople. Whether it's an emergency pipe burst at midnight or a scheduled full-home repaint, we believe finding a professional should be immediate, secure, and fully transparent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-orange-500" /> Vetted Professionals
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                We review business registration details, trade licenses, and public liability certificates for every tradie before awarding our green "Verified" badge.
              </p>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-orange-500" /> Client Safety & Disputes
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                We offer built-in dispute resolution desks. If a job milestone experiences conflict, our platform admins act as impartial mediators to negotiate resolutions.
              </p>
            </div>
          </div>

          <div className="bg-zinc-900/30 border border-dashed border-zinc-800 p-8 rounded-2xl text-center">
            <h3 className="font-bold text-white text-base">Ready to get started?</h3>
            <p className="text-xs text-zinc-500 mt-2">Post your job description in 2 minutes and let local providers quote immediately.</p>
            <div className="mt-6 flex justify-center gap-4">
              <Link to="/register?role=client" className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold px-5 py-2.5 rounded-lg">Post a Job</Link>
              <Link to="/register?role=tradie" className="bg-zinc-850 hover:bg-zinc-800 text-zinc-300 text-xs font-bold px-5 py-2.5 rounded-lg border border-zinc-800">Become a Tradie</Link>
            </div>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-zinc-900 border-t border-zinc-800 py-6 text-center text-xs text-zinc-500">
        &copy; {new Date().getFullYear()} TradeConnect Pty Ltd. All rights reserved.
      </footer>
    </div>
  );
};
export default AboutPage;

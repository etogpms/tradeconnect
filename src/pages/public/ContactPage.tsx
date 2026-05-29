import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Mail, Phone, MapPin, Send, Check } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSubmitted(true);
    setForm({ name: '', email: '', subject: '', message: '' });
  };

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
            <Link to="/about" className="text-zinc-300 hover:text-white transition-colors">About Us</Link>
            <Link to="/contact" className="text-white">Contact</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-zinc-300 hover:text-white">Log In</Link>
            <Link to="/register" className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all">Sign Up</Link>
          </div>
        </div>
      </header>

      {/* VIEW */}
      <main className="max-w-5xl mx-auto px-4 py-16 flex-grow grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        
        {/* Contact Info */}
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white">Get in Touch</h1>
            <p className="mt-4 text-zinc-400 text-sm leading-relaxed">
              Have questions about registration, verifications, or subscription tiers? Shoot us an email or submit the contact form and our support desk will respond within 24 hours.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800">
              <Mail className="w-5 h-5 text-orange-500 shrink-0" />
              <div>
                <h4 className="text-xs text-zinc-500 font-bold uppercase tracking-wide">Email Support</h4>
                <span className="text-sm font-semibold text-zinc-300">support@tradeconnect.com.au</span>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800">
              <Phone className="w-5 h-5 text-orange-500 shrink-0" />
              <div>
                <h4 className="text-xs text-zinc-500 font-bold uppercase tracking-wide">Phone Assistance</h4>
                <span className="text-sm font-semibold text-zinc-300">1300 TRADIE (1300 872 343)</span>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800">
              <MapPin className="w-5 h-5 text-orange-500 shrink-0" />
              <div>
                <h4 className="text-xs text-zinc-500 font-bold uppercase tracking-wide">Sydney Head Office</h4>
                <span className="text-sm font-semibold text-zinc-300">Level 14, 201 Elizabeth St, Sydney NSW 2000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-zinc-900/60 border border-zinc-800 p-8 rounded-2xl shadow-xl">
          {submitted ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Inquiry Received!</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">Thank you for writing to us. A team member will inspect your query and respond shortly.</p>
              <button 
                onClick={() => setSubmitted(false)}
                className="mt-4 text-xs font-semibold text-orange-400 hover:underline cursor-pointer"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Steve Henderson"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="steve@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Subject</label>
                <input
                  type="text"
                  placeholder="Question about verification"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Your Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="How can we help you?"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-600/10"
              >
                <Send className="w-4 h-4" /> Send Message
              </button>
            </form>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-zinc-900 border-t border-zinc-800 py-6 text-center text-xs text-zinc-500 mt-auto">
        &copy; {new Date().getFullYear()} TradeConnect Pty Ltd. All rights reserved.
      </footer>
    </div>
  );
};
export default ContactPage;

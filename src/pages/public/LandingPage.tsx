import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, ShieldCheck, Star, MapPin, ArrowRight, Wrench, Users 
} from 'lucide-react';
import { mockDb } from '../../lib/mockDb';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchCategory, setSearchCategory] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const categories = mockDb.categories.filter(c => c.is_active);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/directory?category=${searchCategory}&location=${searchLocation}`);
  };

  const testimonials = [
    {
      name: 'Sarah Jenkins',
      role: 'Homeowner, Sydney',
      rating: 5,
      comment: 'Found Steve within an hour to fix our leaking kitchen drain. He arrived on time, was highly professional, and the quotation process was completely transparent!'
    },
    {
      name: 'Mark Taylor',
      role: 'Property Manager, Parramatta',
      rating: 5,
      comment: 'TradeConnect makes managing maintenance so easy. I posted an electrical job and received three competitive quotes in minutes. Highly recommended.'
    },
    {
      name: 'Robert Diaz',
      role: 'Tradie (Diaz Landscaping)',
      rating: 5,
      comment: 'Since joining TradeConnect as a Pro Tradie, my lead volume has doubled. The verification badge builds instant trust with local clients.'
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* PUBLIC NAVBAR */}
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
            <Link to="/contact" className="text-zinc-300 hover:text-white transition-colors">Contact</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-zinc-300 hover:text-white">Log In</Link>
            <Link 
              to="/register" 
              className="bg-orange-600 hover:bg-orange-500 text-white text-xs md:text-sm font-bold px-4 py-2 rounded-lg transition-all shadow-md shadow-orange-600/10 hover:shadow-orange-600/20"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-28 border-b border-zinc-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-950/15 via-zinc-950 to-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 mb-6">
            <ShieldCheck className="w-4 h-4" /> Trusted Australian Tradespeople
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Find Trusted <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Tradies</span> Near You
          </h1>
          <p className="mt-6 text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto font-medium">
            Post your job details for free, receive competitive quotes from verified local experts, and pay securely when the work is complete.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mt-10 max-w-3xl mx-auto bg-zinc-900/90 border border-zinc-800 p-2 md:p-3 rounded-2xl flex flex-col md:flex-row items-center gap-2 shadow-2xl">
            <div className="w-full relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-zinc-500" />
              <select
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="w-full bg-transparent pl-12 pr-4 py-3 text-zinc-200 outline-none appearance-none font-medium cursor-pointer"
              >
                <option value="" className="bg-zinc-900">What service do you need?</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name} className="bg-zinc-900">{c.name}</option>
                ))}
              </select>
            </div>
            <div className="hidden md:block w-px h-8 bg-zinc-800 shrink-0"></div>
            <div className="w-full relative flex items-center">
              <MapPin className="absolute left-4 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                placeholder="Enter suburb or postcode (e.g. Sydney)"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="w-full bg-transparent pl-12 pr-4 py-3 text-zinc-200 outline-none font-medium"
              />
            </div>
            <button
              type="submit"
              className="w-full md:w-auto bg-orange-600 hover:bg-orange-500 text-white font-bold px-8 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-600/20"
            >
              Search
            </button>
          </form>

          {/* Quick CTA links */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link 
              to="/register?role=client" 
              className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 font-bold transition-all flex items-center gap-2 text-sm card-lift"
            >
              Post a Job for Free <ArrowRight className="w-4 h-4 text-orange-500" />
            </Link>
            <Link 
              to="/register?role=tradie" 
              className="px-6 py-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/25 border border-orange-500/20 hover:border-orange-500/35 text-orange-400 font-bold transition-all flex items-center gap-2 text-sm card-lift"
            >
              Join as a Tradie <ArrowRight className="w-4 h-4 text-orange-400" />
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED CATEGORIES SECTION */}
      <section className="py-16 md:py-24 bg-zinc-950 border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Featured Categories</h2>
            <p className="mt-4 text-zinc-400 font-medium">
              Browse professional services available in your community. Real-time access to experienced, rated experts.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.slice(0, 10).map((cat) => (
              <Link 
                key={cat.id} 
                to={`/directory?category=${encodeURIComponent(cat.name)}`}
                className="glass-card p-6 text-center hover:border-orange-500 flex flex-col items-center justify-center gap-3 card-lift"
              >
                <div className="w-12 h-12 bg-orange-600/10 rounded-full flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-inner">
                  <Wrench className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-zinc-100">{cat.name}</h4>
                <span className="text-[10px] text-zinc-500 font-semibold uppercase leading-none">View Listings</span>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link 
              to="/categories" 
              className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 font-bold text-sm border-b border-orange-500/30 pb-0.5"
            >
              Browse all trade categories
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-16 md:py-24 bg-zinc-900/30 border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-white">How It Works</h2>
            <p className="mt-4 text-zinc-400 font-medium">
              We make job completion stress-free in just four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
            
            {/* Client Side */}
            <div className="bg-zinc-900/60 border border-zinc-800 p-8 rounded-2xl">
              <h3 className="text-xl font-bold text-orange-400 flex items-center gap-2 mb-8 border-b border-zinc-800 pb-4">
                <Users className="w-5 h-5" /> For Clients
              </h3>
              <div className="space-y-6">
                {[
                  { step: '1', title: 'Post a Job', desc: 'Describe the issue, specify your budget range, and upload photos.' },
                  { step: '2', title: 'Compare Quotes', desc: 'Receive pricing offers from local tradies. Inspect reviews and bios.' },
                  { step: '3', title: 'Chat & Assign', desc: 'Message builders directly in the chat and assign the job securely.' },
                  { step: '4', title: 'Confirm & Review', desc: 'Confirm completion when the job is done and leave a rating.' }
                ].map((s) => (
                  <div key={s.step} className="flex gap-4">
                    <span className="w-8 h-8 rounded-full bg-orange-600/10 text-orange-500 border border-orange-500/25 flex items-center justify-center font-bold text-sm shrink-0">
                      {s.step}
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-base">{s.title}</h4>
                      <p className="text-zinc-400 text-sm mt-1">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tradie Side */}
            <div className="bg-zinc-900/60 border border-zinc-800 p-8 rounded-2xl">
              <h3 className="text-xl font-bold text-orange-400 flex items-center gap-2 mb-8 border-b border-zinc-800 pb-4">
                <Wrench className="w-5 h-5" /> For Tradies
              </h3>
              <div className="space-y-6">
                {[
                  { step: '1', title: 'Register Business', desc: 'Create your business profile, select categories, and add areas.' },
                  { step: '2', title: 'Submit Documents', desc: 'Upload your trade license and insurance to earn a Verified badge.' },
                  { step: '3', title: 'Browse Jobs & Quote', desc: 'Find local open jobs in your sector. Submit pricing proposals.' },
                  { step: '4', title: 'Get Hired & Paid', desc: 'Communicate with clients, start jobs, and grow your local client base.' }
                ].map((s) => (
                  <div key={s.step} className="flex gap-4">
                    <span className="w-8 h-8 rounded-full bg-orange-600/10 text-orange-500 border border-orange-500/25 flex items-center justify-center font-bold text-sm shrink-0">
                      {s.step}
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-base">{s.title}</h4>
                      <p className="text-zinc-400 text-sm mt-1">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="py-16 md:py-24 bg-zinc-950 border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-extrabold text-white">What Australians Are Saying</h2>
            <p className="mt-3 text-zinc-400 font-medium">Read testimonials from homeowners and tradespeople.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div key={idx} className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex gap-1 mb-4">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-orange-500 text-orange-500" />
                    ))}
                  </div>
                  <p className="text-zinc-300 text-sm italic leading-relaxed">"{t.comment}"</p>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-white">{t.name}</h5>
                    <span className="text-[10px] text-zinc-500 font-medium">{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-zinc-900 border-t border-zinc-800 py-12 text-zinc-500 text-sm mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 text-white mb-4">
              <Wrench className="w-6 h-6 text-orange-500" />
              <span className="font-extrabold text-lg">TradeConnect</span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              TradeConnect connects clients with verified and trusted local service professionals. Proudly servicing Australian homes and commercial properties.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-zinc-200 mb-4 text-xs uppercase tracking-wider">For Clients</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/register" className="hover:text-zinc-300 transition-colors">Post a Job</Link></li>
              <li><Link to="/directory" className="hover:text-zinc-300 transition-colors">Browse Directory</Link></li>
              <li><Link to="/login" className="hover:text-zinc-300 transition-colors">Client Log In</Link></li>
              <li><Link to="/about" className="hover:text-zinc-300 transition-colors">Security Guarantee</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-zinc-200 mb-4 text-xs uppercase tracking-wider">For Tradies</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/register?role=tradie" className="hover:text-zinc-300 transition-colors">Join as a Provider</Link></li>
              <li><Link to="/login" className="hover:text-zinc-300 transition-colors">Tradie Sign In</Link></li>
              <li><Link to="/about" className="hover:text-zinc-300 transition-colors">Subscription Plans</Link></li>
              <li><Link to="/about" className="hover:text-zinc-300 transition-colors">FAQ & Support</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-zinc-200 mb-4 text-xs uppercase tracking-wider">Company</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/about" className="hover:text-zinc-300 transition-colors">About Our Platform</Link></li>
              <li><Link to="/contact" className="hover:text-zinc-300 transition-colors">Contact Support</Link></li>
              <li><a href="#" className="hover:text-zinc-300 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-zinc-300 transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-zinc-800/60 text-center text-xs">
          &copy; {new Date().getFullYear()} TradeConnect Pty Ltd. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
export default LandingPage;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCats = async () => {
      const { data } = await supabase.from('trade_categories').select('*').eq('is_active', true);
      if (data) setCategories(data);
    };
    fetchCats();
  }, []);

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
            <Link to="/categories" className="text-white">Services</Link>
            <Link to="/about" className="text-zinc-300 hover:text-white transition-colors">About Us</Link>
            <Link to="/contact" className="text-zinc-300 hover:text-white transition-colors">Contact</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-zinc-300 hover:text-white">Log In</Link>
            <Link to="/register" className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all">Sign Up</Link>
          </div>
        </div>
      </header>

      {/* VIEW */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 mb-4">
            Services Catalog
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            Our Trade Categories
          </h1>
          <p className="mt-4 text-zinc-400 font-medium">
            Select a trade service to find vetted professionals who serve your postcode radius.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((c) => (
            <Link 
              key={c.id} 
              to={`/directory?category=${encodeURIComponent(c.name)}`}
              className="bg-zinc-900/40 border border-zinc-850 p-6 rounded-2xl flex flex-col justify-between hover:border-orange-500/40 hover:bg-zinc-900/60 transition-all card-lift"
            >
              <div>
                <div className="w-10 h-10 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Wrench className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{c.name}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{c.description}</p>
              </div>
              
              <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs font-bold text-orange-400 hover:text-orange-300">
                <span>Browse providers</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-zinc-900 border-t border-zinc-800 py-6 text-center text-xs text-zinc-500 mt-auto">
        &copy; {new Date().getFullYear()} TradeConnect Pty Ltd. All rights reserved.
      </footer>
    </div>
  );
};
export default CategoriesPage;

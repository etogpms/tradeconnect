import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  Search, Star, ShieldCheck, MapPin, Filter, Wrench, 
  Check, X, AlertCircle 
} from 'lucide-react';
import type { TradieProfile, Profile, Job } from '../../lib/mockDb';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

export const TradieDirectory: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Filter States
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [locationSearch, setLocationSearch] = useState(searchParams.get('location') || '');
  const [minRating, setMinRating] = useState<number>(0);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [availability, setAvailability] = useState('');

  // Profiles list
  const [tradiesList, setTradiesList] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Quote Request Modal State
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedTradie, setSelectedTradie] = useState<any>(null);
  const [clientJobs, setClientJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    // Load categories
    const loadCategories = async () => {
      const { data } = await supabase.from('trade_categories').select('*');
      if (data) setCategories(data);
    };

    // Load tradies and join with profiles
    const loadTradies = async () => {
      const { data: tradiesData } = await supabase.from('tradies').select('*');
      const { data: profilesData } = await supabase.from('profiles').select('*');
      const { data: tradieCats } = await supabase.from('tradie_categories').select('*');

      if (tradiesData && profilesData) {
        // Zip tradies with profile details
        const combined = tradiesData.map((t: TradieProfile) => {
          const profile = profilesData.find((p: Profile) => p.id === t.user_id);
          const tCats = tradieCats ? tradieCats.filter((tc: any) => tc.tradie_id === t.id) : [];
          
          return {
            ...t,
            profile,
            category_ids: tCats.map((tc: any) => tc.category_id)
          };
        });
        setTradiesList(combined);
      }
    };

    loadCategories();
    loadTradies();
  }, []);

  // Fetch client jobs if modal opens
  useEffect(() => {
    if (!requestModalOpen || !user || user.role !== 'client') return;

    const fetchClientJobs = async () => {
      // Find client profile id
      const { data: clientProfile } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (clientProfile) {
        const { data: jobs } = await supabase
          .from('jobs')
          .select('*')
          .eq('client_id', clientProfile.id)
          .eq('status', 'open');
        
        if (jobs) {
          setClientJobs(jobs);
          if (jobs.length > 0) setSelectedJobId(jobs[0].id);
        }
      }
    };

    fetchClientJobs();
  }, [requestModalOpen, user]);

  const handleRequestQuote = (tradie: any) => {
    if (!user) {
      navigate('/login?redirect=directory');
      return;
    }
    if (user.role !== 'client') {
      alert('Only clients can request quotes.');
      return;
    }
    setSelectedTradie(tradie);
    setRequestModalOpen(true);
    setInviteSuccess(false);
    setInviteError('');
  };

  const submitInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId || !selectedTradie) return;

    try {
      // Check if quote already exists
      const { data: existing } = await supabase
        .from('quotes')
        .select('*')
        .eq('job_id', selectedJobId)
        .eq('tradie_id', selectedTradie.id)
        .single();

      if (existing) {
        setInviteError('This tradie has already submitted a quote or been invited to this job.');
        return;
      }

      // Simulate sending notifications to tradie
      await supabase.from('notifications').insert({
        user_id: selectedTradie.user_id,
        title: 'Quote request received!',
        message: `Client ${user?.full_name} has requested a quote for their job. Details are available on your jobs board.`,
        type: 'quote_request'
      });

      setInviteSuccess(true);
      setTimeout(() => {
        setRequestModalOpen(false);
      }, 2000);
    } catch (e: any) {
      setInviteError(e.message || 'Failed to request quote.');
    }
  };

  // Filter application
  const filteredTradies = tradiesList.filter((t) => {
    // 1. Category Filter
    if (categoryFilter) {
      const matchCat = categories.find(c => c.name.toLowerCase() === categoryFilter.toLowerCase());
      if (matchCat && !t.category_ids.includes(matchCat.id)) return false;
    }

    // 2. Suburb / Location Search
    if (locationSearch) {
      const loc = locationSearch.toLowerCase();
      const cityMatch = t.city && t.city.toLowerCase().includes(loc);
      const stateMatch = t.state && t.state.toLowerCase().includes(loc);
      const postcodeMatch = t.postcode && t.postcode.includes(loc);
      const businessAddrMatch = t.business_address && t.business_address.toLowerCase().includes(loc);
      if (!cityMatch && !stateMatch && !postcodeMatch && !businessAddrMatch) return false;
    }

    // 3. Rating Filter
    if (minRating > 0 && t.rating < minRating) return false;

    // 4. Verification Filter
    if (onlyVerified && t.verification_status !== 'approved') return false;

    // 5. Availability Filter
    if (availability && t.availability_status !== availability) return false;

    return true;
  });

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
            <Link to="/directory" className="text-white">Find a Tradie</Link>
            <Link to="/categories" className="text-zinc-300 hover:text-white transition-colors">Services</Link>
            <Link to="/about" className="text-zinc-300 hover:text-white transition-colors">About Us</Link>
            <Link to="/contact" className="text-zinc-300 hover:text-white transition-colors">Contact</Link>
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <Link 
                to={user.role === 'client' ? '/client' : user.role === 'tradie' ? '/tradie' : '/admin'}
                className="text-sm font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-zinc-300 hover:text-white">Log In</Link>
                <Link to="/register" className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* DIRECTORY VIEW */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col md:flex-row gap-8">
        
        {/* FILTERS PANEL */}
        <aside className="w-full md:w-64 shrink-0 bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl h-fit sticky top-20">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-4 mb-6">
            <Filter className="w-5 h-5 text-orange-500" />
            <h3 className="font-extrabold text-white text-base">Filter Profiles</h3>
          </div>

          <div className="space-y-5">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Trade Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Suburb Search */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Suburb or City</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Sydney"
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Minimum Rating</label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
              >
                <option value="0">Any rating</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="4.0">4.0+ Stars</option>
                <option value="3.0">3.0+ Stars</option>
              </select>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Availability</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
              >
                <option value="">Any availability</option>
                <option value="available">Available Now</option>
                <option value="busy">Busy</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            {/* Verified toggle */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="verifiedOnly"
                checked={onlyVerified}
                onChange={(e) => setOnlyVerified(e.target.checked)}
                className="rounded border-zinc-800 bg-zinc-950 text-orange-600 focus:ring-orange-500/20"
              />
              <label htmlFor="verifiedOnly" className="text-sm font-semibold text-zinc-300 cursor-pointer select-none">
                Verified Tradies Only
              </label>
            </div>

            <button
              onClick={() => {
                setCategoryFilter('');
                setLocationSearch('');
                setMinRating(0);
                setOnlyVerified(false);
                setAvailability('');
              }}
              className="w-full text-center text-xs font-bold text-zinc-500 hover:text-zinc-300 pt-2 border-t border-zinc-800/60 cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        </aside>

        {/* LISTINGS AREA */}
        <section className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">
              {filteredTradies.length} Tradies Found
            </h2>
            {categoryFilter && (
              <span className="bg-orange-500/10 text-orange-400 text-xs font-bold px-3 py-1 rounded-full border border-orange-500/20">
                {categoryFilter}
              </span>
            )}
          </div>

          {filteredTradies.length === 0 ? (
            <div className="text-center py-20 bg-zinc-900/20 border border-zinc-800 rounded-2xl">
              <Wrench className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-zinc-300">No tradies match your filters</h3>
              <p className="text-zinc-500 mt-2 text-sm">Try broadening your search or choosing a different suburb.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredTradies.map((t) => {
                const tradieCats = categories.filter(c => t.category_ids.includes(c.id)).map(c => c.name);
                return (
                  <div key={t.id} className="bg-zinc-900/40 border border-zinc-850 p-6 rounded-xl hover:border-orange-500/30 transition-all flex flex-col md:flex-row justify-between gap-6 card-lift">
                    <div className="flex gap-4">
                      <img 
                        src={t.profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'} 
                        alt={t.profile?.full_name || 'Business'} 
                        className="w-16 h-16 rounded-xl border border-zinc-700 object-cover shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-extrabold text-white leading-none">
                            {t.business_name || t.profile?.full_name || 'Service Provider'}
                          </h3>
                          {t.verification_status === 'approved' && (
                            <span className="text-orange-500 flex items-center shrink-0" title="Verified Tradie">
                              <ShieldCheck className="w-5 h-5 fill-orange-500/10" />
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {tradieCats.map((catName: string) => (
                            <span key={catName} className="bg-zinc-800/80 text-zinc-300 text-[10px] font-bold px-2 py-0.5 rounded border border-zinc-700/60">
                              {catName}
                            </span>
                          ))}
                        </div>
                        <p className="text-zinc-400 text-xs mt-3 line-clamp-2 max-w-xl leading-relaxed">
                          {t.bio || 'No business description provided yet.'}
                        </p>
                        <div className="flex flex-wrap gap-4 text-xs font-semibold text-zinc-500 mt-4">
                          <span className="flex items-center gap-1 text-zinc-400">
                            <MapPin className="w-4 h-4 text-orange-500" />
                            {t.city || 'Anywhere'}, {t.state || 'AU'}
                          </span>
                          <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                            <Star className="w-4 h-4 fill-amber-400 shrink-0" />
                            {t.rating > 0 ? t.rating.toFixed(1) : 'New'} ({t.total_reviews} reviews)
                          </span>
                          <span>
                            Experience: {t.years_experience} years
                          </span>
                          <span className={`capitalize font-bold ${t.availability_status === 'available' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                            &bull; {t.availability_status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="md:text-right flex flex-row md:flex-col justify-between items-center md:items-end gap-3 shrink-0 border-t md:border-t-0 border-zinc-800/60 pt-4 md:pt-0">
                      <div>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Service Radius</span>
                        <span className="text-sm font-bold text-zinc-300">{t.service_radius_km}km from base</span>
                      </div>
                      <button
                        onClick={() => handleRequestQuote(t)}
                        className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 px-5 rounded-lg text-sm transition-all cursor-pointer shadow-md shadow-orange-600/10 card-lift"
                      >
                        Request Quote
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* REQUEST QUOTE MODAL */}
      {requestModalOpen && selectedTradie && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
              <h3 className="font-extrabold text-white text-base">Request Quote</h3>
              <button 
                onClick={() => setRequestModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={submitInvitation} className="p-6 space-y-4">
              {inviteSuccess ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-center space-y-2">
                  <Check className="w-8 h-8 mx-auto text-emerald-400 bg-emerald-500/10 rounded-full p-1 border border-emerald-500/25" />
                  <h4 className="font-bold">Quote Request Sent!</h4>
                  <p className="text-xs">We have alerted {selectedTradie.business_name || selectedTradie.profile?.full_name}. They will review your job details and message you.</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                    <img 
                      src={selectedTradie.profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                      alt="" 
                      className="w-12 h-12 rounded-lg object-cover border border-zinc-800"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-white">{selectedTradie.business_name || selectedTradie.profile?.full_name}</h4>
                      <span className="text-[10px] text-zinc-500 font-semibold">{selectedTradie.city}, {selectedTradie.state}</span>
                    </div>
                  </div>

                  {inviteError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{inviteError}</span>
                    </div>
                  )}

                  {clientJobs.length === 0 ? (
                    <div className="text-center py-6 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
                      <p className="text-xs text-zinc-500">You do not have any open job postings.</p>
                      <Link 
                        to="/client/post-job"
                        className="inline-block bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                      >
                        Create a Job Post
                      </Link>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Select Your Active Job</label>
                      <select
                        value={selectedJobId}
                        onChange={(e) => setSelectedJobId(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none cursor-pointer"
                      >
                        {clientJobs.map((j) => (
                          <option key={j.id} value={j.id}>{j.title}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-zinc-500 mt-2">
                        Inviting a tradie automatically alerts them about this job so they can submit a customized quote.
                      </p>
                    </div>
                  )}

                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setRequestModalOpen(false)}
                      className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    {clientJobs.length > 0 && (
                      <button
                        type="submit"
                        className="w-full bg-orange-600 hover:bg-orange-500 text-white py-2.5 rounded-lg text-xs font-bold cursor-pointer shadow-lg shadow-orange-600/10"
                      >
                        Send Request
                      </button>
                    )}
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default TradieDirectory;

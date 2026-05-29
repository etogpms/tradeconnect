import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { supabase, isDemoMode } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Wrench, FileText, User, Bell, ShieldCheck, ShieldAlert, Clock, MapPin, 
  Send, CheckCircle, Upload, Trash, AlertTriangle, Check, X
} from 'lucide-react';
import confetti from 'canvas-confetti';

// =========================================================================
// 1. TRADIE OVERVIEW
// =========================================================================
const TradieOverview: React.FC<{ tradieProfile: any }> = ({ tradieProfile }) => {
  const [stats, setStats] = useState({ matching: 0, quotes: 0, active: 0, completed: 0 });
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (!tradieProfile) return;
    const fetchStats = async () => {
      // Fetch matching job counts (open jobs that share category with tradie)
      const { data: tc } = await supabase.from('tradie_categories').select('category_id').eq('tradie_id', tradieProfile.id);
      const catIds = tc ? tc.map((item: any) => item.category_id) : [];

      let matchingCount = 0;
      if (catIds.length > 0) {
        const { data: matchJobs } = await supabase
          .from('jobs')
          .select('id')
          .eq('status', 'open');
        
        // Filter in frontend to simplify mock joins
        if (matchJobs) {
          const { data: allJobs } = await supabase.from('jobs').select('*');
          if (allJobs) {
            matchingCount = allJobs.filter((j: any) => j.status === 'open' && catIds.includes(j.category_id)).length;
          }
        }
      }

      // Fetch quote count
      const { data: quotes } = await supabase.from('quotes').select('id').eq('tradie_id', tradieProfile.id);
      
      const { data: allJobsAssigned } = await supabase.from('jobs').select('*').eq('assigned_tradie_id', tradieProfile.id);
      const active = allJobsAssigned ? allJobsAssigned.filter((j: any) => ['assigned', 'in_progress', 'completion_requested'].includes(j.status)).length : 0;
      const completed = allJobsAssigned ? allJobsAssigned.filter((j: any) => j.status === 'completed').length : 0;

      setStats({
        matching: matchingCount,
        quotes: quotes ? quotes.length : 0,
        active,
        completed
      });

      // Fetch subscription plan
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('tradie_id', tradieProfile.id)
        .eq('status', 'active')
        .single();
      
      if (sub) setSubscription(sub);
    };

    fetchStats();
  }, [tradieProfile]);

  return (
    <div className="space-y-6">
      {/* Verification alerts */}
      {tradieProfile.verification_status === 'not_submitted' && (
        <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 p-4 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Account Verification Required</h4>
            <p className="text-xs text-zinc-400 mt-1">Upload your trade license and business registration on the Verification Docs page to unlock the "Verified Tradie" trust badge and request premium quotes.</p>
            <Link to="/tradie/documents" className="inline-block mt-3 text-xs bg-orange-600 hover:bg-orange-500 text-white font-bold px-3 py-1.5 rounded-lg">Upload Documents</Link>
          </div>
        </div>
      )}

      {tradieProfile.verification_status === 'pending' && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl flex items-center gap-3">
          <Clock className="w-5 h-5 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Documents Under Review</h4>
            <p className="text-xs text-zinc-400 mt-0.5">Our administration panel is checking your certificates. This usually takes less than 24 hours.</p>
          </div>
        </div>
      )}

      {tradieProfile.verification_status === 'approved' && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Vetted Profile Verified</h4>
            <p className="text-xs text-zinc-400 mt-0.5">Your profile is fully verified! You enjoy maximum visibility and priority quoting.</p>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { name: 'Matching Leads', value: stats.matching, icon: Bell, color: 'text-orange-500 bg-orange-500/10' },
          { name: 'Quotes Submitted', value: stats.quotes, icon: FileText, color: 'text-amber-400 bg-amber-400/10' },
          { name: 'Active Assigned', value: stats.active, icon: Wrench, color: 'text-emerald-400 bg-emerald-400/10' },
          { name: 'Completed Works', value: stats.completed, icon: CheckCircle, color: 'text-blue-400 bg-blue-500/10' }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-400 font-bold block">{stat.name}</span>
                <span className="text-2xl font-extrabold text-white mt-1 block">{stat.value}</span>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color} border border-white/5`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subscription Tier Details */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-white text-base mb-2">Subscription Tier</h3>
            <p className="text-xs text-zinc-400">Your plan determines your maximum lead quoting capacity and platform search visibility.</p>
            <div className="mt-4 p-4 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase">Active Tier</span>
                <h4 className="text-lg font-black text-white mt-0.5">{subscription?.plan_name || 'Free Plan'}</h4>
              </div>
              <span className="text-xl font-extrabold text-orange-500">
                ${subscription?.price || 0}<span className="text-xs text-zinc-500 font-medium">/mo</span>
              </span>
            </div>
          </div>
          <Link to="/tradie/subscription" className="mt-6 text-center bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 text-zinc-300 text-xs font-bold py-2.5 rounded-lg transition-all">
            Upgrade Subscription
          </Link>
        </div>

        {/* Business summary card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <h3 className="font-extrabold text-white text-base">Business Dashboard Summary</h3>
          <div className="flex items-center gap-4 bg-zinc-955 p-3 rounded-xl border border-zinc-850">
            <div className="text-center shrink-0">
              <span className="text-2xl font-black text-amber-400">{tradieProfile.rating > 0 ? tradieProfile.rating.toFixed(1) : '0.0'}</span>
              <span className="block text-[9px] text-zinc-500 font-bold uppercase mt-0.5">Rating</span>
            </div>
            <div className="w-px h-10 bg-zinc-800 shrink-0"></div>
            <div>
              <span className="text-sm font-bold text-zinc-200">{tradieProfile.business_name || 'Individual Contractor'}</span>
              <span className="block text-xs text-zinc-500 font-semibold mt-1">Total reviews: {tradieProfile.total_reviews} &bull; Exp: {tradieProfile.years_experience} years</span>
            </div>
          </div>
          <Link to="/tradie/profile" className="block text-center text-xs font-bold text-orange-400 hover:underline">
            Manage business profile card
          </Link>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 2. AVAILABLE JOBS & SUBMIT QUOTE DRAWER
// =========================================================================
const AvailableJobs: React.FC<{ tradieProfile: any }> = ({ tradieProfile }) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  
  // Quoting form state
  const [quoteAmount, setQuoteAmount] = useState('');
  const [duration, setDuration] = useState('1 day');
  const [startDate, setStartDate] = useState('');
  const [proposal, setProposal] = useState('');
  const [scope, setScope] = useState('');
  const [inclusions, setInclusions] = useState('');
  const [exclusions, setExclusions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadLeads = async () => {
      // Find tradie category maps
      const { data: tCats } = await supabase.from('tradie_categories').select('category_id').eq('tradie_id', tradieProfile.id);
      const catIds = tCats ? tCats.map((tc: any) => tc.category_id) : [];

      // Fetch open jobs
      const { data: openJobs } = await supabase.from('jobs').select('*').eq('status', 'open');
      const { data: quoteJobs } = await supabase.from('jobs').select('*').eq('status', 'quoting');
      
      const combined = [...(openJobs || []), ...(quoteJobs || [])];
      
      // Filter by tradie categories
      const filtered = catIds.length > 0 
        ? combined.filter((j: any) => catIds.includes(j.category_id))
        : combined;

      setJobs(filtered);

      const { data: catList } = await supabase.from('trade_categories').select('*');
      if (catList) setCategories(catList);
    };

    loadLeads();
  }, [tradieProfile]);

  const handleOpenQuote = (job: any) => {
    setSelectedJob(job);
    setQuoteAmount('');
    setProposal('');
    setScope('');
    setInclusions('');
    setExclusions('');
    setError('');
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    setError('');
    setSubmitting(true);

    try {
      const { error: quoteErr } = await supabase.from('quotes').insert({
        job_id: selectedJob.id,
        tradie_id: tradieProfile.id,
        amount: parseFloat(quoteAmount),
        estimated_duration: duration,
        available_date: startDate || new Date().toISOString().split('T')[0],
        proposal_message: proposal,
        scope_of_work: scope,
        inclusions: inclusions,
        exclusions: exclusions,
        status: 'submitted'
      });

      if (quoteErr) throw quoteErr;

      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      alert('Your quote has been submitted successfully to the client!');
      setSelectedJob(null);
      
      // Reload jobs
      const { data: openJobs } = await supabase.from('jobs').select('*').eq('status', 'open');
      const { data: quoteJobs } = await supabase.from('jobs').select('*').eq('status', 'quoting');
      const combined = [...(openJobs || []), ...(quoteJobs || [])];
      setJobs(combined);
    } catch (err: any) {
      setError(err.message || 'Failed to submit quote');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Available Trades Leads</h2>
        <p className="text-xs text-zinc-400 mt-1">Browse open job requests matching your registered trade category.</p>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/10 border border-zinc-800 rounded-2xl">
          <Wrench className="w-12 h-12 text-zinc-750 mx-auto mb-4" />
          <h3 className="font-bold text-zinc-400">No open jobs found</h3>
          <p className="text-xs text-zinc-500 mt-1">Verify that your trade categories are correctly configured on your Profile page.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => {
            const cat = categories.find(c => c.id === job.category_id);
            return (
              <div key={job.id} className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-xl flex flex-col justify-between hover:border-orange-500/20 transition-all card-lift">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="bg-orange-500/10 text-orange-400 text-[10px] font-bold px-2.5 py-0.5 rounded border border-orange-500/20">
                      {cat?.name || 'Trade'}
                    </span>
                    <span className="text-[10px] font-bold capitalize text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                      {job.urgency} Urgency
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base mt-3">{job.title}</h3>
                  <p className="text-zinc-400 text-xs mt-2 line-clamp-3 leading-relaxed">{job.description}</p>
                  
                  <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] font-semibold text-zinc-500 bg-zinc-950 p-2.5 rounded-lg border border-zinc-850">
                    <div>
                      <span className="text-zinc-500 uppercase font-bold block text-[9px]">Budget Range</span>
                      <span className="text-zinc-300 text-xs">${job.budget_min} - ${job.budget_max}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase font-bold block text-[9px]">Preferred Date</span>
                      <span className="text-zinc-300 text-xs">{job.preferred_date || 'Flexible'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-zinc-800/60 flex items-center justify-between">
                  <div className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <span>{job.city}, {job.state}</span>
                  </div>
                  <button
                    onClick={() => handleOpenQuote(job)}
                    className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold py-2 px-4 rounded-lg cursor-pointer"
                  >
                    Submit Quotation
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUOTATION FORM OVERLAY DRAWER */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-850 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
              <h3 className="font-extrabold text-white text-base">Submit Quote Proposal</h3>
              <button 
                onClick={() => setSelectedJob(null)}
                className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitQuote} className="p-6 overflow-y-auto max-h-[80vh] space-y-4">
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850">
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide">Quoting For</span>
                <h4 className="font-bold text-white text-sm mt-0.5">{selectedJob.title}</h4>
                <p className="text-[10px] text-zinc-500 mt-2">Client budget: ${selectedJob.budget_min} - ${selectedJob.budget_max}</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Quote Amount ($ AUD)</label>
                  <input
                    type="number"
                    required
                    placeholder="250"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Est. Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none cursor-pointer"
                  >
                    <option value="1-2 hours">1-2 hours</option>
                    <option value="Half Day">Half Day</option>
                    <option value="1 day">1 day</option>
                    <option value="2-3 days">2-3 days</option>
                    <option value="1 week">1 week</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Earliest Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Proposal message</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Introduce yourself, mention your relevant expertise, and how you will complete the job..."
                  value={proposal}
                  onChange={(e) => setProposal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-orange-500 focus:outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Scope of work</label>
                <textarea
                  rows={2}
                  placeholder="Steps to carry out (e.g. 1. Snaking sewerage line, 2. Flush testing)..."
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-orange-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Inclusions</label>
                  <input
                    type="text"
                    placeholder="e.g. Parts and cleanup"
                    value={inclusions}
                    onChange={(e) => setInclusions(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Exclusions</label>
                  <input
                    type="text"
                    placeholder="e.g. Disposal of concrete rubble"
                    value={exclusions}
                    onChange={(e) => setExclusions(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white py-2.5 rounded-lg text-xs font-bold cursor-pointer shadow-lg shadow-orange-600/10"
                >
                  {submitting ? 'Submitting...' : 'Submit Quote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// 3. MY JOBS (ASSIGNED AND PROGRESS CONTROLLER)
// =========================================================================
const TradieJobs: React.FC<{ tradieProfile: any }> = ({ tradieProfile }) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  
  // Progress status message states
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPhoto, setProgressPhoto] = useState('');
  const [loading, setLoading] = useState(false);

  // Chat conversation state
  const [conversation, setConversation] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadTradieJobs = async () => {
    const { data } = await supabase.from('jobs').select('*').eq('assigned_tradie_id', tradieProfile.id);
    if (data) setJobs(data);
  };

  useEffect(() => {
    loadTradieJobs();
  }, [tradieProfile]);

  const handleOpenJobDetails = async (job: any) => {
    setSelectedJob(job);
    setProgressMsg('');
    setProgressPhoto('');

    // Fetch conversation for chat
    const { data: conv } = await supabase
      .from('conversations')
      .select('*')
      .eq('job_id', job.id)
      .eq('tradie_id', tradieProfile.id)
      .single();

    if (conv) {
      setConversation(conv);
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true });
      if (messages) setChatMessages(messages);
    }
  };

  // Realtime subscription for messages inside chat
  useEffect(() => {
    if (!conversation) return;

    const channel = supabase
      .channel(`chat-tradie-${conversation.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` }, (payload: any) => {
        setChatMessages((prev) => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation) return;

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: tradieProfile.user_id,
        message: newMessage.trim(),
        is_read: false
      });
      if (error) throw error;
      
      // refresh lists
      if (isDemoMode) {
        setTimeout(async () => {
          const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: true });
          if (data) setChatMessages(data);
        }, 100);
      }

      setNewMessage('');
    } catch (e: any) {
      alert(e.message || 'Failed to send message');
    }
  };

  const handleProgressPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProgressPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateProgress = async (newStatus: any, defaultMsg: string) => {
    if (!selectedJob) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          status: newStatus,
          update_message: progressMsg || defaultMsg,
          photo_url: progressPhoto
        })
        .eq('id', selectedJob.id);

      if (error) throw error;

      alert(`Job progress updated: ${newStatus.replace('_', ' ')}`);
      setProgressMsg('');
      setProgressPhoto('');
      
      // reload details
      const { data: updatedJob } = await supabase.from('jobs').select('*').eq('id', selectedJob.id).single();
      if (updatedJob) setSelectedJob(updatedJob);
      loadTradieJobs();
    } catch (e: any) {
      alert(e.message || 'Failed to update job status.');
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (_clientId: string) => {
    return 'Dave Henderson'; // Default seed client name
  };

  return (
    <div className="space-y-6">
      {!selectedJob ? (
        <>
          <div>
            <h2 className="text-xl font-bold text-white">Active Assigned Projects</h2>
            <p className="text-xs text-zinc-400 mt-1">Review active, in-progress, or completion requested jobs.</p>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-20 bg-zinc-900/10 border border-zinc-800 rounded-2xl">
              <Wrench className="w-12 h-12 text-zinc-750 mx-auto mb-4" />
              <h3 className="font-bold text-zinc-400">No assigned jobs yet</h3>
              <p className="text-xs text-zinc-500 mt-1">Submit quotes on open leads. Once a client accepts your quote, the job will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.map((job) => (
                <div key={job.id} className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-xl flex flex-col justify-between hover:border-orange-500/20 transition-all card-lift">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1">
                        <User className="w-3.5 h-3.5" /> Client: {getClientName(job.client_id)}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        job.status === 'assigned' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        job.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        job.status === 'completion_requested' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        job.status === 'completed' ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' :
                        'bg-zinc-850 text-zinc-400'
                      }`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-base mt-3">{job.title}</h3>
                    <p className="text-zinc-400 text-xs mt-2 line-clamp-2 leading-relaxed">{job.description}</p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-zinc-800/60 flex items-center justify-between">
                    <span className="text-xs text-zinc-500 font-semibold flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-orange-500" />
                      {job.city}, {job.state}
                    </span>
                    <button
                      onClick={() => handleOpenJobDetails(job)}
                      className="bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 text-zinc-300 text-xs font-bold py-1.5 px-3 rounded-lg"
                    >
                      Update & Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => {
              setSelectedJob(null);
              setConversation(null);
              setChatMessages([]);
            }}
            className="text-xs font-bold text-zinc-400 hover:text-zinc-200"
          >
            &larr; Back to Active Jobs
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Detail and Update Controls */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">Assigned Project</span>
                    <h2 className="text-xl font-extrabold text-white mt-1">{selectedJob.title}</h2>
                  </div>
                  <span className="bg-orange-500/10 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-500/20 uppercase">
                    {selectedJob.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{selectedJob.description}</p>

                {/* Progress actions based on status */}
                <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-850 space-y-4">
                  <h4 className="font-extrabold text-white text-sm">Update Job Progress</h4>
                  
                  {selectedJob.status === 'assigned' && (
                    <div className="space-y-3">
                      <p className="text-xs text-zinc-500">Milestone: Start work to notify client you are setting up or arriving on site.</p>
                      <button
                        onClick={() => updateProgress('in_progress', 'Started job execution. Work is in progress.')}
                        disabled={loading}
                        className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 px-6 rounded-lg text-xs transition-all cursor-pointer shadow-lg shadow-orange-600/10"
                      >
                        Start Job Work
                      </button>
                    </div>
                  )}

                  {selectedJob.status === 'in_progress' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Progress Note / Update message</label>
                        <input
                          type="text"
                          placeholder="e.g. Finished routing plumbing lines, starting tests..."
                          value={progressMsg}
                          onChange={(e) => setProgressMsg(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Attach Progress Photo</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProgressPhoto}
                          className="text-xs text-zinc-400 cursor-pointer"
                        />
                        {progressPhoto && (
                          <img src={progressPhoto} alt="Progress Preview" className="w-20 h-20 object-cover mt-2 rounded border border-zinc-800" />
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => updateProgress('in_progress', 'Job progress milestone updated.')}
                          disabled={loading}
                          className="bg-zinc-850 hover:bg-zinc-800 border border-zinc-850 text-zinc-300 font-bold py-2 px-4 rounded-lg text-xs cursor-pointer"
                        >
                          Log Milestone Update
                        </button>
                        <button
                          onClick={() => updateProgress('completion_requested', 'All job tasks finished. Requesting client verification.')}
                          disabled={loading}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg text-xs cursor-pointer shadow-lg shadow-emerald-600/10"
                        >
                          Request Completion Confirmation
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedJob.status === 'completion_requested' && (
                    <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-lg text-amber-400 text-xs flex items-center gap-2">
                      <Clock className="w-5 h-5 shrink-0" />
                      <span>Completion requested. Waiting for client Dave Henderson to inspect and confirm work.</span>
                    </div>
                  )}

                  {selectedJob.status === 'completed' && (
                    <div className="bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 shrink-0" />
                      <span>Job completed! The client has verified the work and locked the project.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chat Box */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-[400px]">
              <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="font-extrabold text-sm text-white">Message Client</span>
                </div>
              </div>

              {/* Chat log */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-zinc-955 flex flex-col">
                {chatMessages.length === 0 ? (
                  <div className="text-center my-auto text-xs text-zinc-600">
                    No messages yet.
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    if (msg.sender_id === 'system') {
                      return (
                        <div key={msg.id} className="chat-bubble-system">
                          {msg.message}
                        </div>
                      );
                    }
                    const isMe = msg.sender_id === tradieProfile.user_id;
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className={isMe ? 'chat-bubble-client' : 'chat-bubble-tradie'}>
                          <p className="text-xs">{msg.message}</p>
                        </div>
                        <span className="text-[8px] text-zinc-650 mt-1 px-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef}></div>
              </div>

              {/* Chat Send Form */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-800 bg-zinc-900 flex gap-2">
                <input
                  type="text"
                  placeholder="Send message to client..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-500 text-white rounded-lg p-2 flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// 4. VERIFICATION DOCUMENTS UPLOAD
// =========================================================================
const TradieDocuments: React.FC<{ tradieProfile: any; onRefresh: () => void }> = ({ tradieProfile, onRefresh }) => {
  const [docs, setDocs] = useState<any[]>([]);
  const [docType, setDocType] = useState<'license' | 'insurance' | 'id' | 'business_registration' | 'certificate' | 'other'>('license');
  const [fileUrl, setFileUrl] = useState('');
  const [expiry, setExpiry] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchDocs = async () => {
    const { data } = await supabase.from('tradie_documents').select('*').eq('tradie_id', tradieProfile.id);
    if (data) setDocs(data);
  };

  useEffect(() => {
    fetchDocs();
  }, [tradieProfile]);

  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUrl) {
      alert('Provide a document link or mock certificate.');
      return;
    }
    setLoading(true);

    try {
      const { error } = await supabase.from('tradie_documents').insert({
        tradie_id: tradieProfile.id,
        document_type: docType,
        file_url: fileUrl,
        expiry_date: expiry || null,
        status: 'pending'
      });

      if (error) throw error;
      
      // Update tradie status to pending
      await supabase.from('tradies').update({ verification_status: 'pending' }).eq('id', tradieProfile.id);

      setFileUrl('');
      setExpiry('');
      alert('Document uploaded successfully. Admin verification pending.');
      fetchDocs();
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error submitting document');
    } finally {
      setLoading(false);
    }
  };

  const deleteDoc = async (id: string) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await supabase.from('tradie_documents').delete().eq('id', id);
      fetchDocs();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Upload Panel */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl h-fit">
        <h3 className="font-extrabold text-white text-base mb-2">Upload Credentials</h3>
        <p className="text-xs text-zinc-400 mb-6">Upload required trades compliance and business registration forms.</p>

        <form onSubmit={handleDocumentSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Document Category</label>
            <select
              value={docType}
              onChange={(e: any) => setDocType(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none cursor-pointer"
            >
              <option value="license">Trade License</option>
              <option value="insurance">Public Liability Insurance</option>
              <option value="id">Photo Identification (ID)</option>
              <option value="business_registration">Business Registration (ABN)</option>
              <option value="certificate">Trade Certificate</option>
              <option value="other">Other Document</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Document File URL (Mock Upload Link)</label>
            <input
              type="text"
              required
              placeholder="e.g. https://images.unsplash.com/photo-..."
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setFileUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800')}
              className="text-[10px] text-orange-400 hover:text-orange-300 font-bold block mt-1 underline cursor-pointer"
            >
              Autofill Sample Certificate Link
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Expiry Date</label>
            <input
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 rounded-lg text-sm transition-all cursor-pointer shadow-lg shadow-orange-600/10 flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {loading ? 'Submitting...' : 'Upload Document'}
          </button>
        </form>
      </div>

      {/* Uploaded Documents List */}
      <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
        <h3 className="font-extrabold text-white text-base mb-4">Verification Documents ({docs.length})</h3>

        {docs.length === 0 ? (
          <div className="text-center py-12 text-xs text-zinc-500">
            No verification documents uploaded. Start by adding a Trade License.
          </div>
        ) : (
          <div className="space-y-4">
            {docs.map((d) => (
              <div key={d.id} className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center text-zinc-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white capitalize">{d.document_type.replace('_', ' ')}</h4>
                    <span className="text-[10px] text-zinc-500 font-semibold block mt-0.5">
                      Expiry: {d.expiry_date ? new Date(d.expiry_date).toLocaleDateString() : 'None'}
                    </span>
                    {d.admin_comment && (
                      <span className="text-[10px] text-red-400 font-medium block mt-1">Admin note: {d.admin_comment}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                    d.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    d.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {d.status}
                  </span>
                  <button
                    onClick={() => deleteDoc(d.id)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer transition-colors"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// =========================================================================
// 5. SUBSCRIPTIONS PLANS AND MOCK PAYMENTS
// =========================================================================
const TradieSubscription: React.FC<{ tradieProfile: any }> = ({ tradieProfile }) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [currentPlan, setCurrentPlan] = useState<any>(null);

  const loadSubData = async () => {
    const { data: planList } = await supabase.from('subscription_plans').select('*');
    if (planList) setPlans(planList);

    const { data: activeSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('tradie_id', tradieProfile.id)
      .eq('status', 'active')
      .single();

    if (activeSub && planList) {
      const match = planList.find((p: any) => p.name === activeSub.plan_name);
      if (match) setCurrentPlan(match);
    }
  };

  useEffect(() => {
    loadSubData();
  }, [tradieProfile]);

  const handleUpgrade = async (plan: any) => {
    if (currentPlan && currentPlan.name === plan.name) {
      alert('You are already subscribed to this tier.');
      return;
    }

    if (!window.confirm(`Upgrade your subscription to the ${plan.name} Tier for $${plan.price}/month?`)) return;

    try {
      // Deactivate old subscription
      await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('tradie_id', tradieProfile.id);

      // Create new subscription record
      await supabase.from('subscriptions').insert({
        tradie_id: tradieProfile.id,
        plan_name: plan.name,
        price: plan.price,
        status: 'active',
        start_date: new Date().toISOString().split('T')[0]
      });

      // Insert transaction logs
      await supabase.from('payments').insert({
        tradie_id: tradieProfile.id,
        amount: plan.price,
        payment_status: 'paid',
        payment_provider: 'stripe'
      });

      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      alert(`Subscription successfully upgraded to ${plan.name}!`);
      loadSubData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Subscription Management</h2>
        <p className="text-xs text-zinc-400 mt-1">Upgrade your quoting limits and search radius capabilities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {plans.map((p) => {
          const isCurrent = currentPlan?.name === p.name || (!currentPlan && p.name === 'Free');
          return (
            <div 
              key={p.id} 
              className={`bg-zinc-900 border rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden ${
                isCurrent ? 'border-orange-500 shadow-premium' : 'border-zinc-800'
              }`}
            >
              {isCurrent && (
                <span className="absolute top-0 right-0 bg-orange-600 text-white font-bold text-[9px] uppercase tracking-wider px-3 py-1 rounded-bl-lg shadow-sm">
                  Active Tier
                </span>
              )}
              
              <div>
                <h3 className="font-extrabold text-white text-base">{p.name}</h3>
                <p className="text-zinc-500 text-[11px] leading-relaxed mt-2">{p.description}</p>
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-black text-white">${p.price}</span>
                  <span className="text-zinc-500 text-xs font-semibold ml-1">/month</span>
                </div>

                <ul className="mt-6 space-y-2 text-xs text-zinc-400">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-orange-500 shrink-0" />
                    <span>Quotes: {p.max_quotes_per_month} per month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-orange-500 shrink-0" />
                    <span>Search Visibility: {p.featured_listing ? 'Featured' : 'Standard'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-orange-500 shrink-0" />
                    <span>Priority Matching: {p.priority_matching ? 'Instant SMS' : 'Standard'}</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleUpgrade(p)}
                disabled={isCurrent}
                className={`mt-8 w-full font-bold py-2 rounded-lg text-xs transition-all cursor-pointer ${
                  isCurrent 
                    ? 'bg-zinc-850 text-zinc-500 border border-zinc-800 cursor-not-allowed' 
                    : 'bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/10'
                }`}
              >
                {isCurrent ? 'Current Plan' : 'Select Plan'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =========================================================================
// 6. TRADIE PROFILE SETTINGS (CATEGORY CONFIGS & radius)
// =========================================================================
const TradieProfileEdit: React.FC<{ tradieProfile: any; onRefresh: () => void }> = ({ tradieProfile, onRefresh }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    business_name: tradieProfile?.business_name || '',
    abn: tradieProfile?.abn || '',
    business_address: tradieProfile?.business_address || '',
    city: tradieProfile?.city || '',
    state: tradieProfile?.state || 'NSW',
    postcode: tradieProfile?.postcode || '',
    service_radius_km: tradieProfile?.service_radius_km || 25,
    years_experience: tradieProfile?.years_experience || 0,
    bio: tradieProfile?.bio || '',
    availability_status: tradieProfile?.availability_status || 'available'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      const { data } = await supabase.from('trade_categories').select('*').eq('is_active', true);
      if (data) setCategories(data);

      const { data: tCats } = await supabase.from('tradie_categories').select('category_id').eq('tradie_id', tradieProfile.id);
      if (tCats) setSelectedCats(tCats.map((tc: any) => tc.category_id));
    };

    loadCategories();
  }, [tradieProfile]);

  const toggleCategory = (catId: string) => {
    setSelectedCats(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      // 1. Update tradies table
      const { error: tradieErr } = await supabase
        .from('tradies')
        .update(formData)
        .eq('id', tradieProfile.id);
      
      if (tradieErr) throw tradieErr;

      // 2. Synchronize tradie_categories
      // delete existing categories mapping
      await supabase.from('tradie_categories').delete().eq('tradie_id', tradieProfile.id);

      // insert selected categories
      for (const catId of selectedCats) {
        await supabase.from('tradie_categories').insert({
          tradie_id: tradieProfile.id,
          category_id: catId
        });
      }

      setSuccess(true);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update profile settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Business Card Settings</h2>
        <p className="text-xs text-zinc-400 mt-1">Configure service sectors, service distance caps, and experience bios.</p>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs mb-4 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Business settings saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Business Name</label>
            <input
              type="text"
              required
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Australian Business Number (ABN)</label>
            <input
              type="text"
              required
              placeholder="11 digits"
              value={formData.abn}
              onChange={(e) => setFormData({ ...formData, abn: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Experience & Radius */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Years Experience</label>
            <input
              type="number"
              value={formData.years_experience}
              onChange={(e) => setFormData({ ...formData, years_experience: parseInt(e.target.value) || 0 })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Service Radius (km)</label>
            <input
              type="number"
              value={formData.service_radius_km}
              onChange={(e) => setFormData({ ...formData, service_radius_km: parseInt(e.target.value) || 0 })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Availability Status</label>
            <select
              value={formData.availability_status}
              onChange={(e) => setFormData({ ...formData, availability_status: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none cursor-pointer"
            >
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
        </div>

        {/* Business address */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Street Address</label>
          <input
            type="text"
            required
            value={formData.business_address}
            onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Suburb / City</label>
            <input
              type="text"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Postcode</label>
            <input
              type="text"
              required
              value={formData.postcode}
              onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">About / Business Bio</label>
          <textarea
            rows={4}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-orange-500 focus:outline-none"
          ></textarea>
        </div>

        {/* Categories Checklist */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Trade Category Specializations</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            {categories.map((c) => {
              const isChecked = selectedCats.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCategory(c.id)}
                  className={`flex items-center justify-between px-3 py-2 text-xs font-bold rounded-lg border text-left transition-all cursor-pointer ${
                    isChecked 
                      ? 'bg-orange-600/15 border-orange-500 text-orange-400' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>{c.name}</span>
                  {isChecked && <Check className="w-4 h-4 shrink-0 text-orange-400" />}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 rounded-lg text-sm transition-all cursor-pointer shadow-md shadow-orange-600/10"
        >
          {loading ? 'Saving settings...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};

// =========================================================================
// MAIN ROUTER PORTAL CONTAINER
// =========================================================================
export const TradieDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tradieProfile, setTradieProfile] = useState<any>(null);

  const fetchTradieProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('tradies').select('*').eq('user_id', user.id).single();
    if (data) setTradieProfile(data);
  };

  useEffect(() => {
    fetchTradieProfile();
  }, [user]);

  if (!tradieProfile) {
    return (
      <div className="text-center py-20">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-xs text-zinc-500">Retrieving business profile...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<TradieOverview tradieProfile={tradieProfile} />} />
      <Route path="/available-jobs" element={<AvailableJobs tradieProfile={tradieProfile} />} />
      <Route path="/my-jobs" element={<TradieJobs tradieProfile={tradieProfile} />} />
      <Route path="/documents" element={<TradieDocuments tradieProfile={tradieProfile} onRefresh={fetchTradieProfile} />} />
      <Route path="/subscription" element={<TradieSubscription tradieProfile={tradieProfile} />} />
      <Route path="/profile" element={<TradieProfileEdit tradieProfile={tradieProfile} onRefresh={fetchTradieProfile} />} />
    </Routes>
  );
};
export default TradieDashboard;

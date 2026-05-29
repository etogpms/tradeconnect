import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { supabase, isDemoMode } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { 
  PlusCircle, Wrench, CheckCircle, 
  Clock, MapPin, DollarSign, Send, Star, AlertTriangle, X, 
  Image, Calendar, Trash, Check 
} from 'lucide-react';
import confetti from 'canvas-confetti';

// =========================================================================
// 1. CLIENT OVERVIEW
// =========================================================================
const ClientOverview: React.FC<{ clientProfile: any }> = ({ clientProfile }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ active: 0, quoting: 0, completed: 0, disputes: 0 });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);

  useEffect(() => {
    if (!clientProfile) return;
    const fetchStats = async () => {
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('client_id', clientProfile.id);

      if (jobs) {
        const active = jobs.filter((j: any) => ['assigned', 'in_progress', 'completion_requested'].includes(j.status)).length;
        const quoting = jobs.filter((j: any) => ['open', 'quoting'].includes(j.status)).length;
        const completed = jobs.filter((j: any) => j.status === 'completed').length;
        const disputes = jobs.filter((j: any) => j.status === 'disputed').length;
        setStats({ active, quoting, completed, disputes });
        setRecentJobs(jobs.slice(0, 3));
      }
    };
    fetchStats();
  }, [clientProfile]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Hello, {user?.full_name}</h2>
        <p className="text-xs text-zinc-400 mt-1">Manage your home repairs and trade services requests.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { name: 'Active Projects', value: stats.active, icon: Wrench, color: 'text-orange-500 bg-orange-500/10' },
          { name: 'Quoting Phase', value: stats.quoting, icon: Clock, color: 'text-amber-400 bg-amber-400/10' },
          { name: 'Completed Jobs', value: stats.completed, icon: CheckCircle, color: 'text-emerald-400 bg-emerald-400/10' },
          { name: 'Disputes Opened', value: stats.disputes, icon: AlertTriangle, color: 'text-red-400 bg-red-400/10' }
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

      {/* Recent Jobs Panel */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-extrabold text-white text-base">Recent Postings</h3>
          <Link to="/client/my-jobs" className="text-xs text-orange-400 hover:underline font-bold">View all jobs</Link>
        </div>

        {recentJobs.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 text-xs">
            No jobs posted yet. Click "Post a Job" to get started.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {recentJobs.map((job) => (
              <div key={job.id} className="py-4 flex justify-between items-center gap-4">
                <div>
                  <h4 className="font-bold text-sm text-zinc-200">{job.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                    <span className="flex items-center gap-0.5"><MapPin className="w-3.5 h-3.5" />{job.city || 'Anywhere'}</span>
                    <span>&bull;</span>
                    <span className="capitalize">{job.urgency} urgency</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    job.status === 'open' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                    job.status === 'assigned' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    job.status === 'completed' ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' :
                    'bg-zinc-800 text-zinc-300'
                  }`}>
                    {job.status.replace('_', ' ')}
                  </span>
                  <Link 
                    to={`/client/jobs/${job.id}`}
                    className="bg-zinc-800 hover:bg-zinc-750 border border-zinc-700/50 text-zinc-300 text-xs font-semibold py-1.5 px-3 rounded-lg"
                  >
                    Manage
                  </Link>
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
// 2. POST A JOB FORM
// =========================================================================
const PostJob: React.FC<{ clientProfile: any }> = ({ clientProfile }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    description: '',
    location_address: '',
    city: '',
    state: 'NSW',
    postcode: '',
    preferred_date: '',
    budget_min: 100,
    budget_max: 500,
    urgency: 'flexible' as any
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCats = async () => {
      const { data } = await supabase.from('trade_categories').select('*').eq('is_active', true);
      if (data) {
        setCategories(data);
        if (data.length > 0) setFormData(prev => ({ ...prev, category_id: data[0].id }));
      }
    };
    fetchCats();
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotos(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: jobErr } = await supabase
        .from('jobs')
        .insert({
          ...formData,
          client_id: clientProfile.id
        });

      if (jobErr) throw jobErr;

      // Simulate media upload in Supabase Storage if photos exist
      if (photos.length > 0 && data) {
        const createdJob = data[0];
        for (let i = 0; i < photos.length; i++) {
          await supabase.from('job_media').insert({
            job_id: createdJob.id,
            uploaded_by: clientProfile.user_id,
            file_url: photos[i], // base64 string mock
            file_type: 'image/jpeg',
            caption: `Photo ${i + 1}`
          });
        }
      }

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      navigate('/client/my-jobs');
    } catch (err: any) {
      setError(err.message || 'Failed to submit job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Post a New Job Request</h2>
        <p className="text-xs text-zinc-400 mt-1">Provide detailed info so tradies can calculate accurate quotes.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Job Title</label>
          <input
            type="text"
            required
            placeholder="e.g. Blocked Sewerage Main Drain"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Category</label>
          <select
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Description</label>
          <textarea
            required
            rows={5}
            placeholder="Describe what needs repair, materials required, access details, and any other relevant context..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
          ></textarea>
        </div>

        {/* Location Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Street Address</label>
            <input
              type="text"
              required
              placeholder="e.g. 101 Elizabeth St"
              value={formData.location_address}
              onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">City/Suburb</label>
            <input
              type="text"
              required
              placeholder="e.g. Sydney"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">State</label>
            <select
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none cursor-pointer"
            >
              {['NSW', 'QLD', 'VIC', 'WA', 'SA', 'TAS', 'ACT', 'NT'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Postcode</label>
            <input
              type="text"
              required
              placeholder="2000"
              value={formData.postcode}
              onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Urgency & Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Urgency Level</label>
            <select
              value={formData.urgency}
              onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none cursor-pointer"
            >
              <option value="flexible">Flexible (No hurry)</option>
              <option value="within_week">Within the week</option>
              <option value="urgent">Urgent (1-2 days)</option>
              <option value="emergency">Emergency (Immediate)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Preferred Date</label>
            <input
              type="date"
              value={formData.preferred_date}
              onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Budget */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Min Budget ($)</label>
            <input
              type="number"
              value={formData.budget_min}
              onChange={(e) => setFormData({ ...formData, budget_min: parseInt(e.target.value) || 0 })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Max Budget ($)</label>
            <input
              type="number"
              value={formData.budget_max}
              onChange={(e) => setFormData({ ...formData, budget_max: parseInt(e.target.value) || 0 })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Image Attachment Mock */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Upload Job Photos</label>
          <div className="border border-dashed border-zinc-850 hover:border-orange-500/50 p-6 rounded-xl flex flex-col items-center justify-center bg-zinc-950/40 transition-all cursor-pointer relative">
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handlePhotoUpload} 
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
            />
            <Image className="w-8 h-8 text-zinc-500 mb-2" />
            <span className="text-xs text-zinc-400 font-medium">Click to select files or drop here</span>
            <span className="text-[10px] text-zinc-500 mt-1">PNG, JPG, JPEG up to 5MB</span>
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-4">
              {photos.map((p, idx) => (
                <div key={idx} className="relative group rounded-lg overflow-hidden border border-zinc-800 aspect-square">
                  <img src={p} alt="Upload preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 p-1 bg-red-600 rounded-full text-white opacity-90 hover:opacity-100 transition-opacity z-20 cursor-pointer"
                  >
                    <Trash className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-lg text-sm transition-all cursor-pointer shadow-lg shadow-orange-600/10"
        >
          {loading ? 'Posting job...' : 'Post Job Request'}
        </button>
      </form>
    </div>
  );
};

// =========================================================================
// 3. MY JOBS LISTING
// =========================================================================
const MyJobs: React.FC<{ clientProfile: any }> = ({ clientProfile }) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (!clientProfile) return;
    const loadJobs = async () => {
      const { data: jobList } = await supabase.from('jobs').select('*').eq('client_id', clientProfile.id);
      const { data: catList } = await supabase.from('trade_categories').select('*');
      if (jobList) setJobs(jobList);
      if (catList) setCategories(catList);
    };
    loadJobs();
  }, [clientProfile]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">My Job Postings</h2>
          <p className="text-xs text-zinc-400 mt-1">Review active, quoting, and completed trades requests.</p>
        </div>
        <Link 
          to="/client/post-job" 
          className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" /> Post a Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/10 border border-zinc-800 rounded-2xl">
          <Wrench className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="font-bold text-zinc-300">No jobs posted yet</h3>
          <p className="text-xs text-zinc-500 mt-1">Submit your first trades job requirement to receive local quotes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => {
            const cat = categories.find(c => c.id === job.category_id);
            return (
              <div key={job.id} className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-xl flex flex-col justify-between hover:border-orange-500/20 transition-all card-lift">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="bg-zinc-800/80 text-zinc-300 text-[10px] font-bold px-2 py-0.5 rounded border border-zinc-700/60">
                      {cat?.name || 'Trade'}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      job.status === 'open' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                      job.status === 'quoting' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      job.status === 'assigned' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      job.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      job.status === 'completed' ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' :
                      'bg-zinc-800 text-zinc-300'
                    }`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base mt-3">{job.title}</h3>
                  <p className="text-zinc-400 text-xs mt-2 line-clamp-2 leading-relaxed">{job.description}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-zinc-800/60 flex items-center justify-between">
                  <div className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <span>{job.city}, {job.state}</span>
                  </div>
                  <Link
                    to={`/client/jobs/${job.id}`}
                    className="bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 text-zinc-300 text-xs font-bold py-1.5 px-3 rounded-lg"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// =========================================================================
// 4. JOB DETAILS & QUOTES & REALTIME CHAT
// =========================================================================
const JobDetails: React.FC<{ clientProfile: any }> = ({ clientProfile }) => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const [job, setJob] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [tradies, setTradies] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  
  // Conversation & Chat states
  const [conversation, setConversation] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Review & Dispute Modal toggles
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [recommend, setRecommend] = useState(true);

  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDesc, setDisputeDesc] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadJobDetails = async () => {
    if (!id) return;
    const { data: jobObj } = await supabase.from('jobs').select('*').eq('id', id).single();
    if (!jobObj) return;
    setJob(jobObj);

    // Fetch category
    const { data: cat } = await supabase.from('trade_categories').select('*').eq('id', jobObj.category_id).single();
    if (cat) setCategory(cat);

    // Fetch quotes
    const { data: quotesData } = await supabase.from('quotes').select('*').eq('job_id', jobObj.id);
    if (quotesData) setQuotes(quotesData);

    // Fetch media
    const { data: mediaData } = await supabase.from('job_media').select('*').eq('job_id', jobObj.id);
    if (mediaData) setMedia(mediaData);

    // Fetch job updates
    const { data: updatesData } = await supabase.from('job_updates').select('*').eq('job_id', jobObj.id).order('created_at', { ascending: true });
    if (updatesData) setUpdates(updatesData);

    // Load tradies and profiles for mapping names
    const { data: tradieData } = await supabase.from('tradies').select('*');
    const { data: profData } = await supabase.from('profiles').select('*');
    if (tradieData) setTradies(tradieData);
    if (profData) setProfiles(profData);

    // If job assigned, fetch conversation
    if (jobObj.assigned_tradie_id && clientProfile) {
      const { data: conv } = await supabase
        .from('conversations')
        .select('*')
        .eq('job_id', jobObj.id)
        .eq('client_id', clientProfile.id)
        .eq('tradie_id', jobObj.assigned_tradie_id)
        .single();
      
      if (conv) {
        setConversation(conv);
        // Fetch chat messages
        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: true });
        
        if (messages) setChatMessages(messages);
      }
    }
  };

  useEffect(() => {
    loadJobDetails();
  }, [id, clientProfile]);

  // Realtime subscription for chat messages
  useEffect(() => {
    if (!conversation) return;

    const channel = supabase
      .channel(`chat-${conversation.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` }, (payload: any) => {
        setChatMessages((prev) => {
          // Avoid duplicate triggers in local emulation
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
    // Scroll chat to bottom
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  if (!job) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-xs text-zinc-500">Loading job details...</p>
      </div>
    );
  }

  // Quote acceptor
  const handleAcceptQuote = async (quoteId: string) => {
    if (!window.confirm('Are you sure you want to accept this quotation? This will lock in the price and reject other quotes.')) return;
    try {
      await supabase.from('quotes').update({ status: 'accepted' }).eq('id', quoteId);
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      await loadJobDetails();
    } catch (e: any) {
      alert(e.message || 'Error accepting quote.');
    }
  };

  // Chat message sender
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation || !user) return;

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        message: newMessage.trim(),
        is_read: false
      });

      if (error) throw error;
      
      // In local demo, the local trigger automatically sets a quick simulated reply, so we refresh messages
      if (isDemoMode) {
        // Fetch new messages list locally
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

  // Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !job.assigned_tradie_id) return;

    try {
      const { error } = await supabase.from('reviews').insert({
        job_id: job.id,
        client_id: clientProfile.id,
        tradie_id: job.assigned_tradie_id,
        rating: rating,
        comment: reviewComment,
        would_recommend: recommend
      });

      if (error) throw error;
      
      setReviewOpen(false);
      alert('Thank you! Your rating and review have been registered.');
      await loadJobDetails();
    } catch (e: any) {
      alert(e.message || 'Failed to post review');
    }
  };

  // Raise Dispute
  const handleRaiseDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase.from('disputes').insert({
        job_id: job.id,
        raised_by: user.id,
        reason: disputeReason,
        description: disputeDesc
      });

      if (error) throw error;
      
      setDisputeOpen(false);
      alert('Dispute logged. Platform administrators have been alerted.');
      await loadJobDetails();
    } catch (e: any) {
      alert(e.message || 'Failed to log dispute');
    }
  };

  // Helper formatting names
  const getTradieName = (tradieId: string) => {
    const t = tradies.find(tr => tr.id === tradieId);
    if (!t) return 'Service Provider';
    const profile = profiles.find(p => p.id === t.user_id);
    return t.business_name || profile?.full_name || 'Service Provider';
  };

  const getTradieAvatar = (tradieId: string) => {
    const t = tradies.find(tr => tr.id === tradieId);
    if (!t) return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100';
    const profile = profiles.find(p => p.id === t.user_id);
    return profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100';
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link to="/client/my-jobs" className="inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-xs font-bold">
        &larr; Back to My Jobs
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT/MID PANELS: JOB DESCRIPTION & QUOTES */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Job Core Details */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
            <div className="flex justify-between items-start gap-3">
              <div>
                <span className="bg-orange-500/10 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-500/20">
                  {category?.name || 'Trade Category'}
                </span>
                <h1 className="text-xl font-extrabold text-white mt-2">{job.title}</h1>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                job.status === 'open' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                job.status === 'quoting' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                job.status === 'assigned' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                job.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                job.status === 'completed' ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' :
                'bg-zinc-850 text-zinc-400'
              }`}>
                {job.status.replace('_', ' ')}
              </span>
            </div>

            <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{job.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-800/60 text-xs font-semibold text-zinc-400">
              <div>
                <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Suburb / Postcode</span>
                <span className="text-zinc-300 flex items-center gap-0.5 mt-0.5"><MapPin className="w-3.5 h-3.5 text-orange-500" />{job.city}, {job.postcode}</span>
              </div>
              <div>
                <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Urgency</span>
                <span className="text-zinc-300 capitalize mt-0.5">{job.urgency}</span>
              </div>
              <div>
                <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Budget Details</span>
                <span className="text-zinc-300 mt-0.5 flex items-center"><DollarSign className="w-3.5 h-3.5 text-orange-500" />{job.budget_min} - ${job.budget_max}</span>
              </div>
              <div>
                <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Preferred Date</span>
                <span className="text-zinc-300 mt-0.5 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-orange-500" />{job.preferred_date || 'Flexible'}</span>
              </div>
            </div>

            {/* Photos */}
            {media.length > 0 && (
              <div className="pt-4 border-t border-zinc-800/60">
                <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Attached Images</span>
                <div className="grid grid-cols-3 gap-2">
                  {media.map((img) => (
                    <a key={img.id} href={img.file_url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-zinc-800 aspect-video hover:border-orange-500 transition-colors">
                      <img src={img.file_url} alt={img.caption} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quotes Section (Visible if status is open or quoting) */}
          {['open', 'quoting'].includes(job.status) && (
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
              <h3 className="font-extrabold text-white text-base">Quotes Received ({quotes.length})</h3>
              
              {quotes.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-500">
                  No quotations submitted by providers yet. We will alert you as soon as someone submits a proposal.
                </div>
              ) : (
                <div className="space-y-4">
                  {quotes.map((q) => {
                    const tradieObj = tradies.find(tr => tr.id === q.tradie_id);
                    const providerName = getTradieName(q.tradie_id);
                    const providerAvatar = getTradieAvatar(q.tradie_id);
                    return (
                      <div key={q.id} className="bg-zinc-950 border border-zinc-850 p-5 rounded-xl space-y-3 hover:border-zinc-700 transition-all">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-center gap-3">
                            <img src={providerAvatar} alt={providerName} className="w-10 h-10 rounded-full border border-zinc-800 object-cover" />
                            <div>
                              <h4 className="font-bold text-sm text-white">{providerName}</h4>
                              <div className="flex items-center gap-0.5 text-xs text-amber-400 mt-0.5">
                                <Star className="w-3.5 h-3.5 fill-amber-400" />
                                <span className="font-bold">{tradieObj?.rating > 0 ? tradieObj.rating.toFixed(1) : 'New'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-black text-orange-500">${q.amount}</span>
                            <span className="block text-[10px] text-zinc-500 font-medium">AUD Fixed Price</span>
                          </div>
                        </div>

                        <p className="text-zinc-300 text-xs leading-relaxed whitespace-pre-line bg-zinc-900/50 p-3 rounded-lg border border-zinc-900">
                          {q.proposal_message || 'No description provided.'}
                        </p>

                        <div className="grid grid-cols-2 gap-4 text-[10px] text-zinc-400 bg-zinc-900/20 p-3 rounded-lg border border-zinc-900/50">
                          <div>
                            <strong className="text-zinc-300 block mb-0.5">Timeline:</strong> {q.estimated_duration || 'Not specified'}
                          </div>
                          <div>
                            <strong className="text-zinc-300 block mb-0.5">Availability:</strong> {q.available_date || 'Flexible'}
                          </div>
                        </div>

                        <div className="pt-2 flex justify-end gap-2">
                          <button
                            onClick={() => handleAcceptQuote(q.id)}
                            className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold py-2 px-4 rounded-lg cursor-pointer shadow-md shadow-orange-600/10 transition-all card-lift"
                          >
                            Accept Quotation
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Job Updates/Progress Timeline (For assigned/completed jobs) */}
          {['assigned', 'in_progress', 'completion_requested', 'completed', 'disputed'].includes(job.status) && (
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
              <h3 className="font-extrabold text-white text-base">Job Milestones</h3>
              
              {updates.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-500">
                  No progress updates logged by tradie yet.
                </div>
              ) : (
                <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
                  {updates.map((up) => (
                    <div key={up.id} className="pl-8 relative flex flex-col">
                      <span className="absolute left-1.5 top-1.5 w-3.5 h-3.5 bg-orange-600 border-2 border-zinc-900 rounded-full"></span>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">{up.status.replace('_', ' ')} &bull; {new Date(up.created_at).toLocaleDateString()}</span>
                      <p className="text-zinc-200 text-xs mt-1 leading-relaxed">{up.update_message}</p>
                      {up.photo_url && (
                        <a href={up.photo_url} target="_blank" rel="noreferrer" className="block max-w-[150px] rounded-lg overflow-hidden border border-zinc-800 mt-2">
                          <img src={up.photo_url} alt="Progress milestone" className="w-full h-full object-cover" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ASSIGNED TRADIE, CHAT BOX, STATUS CONTROLS */}
        <div className="space-y-6">
          
          {/* Status Control Actions */}
          {job.assigned_tradie_id && (
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
              <h3 className="font-extrabold text-white text-base">Project Status Controls</h3>
              
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center gap-3">
                <img src={getTradieAvatar(job.assigned_tradie_id)} alt="" className="w-10 h-10 rounded-full border border-zinc-700 object-cover" />
                <div>
                  <span className="text-[9px] text-zinc-500 font-bold uppercase">Assigned Tradie</span>
                  <h4 className="font-bold text-sm text-white">{getTradieName(job.assigned_tradie_id)}</h4>
                </div>
              </div>

              <div className="space-y-2">
                {/* Completion Confirmation */}
                {job.status === 'completion_requested' && (
                  <button
                    onClick={async () => {
                      if (!window.confirm('Do you confirm the task is complete to your satisfaction?')) return;
                      await supabase.from('jobs').update({ status: 'completed' }).eq('id', job.id);
                      setReviewOpen(true);
                      await loadJobDetails();
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer transition-all card-lift"
                  >
                    <Check className="w-4 h-4" /> Confirm Completion & Rate
                  </button>
                )}

                {/* Left Review trigger after completion */}
                {job.status === 'completed' && (
                  <button
                    onClick={() => setReviewOpen(true)}
                    className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer transition-all card-lift"
                  >
                    <Star className="w-4 h-4" /> Submit Feedback Rating
                  </button>
                )}

                {/* Dispute Trigger */}
                {!['completed', 'cancelled', 'disputed'].includes(job.status) && (
                  <button
                    onClick={() => setDisputeOpen(true)}
                    className="w-full bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-red-400 hover:text-red-300 font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-500" /> Raise Dispute Complaint
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Real-time Message Chat Box */}
          {conversation && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-[400px]">
              <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="font-extrabold text-sm text-white">Live Job Chat</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Secured</span>
              </div>

              {/* Chat Log */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-zinc-955 flex flex-col">
                {chatMessages.length === 0 ? (
                  <div className="text-center my-auto text-xs text-zinc-600">
                    Send a message to sync with {getTradieName(job.assigned_tradie_id)}.
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
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className={isMe ? 'chat-bubble-client' : 'chat-bubble-tradie'}>
                          <p className="text-xs">{msg.message}</p>
                        </div>
                        <span className="text-[8px] text-zinc-600 mt-1 px-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef}></div>
              </div>

              {/* Message Input form */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-800 bg-zinc-900 flex gap-2">
                <input
                  type="text"
                  placeholder="Type message..."
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
          )}
        </div>
      </div>

      {/* RATING & REVIEW MODAL */}
      {reviewOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
              <h3 className="font-extrabold text-white text-base">Rate Service Provider</h3>
              <button 
                onClick={() => setReviewOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="p-6 space-y-4">
              <div className="text-center space-y-2">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Rate your overall experience</span>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star className={`w-8 h-8 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5 font-sans">Comments</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Share details of the tradies punctuality, expertise, quality, and friendliness..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="recommend"
                  checked={recommend}
                  onChange={(e) => setRecommend(e.target.checked)}
                  className="rounded border-zinc-800 bg-zinc-950 text-orange-600 focus:ring-orange-500/20"
                />
                <label htmlFor="recommend" className="text-sm font-semibold text-zinc-300 cursor-pointer select-none">
                  Would recommend this tradie: Yes
                </label>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setReviewOpen(false)}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white py-2.5 rounded-lg text-xs font-bold cursor-pointer shadow-lg shadow-orange-600/10"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISPUTE MODAL */}
      {disputeOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
              <h3 className="font-extrabold text-white text-base">Raise Dispute Complaint</h3>
              <button 
                onClick={() => setDisputeOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRaiseDispute} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5 font-sans">Reason for Dispute</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none cursor-pointer"
                >
                  <option value="">Select a reason</option>
                  <option value="Unfinished Work">Unfinished Work</option>
                  <option value="Quality Issues">Poor Quality of Work</option>
                  <option value="Overcharging">Pricing/Invoice Dispute</option>
                  <option value="No Show">Tradie did not arrive</option>
                  <option value="Other">Other (Specify below)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5 font-sans">Detailed Description</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide supporting logs, facts, dates, and what resolution you are seeking..."
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setDisputeOpen(false)}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg text-xs font-bold cursor-pointer shadow-lg shadow-red-600/10"
                >
                  File Complaint
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
// 5. CLIENT PROFILE EDITING
// =========================================================================
const ClientProfile: React.FC<{ clientProfile: any; onRefresh: () => void }> = ({ clientProfile, onRefresh }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    mobile_number: user?.mobile_number || '',
    address: clientProfile?.address || '',
    city: clientProfile?.city || '',
    state: clientProfile?.state || 'NSW',
    postcode: clientProfile?.postcode || '',
    avatar_url: user?.avatar_url || ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (clientProfile && user) {
      setFormData({
        full_name: user.full_name,
        mobile_number: user.mobile_number || '',
        address: clientProfile.address || '',
        city: clientProfile.city || '',
        state: clientProfile.state || 'NSW',
        postcode: clientProfile.postcode || '',
        avatar_url: user.avatar_url || ''
      });
    }
  }, [clientProfile, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      // Update profiles
      const { error: profErr } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          mobile_number: formData.mobile_number,
          avatar_url: formData.avatar_url
        })
        .eq('id', user?.id);

      if (profErr) throw profErr;

      // Update clients
      const { error: cliErr } = await supabase
        .from('clients')
        .update({
          address: formData.address,
          city: formData.city,
          state: formData.state,
          postcode: formData.postcode
        })
        .eq('id', clientProfile.id);

      if (cliErr) throw cliErr;

      setSuccess(true);
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Client Profile Settings</h2>
        <p className="text-xs text-zinc-400 mt-1">Keep your address and mobile details updated so tradies can locate you.</p>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs mb-4 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Full Name</label>
          <input
            type="text"
            required
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Mobile Number</label>
          <input
            type="tel"
            required
            value={formData.mobile_number}
            onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Avatar Image URL</label>
          <input
            type="text"
            value={formData.avatar_url}
            onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Street Address</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">City / Suburb</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Postcode</label>
            <input
              type="text"
              value={formData.postcode}
              onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 rounded-lg text-sm transition-all cursor-pointer shadow-md shadow-orange-600/10"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};

// =========================================================================
// MAIN ROUTER CONTAINER
// =========================================================================
export const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [clientProfile, setClientProfile] = useState<any>(null);

  const fetchClientProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('clients').select('*').eq('user_id', user.id).single();
    if (data) setClientProfile(data);
  };

  useEffect(() => {
    fetchClientProfile();
  }, [user]);

  if (!clientProfile) {
    return (
      <div className="text-center py-20">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-xs text-zinc-500">Retrieving client account...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<ClientOverview clientProfile={clientProfile} />} />
      <Route path="/post-job" element={<PostJob clientProfile={clientProfile} />} />
      <Route path="/my-jobs" element={<MyJobs clientProfile={clientProfile} />} />
      <Route path="/jobs/:id" element={<JobDetails clientProfile={clientProfile} />} />
      <Route path="/profile" element={<ClientProfile clientProfile={clientProfile} onRefresh={fetchClientProfile} />} />
    </Routes>
  );
};
export default ClientDashboard;

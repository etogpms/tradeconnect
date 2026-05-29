import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { 
  Users, HardHat, ShieldCheck, Wrench, AlertTriangle, 
  DollarSign, X, Plus, Clock
} from 'lucide-react';
import mockDb from '../../lib/mockDb';

// =========================================================================
// 1. ADMIN OVERVIEW (ANALYTICS)
// =========================================================================
const AdminOverview: React.FC = () => {
  const [metrics, setMetrics] = useState({
    clients: 0,
    tradies: 0,
    verifiedTradies: 0,
    pendingDocs: 0,
    openJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    disputes: 0,
    revenue: 0
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      const { data: profiles } = await supabase.from('profiles').select('*');
      const { data: tradies } = await supabase.from('tradies').select('*');
      const { data: docs } = await supabase.from('tradie_documents').select('*');
      const { data: jobs } = await supabase.from('jobs').select('*');
      const { data: disputes } = await supabase.from('disputes').select('*');
      const { data: payments } = await supabase.from('payments').select('*');

      if (profiles && tradies && jobs) {
        const clientsCount = profiles.filter((p: any) => p.role === 'client').length;
        const tradiesCount = tradies.length;
        const verifiedCount = tradies.filter((t: any) => t.verification_status === 'approved').length;
        const pendingDocsCount = docs ? docs.filter((d: any) => d.status === 'pending').length : 0;
        
        const open = jobs.filter((j: any) => j.status === 'open' || j.status === 'quoting').length;
        const active = jobs.filter((j: any) => ['assigned', 'in_progress', 'completion_requested'].includes(j.status)).length;
        const completed = jobs.filter((j: any) => j.status === 'completed').length;
        const openDisputes = disputes ? disputes.filter((d: any) => d.status === 'open' || d.status === 'under_review').length : 0;
        
        const totalRevenue = payments ? payments.reduce((acc: number, p: any) => acc + parseFloat(p.amount), 0) : 0;

        setMetrics({
          clients: clientsCount,
          tradies: tradiesCount,
          verifiedTradies: verifiedCount,
          pendingDocs: pendingDocsCount,
          openJobs: open,
          activeJobs: active,
          completedJobs: completed,
          disputes: openDisputes,
          revenue: totalRevenue
        });
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Platform Analytics</h2>
        <p className="text-xs text-zinc-400 mt-1">Real-time indicators of user registrations, job statuses, and billing volume.</p>
      </div>

      {/* Analytics Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: 'Total Registered Clients', value: metrics.clients, icon: Users, color: 'text-orange-500 bg-orange-500/10' },
          { name: 'Total Service Providers', value: metrics.tradies, icon: HardHat, color: 'text-amber-400 bg-amber-400/10' },
          { name: 'Verified Businesses', value: metrics.verifiedTradies, icon: ShieldCheck, color: 'text-emerald-400 bg-emerald-400/10' },
          { name: 'Open Jobs (Quoting)', value: metrics.openJobs, icon: Wrench, color: 'text-blue-400 bg-blue-500/10' },
          { name: 'Active Job Progressions', value: metrics.activeJobs, icon: Clock, color: 'text-indigo-400 bg-indigo-400/10' },
          { name: 'Disputes Pending Review', value: metrics.disputes, icon: AlertTriangle, color: 'text-red-400 bg-red-400/10' },
          { name: 'Total Monthly Revenue ($)', value: `$${metrics.revenue}`, icon: DollarSign, color: 'text-purple-400 bg-purple-400/10' }
        ].map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs text-zinc-500 font-bold block">{m.name}</span>
                <span className="text-3xl font-black text-white mt-1.5 block">{m.value}</span>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${m.color} border border-white/5`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =========================================================================
// 2. VERIFICATIONS WORKFLOW
// =========================================================================
const AdminVerifications: React.FC = () => {
  const [docs, setDocs] = useState<any[]>([]);
  const [tradies, setTradies] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  
  // Rejection comment popup state
  const [commentOpen, setCommentOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [commentText, setCommentText] = useState('');

  const loadDocuments = async () => {
    const { data: docList } = await supabase.from('tradie_documents').select('*').order('created_at', { ascending: false });
    const { data: tradieList } = await supabase.from('tradies').select('*');
    const { data: profileList } = await supabase.from('profiles').select('*');
    
    if (docList) setDocs(docList);
    if (tradieList) setTradies(tradieList);
    if (profileList) setProfiles(profileList);
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleVerify = async (id: string, status: 'approved' | 'rejected', comment?: string) => {
    try {
      // In local mode, the mock database wraps this trigger automatically.
      // We trigger verifyDocument directly
      if (mockDb.verifyDocument) {
        mockDb.verifyDocument(id, status, comment);
      } else {
        await supabase.from('tradie_documents').update({ status, admin_comment: comment }).eq('id', id);
      }
      
      alert(`Document set to ${status}`);
      loadDocuments();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const openRejectionComment = (id: string) => {
    setSelectedDocId(id);
    setCommentText('');
    setCommentOpen(true);
  };

  const submitRejection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId || !commentText.trim()) return;

    handleVerify(selectedDocId, 'rejected', commentText.trim());
    setCommentOpen(false);
  };

  const getTradieName = (tradieId: string) => {
    const t = tradies.find(tr => tr.id === tradieId);
    if (!t) return 'Provider';
    const p = profiles.find(pr => pr.id === t.user_id);
    return t.business_name || p?.full_name || 'Provider';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Document Compliance Desk</h2>
        <p className="text-xs text-zinc-400 mt-1">Review licenses and public liability insurance certificates uploaded by providers.</p>
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-12 text-xs text-zinc-500 bg-zinc-900/10 border border-zinc-800 rounded-xl">
          No verification documents uploaded on the platform yet.
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase font-bold tracking-wider">
                  <th className="p-4">Tradie Business</th>
                  <th className="p-4">Document Type</th>
                  <th className="p-4 font-sans">Expiry</th>
                  <th className="p-4">File Link</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {docs.map((d) => (
                  <tr key={d.id} className="hover:bg-zinc-800/10 transition-colors">
                    <td className="p-4 font-semibold text-white">{getTradieName(d.tradie_id)}</td>
                    <td className="p-4 capitalize">{d.document_type.replace('_', ' ')}</td>
                    <td className="p-4">{d.expiry_date ? new Date(d.expiry_date).toLocaleDateString() : 'N/A'}</td>
                    <td className="p-4">
                      <a 
                        href={d.file_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-orange-400 hover:text-orange-300 font-bold underline"
                      >
                        Inspect Document
                      </a>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        d.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        d.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {d.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleVerify(d.id, 'approved')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openRejectionComment(d.id)}
                            className="bg-red-600/10 hover:bg-red-600/25 border border-red-500/20 text-red-400 font-bold px-3 py-1.5 rounded-lg"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REJECTION COMMENT POPUP */}
      {commentOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
              <h3 className="font-bold text-white text-sm">Add Rejection Reason</h3>
              <button onClick={() => setCommentOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitRejection} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Administrative Comment</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. License document blurry, please re-upload clear photo."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-orange-500 focus:outline-none"
                ></textarea>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setCommentOpen(false)}
                  className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold"
                >
                  Confirm Rejection
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
// 3. USER MANAGEMENT (CLIENTS & TRADIES)
// =========================================================================
const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*');
    if (data) setUsers(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleUserStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    if (!window.confirm(`Are you sure you want to set this user account status to ${nextStatus.toUpperCase()}?`)) return;

    try {
      if (mockDb.manageUserStatus) {
        mockDb.manageUserStatus(id, nextStatus as any);
      } else {
        await supabase.from('profiles').update({ account_status: nextStatus }).eq('id', id);
      }
      alert(`User status set to ${nextStatus}`);
      fetchUsers();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">User Accounts Manager</h2>
        <p className="text-xs text-zinc-400 mt-1">Monitor, suspend, or reactivate platform accounts.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase font-bold tracking-wider">
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4 font-sans">Role</th>
                <th className="p-4">Mobile</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-850/20 transition-colors">
                  <td className="p-4 font-semibold text-white flex items-center gap-2">
                    <img src={u.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60'} className="w-7 h-7 rounded-full object-cover border border-zinc-700" alt="" />
                    {u.full_name}
                  </td>
                  <td className="p-4 text-zinc-300">{u.email}</td>
                  <td className="p-4 font-bold capitalize text-orange-400">{u.role.replace('_', ' ')}</td>
                  <td className="p-4 text-zinc-400">{u.mobile_number || 'N/A'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      u.account_status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {u.account_status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {u.role !== 'super_admin' && (
                      <button
                        onClick={() => toggleUserStatus(u.id, u.account_status)}
                        className={`font-bold px-3 py-1.5 rounded-lg cursor-pointer ${
                          u.account_status === 'active' 
                            ? 'bg-red-600/10 hover:bg-red-600/25 border border-red-500/20 text-red-400' 
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/10'
                        }`}
                      >
                        {u.account_status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 4. DISPUTES PANEL MEDIATION
// =========================================================================
const AdminDisputes: React.FC = () => {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [resolutionOpen, setResolutionOpen] = useState(false);
  const [selectedDisputeId, setSelectedDisputeId] = useState('');
  const [resolutionText, setResolutionText] = useState('');

  const fetchDisputes = async () => {
    const { data } = await supabase.from('disputes').select('*').order('created_at', { ascending: false });
    if (data) setDisputes(data);
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const openResolution = (id: string) => {
    setSelectedDisputeId(id);
    setResolutionText('');
    setResolutionOpen(true);
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDisputeId || !resolutionText.trim()) return;

    try {
      if (mockDb.resolveDispute) {
        mockDb.resolveDispute(selectedDisputeId, resolutionText.trim());
      } else {
        await supabase.from('disputes').update({ status: 'resolved', resolution_notes: resolutionText }).eq('id', selectedDisputeId);
      }
      alert('Dispute resolved successfully!');
      setResolutionOpen(false);
      fetchDisputes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Marketplace Disputes Desk</h2>
        <p className="text-xs text-zinc-400 mt-1">Review active project conflicts raised by homeowners or tradespeople.</p>
      </div>

      {disputes.length === 0 ? (
        <div className="text-center py-12 text-xs text-zinc-500 bg-zinc-900/10 border border-zinc-800 rounded-xl">
          No active disputes reported.
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((d) => (
            <div key={d.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">Dispute ID: {d.id}</span>
                  <h3 className="font-extrabold text-white text-base mt-0.5">Reason: {d.reason}</h3>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                  d.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse'
                }`}>
                  {d.status.replace('_', ' ')}
                </span>
              </div>

              <p className="text-zinc-300 text-xs leading-relaxed">{d.description || 'No description provided.'}</p>
              
              {d.resolution_notes && (
                <div className="bg-zinc-950 p-4 border border-zinc-850 rounded-lg text-xs text-zinc-400">
                  <strong className="text-zinc-300 block mb-1">Mediation Resolution:</strong>
                  {d.resolution_notes}
                </div>
              )}

              {d.status !== 'resolved' && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => openResolution(d.id)}
                    className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold py-2 px-4 rounded-lg cursor-pointer"
                  >
                    Mediate Dispute
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MEDIATION RESOLUTION POPUP */}
      {resolutionOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
              <h3 className="font-bold text-white text-sm">Mediate & Resolve Dispute</h3>
              <button onClick={() => setResolutionOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleResolve} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Resolution Notes (Visible to Client & Tradie)</label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Mediation completed. Client and tradie agreed to adjust price to $200. Job unlocked for completion..."
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-orange-500 focus:outline-none"
                ></textarea>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setResolutionOpen(false)}
                  className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg text-xs font-bold"
                >
                  Resolve dispute
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
// 5. CATEGORIES EDITOR
// =========================================================================
const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCats = async () => {
    const { data } = await supabase.from('trade_categories').select('*');
    if (data) setCategories(data);
  };

  useEffect(() => {
    fetchCats();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setLoading(true);

    try {
      const { error } = await supabase.from('trade_categories').insert({
        name: catName.trim(),
        description: catDesc.trim(),
        is_active: true
      });

      if (error) throw error;
      setCatName('');
      setCatDesc('');
      alert('Category added successfully.');
      fetchCats();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategoryStatus = async (id: string, active: boolean) => {
    try {
      await supabase.from('trade_categories').update({ is_active: !active }).eq('id', id);
      fetchCats();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Add form */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl h-fit">
        <h3 className="font-extrabold text-white text-base mb-2">Create Trade Sector</h3>
        <p className="text-xs text-zinc-400 mb-6">Create new specialty tags matching tradie skills.</p>

        <form onSubmit={handleAddCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Category Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Roofing"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Description</label>
            <textarea
              rows={3}
              placeholder="Brief summary of tasks covered..."
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-orange-500 focus:outline-none"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 rounded-lg text-sm transition-all cursor-pointer shadow-lg shadow-orange-600/10 flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {loading ? 'Submitting...' : 'Create Category'}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
        <h3 className="font-extrabold text-white text-base mb-4">Sectors Catalog ({categories.length})</h3>

        <div className="space-y-3">
          {categories.map((c) => (
            <div key={c.id} className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl flex items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-white">{c.name}</h4>
                <p className="text-[10px] text-zinc-500 leading-normal mt-1">{c.description || 'No description.'}</p>
              </div>
              <button
                onClick={() => toggleCategoryStatus(c.id, c.is_active)}
                className={`font-semibold px-3 py-1 rounded text-[10px] cursor-pointer ${
                  c.is_active 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                }`}
              >
                {c.is_active ? 'Active' : 'Disabled'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 6. SYSTEM AUDIT LOGS
// =========================================================================
const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase.from('audit_logs').select('*');
      if (data) setLogs(data);
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">System Security Audit Logs</h2>
        <p className="text-xs text-zinc-400 mt-1">Review ledger events, profile registers, and administrative resolves.</p>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-12 text-xs text-zinc-500 bg-zinc-900/10 border border-zinc-800 rounded-xl">
          No audit logs recorded in system ledger.
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="divide-y divide-zinc-800/60 max-h-[500px] overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="p-4 text-xs hover:bg-zinc-850/10 transition-colors flex justify-between gap-4">
                <div>
                  <span className="font-bold text-orange-400">{log.action}</span>
                  <span className="text-zinc-500 ml-2">ID: {log.entity_id} &bull; Type: {log.entity_type}</span>
                  <p className="text-zinc-400 mt-1">Actor Account: {log.actor_id}</p>
                </div>
                <span className="text-[10px] text-zinc-500 shrink-0 font-medium">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// MAIN ROUTER PORTAL CONTAINER
// =========================================================================
export const AdminDashboard: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminOverview />} />
      <Route path="/verifications" element={<AdminVerifications />} />
      <Route path="/users" element={<AdminUsers />} />
      <Route path="/disputes" element={<AdminDisputes />} />
      <Route path="/categories" element={<AdminCategories />} />
      <Route path="/audit-logs" element={<AdminAuditLogs />} />
    </Routes>
  );
};
export default AdminDashboard;

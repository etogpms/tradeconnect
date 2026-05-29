// Mock Database and Business Logic Simulator using localStorage
// This simulates Supabase DB, Auth, Storage, and Realtime when live credentials are not set.

export interface Profile {
  id: string;
  role: 'client' | 'tradie' | 'admin' | 'super_admin';
  full_name: string;
  email: string;
  mobile_number?: string;
  avatar_url?: string;
  account_status: 'active' | 'suspended' | 'pending';
  created_at: string;
}

export interface ClientProfile {
  id: string;
  user_id: string;
  address?: string;
  city?: string;
  state?: string;
  postcode?: string;
}

export interface TradieProfile {
  id: string;
  user_id: string;
  business_name?: string;
  abn?: string;
  business_address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  service_radius_km: number;
  years_experience: number;
  bio?: string;
  verification_status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  availability_status: 'available' | 'busy' | 'unavailable';
  rating: number;
  total_reviews: number;
}

export interface TradeCategory {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

export interface Job {
  id: string;
  client_id: string; // references ClientProfile.id
  assigned_tradie_id?: string | null; // references TradieProfile.id
  category_id: string;
  title: string;
  description: string;
  location_address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  preferred_date?: string;
  budget_min?: number;
  budget_max?: number;
  urgency: 'flexible' | 'within_week' | 'urgent' | 'emergency';
  status: 'draft' | 'open' | 'quoting' | 'assigned' | 'in_progress' | 'completion_requested' | 'completed' | 'cancelled' | 'disputed';
  created_at: string;
  updated_at?: string;
}

export interface Quote {
  id: string;
  job_id: string;
  tradie_id: string;
  amount: number;
  estimated_duration?: string;
  available_date?: string;
  proposal_message?: string;
  scope_of_work?: string;
  inclusions?: string;
  exclusions?: string;
  terms_notes?: string;
  status: 'submitted' | 'viewed' | 'accepted' | 'rejected' | 'withdrawn';
  created_at: string;
}

export interface Conversation {
  id: string;
  job_id: string;
  client_id: string;
  tradie_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  attachment_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface TradieDocument {
  id: string;
  tradie_id: string;
  document_type: 'license' | 'insurance' | 'id' | 'business_registration' | 'certificate' | 'other';
  file_url: string;
  expiry_date?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  admin_comment?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface Review {
  id: string;
  job_id: string;
  client_id: string;
  tradie_id: string;
  rating: number;
  comment?: string;
  would_recommend?: boolean;
  created_at: string;
}

export interface Dispute {
  id: string;
  job_id: string;
  raised_by: string;
  reason: string;
  description?: string;
  status: 'open' | 'under_review' | 'awaiting_response' | 'resolved' | 'closed';
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  tradie_id: string;
  plan_name: 'Free' | 'Basic' | 'Pro' | 'Premium';
  status: 'active' | 'cancelled' | 'expired';
  start_date: string;
  end_date?: string;
  price: number;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type?: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: any;
  created_at: string;
}

// Initial Seeds
const DEFAULT_CATEGORIES: TradeCategory[] = [
  { id: 'cat-1', name: 'Plumbing', description: 'Plumbing installations, repair of leaks, drain cleaning, and hot water service.', is_active: true },
  { id: 'cat-2', name: 'Electrical', description: 'Electrical maintenance, wire routing, safety checks, and lighting fixtures.', is_active: true },
  { id: 'cat-3', name: 'Carpentry', description: 'Woodworking, framing, decking, cabinetry, and furniture assembly.', is_active: true },
  { id: 'cat-4', name: 'Painting', description: 'Interior and exterior house painting, wall patching, and finishing.', is_active: true },
  { id: 'cat-5', name: 'Roofing', description: 'Tile roof repairing, guttering, leakage protection, metal roof sheeting, and cleaning.', is_active: true },
  { id: 'cat-6', name: 'Tiling', description: 'Bathroom tiling, kitchen splashbacks, floor tiles, and waterproofing.', is_active: true },
  { id: 'cat-7', name: 'Cleaning', description: 'Domestic house cleaning, end-of-lease cleaning, commercial disinfection.', is_active: true },
  { id: 'cat-8', name: 'Landscaping', description: 'Garden designing, lawn mowing, paving, turf laying, and tree pruning.', is_active: true },
  { id: 'cat-9', name: 'Airconditioning', description: 'Airconditioning unit cleaning, installation, and general HVAC maintenance.', is_active: true },
  { id: 'cat-10', name: 'General Maintenance', description: 'Handyman services, lock replacements, wall mounting, and minor repairs.', is_active: true }
];

const DEMO_USERS = [
  {
    id: 'usr-client',
    email: 'client@tradeconnect.com.au',
    role: 'client',
    full_name: 'Dave Henderson',
    mobile: '0412 345 678',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120'
  },
  {
    id: 'usr-tradie',
    email: 'tradie@tradeconnect.com.au',
    role: 'tradie',
    full_name: 'Steve MacQueen',
    mobile: '0498 765 432',
    avatar: 'https://images.unsplash.com/photo-1621574539437-4b7cb63120b8?auto=format&fit=crop&q=80&w=120',
    business_name: 'Steve\'s Professional Plumbing',
    abn: '12345678901',
    address: '42 George St, Sydney',
    city: 'Sydney',
    state: 'NSW',
    postcode: '2000'
  },
  {
    id: 'usr-admin',
    email: 'admin@tradeconnect.com.au',
    role: 'admin',
    full_name: 'Alice Cooper',
    mobile: '0422 111 222',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120'
  },
  {
    id: 'usr-superadmin',
    email: 'superadmin@tradeconnect.com.au',
    role: 'super_admin',
    full_name: 'Sarah Connor',
    mobile: '0433 333 444',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120'
  }
];

class MockDatabase {
  private getStorageItem<T>(key: string, defaultValue: T): T {
    const val = localStorage.getItem(`tc_${key}`);
    return val ? JSON.parse(val) : defaultValue;
  }

  private setStorageItem<T>(key: string, value: T): void {
    localStorage.setItem(`tc_${key}`, JSON.stringify(value));
  }

  // Raw states
  get currentUser(): Profile | null {
    return this.getStorageItem<Profile | null>('current_user', null);
  }
  set currentUser(val: Profile | null) {
    this.setStorageItem<Profile | null>('current_user', val);
  }

  get profiles(): Profile[] {
    return this.getStorageItem<Profile[]>('profiles', []);
  }
  set profiles(val: Profile[]) {
    this.setStorageItem<Profile[]>('profiles', val);
  }

  get clients(): ClientProfile[] {
    return this.getStorageItem<ClientProfile[]>('clients', []);
  }
  set clients(val: ClientProfile[]) {
    this.setStorageItem<ClientProfile[]>('clients', val);
  }

  get tradies(): TradieProfile[] {
    return this.getStorageItem<TradieProfile[]>('tradies', []);
  }
  set tradies(val: TradieProfile[]) {
    this.setStorageItem<TradieProfile[]>('tradies', val);
  }

  get categories(): TradeCategory[] {
    return this.getStorageItem<TradeCategory[]>('categories', DEFAULT_CATEGORIES);
  }
  set categories(val: TradeCategory[]) {
    this.setStorageItem<TradeCategory[]>('categories', val);
  }

  get tradieCategories(): { tradie_id: string; category_id: string }[] {
    return this.getStorageItem<{ tradie_id: string; category_id: string }[]>('tradie_categories', []);
  }
  set tradieCategories(val: { tradie_id: string; category_id: string }[]) {
    this.setStorageItem<{ tradie_id: string; category_id: string }[]>('tradie_categories', val);
  }

  get jobs(): Job[] {
    return this.getStorageItem<Job[]>('jobs', []);
  }
  set jobs(val: Job[]) {
    this.setStorageItem<Job[]>('jobs', val);
  }

  get quotes(): Quote[] {
    return this.getStorageItem<Quote[]>('quotes', []);
  }
  set quotes(val: Quote[]) {
    this.setStorageItem<Quote[]>('quotes', val);
  }

  get conversations(): Conversation[] {
    return this.getStorageItem<Conversation[]>('conversations', []);
  }
  set conversations(val: Conversation[]) {
    this.setStorageItem<Conversation[]>('conversations', val);
  }

  get messages(): Message[] {
    return this.getStorageItem<Message[]>('messages', []);
  }
  set messages(val: Message[]) {
    this.setStorageItem<Message[]>('messages', val);
  }

  get documents(): TradieDocument[] {
    return this.getStorageItem<TradieDocument[]>('documents', []);
  }
  set documents(val: TradieDocument[]) {
    this.setStorageItem<TradieDocument[]>('documents', val);
  }

  get reviews(): Review[] {
    return this.getStorageItem<Review[]>('reviews', []);
  }
  set reviews(val: Review[]) {
    this.setStorageItem<Review[]>('reviews', val);
  }

  get disputes(): Dispute[] {
    return this.getStorageItem<Dispute[]>('disputes', []);
  }
  set disputes(val: Dispute[]) {
    this.setStorageItem<Dispute[]>('disputes', val);
  }

  get subscriptions(): Subscription[] {
    return this.getStorageItem<Subscription[]>('subscriptions', []);
  }
  set subscriptions(val: Subscription[]) {
    this.setStorageItem<Subscription[]>('subscriptions', val);
  }

  get notifications(): Notification[] {
    return this.getStorageItem<Notification[]>('notifications', []);
  }
  set notifications(val: Notification[]) {
    this.setStorageItem<Notification[]>('notifications', val);
  }

  get auditLogs(): AuditLog[] {
    return this.getStorageItem<AuditLog[]>('audit_logs', []);
  }
  set auditLogs(val: AuditLog[]) {
    this.setStorageItem<AuditLog[]>('audit_logs', val);
  }

  constructor() {
    this.initSeeds();
  }

  public initSeeds() {
    if (this.profiles.length === 0) {
      const initialProfiles: Profile[] = [];
      const initialClients: ClientProfile[] = [];
      const initialTradies: TradieProfile[] = [];
      const initialSubscriptions: Subscription[] = [];

      DEMO_USERS.forEach((u) => {
        initialProfiles.push({
          id: u.id,
          role: u.role as any,
          full_name: u.full_name,
          email: u.email,
          mobile_number: u.mobile,
          avatar_url: u.avatar,
          account_status: 'active',
          created_at: new Date().toISOString()
        });

        if (u.role === 'client') {
          initialClients.push({
            id: 'cli-dave',
            user_id: u.id,
            address: '12 Pitt St',
            city: 'Sydney',
            state: 'NSW',
            postcode: '2000'
          });
        } else if (u.role === 'tradie') {
          initialTradies.push({
            id: 'tra-steve',
            user_id: u.id,
            business_name: u.business_name,
            abn: u.abn,
            business_address: u.address,
            city: u.city,
            state: u.state,
            postcode: u.postcode,
            service_radius_km: 25,
            years_experience: 8,
            bio: 'Expert plumber specializing in emergency blocked drains, leak detection, and hot water systems. Licensed and insured.',
            verification_status: 'approved',
            availability_status: 'available',
            rating: 4.8,
            total_reviews: 12
          });

          // Add default category mapping
          this.setStorageItem('tradie_categories', [{ tradie_id: 'tra-steve', category_id: 'cat-1' }]);

          initialSubscriptions.push({
            id: 'sub-steve',
            tradie_id: 'tra-steve',
            plan_name: 'Pro',
            status: 'active',
            start_date: new Date().toISOString().split('T')[0],
            end_date: '2027-12-31',
            price: 59
          });
        }
      });

      this.profiles = initialProfiles;
      this.clients = initialClients;
      this.tradies = initialTradies;
      this.subscriptions = initialSubscriptions;

      // Seed a few demo jobs
      const demoJobs: Job[] = [
        {
          id: 'job-1',
          client_id: 'cli-dave',
          category_id: 'cat-1',
          title: 'Blocked Drain in Kitchen Sink',
          description: 'Our kitchen sink is completely blocked and water is backing up. We tried standard drain cleaners but no luck. Needs professional plumbing tools/snaking.',
          location_address: '12 Pitt St',
          city: 'Sydney',
          state: 'NSW',
          postcode: '2000',
          preferred_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
          budget_min: 150,
          budget_max: 300,
          urgency: 'urgent',
          status: 'open',
          created_at: new Date().toISOString()
        },
        {
          id: 'job-2',
          client_id: 'cli-dave',
          category_id: 'cat-2',
          title: 'Install 5 LED Downlights',
          description: 'Need to replace old halogen ceiling lights with modern energy-efficient LED downlights in the living room. Switches are already in place.',
          location_address: '12 Pitt St',
          city: 'Sydney',
          state: 'NSW',
          postcode: '2000',
          preferred_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
          budget_min: 200,
          budget_max: 400,
          urgency: 'flexible',
          status: 'open',
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      this.jobs = demoJobs;

      // Log event
      this.log('system', 'System seeded with demo data', 'system', 'sys-0');
    }
  }

  // Logger
  public log(actorId: string, action: string, entityType?: string, entityId?: string, details?: any) {
    const logs = this.auditLogs;
    logs.unshift({
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      actor_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      created_at: new Date().toISOString()
    });
    this.auditLogs = logs;
  }

  // Custom notifications trigger
  public notify(userId: string, title: string, message: string, type?: string) {
    const list = this.notifications;
    list.unshift({
      id: `notif-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      title,
      message,
      type,
      is_read: false,
      created_at: new Date().toISOString()
    });
    this.notifications = list;
  }

  // AUTH ACTIONS
  public login(email: string): Profile {
    const user = this.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error('User not found. Try client@tradeconnect.com.au or tradie@tradeconnect.com.au');
    if (user.account_status === 'suspended') throw new Error('Account suspended. Contact support.');
    this.currentUser = user;
    this.log(user.id, 'Logged in', 'profiles', user.id);
    return user;
  }

  public register(data: { email: string; full_name: string; role: 'client' | 'tradie'; mobile_number: string }) {
    const exists = this.profiles.some((p) => p.email.toLowerCase() === data.email.toLowerCase());
    if (exists) throw new Error('Email already registered.');

    const newId = `usr-${Math.random().toString(36).substr(2, 9)}`;
    const newProfile: Profile = {
      id: newId,
      role: data.role,
      full_name: data.full_name,
      email: data.email,
      mobile_number: data.mobile_number,
      account_status: 'active',
      created_at: new Date().toISOString()
    };

    const profs = this.profiles;
    profs.push(newProfile);
    this.profiles = profs;

    if (data.role === 'client') {
      const cls = this.clients;
      cls.push({ id: `cli-${Math.random().toString(36).substr(2, 9)}`, user_id: newId });
      this.clients = cls;
    } else {
      const trs = this.tradies;
      trs.push({
        id: `tra-${Math.random().toString(36).substr(2, 9)}`,
        user_id: newId,
        service_radius_km: 20,
        years_experience: 0,
        verification_status: 'not_submitted',
        availability_status: 'available',
        rating: 0,
        total_reviews: 0
      });
      this.tradies = trs;
    }

    this.currentUser = newProfile;
    this.log(newId, 'Registered new account', 'profiles', newId);
    this.notify(newId, 'Welcome to TradeConnect!', 'Thank you for registering. Complete your profile to get started.');
    return newProfile;
  }

  public logout() {
    if (this.currentUser) {
      this.log(this.currentUser.id, 'Logged out', 'profiles', this.currentUser.id);
      this.currentUser = null;
    }
  }

  // JOB ACTIONS
  public postJob(jobData: Omit<Job, 'id' | 'client_id' | 'status' | 'created_at'>) {
    if (!this.currentUser || this.currentUser.role !== 'client') {
      throw new Error('Only clients can post jobs.');
    }
    const client = this.clients.find((c) => c.user_id === this.currentUser!.id);
    if (!client) throw new Error('Client profile not found.');

    const newJob: Job = {
      ...jobData,
      id: `job-${Math.random().toString(36).substr(2, 9)}`,
      client_id: client.id,
      status: 'open',
      created_at: new Date().toISOString()
    };

    const list = this.jobs;
    list.unshift(newJob);
    this.jobs = list;

    this.log(this.currentUser.id, `Posted job: ${newJob.title}`, 'jobs', newJob.id);

    // Notify matching tradies (mock)
    const matchingTradies = this.tradies.filter((t) => {
      const cats = this.tradieCategories.filter((tc) => tc.tradie_id === t.id);
      return cats.some((c) => c.category_id === newJob.category_id);
    });
    matchingTradies.forEach((t) => {
      this.notify(t.user_id, 'New job matching your trade!', `A new job "${newJob.title}" is available in ${newJob.city || 'your area'}.`);
    });

    return newJob;
  }

  // QUOTES
  public submitQuote(quoteData: Omit<Quote, 'id' | 'status' | 'created_at'>) {
    if (!this.currentUser || this.currentUser.role !== 'tradie') {
      throw new Error('Only tradies can submit quotes.');
    }
    const tradie = this.tradies.find((t) => t.user_id === this.currentUser!.id);
    if (!tradie) throw new Error('Tradie profile not found.');

    // Check if quote already exists
    const existing = this.quotes.find((q) => q.job_id === quoteData.job_id && q.tradie_id === tradie.id);
    if (existing) throw new Error('You have already submitted a quote for this job.');

    const newQuote: Quote = {
      ...quoteData,
      id: `qte-${Math.random().toString(36).substr(2, 9)}`,
      tradie_id: tradie.id,
      status: 'submitted',
      created_at: new Date().toISOString()
    };

    const list = this.quotes;
    list.push(newQuote);
    this.quotes = list;

    // Update job status to 'quoting' if it was 'open'
    const jobsList = this.jobs;
    const jobIdx = jobsList.findIndex((j) => j.id === quoteData.job_id);
    if (jobIdx !== -1 && jobsList[jobIdx].status === 'open') {
      jobsList[jobIdx].status = 'quoting';
      this.jobs = jobsList;
    }

    const jobObj = this.jobs.find((j) => j.id === quoteData.job_id);
    if (jobObj) {
      const clientProfile = this.clients.find((c) => c.id === jobObj.client_id);
      if (clientProfile) {
        this.notify(
          clientProfile.user_id,
          'New quote received!',
          `You received a quote of $${newQuote.amount} from ${tradie.business_name || this.currentUser.full_name} for "${jobObj.title}".`
        );
      }
    }

    this.log(this.currentUser.id, `Submitted quote of $${newQuote.amount}`, 'quotes', newQuote.id);
    return newQuote;
  }

  public acceptQuote(quoteId: string) {
    if (!this.currentUser || this.currentUser.role !== 'client') {
      throw new Error('Only clients can accept quotes.');
    }

    const quotesList = this.quotes;
    const quote = quotesList.find((q) => q.id === quoteId);
    if (!quote) throw new Error('Quote not found.');

    const jobsList = this.jobs;
    const job = jobsList.find((j) => j.id === quote.job_id);
    if (!job) throw new Error('Job not found.');

    // Accept selected quote, reject others
    quotesList.forEach((q) => {
      if (q.job_id === job.id) {
        if (q.id === quote.id) {
          q.status = 'accepted';
        } else {
          q.status = 'rejected';
        }
      }
    });
    this.quotes = quotesList;

    // Update job status & assigned tradie
    job.status = 'assigned';
    job.assigned_tradie_id = quote.tradie_id;
    this.jobs = jobsList;

    // Create Conversation
    const tradie = this.tradies.find((t) => t.id === quote.tradie_id);
    const client = this.clients.find((c) => c.id === job.client_id);
    if (tradie && client) {
      const conversationsList = this.conversations;
      const existingConv = conversationsList.find(
        (c) => c.job_id === job.id && c.client_id === client.id && c.tradie_id === tradie.id
      );

      if (!existingConv) {
        const newConv: Conversation = {
          id: `conv-${Math.random().toString(36).substr(2, 9)}`,
          job_id: job.id,
          client_id: client.id,
          tradie_id: tradie.id,
          created_at: new Date().toISOString()
        };
        conversationsList.push(newConv);
        this.conversations = conversationsList;

        // Auto insert system message
        const messagesList = this.messages;
        messagesList.push({
          id: `msg-${Math.random().toString(36).substr(2, 9)}`,
          conversation_id: newConv.id,
          sender_id: 'system',
          message: `Quote accepted! Conversation started for "${job.title}". Price locked at $${quote.amount}.`,
          is_read: false,
          created_at: new Date().toISOString()
        });
        this.messages = messagesList;
      }

      // Notify selected tradie
      this.notify(
        tradie.user_id,
        'Quote Accepted!',
        `Your quote of $${quote.amount} for "${job.title}" has been accepted! You can now message the client.`
      );
    }

    // Notify rejected tradies
    const otherQuotes = this.quotes.filter((q) => q.job_id === job.id && q.id !== quote.id);
    otherQuotes.forEach((oq) => {
      const ot = this.tradies.find((t) => t.id === oq.tradie_id);
      if (ot) {
        this.notify(
          ot.user_id,
          'Quote Rejected',
          `Your quote for "${job.title}" was not accepted. Better luck next time!`
        );
      }
    });

    this.log(this.currentUser.id, `Accepted quote for job: ${job.title}`, 'jobs', job.id);
  }

  // MESSAGING
  public sendMessage(conversationId: string, text: string, attachmentUrl?: string) {
    if (!this.currentUser) throw new Error('Must be logged in to send messages.');

    const messagesList = this.messages;
    const newMsg: Message = {
      id: `msg-${Math.random().toString(36).substr(2, 9)}`,
      conversation_id: conversationId,
      sender_id: this.currentUser.id,
      message: text,
      attachment_url: attachmentUrl,
      is_read: false,
      created_at: new Date().toISOString()
    };
    messagesList.push(newMsg);
    this.messages = messagesList;

    // Send mock automated reply after 2 seconds to make the UI feel live!
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv && this.currentUser.id !== 'system') {
      const recipientProfileId = this.currentUser.role === 'client' 
        ? this.tradies.find((t) => t.id === conv.tradie_id)?.user_id 
        : this.clients.find((c) => c.id === conv.client_id)?.user_id;

      if (recipientProfileId) {
        // Increment dynamic notifications
        const recipientProfile = this.profiles.find((p) => p.id === recipientProfileId);
        if (recipientProfile) {
          this.notify(
            recipientProfile.id,
            'New message received',
            `You have a new message from ${this.currentUser.full_name}: "${text.substring(0, 30)}..."`
          );
        }

        // Auto mock tradie response if client asks questions
        if (this.currentUser.role === 'client') {
          setTimeout(() => {
            const list = this.messages;
            list.push({
              id: `msg-${Math.random().toString(36).substr(2, 9)}`,
              conversation_id: conversationId,
              sender_id: recipientProfileId,
              message: `Hi Dave, thanks for the message! I've received your query and will address it shortly. Looking forward to getting this sorted.`,
              is_read: false,
              created_at: new Date().toISOString()
            });
            this.messages = list;
            this.notify(this.currentUser!.id, 'New message received', `Steve MacQueen: "Hi Dave, thanks for the message..."`);
          }, 3000);
        }
      }
    }

    return newMsg;
  }

  // JOB PROGRESS UPDATE
  public updateJobStatus(jobId: string, status: Job['status'], updateMessage?: string, photoUrl?: string) {
    if (!this.currentUser) throw new Error('Authentication required.');

    const jobsList = this.jobs;
    const job = jobsList.find((j) => j.id === jobId);
    if (!job) throw new Error('Job not found.');

    job.status = status;
    job.updated_at = new Date().toISOString();
    this.jobs = jobsList;

    // Save job update milestone
    const updates = this.getStorageItem<JobUpdate[]>('job_updates', []);
    updates.push({
      id: `upd-${Math.random().toString(36).substr(2, 9)}`,
      job_id: jobId,
      created_by: this.currentUser.id,
      status: status,
      update_message: updateMessage || `Job status updated to ${status.replace('_', ' ')}`,
      photo_url: photoUrl,
      created_at: new Date().toISOString()
    });
    this.setStorageItem('job_updates', updates);

    // Notify relative parties
    const clientUser = this.profiles.find(
      (p) => p.id === this.clients.find((c) => c.id === job.client_id)?.user_id
    );
    const tradieUser = this.profiles.find(
      (p) => p.id === this.tradies.find((t) => t.id === job.assigned_tradie_id)?.user_id
    );

    if (this.currentUser.role === 'tradie' && clientUser) {
      this.notify(
        clientUser.id,
        'Job Progress Update!',
        `Tradie updated job "${job.title}" to ${status.replace('_', ' ')}: "${updateMessage || ''}"`
      );
    } else if (this.currentUser.role === 'client' && tradieUser) {
      this.notify(
        tradieUser.id,
        'Client Update!',
        `Client updated job "${job.title}" to ${status.replace('_', ' ')}.`
      );
    }

    this.log(this.currentUser.id, `Updated job status to: ${status}`, 'jobs', jobId);
  }

  // REVIEWS
  public submitReview(reviewData: Omit<Review, 'id' | 'created_at'>) {
    if (!this.currentUser || this.currentUser.role !== 'client') {
      throw new Error('Only clients can submit reviews.');
    }

    const reviewsList = this.reviews;
    // Check duplicate
    const exists = reviewsList.some((r) => r.job_id === reviewData.job_id);
    if (exists) throw new Error('You have already submitted a review for this completed job.');

    const newReview: Review = {
      ...reviewData,
      id: `rev-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    };
    reviewsList.push(newReview);
    this.reviews = reviewsList;

    // Recalculate tradie rating & review counts
    const tradiesList = this.tradies;
    const tradieIdx = tradiesList.findIndex((t) => t.id === reviewData.tradie_id);
    if (tradieIdx !== -1) {
      const tradieReviews = reviewsList.filter((r) => r.tradie_id === reviewData.tradie_id);
      const total = tradieReviews.length;
      const sum = tradieReviews.reduce((acc, r) => acc + r.rating, 0);
      tradiesList[tradieIdx].rating = parseFloat((sum / total).toFixed(2));
      tradiesList[tradieIdx].total_reviews = total;
      this.tradies = tradiesList;

      // Notify tradie
      this.notify(
        tradiesList[tradieIdx].user_id,
        'New Review Received!',
        `You received a ${newReview.rating}-star review: "${newReview.comment || ''}"`
      );
    }

    this.log(this.currentUser.id, `Reviewed tradie rating: ${newReview.rating}`, 'reviews', newReview.id);
  }

  // DISPUTES
  public raiseDispute(disputeData: Omit<Dispute, 'id' | 'status' | 'created_at'>) {
    if (!this.currentUser) throw new Error('Authentication required.');

    const newDispute: Dispute = {
      ...disputeData,
      id: `dsp-${Math.random().toString(36).substr(2, 9)}`,
      status: 'open',
      created_at: new Date().toISOString()
    };

    const disputesList = this.disputes;
    disputesList.push(newDispute);
    this.disputes = disputesList;

    // Set job status to disputed
    this.updateJobStatus(disputeData.job_id, 'disputed', `Dispute raised: ${disputeData.reason}`);

    // Notify admins
    this.profiles.filter(p => p.role === 'admin' || p.role === 'super_admin').forEach(admin => {
      this.notify(admin.id, 'New Dispute Raised!', `A dispute has been raised for Job ID: ${disputeData.job_id}`);
    });

    this.log(this.currentUser.id, `Raised dispute: ${disputeData.reason}`, 'disputes', newDispute.id);
    return newDispute;
  }

  // ADMIN OPERATIONS
  public verifyDocument(docId: string, status: TradieDocument['status'], comment?: string) {
    if (!this.currentUser || (this.currentUser.role !== 'admin' && this.currentUser.role !== 'super_admin')) {
      throw new Error('Only admins can review verification documents.');
    }

    const docsList = this.documents;
    const docIdx = docsList.findIndex((d) => d.id === docId);
    if (docIdx === -1) throw new Error('Document not found.');

    docsList[docIdx].status = status;
    docsList[docIdx].admin_comment = comment;
    docsList[docIdx].reviewed_by = this.currentUser.id;
    docsList[docIdx].reviewed_at = new Date().toISOString();
    this.documents = docsList;

    const tradie = this.tradies.find((t) => t.id === docsList[docIdx].tradie_id);
    if (tradie) {
      this.notify(
        tradie.user_id,
        `Document Verification: ${status.toUpperCase()}`,
        `Your uploaded document (${docsList[docIdx].document_type.replace('_', ' ')}) was ${status}. ${comment ? 'Comment: ' + comment : ''}`
      );

      // Check if all documents approved, then verify tradie account
      const tradieDocs = this.documents.filter((d) => d.tradie_id === tradie.id);
      const allApproved = tradieDocs.length > 0 && tradieDocs.every((d) => d.status === 'approved');
      if (allApproved) {
        const tradiesList = this.tradies;
        const tIdx = tradiesList.findIndex((t) => t.id === tradie.id);
        if (tIdx !== -1) {
          tradiesList[tIdx].verification_status = 'approved';
          this.tradies = tradiesList;
          this.notify(tradie.user_id, 'Account Verified!', 'Congratulations! Your business profile is now verified.');
        }
      }
    }

    this.log(this.currentUser.id, `Document ID ${docId} set to ${status}`, 'tradie_documents', docId);
  }

  public manageUserStatus(profileId: string, status: Profile['account_status']) {
    if (!this.currentUser || (this.currentUser.role !== 'admin' && this.currentUser.role !== 'super_admin')) {
      throw new Error('Only admins can change user status.');
    }

    const list = this.profiles;
    const idx = list.findIndex((p) => p.id === profileId);
    if (idx !== -1) {
      list[idx].account_status = status;
      this.profiles = list;
      this.log(this.currentUser.id, `Changed user status of ${profileId} to ${status}`, 'profiles', profileId);
    }
  }

  public resolveDispute(disputeId: string, notes: string) {
    if (!this.currentUser || (this.currentUser.role !== 'admin' && this.currentUser.role !== 'super_admin')) {
      throw new Error('Only admins can resolve disputes.');
    }

    const disputesList = this.disputes;
    const dispute = disputesList.find((d) => d.id === disputeId);
    if (!dispute) throw new Error('Dispute not found.');

    dispute.status = 'resolved';
    dispute.resolution_notes = notes;
    dispute.resolved_by = this.currentUser.id;
    dispute.resolved_at = new Date().toISOString();
    this.disputes = disputesList;

    // Reset job status to resolved (or completed/assigned depending on choice, let's keep assigned or quoting)
    this.updateJobStatus(dispute.job_id, 'assigned', `Dispute resolved by admin: ${notes}`);

    // Notify client and tradie
    const job = this.jobs.find(j => j.id === dispute.job_id);
    if (job) {
      const clientUser = this.profiles.find(p => p.id === this.clients.find(c => c.id === job.client_id)?.user_id);
      const tradieUser = this.profiles.find(p => p.id === this.tradies.find(t => t.id === job.assigned_tradie_id)?.user_id);

      if (clientUser) this.notify(clientUser.id, 'Dispute Resolved!', `Admin resolved dispute: "${notes}"`);
      if (tradieUser) this.notify(tradieUser.id, 'Dispute Resolved!', `Admin resolved dispute: "${notes}"`);
    }

    this.log(this.currentUser.id, `Resolved dispute ID ${disputeId}`, 'disputes', disputeId);
  }
}

export interface JobUpdate {
  id: string;
  job_id: string;
  created_by: string;
  status: string;
  update_message: string;
  photo_url?: string;
  created_at: string;
}

export const mockDb = new MockDatabase();
export default mockDb;

// Supabase Client Wrapper with Transparent Mock DB Fallback
import { createClient } from '@supabase/supabase-js';
import { mockDb } from './mockDb';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Determine if we should run in demo mode (no credentials provided)
export const isDemoMode = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_SUPABASE_');

console.log(
  isDemoMode 
    ? 'TradeConnect: running in [DEMO MODE] using client-side localStorage simulation.' 
    : 'TradeConnect: running in [PRODUCTION MODE] connected to Supabase.'
);

// Instantiate real client if credentials exist
const realClient = !isDemoMode ? createClient(supabaseUrl, supabaseAnonKey) : null;

// =========================================================================
// MOCK CLIENT PROXY INTERFACES
// =========================================================================

// Simple query builder simulator to mimic Supabase syntax
class MockQueryBuilder {
  private table: string;
  private filters: { col: string; val: any }[] = [];
  private orderCol: string | null = null;
  private orderAsc: boolean = true;
  private isSingle: boolean = false;
  private operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private insertRows: any = null;
  private updateChanges: any = null;

  constructor(table: string) {
    this.table = table;
  }

  eq(col: string, val: any) {
    this.filters.push({ col, val });
    return this;
  }

  order(col: string, options = { ascending: true }) {
    this.orderCol = col;
    this.orderAsc = options.ascending;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  private getData() {
    let list: any[] = [];
    switch (this.table) {
      case 'profiles': list = [...mockDb.profiles]; break;
      case 'clients': list = [...mockDb.clients]; break;
      case 'tradies': list = [...mockDb.tradies]; break;
      case 'trade_categories': list = [...mockDb.categories]; break;
      case 'tradie_categories': list = [...mockDb.tradieCategories]; break;
      case 'jobs': list = [...mockDb.jobs]; break;
      case 'quotes': list = [...mockDb.quotes]; break;
      case 'conversations': list = [...mockDb.conversations]; break;
      case 'messages': list = [...mockDb.messages]; break;
      case 'tradie_documents': list = [...mockDb.documents]; break;
      case 'reviews': list = [...mockDb.reviews]; break;
      case 'disputes': list = [...mockDb.disputes]; break;
      case 'subscriptions': list = [...mockDb.subscriptions]; break;
      case 'notifications': list = [...mockDb.notifications]; break;
      case 'audit_logs': list = [...mockDb.auditLogs]; break;
      default: list = []; break;
    }

    // Apply filters
    this.filters.forEach(f => {
      list = list.filter(item => item[f.col] === f.val);
    });

    // Apply ordering
    if (this.orderCol) {
      const col = this.orderCol;
      const asc = this.orderAsc;
      list.sort((a, b) => {
        if (a[col] < b[col]) return asc ? -1 : 1;
        if (a[col] > b[col]) return asc ? 1 : -1;
        return 0;
      });
    }

    if (this.isSingle) {
      return list[0] || null;
    }

    return list;
  }

  select(_columns?: string) {
    this.operation = 'select';
    return this;
  }

  insert(rows: any | any[]) {
    this.operation = 'insert';
    this.insertRows = rows;
    return this;
  }

  update(changes: any) {
    this.operation = 'update';
    this.updateChanges = changes;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  // Custom Thenable implementation to allow await logic on MockQueryBuilder
  then(onFulfilled?: (value: any) => any, onRejected?: (reason: any) => any) {
    const promise = (async () => {
      try {
        if (this.operation === 'select') {
          const data = this.getData();
          return { data, error: null };
        }

        if (this.operation === 'insert') {
          const array = Array.isArray(this.insertRows) ? this.insertRows : [this.insertRows];
          array.forEach(row => {
            const newRow = { 
              id: row.id || `row-${Math.random().toString(36).substr(2, 9)}`, 
              created_at: new Date().toISOString(),
              ...row 
            };

            if (this.table === 'jobs') {
              mockDb.postJob(newRow);
            } else if (this.table === 'quotes') {
              mockDb.submitQuote(newRow);
            } else if (this.table === 'messages') {
              mockDb.sendMessage(row.conversation_id, row.message, row.attachment_url);
            } else if (this.table === 'reviews') {
              mockDb.submitReview(newRow);
            } else if (this.table === 'disputes') {
              mockDb.raiseDispute(newRow);
            } else {
              const currentList = (mockDb as any)[this.table] || [];
              currentList.unshift(newRow);
              (mockDb as any)[this.table] = currentList;
            }
          });
          return { data: array, error: null };
        }

        if (this.operation === 'update') {
          const currentList = (mockDb as any)[this.table] || [];
          currentList.forEach((item: any, idx: number) => {
            let matches = true;
            this.filters.forEach(f => {
              if (item[f.col] !== f.val) matches = false;
            });
            if (matches) {
              currentList[idx] = { ...item, ...this.updateChanges, updated_at: new Date().toISOString() };
              
              if (this.table === 'jobs' && this.updateChanges.status) {
                mockDb.updateJobStatus(item.id, this.updateChanges.status, this.updateChanges.update_message, this.updateChanges.photo_url);
              }
            }
          });
          (mockDb as any)[this.table] = currentList;
          return { data: this.updateChanges, error: null };
        }

        if (this.operation === 'delete') {
          const currentList = (mockDb as any)[this.table] || [];
          const newList = currentList.filter((item: any) => {
            let matches = true;
            this.filters.forEach(f => {
              if (item[f.col] !== f.val) matches = false;
            });
            return !matches;
          });
          (mockDb as any)[this.table] = newList;
          return { data: null, error: null };
        }

        return { data: null, error: null };
      } catch (e: any) {
        return { data: null, error: { message: e.message } };
      }
    })();

    return promise.then(onFulfilled, onRejected);
  }
}

// Simulated Supabase Client
const mockSupabase = {
  auth: {
    async signUp(credentials: any) {
      try {
        const data = mockDb.register({
          email: credentials.email,
          full_name: credentials.options?.data?.full_name || 'User',
          role: credentials.options?.data?.role || 'client',
          mobile_number: credentials.options?.data?.mobile_number || ''
        });
        return { data: { user: data, session: { access_token: 'mock-jwt' } }, error: null };
      } catch (e: any) {
        return { data: { user: null, session: null }, error: { message: e.message } };
      }
    },

    async signInWithPassword(credentials: any) {
      try {
        const user = mockDb.login(credentials.email);
        return { data: { user, session: { access_token: 'mock-jwt' } }, error: null };
      } catch (e: any) {
        return { data: { user: null, session: null }, error: { message: e.message } };
      }
    },

    async signOut() {
      mockDb.logout();
      return { error: null };
    },

    async getUser() {
      const user = mockDb.currentUser;
      return { data: { user }, error: null };
    },

    onAuthStateChange(callback: (event: string, session: any) => void) {
      // Trigger callback with current session initially
      const user = mockDb.currentUser;
      callback('SIGNED_IN', user ? { user, access_token: 'mock-jwt' } : null);
      
      // Return unsubscribe handle
      return {
        data: {
          subscription: {
            unsubscribe() {}
          }
        }
      };
    }
  },

  from(table: string) {
    return new MockQueryBuilder(table);
  },

  storage: {
    from(bucket: string) {
      return {
        async upload(path: string, _file: File) {
          // Simulate simple upload, return random url
          const mockUrl = `https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500`;
          return { data: { path, fullPath: `${bucket}/${path}`, url: mockUrl }, error: null };
        },
        getPublicUrl(path: string) {
          // If a base64 string or an http link was stored, return it, otherwise return a placeholder
          return { data: { publicUrl: path.startsWith('http') || path.startsWith('data:') ? path : `https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500` } };
        }
      };
    }
  },

  channel(channelName: string) {
    return {
      on(_type: string, _filter: any, callback: any) {
        // Mock real-time channels: listen and trigger callback periodically (e.g. check for new messages)
        if (channelName.includes('messages')) {
          setInterval(() => {
            const lastMsg = mockDb.messages[0];
            if (lastMsg && lastMsg.sender_id !== mockDb.currentUser?.id && !lastMsg.is_read) {
              callback({ new: lastMsg });
            }
          }, 4000);
        }
        return this;
      },
      subscribe() {
        return this;
      }
    };
  },

  removeChannel(_channel: any) {
    // Mock channel cleanup
  }
};

// Export active client instance
export const supabase = !isDemoMode ? realClient! : (mockSupabase as any);

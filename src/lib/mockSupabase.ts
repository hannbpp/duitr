/**
 * Mock Supabase Client for Offline / Local-only Development
 * Emulates the Supabase JS Client using browser localStorage.
 */

// Default categories from the database schema
const DEFAULT_CATEGORIES = [
  // EXPENSE CATEGORIES
  { category_id: 1, category_key: 'expense_groceries', en_name: 'Groceries', id_name: 'Kebutuhan Rumah', type: 'expense', icon: 'shopping-basket', color: '#EF4444' },
  { category_id: 2, category_key: 'expense_food', en_name: 'Dining', id_name: 'Makan di Luar', type: 'expense', icon: 'utensils', color: '#F97316' },
  { category_id: 3, category_key: 'expense_transportation', en_name: 'Transportation', id_name: 'Transportasi', type: 'expense', icon: 'car', color: '#F59E0B' },
  { category_id: 4, category_key: 'expense_subscription', en_name: 'Subscription', id_name: 'Berlangganan', type: 'expense', icon: 'repeat', color: '#3B82F6' },
  { category_id: 5, category_key: 'expense_housing', en_name: 'Housing', id_name: 'Perumahan', type: 'expense', icon: 'home', color: '#8B5CF6' },
  { category_id: 6, category_key: 'expense_entertainment', en_name: 'Entertainment', id_name: 'Hiburan', type: 'expense', icon: 'film', color: '#EC4899' },
  { category_id: 7, category_key: 'expense_shopping', en_name: 'Shopping', id_name: 'Belanja', type: 'expense', icon: 'shopping-cart', color: '#F43F5E' },
  { category_id: 8, category_key: 'expense_health', en_name: 'Health', id_name: 'Kesehatan', type: 'expense', icon: 'heart-pulse', color: '#10B981' },
  { category_id: 9, category_key: 'expense_education', en_name: 'Education', id_name: 'Pendidikan', type: 'expense', icon: 'graduation-cap', color: '#06B6D4' },
  { category_id: 10, category_key: 'expense_travel', en_name: 'Travel', id_name: 'Perjalanan', type: 'expense', icon: 'plane', color: '#6366F1' },
  { category_id: 11, category_key: 'expense_personal', en_name: 'Personal Care', id_name: 'Perawatan Diri', type: 'expense', icon: 'user', color: '#A855F7' },
  { category_id: 12, category_key: 'expense_other', en_name: 'Other', id_name: 'Lainnya', type: 'expense', icon: 'more-horizontal', color: '#6B7280' },
  { category_id: 19, category_key: 'expense_donation', en_name: 'Donation', id_name: 'Donasi', type: 'expense', icon: 'heart', color: '#F87171' },
  { category_id: 20, category_key: 'expense_investment', en_name: 'Investment', id_name: 'Investasi', type: 'expense', icon: 'trending-up', color: '#34D399' },
  { category_id: 21, category_key: 'expense_baby', en_name: 'Baby Needs', id_name: 'Kebutuhan Bayi', type: 'expense', icon: 'baby', color: '#FBB6CE' },
  // INCOME CATEGORIES
  { category_id: 13, category_key: 'income_salary', en_name: 'Salary', id_name: 'Gaji', type: 'income', icon: 'wallet', color: '#10B981' },
  { category_id: 14, category_key: 'income_business', en_name: 'Business', id_name: 'Bisnis', type: 'income', icon: 'briefcase', color: '#3B82F6' },
  { category_id: 15, category_key: 'income_investment', en_name: 'Investment', id_name: 'Investasi', type: 'income', icon: 'trending-up', color: '#8B5CF6' },
  { category_id: 16, category_key: 'income_gift', en_name: 'Gift', id_name: 'Hadiah', type: 'income', icon: 'gift', color: '#EC4899' },
  { category_id: 17, category_key: 'income_other', en_name: 'Other', id_name: 'Lainnya', type: 'income', icon: 'more-horizontal', color: '#6B7280' },
  // SYSTEM CATEGORY
  { category_id: 18, category_key: 'system_transfer', en_name: 'Transfer', id_name: 'Transfer', type: 'system', icon: 'arrow-right-left', color: '#0EA5E9' }
];

// Helper to safely access localStorage in SSR-safe way
const getLocalStorageData = (key: string, defaultValue: any): any => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('LocalStorage error:', error);
    return defaultValue;
  }
};

const setLocalStorageData = (key: string, data: any): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('LocalStorage error:', error);
  }
};

// Mock Auth State
const MOCK_USER_SESSION_KEY = 'duitr_mock_session';
const MOCK_USERS_KEY = 'duitr_mock_users';

interface MockUser {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
    is_balance_hidden?: boolean;
    [key: string]: any;
  };
  email_confirmed_at?: string;
}

class MockQueryBuilder {
  private table: string;
  private filters: Array<{ col: string; val: any; op: string }> = [];
  private orderFields: Array<{ col: string; ascending: boolean }> = [];
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: any = null;
  private isSingle: boolean = false;
  private isOrExpr: string | null = null;
  private isNullCol: string | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(columns?: string) {
    if (this.action === 'select') {
      this.action = 'select';
    }
    return this;
  }

  insert(data: any) {
    this.action = 'insert';
    this.payload = data;
    return this;
  }

  update(data: any) {
    this.action = 'update';
    this.payload = data;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push({ col, val, op: 'eq' });
    return this;
  }

  or(expr: string) {
    this.isOrExpr = expr;
    return this;
  }

  is(col: string, val: any) {
    if (val === null) {
      this.isNullCol = col;
    } else {
      this.filters.push({ col, val, op: 'is' });
    }
    return this;
  }

  order(col: string, options?: { ascending: boolean }) {
    this.orderFields.push({ col, ascending: options?.ascending !== false });
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  // To support chaining .select() after .insert() / .update() / .delete()
  // e.g. supabase.from('table').insert(data).select().single()
  // we just return `this` for select() if it's already insert/update/delete.
  // This is handled by select() and constructor.

  private getTableKey(): string {
    return `duitr_mock_table_${this.table}`;
  }

  private loadTableData(): any[] {
    if (this.table === 'categories') {
      const customCats = getLocalStorageData(this.getTableKey(), []);
      return [...DEFAULT_CATEGORIES, ...customCats];
    }
    return getLocalStorageData(this.getTableKey(), []);
  }

  private saveTableData(data: any[]): void {
    if (this.table === 'categories') {
      // Save only custom categories (ones with user_id)
      const customCats = data.filter(item => item.user_id !== null && item.user_id !== undefined);
      setLocalStorageData(this.getTableKey(), customCats);
      return;
    }
    setLocalStorageData(this.getTableKey(), data);
  }

  async execute(): Promise<{ data: any; error: any }> {
    try {
      const dataList = this.loadTableData();
      
      if (this.action === 'select') {
        let filtered = [...dataList];

        // Apply filters
        for (const f of this.filters) {
          filtered = filtered.filter(item => item[f.col] === f.val);
        }

        if (this.isNullCol) {
          filtered = filtered.filter(item => item[this.isNullCol!] === null || item[this.isNullCol!] === undefined);
        }

        // Apply .or expression if any (e.g. "user_id.is.null,user_id.eq.user-123")
        if (this.isOrExpr) {
          const conditions = this.isOrExpr.split(',');
          filtered = filtered.filter(item => {
            return conditions.some(cond => {
              if (cond.includes('.is.null')) {
                const col = cond.split('.is.null')[0];
                return item[col] === null || item[col] === undefined;
              } else if (cond.includes('.eq.')) {
                const [col, val] = cond.split('.eq.');
                return String(item[col]) === String(val);
              }
              return false;
            });
          });
        }

        // Apply sorting
        for (const sort of this.orderFields) {
          filtered.sort((a, b) => {
            const valA = a[sort.col];
            const valB = b[sort.col];
            
            if (valA == null) return sort.ascending ? -1 : 1;
            if (valB == null) return sort.ascending ? 1 : -1;
            
            if (typeof valA === 'number' && typeof valB === 'number') {
              return sort.ascending ? valA - valB : valB - valA;
            }
            
            const strA = String(valA);
            const strB = String(valB);
            return sort.ascending ? strA.localeCompare(strB) : strB.localeCompare(strA);
          });
        }

        if (this.isSingle) {
          return { data: filtered[0] || null, error: filtered.length === 0 ? { message: 'Row not found', code: 'PGRST116' } : null };
        }

        return { data: filtered, error: null };
      }

      if (this.action === 'insert') {
        const toInsertArray = Array.isArray(this.payload) ? this.payload : [this.payload];
        const insertedRows = toInsertArray.map(item => {
          const newRow = { ...item };
          
          // Generate ID if missing
          if (!newRow.id) {
            newRow.id = `mock-id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          }
          if (this.table === 'categories' && !newRow.category_id) {
            // Find max ID
            const maxId = dataList.reduce((max, cat) => Math.max(max, cat.category_id || 0), 0);
            newRow.category_id = maxId + 1;
          }
          
          if (!newRow.created_at) {
            newRow.created_at = new Date().toISOString();
          }
          return newRow;
        });

        const updatedTable = [...dataList, ...insertedRows];
        this.saveTableData(updatedTable);

        if (this.isSingle) {
          return { data: insertedRows[0] || null, error: null };
        }
        return { data: insertedRows, error: null };
      }

      if (this.action === 'update') {
        let updatedCount = 0;
        const updatedTable = dataList.map(item => {
          // Check if item matches filters
          const matchesFilters = this.filters.every(f => item[f.col] === f.val);
          if (matchesFilters) {
            updatedCount++;
            return { ...item, ...this.payload };
          }
          return item;
        });

        this.saveTableData(updatedTable);

        // Find updated items to return
        const updatedItems = updatedTable.filter(item => {
          return this.filters.every(f => item[f.col] === f.val);
        });

        if (this.isSingle) {
          return { data: updatedItems[0] || null, error: null };
        }
        return { data: updatedItems, error: null };
      }

      if (this.action === 'delete') {
        const beforeCount = dataList.length;
        const filteredTable = dataList.filter(item => {
          // Keep item if it does NOT match filters (we delete matches)
          const matchesFilters = this.filters.every(f => item[f.col] === f.val);
          return !matchesFilters;
        });

        this.saveTableData(filteredTable);
        return { data: null, error: null };
      }

      return { data: null, error: null };
    } catch (e: any) {
      console.error('Mock DB error:', e);
      return { data: null, error: { message: e.message } };
    }
  }

  // Make class Thenable to support await directly on chain
  then(onfulfilled?: (value: { data: any; error: any }) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

class MockSupabaseAuth {
  private listeners: Set<(event: string, session: any) => void> = new Set();

  constructor() {
    // Read state changes or check active storage session
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === MOCK_USER_SESSION_KEY) {
          const session = this.getSessionSync();
          this.triggerListeners(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
        }
      });
    }
  }

  private triggerListeners(event: string, session: any) {
    this.listeners.forEach(cb => cb(event, session));
  }

  private getSessionSync() {
    const user = getLocalStorageData(MOCK_USER_SESSION_KEY, null);
    if (!user) return null;
    
    // Auto-patch email_confirmed_at for existing users/sessions
    if (!user.email_confirmed_at) {
      user.email_confirmed_at = new Date().toISOString();
    }
    
    return {
      user,
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      token_type: 'bearer'
    };
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    this.listeners.add(callback);
    
    // Trigger initial state
    const session = this.getSessionSync();
    setTimeout(() => {
      callback(session ? 'SIGNED_IN' : 'INITIAL_SESSION', session);
    }, 0);

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners.delete(callback);
          }
        }
      }
    };
  }

  async getSession() {
    const session = this.getSessionSync();
    return { data: { session }, error: null };
  }

  async getUser() {
    const sessionObj = this.getSessionSync();
    return { data: { user: sessionObj?.user || null }, error: null };
  }

  async signUp({ email, password, options }: any) {
    const users = getLocalStorageData(MOCK_USERS_KEY, []);
    const sanitizedEmail = email.trim().toLowerCase();
    
    if (users.find((u: any) => u.email === sanitizedEmail)) {
      return { data: null, error: { message: 'User already exists' } };
    }

    const newUser: MockUser = {
      id: `mock-user-${Date.now()}`,
      email: sanitizedEmail,
      user_metadata: options?.data || { name: email.split('@')[0] },
      email_confirmed_at: new Date().toISOString()
    };

    setLocalStorageData(MOCK_USERS_KEY, [...users, newUser]);

    // Automatically confirm and log in local mock users
    setLocalStorageData(MOCK_USER_SESSION_KEY, newUser);
    this.triggerListeners('SIGNED_IN', this.getSessionSync());

    return { data: { user: newUser, session: this.getSessionSync() }, error: null };
  }

  async signInWithPassword({ email, password }: any) {
    const users = getLocalStorageData(MOCK_USERS_KEY, []);
    const sanitizedEmail = email.trim().toLowerCase();
    
    let user = users.find((u: any) => u.email === sanitizedEmail);
    
    // If user doesn't exist, create it dynamically for a smooth local onboarding!
    if (!user) {
      user = {
        id: `mock-user-${Date.now()}`,
        email: sanitizedEmail,
        user_metadata: { name: email.split('@')[0] },
        email_confirmed_at: new Date().toISOString()
      };
      setLocalStorageData(MOCK_USERS_KEY, [...users, user]);
    } else if (!user.email_confirmed_at) {
      user.email_confirmed_at = new Date().toISOString();
      const updatedUsers = users.map((u: any) => u.id === user.id ? user : u);
      setLocalStorageData(MOCK_USERS_KEY, updatedUsers);
    }

    setLocalStorageData(MOCK_USER_SESSION_KEY, user);
    const session = this.getSessionSync();
    this.triggerListeners('SIGNED_IN', session);

    return { data: { user, session }, error: null };
  }

  async signInWithOAuth({ provider, options }: any) {
    // Generate a quick mock user
    const mockOAuthUser = {
      id: `mock-user-oauth-${Date.now()}`,
      email: 'oauth.user@example.com',
      user_metadata: { name: 'Google Local User' }
    };
    
    setLocalStorageData(MOCK_USER_SESSION_KEY, mockOAuthUser);
    
    // Redirect to local callback
    if (typeof window !== 'undefined') {
      window.location.href = options?.redirectTo || '/';
    }

    return { data: { url: window.location.origin }, error: null };
  }

  async signOut() {
    setLocalStorageData(MOCK_USER_SESSION_KEY, null);
    this.triggerListeners('SIGNED_OUT', null);
    return { error: null };
  }

  async updateUser({ data }: any) {
    const user = getLocalStorageData(MOCK_USER_SESSION_KEY, null);
    if (!user) return { data: null, error: { message: 'No active session' } };

    const updatedUser = {
      ...user,
      user_metadata: {
        ...user.user_metadata,
        ...data
      }
    };

    // Save in session
    setLocalStorageData(MOCK_USER_SESSION_KEY, updatedUser);

    // Save in users database
    const users = getLocalStorageData(MOCK_USERS_KEY, []);
    const updatedUsers = users.map((u: any) => u.id === user.id ? updatedUser : u);
    setLocalStorageData(MOCK_USERS_KEY, updatedUsers);

    this.triggerListeners('USER_UPDATED', this.getSessionSync());

    return { data: { user: updatedUser }, error: null };
  }

  async resend({ email }: any) {
    return { data: null, error: null };
  }
}

const getLangCode = (lang: any) => String(lang || 'id').toLowerCase().split('-')[0];

// Mock Supabase Client Object
export const mockSupabase = {
  auth: new MockSupabaseAuth(),
  from(table: string) {
    return new MockQueryBuilder(table);
  },
  functions: {
    async invoke(functionName: string, options?: { body: any }) {
      console.log(`[Mock Supabase Functions] Invoking ${functionName}`, options);
      const body = options?.body || {};
      
      if (functionName === 'gemini-finance-insight') {
        const { action, input, language, summary, question } = body;
        const lang = getLangCode(language);
        
        // 1. Transaction parsing action
        if (action === 'parse_transactions' && typeof input === 'string') {
          // Splitting input by commas, newlines, semicolons, or "dan"
          const tokens = input.split(/[,;\n]|\bdan\b/i).map(t => t.trim()).filter(Boolean);
          const parsedTransactions: any[] = [];
          
          for (const token of tokens) {
            const amountRegex = /(\d+(?:[.,]\d+)?)\s*(rb|k|ribu|jt|juta)?\b/i;
            const match = token.match(amountRegex);
            if (!match) continue;
            
            const rawNum = match[1].replace(/[,.]/g, (char, index, str) => {
              const rest = str.slice(index + 1);
              if (rest.match(/^\d{3}\b/)) return ''; // Thousand separator
              return '.'; // Decimal point
            });
            
            const numValue = parseFloat(rawNum);
            const suffix = (match[2] || '').toLowerCase();
            
            let multiplier = 1;
            if (suffix === 'rb' || suffix === 'k' || suffix === 'ribu') {
              multiplier = 1000;
            } else if (suffix === 'jt' || suffix === 'juta') {
              multiplier = 1000000;
            } else if (numValue < 1000 && !suffix) {
              multiplier = 1000; // default to thousands for small numbers without suffix
            }
            
            const amount = Math.round(numValue * multiplier);
            
            let description = token.replace(match[0], '').trim();
            // Clean prefixes
            description = description.replace(/^(hari ini|kemarin|besok|beli|bayar|untuk|buat)\s+/i, '');
            description = description.replace(/^[\s,;.-]+|[\s,;.-]+$/g, '').trim();
            if (!description) description = token.trim();
            
            let type: 'income' | 'expense' = 'expense';
            let category = 'Other';
            const descLower = description.toLowerCase();
            
            const mappings = [
              { keywords: ['gaji', 'salary', 'transfer masuk', 'bonus', 'upah', 'pemasukan'], category: 'Salary', type: 'income' },
              { keywords: ['jualan', 'untung', 'bisnis', 'omset', 'dagang', 'profit'], category: 'Business', type: 'income' },
              { keywords: ['investasi', 'saham', 'reksadana', 'crypto', 'deviden'], category: 'Investment', type: 'income' },
              { keywords: ['hadiah', 'kado', 'giveaway', 'angpao'], category: 'Gift', type: 'income' },
              { keywords: ['makan', 'minum', 'ngopi', 'kopi', 'restoran', 'cafe', 'sarapan', 'siang', 'malam', 'warteg', 'padang', 'bakso', 'mie'], category: 'Dining', type: 'expense' },
              { keywords: ['belanja', 'pasar', 'supermarket', 'minimarket', 'alfamart', 'indomaret', 'sembako', 'sayur'], category: 'Groceries', type: 'expense' },
              { keywords: ['bensin', 'parkir', 'tol', 'ojek', 'gojek', 'grab', 'taxi', 'taksi', 'bus', 'kereta', 'tiket', 'travel'], category: 'Transportation', type: 'expense' },
              { keywords: ['langganan', 'netflix', 'spotify', 'youtube', 'disney', 'premium', 'subscribe'], category: 'Subscription', type: 'expense' },
              { keywords: ['kost', 'kontrakan', 'sewa', 'listrik', 'token', 'air', 'pdam', 'internet', 'wifi', 'tagihan', 'maintenance'], category: 'Housing', type: 'expense' },
              { keywords: ['nonton', 'bioskop', 'film', 'game', 'topup', 'hiburan', 'karaoke', 'konser'], category: 'Entertainment', type: 'expense' },
              { keywords: ['baju', 'celana', 'sepatu', 'tas', 'kemeja', 'kaos', 'jaket', 'shopping', 'olshop', 'shopee', 'tokopedia'], category: 'Shopping', type: 'expense' },
              { keywords: ['obat', 'dokter', 'rs', 'rumah sakit', 'klinik', 'vitamin', 'apotek', 'sakit'], category: 'Health', type: 'expense' },
              { keywords: ['sekolah', 'kuliah', 'buku', 'kursus', 'spp', 'tugas', 'pen', 'pensil'], category: 'Education', type: 'expense' },
              { keywords: ['potong rambut', 'barbershop', 'salon', 'skincare', 'sabun', 'shampoo'], category: 'Personal Care', type: 'expense' },
              { keywords: ['sedekah', 'donasi', 'zakat', 'mesjid', 'masjid', 'gereja', 'tip'], category: 'Donation', type: 'expense' },
              { keywords: ['invest', 'reksadana', 'crypto', 'saham', 'nabung'], category: 'Investment', type: 'expense' },
              { keywords: ['popok', 'susu bayi', 'pampers', 'mainan bayi'], category: 'Baby Needs', type: 'expense' }
            ];
            
            for (const map of mappings) {
              if (map.keywords.some(kw => descLower.includes(kw))) {
                category = map.category;
                type = map.type as 'income' | 'expense';
                break;
              }
            }
            
            parsedTransactions.push({
              description,
              amount,
              category,
              type,
              confidence: 0.95
            });
          }
          
          return {
            data: {
              result: {
                transactions: parsedTransactions,
                message: 'Parsed locally (offline mode)'
              }
            },
            error: null
          };
        }
        
        // 2. Chat AI question action
        if (question && typeof question === 'string') {
          const totalIncome = summary?.totalIncome || 0;
          const totalExpenses = summary?.totalExpenses || 0;
          const netFlow = summary?.netFlow || 0;
          
          const responseText = lang === 'id'
            ? `Halo! Sebagai asisten AI offline Anda:
            
* Anda menanyakan: "${question}"
* Total Pemasukan: **Rp${totalIncome.toLocaleString('id-ID')}**
* Total Pengeluaran: **Rp${totalExpenses.toLocaleString('id-ID')}**
* Arus Kas Bersih: **Rp${netFlow.toLocaleString('id-ID')}**

Karena Anda sedang menjalankan aplikasi dalam **mode offline / local-only**, saya tidak dapat terhubung langsung ke model Gemini untuk menganalisis secara mendalam. Namun, Anda dapat melihat rincian transaksi lengkap pada dashboard Anda!`
            : `Hello! As your offline AI assistant:
            
* You asked: "${question}"
* Total Income: **Rp${totalIncome.toLocaleString('id-ID')}**
* Total Expenses: **Rp${totalExpenses.toLocaleString('id-ID')}**
* Net Flow: **Rp${netFlow.toLocaleString('id-ID')}**

Because you are running the app in **offline / local-only mode**, I cannot connect to the Gemini model for advanced analysis. However, you can see all your transactional details on the dashboard!`;
          
          return {
            data: {
              result: responseText
            },
            error: null
          };
        }
        
        // 3. Finance Insight action (summary analysis)
        if (summary && !question) {
          const totalIncome = summary.totalIncome || 0;
          const totalExpenses = summary.totalExpenses || 0;
          const netFlow = summary.netFlow || 0;
          const status = netFlow > 0 ? (totalExpenses > totalIncome * 0.8 ? 'Perlu Perhatian' : 'Sehat') : 'Kritis';
          
          const responseText = lang === 'id'
            ? `### 📊 Analisis Keuangan Offline (Lokal)
            
Kondisi Keuangan Anda dinilai **${status}** berdasarkan data lokal Anda.

* **Total Pemasukan**: Rp${totalIncome.toLocaleString('id-ID')}
* **Total Pengeluaran**: Rp${totalExpenses.toLocaleString('id-ID')}
* **Saldo Bersih**: Rp${netFlow.toLocaleString('id-ID')}

**Rekomendasi Praktis:**
1. Pertahankan rasio menabung minimal 20% dari total pemasukan bulanan Anda.
2. Evaluasi pengeluaran non-primer secara berkala pada kategori belanja atau hiburan.
3. Selalu catat pengeluaran harian Anda agar arus kas tetap terkontrol secara real-time.

*Catatan: Analisis ini dibuat secara instan di sisi klien karena Anda sedang menggunakan mode offline.*`
            : `### 📊 Offline Financial Insight (Local)
            
Your Financial Health is **${status === 'Sehat' ? 'Healthy' : status === 'Perlu Perhatian' ? 'Needs Attention' : 'Critical'}** based on local data.

* **Total Income**: Rp${totalIncome.toLocaleString('id-ID')}
* **Total Expenses**: Rp${totalExpenses.toLocaleString('id-ID')}
* **Net Flow**: Rp${netFlow.toLocaleString('id-ID')}

**Actionable Recommendations:**
1. Try to save at least 20% of your total monthly income.
2. Regularly evaluate non-essential expenses in shopping or entertainment.
3. Consistently log daily transactions to keep your cash flow monitored.

*Note: This insight is generated locally on your browser because you are in offline mode.*`;
          
          return {
            data: {
              result: responseText
            },
            error: null
          };
        }
      }
      
      // Default fallback / unknown function
      return { data: null, error: { message: 'Function not implemented in mock mode' } };
    }
  }
};

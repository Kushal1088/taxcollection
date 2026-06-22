import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isMock = !supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your-supabase-url';

let realSupabase = null;
if (!isMock) {
  try {
    realSupabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn("Failed to initialize real Supabase client. Defaulting to mock.", err);
  }
}

const STORAGE_PREFIX = 'tax_system_enh_v4_';

const SEED_DATA = {
  wards: [
    { id: 'ward_1', name: 'Ward 1' },
    { id: 'ward_2', name: 'Ward 2' },
    { id: 'ward_3', name: 'Ward 3' },
    { id: 'ward_4', name: 'Ward 4' }
  ],
  users: [
    {
      id: 'usr_admin_1',
      full_name: 'Amit Patel (Admin)',
      email: 'taxulb@gmail.com',
      password: 'admin123',
      mobile_number: '9999988888',
      role: 'admin',
      status: 'active',
      rejection_reason: null,
      created_at: new Date('2026-01-01').toISOString()
    },
    {
      id: 'usr_collector_1',
      full_name: 'Rajesh Kumar (Collector 1)',
      email: 'collector@municipal.gov',
      password: 'password',
      mobile_number: '8888877777',
      role: 'collector',
      status: 'active',
      rejection_reason: null,
      created_at: new Date('2026-01-02').toISOString()
    },
    {
      id: 'usr_collector_2',
      full_name: 'Suresh Raina (Collector 2)',
      email: 'collector2@municipal.gov',
      password: 'password',
      mobile_number: '8888866666',
      role: 'collector',
      status: 'active',
      rejection_reason: null,
      created_at: new Date('2026-01-03').toISOString()
    },
    {
      id: 'usr_citizen_1',
      full_name: 'Rahul Sharma (Step 2 - Reg Awaiting Review)',
      email: 'citizen@gmail.com',
      password: 'password',
      mobile_number: '9876543210',
      role: 'citizen',
      status: 'pending',
      rejection_reason: null,
      created_at: new Date('2026-06-20').toISOString()
    },
    {
      id: 'usr_citizen_3',
      full_name: 'Vikram Singh (Step 3 - Collector Assigned)',
      email: 'survey-citizen@gmail.com',
      password: 'password',
      mobile_number: '9876543211',
      role: 'citizen',
      status: 'pending',
      rejection_reason: null,
      created_at: new Date('2026-06-19').toISOString()
    },
    {
      id: 'usr_citizen_4',
      full_name: 'Ananya Sen (Step 4 - Survey Completed)',
      email: 'surveyed-citizen@gmail.com',
      password: 'password',
      mobile_number: '9876543212',
      role: 'citizen',
      status: 'pending',
      rejection_reason: null,
      created_at: new Date('2026-06-18').toISOString()
    },
    {
      id: 'usr_citizen_5',
      full_name: 'Kushal Pandey (Step 5 - Unpaid Dues)',
      email: 'kushal@gmail.com',
      password: 'password',
      mobile_number: '9876543213',
      role: 'citizen',
      status: 'active',
      rejection_reason: null,
      created_at: new Date('2026-05-15').toISOString()
    },
    {
      id: 'usr_citizen_6',
      full_name: 'Sunita Rao (Step 6 - Verification Pending)',
      email: 'sunita@gmail.com',
      password: 'password',
      mobile_number: '9876543214',
      role: 'citizen',
      status: 'active',
      rejection_reason: null,
      created_at: new Date('2026-05-14').toISOString()
    },
    {
      id: 'usr_citizen_2',
      full_name: 'Priya Patel (Step 7 - Paid & Receipt)',
      email: 'active-citizen@gmail.com',
      password: 'password',
      mobile_number: '9123456789',
      role: 'citizen',
      status: 'active',
      rejection_reason: null,
      created_at: new Date('2026-05-15').toISOString()
    }
  ],
  collectors: [
    {
      id: 'usr_collector_1',
      ward_id: 'ward_1',
      area: 'Sector A & B, North Zone',
      updated_at: new Date('2026-01-02').toISOString()
    },
    {
      id: 'usr_collector_2',
      ward_id: 'ward_2',
      area: 'Sector C & D, West Zone',
      updated_at: new Date('2026-01-03').toISOString()
    }
  ],
  citizen_requests: [
    {
      id: 'req_1',
      citizen_id: 'usr_citizen_1',
      full_name: 'Rahul Sharma (Step 2 - Reg Awaiting Review)',
      mobile_number: '9876543210',
      email: 'citizen@gmail.com',
      address: 'House No. 12, Ward 1 Area',
      aadhaar_number: '1234-5678-9012',
      status: 'pending_admin_review',
      collector_id: null,
      rejection_reason: null,
      created_at: new Date('2026-06-20').toISOString(),
      updated_at: new Date('2026-06-20').toISOString()
    },
    {
      id: 'req_3',
      citizen_id: 'usr_citizen_3',
      full_name: 'Vikram Singh (Step 3 - Collector Assigned)',
      mobile_number: '9876543211',
      email: 'survey-citizen@gmail.com',
      address: 'Plot 4A, Green Meadows Zone',
      aadhaar_number: '1122-3344-5566',
      status: 'assigned_to_collector',
      collector_id: 'usr_collector_1',
      rejection_reason: null,
      created_at: new Date('2026-06-19').toISOString(),
      updated_at: new Date('2026-06-19').toISOString()
    },
    {
      id: 'req_4',
      citizen_id: 'usr_citizen_4',
      full_name: 'Ananya Sen (Step 4 - Survey Completed)',
      mobile_number: '9876543212',
      email: 'surveyed-citizen@gmail.com',
      address: 'Flat 102, Royal Enclave',
      aadhaar_number: '5566-7788-9900',
      status: 'verification_completed',
      collector_id: 'usr_collector_1',
      rejection_reason: null,
      created_at: new Date('2026-06-18').toISOString(),
      updated_at: new Date('2026-06-18').toISOString()
    },
    {
      id: 'req_5',
      citizen_id: 'usr_citizen_5',
      full_name: 'Kushal Pandey (Step 5 - Unpaid Dues)',
      mobile_number: '9876543213',
      email: 'kushal@gmail.com',
      address: 'Sector 5 Outer Ring Road',
      aadhaar_number: '4455-6677-8899',
      status: 'approved',
      collector_id: 'usr_collector_1',
      rejection_reason: null,
      created_at: new Date('2026-05-15').toISOString(),
      updated_at: new Date('2026-05-17').toISOString()
    },
    {
      id: 'req_6',
      citizen_id: 'usr_citizen_6',
      full_name: 'Sunita Rao (Step 6 - Verification Pending)',
      mobile_number: '9876543214',
      email: 'sunita@gmail.com',
      address: 'G-12, Green View Colony',
      aadhaar_number: '3344-5566-7788',
      status: 'approved',
      collector_id: 'usr_collector_1',
      rejection_reason: null,
      created_at: new Date('2026-05-14').toISOString(),
      updated_at: new Date('2026-05-16').toISOString()
    },
    {
      id: 'req_2',
      citizen_id: 'usr_citizen_2',
      full_name: 'Priya Patel (Step 7 - Paid & Receipt)',
      mobile_number: '9123456789',
      email: 'active-citizen@gmail.com',
      address: 'Penthouse B, Sky View Towers',
      aadhaar_number: '9876-5432-1098',
      status: 'approved',
      collector_id: 'usr_collector_1',
      rejection_reason: null,
      created_at: new Date('2026-05-15').toISOString(),
      updated_at: new Date('2026-05-17').toISOString()
    }
  ],
  properties: [
    {
      id: 'prop_3',
      request_id: 'req_3',
      citizen_id: 'usr_citizen_3',
      collector_id: 'usr_collector_1',
      ward_id: 'ward_1',
      ulb: 'Municipal Corporation Zone A',
      owner_name: 'Vikram Singh',
      owner_phone: '9876543211',
      property_type: 'Residential',
      status: 'Assigned To Collector',
      address: 'Plot 4A, Green Meadows Zone',
      city: 'Metro City',
      state: 'State A',
      pincode: '400001',
      total_area: 0,
      built_up_area: 0,
      created_at: new Date('2026-06-19').toISOString(),
      updated_at: new Date('2026-06-19').toISOString()
    },
    {
      id: 'prop_4',
      request_id: 'req_4',
      citizen_id: 'usr_citizen_4',
      collector_id: 'usr_collector_1',
      ward_id: 'ward_1',
      ulb: 'Municipal Corporation Zone A',
      owner_name: 'Ananya Sen',
      owner_phone: '9876543212',
      owner_photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
      aadhaar_url: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=400',
      property_type: 'Commercial',
      usage_type: 'Shopping Complex',
      construction_type: 'RCC Framed Structure',
      number_of_floors: 3,
      construction_year: 2021,
      occupancy_status: 'Owner Occupied',
      status: 'Verification Completed',
      address: 'Flat 102, Royal Enclave',
      city: 'Metro City',
      state: 'State A',
      pincode: '400001',
      total_area: 1800,
      built_up_area: 1800,
      latitude: 28.6139,
      longitude: 77.2090,
      remarks: 'Survey completed physically. Dimensions verified.',
      created_at: new Date('2026-06-18').toISOString(),
      updated_at: new Date('2026-06-18').toISOString()
    },
    {
      id: 'prop_5',
      request_id: 'req_5',
      citizen_id: 'usr_citizen_5',
      collector_id: 'usr_collector_1',
      ward_id: 'ward_1',
      ulb: 'Municipal Corporation Zone A',
      property_number: 'PROP-2026-00002',
      owner_name: 'Kushal Pandey',
      owner_phone: '9876543213',
      owner_photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
      aadhaar_url: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=400',
      property_type: 'Residential',
      usage_type: 'Self Occupied',
      construction_type: 'RCC Framed Structure',
      number_of_floors: 1,
      construction_year: 2020,
      occupancy_status: 'Owner Occupied',
      status: 'Approved',
      address: 'Sector 5 Outer Ring Road',
      city: 'Metro City',
      state: 'State A',
      pincode: '400001',
      total_area: 1200,
      built_up_area: 1000,
      latitude: 28.6139,
      longitude: 77.2090,
      remarks: 'Survey report approved by admin.',
      created_at: new Date('2026-05-15').toISOString(),
      updated_at: new Date('2026-05-17').toISOString()
    },
    {
      id: 'prop_6',
      request_id: 'req_6',
      citizen_id: 'usr_citizen_6',
      collector_id: 'usr_collector_1',
      ward_id: 'ward_1',
      ulb: 'Municipal Corporation Zone A',
      property_number: 'PROP-2026-00003',
      owner_name: 'Sunita Rao',
      owner_phone: '9876543214',
      owner_photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
      aadhaar_url: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=400',
      property_type: 'Industrial',
      usage_type: 'Warehouse',
      construction_type: 'RCC Framed Structure',
      number_of_floors: 1,
      construction_year: 2018,
      occupancy_status: 'Rented',
      status: 'Approved',
      address: 'G-12, Green View Colony',
      city: 'Metro City',
      state: 'State A',
      pincode: '400001',
      total_area: 5000,
      built_up_area: 4500,
      latitude: 28.6139,
      longitude: 77.2090,
      remarks: 'Warehouse verified.',
      created_at: new Date('2026-05-14').toISOString(),
      updated_at: new Date('2026-05-16').toISOString()
    },
    {
      id: 'prop_2',
      request_id: 'req_2',
      citizen_id: 'usr_citizen_2',
      collector_id: 'usr_collector_1',
      ward_id: 'ward_1',
      ulb: 'Municipal Corporation Zone 1',
      property_number: 'PROP-2026-00001',
      owner_name: 'Priya Patel',
      owner_phone: '9123456789',
      owner_photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
      aadhaar_url: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=400',
      property_type: 'Residential',
      usage_type: 'Self Occupied',
      construction_type: 'RCC Framed Structure',
      number_of_floors: 2,
      construction_year: 2020,
      occupancy_status: 'Owner Occupied',
      status: 'Approved',
      address: 'Penthouse B, Sky View Towers',
      city: 'Metro City',
      state: 'State A',
      pincode: '400001',
      total_area: 3200,
      built_up_area: 2400,
      latitude: 19.0760,
      longitude: 72.8777,
      remarks: 'Survey completed physically.',
      created_at: new Date('2026-05-16').toISOString(),
      updated_at: new Date('2026-05-17').toISOString()
    }
  ],
  property_photos: [
    {
      id: 'pic_2_1',
      property_id: 'prop_2',
      photo_url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=400',
      created_at: new Date('2026-05-16').toISOString()
    }
  ],
  property_documents: [],
  property_transfers: [],
  tax_templates: [
    { id: 'tpl_1', property_type: 'Residential', default_amount: 2000 },
    { id: 'tpl_2', property_type: 'Commercial', default_amount: 5000 },
    { id: 'tpl_3', property_type: 'Industrial', default_amount: 10000 },
    { id: 'tpl_4', property_type: 'Mixed Use', default_amount: 7500 }
  ],
  tax_records: [
    {
      id: 'tax_5_1',
      property_id: 'prop_5',
      financial_year: '2025-26',
      tax_amount: 2000,
      penalty: 0,
      final_amount: 2000,
      due_date: '2026-09-30',
      status: 'Pending',
      created_at: new Date('2026-05-20').toISOString(),
      updated_at: new Date('2026-05-20').toISOString()
    },
    {
      id: 'tax_6_1',
      property_id: 'prop_6',
      financial_year: '2025-26',
      tax_amount: 10000,
      penalty: 500,
      final_amount: 10500,
      due_date: '2026-09-30',
      status: 'Pending',
      created_at: new Date('2026-05-20').toISOString(),
      updated_at: new Date('2026-05-20').toISOString()
    },
    {
      id: 'tax_2_1',
      property_id: 'prop_2',
      financial_year: '2024-25',
      tax_amount: 2000,
      penalty: 0,
      final_amount: 2000,
      due_date: '2025-03-31',
      status: 'Paid',
      created_at: new Date('2025-01-10').toISOString(),
      updated_at: new Date('2025-03-15').toISOString()
    },
    {
      id: 'tax_2_2',
      property_id: 'prop_2',
      financial_year: '2025-26',
      tax_amount: 2000,
      penalty: 150,
      final_amount: 2150,
      due_date: '2026-09-30',
      status: 'Pending',
      created_at: new Date('2026-05-20').toISOString(),
      updated_at: new Date('2026-05-20').toISOString()
    }
  ],
  payments: [
    {
      id: 'pay_6_1',
      tax_record_id: 'tax_6_1',
      tax_bill_number: 'TX-2025-PROP-00003',
      receipt_number: null,
      amount: 10500,
      payment_date: new Date('2026-06-21').toISOString(),
      payment_mode: 'UPI',
      transaction_id: 'TXN8829402100',
      proof_url: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=400',
      status: 'Pending Verification',
      rejection_reason: null,
      created_at: new Date('2026-06-21').toISOString()
    },
    {
      id: 'pay_2_1',
      tax_record_id: 'tax_2_1',
      tax_bill_number: 'TX-2024-0019',
      receipt_number: 'RCT-2026-000001',
      amount: 2000,
      payment_date: new Date('2025-03-15').toISOString(),
      payment_mode: 'UPI',
      transaction_id: 'TXN9042810948',
      proof_url: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=400',
      status: 'Verified',
      rejection_reason: null,
      created_at: new Date('2025-03-15').toISOString()
    }
  ],
  tax_notices: [
    {
      id: 'ntc_1',
      property_id: 'prop_2',
      notice_type: 'Tax Due Soon',
      message: 'Tax record of ₹2,150 for Financial Year 2025-26 is due on 2026-09-30.',
      is_active: true,
      created_at: new Date('2026-05-20').toISOString()
    },
    {
      id: 'ntc_5_1',
      property_id: 'prop_5',
      notice_type: 'Tax Due Soon',
      message: 'Property tax of ₹2,000 for FY 2025-26 is outstanding on property PROP-2026-00002.',
      is_active: true,
      created_at: new Date('2026-05-20').toISOString()
    }
  ],
  notifications: [
    {
      id: 'not_1',
      user_id: 'usr_citizen_2',
      title: 'Tax Bill Generated',
      message: 'New tax of ₹2,150 generated for FY 2025-26 on property PROP-2026-00001.',
      is_read: false,
      created_at: new Date('2026-05-20').toISOString()
    }
  ],
  audit_logs: [
    {
      id: 'aud_1',
      action: 'SUBMIT_REGISTRATION',
      table_name: 'citizen_requests',
      record_id: 'req_2',
      performed_by: 'usr_citizen_2',
      old_values: null,
      new_values: { full_name: 'Priya Patel', status: 'pending_admin_review' },
      timestamp: new Date('2026-05-15T10:00:00Z').toISOString()
    },
    {
      id: 'aud_2',
      action: 'ASSIGN_COLLECTOR',
      table_name: 'citizen_requests',
      record_id: 'req_2',
      performed_by: 'usr_admin_1',
      old_values: { status: 'pending_admin_review' },
      new_values: { status: 'assigned_to_collector', collector_id: 'usr_collector_1' },
      timestamp: new Date('2026-05-15T14:30:00Z').toISOString()
    }
  ]
};

// Counter keys in localStorage
const PROP_SEQ_KEY = STORAGE_PREFIX + '_prop_seq';
const RCT_SEQ_KEY = STORAGE_PREFIX + '_rct_seq';

const getNextSequenceValue = (seqKey) => {
  const current = localStorage.getItem(seqKey);
  const nextVal = current ? parseInt(current, 10) + 1 : 1;
  localStorage.setItem(seqKey, nextVal.toString());
  return nextVal;
};

// Standard CRUD utils
const getMockTable = (tableName) => {
  const key = STORAGE_PREFIX + tableName;
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(SEED_DATA[tableName] || []));
    return SEED_DATA[tableName] || [];
  }
  return JSON.parse(data);
};

const saveMockTable = (tableName, data) => {
  localStorage.setItem(STORAGE_PREFIX + tableName, JSON.stringify(data));
};

const logAudit = (action, tableName, recordId, performedBy, oldValues = null, newValues = null) => {
  const logs = getMockTable('audit_logs');
  const newLog = {
    id: 'aud_' + Math.random().toString(36).substr(2, 9),
    action,
    table_name: tableName,
    record_id: recordId,
    performed_by: performedBy || 'system',
    old_values: oldValues,
    new_values: newValues,
    timestamp: new Date().toISOString()
  };
  logs.unshift(newLog);
  saveMockTable('audit_logs', logs);
};

// -------------------------------------------------------------
// Mock Supabase Adapter Implementation
// -------------------------------------------------------------
const mockSupabase = {
  auth: {
    signUp: async ({ email, password, options }) => {
      const users = getMockTable('users');
      
      const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (emailExists) {
        return { data: null, error: { message: 'User with this email already exists.' } };
      }

      const userId = 'usr_' + Math.random().toString(36).substr(2, 9);
      const fullName = options?.data?.full_name || 'Citizen User';
      const mobileNumber = options?.data?.mobile_number || '';
      const role = options?.data?.role || 'citizen';
      
      const newUser = {
        id: userId,
        full_name: fullName,
        email,
        mobile_number: mobileNumber,
        role,
        status: 'active',
        rejection_reason: null,
        created_at: new Date().toISOString()
      };
      
      users.push(newUser);
      saveMockTable('users', users);

      if (role === 'citizen') {
        // Auto login for citizens
        sessionStorage.setItem('current_user_session', JSON.stringify(newUser));
        window.dispatchEvent(new CustomEvent('mock-auth-change', { detail: { event: 'SIGNED_IN', session: { user: newUser } } }));
      }
      return { data: { user: newUser }, error: null };
    },

    signInWithPassword: async ({ email, password }) => {
      const users = getMockTable('users');
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        return { data: null, error: { message: 'Invalid credentials.' } };
      }

      const expectedPassword = user.password || 'password';
      if (password !== expectedPassword) {
        return { data: null, error: { message: 'Incorrect password.' } };
      }

      sessionStorage.setItem('current_user_session', JSON.stringify(user));
      window.dispatchEvent(new CustomEvent('mock-auth-change', { detail: { event: 'SIGNED_IN', session: { user } } }));
      return { data: { user }, error: null };
    },

    signOut: async () => {
      sessionStorage.removeItem('current_user_session');
      window.dispatchEvent(new CustomEvent('mock-auth-change', { detail: { event: 'SIGNED_OUT', session: null } }));
      return { error: null };
    },

    getSession: async () => {
      const userStr = sessionStorage.getItem('current_user_session');
      if (userStr) {
        const user = JSON.parse(userStr);
        return { data: { session: { user } }, error: null };
      }
      return { data: { session: null }, error: null };
    },

    onAuthStateChange: (callback) => {
      // Setup a window listener to notify on auth state changes
      const handleAuthEvent = (e) => {
        const { event, session } = e.detail;
        callback(event, session);
      };
      
      window.addEventListener('mock-auth-change', handleAuthEvent);

      // Trigger initial call if session already exists
      const userStr = sessionStorage.getItem('current_user_session');
      if (userStr) {
        const user = JSON.parse(userStr);
        callback('INITIAL_SESSION', { user });
      }

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              window.removeEventListener('mock-auth-change', handleAuthEvent);
            }
          }
        }
      };
    }
  },

  storage: {
    from: () => ({
      upload: async (path, file) => {
        // Return a mock URL
        return { data: { path, fullPath: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=400' }, error: null };
      },
      getPublicUrl: (path) => ({
        data: { publicUrl: path.startsWith('http') ? path : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=400' }
      })
    })
  },

  from: (tableName) => {
    let list = getMockTable(tableName);

    const query = {
      data: list,
      error: null,
      filters: [],
      sorting: null,
      rangeLimit: null,

      select: function(fields = '*') {
        return this;
      },

      eq: function(column, value) {
        this.filters.push((row) => row[column] === value);
        return this;
      },

      match: function(queryObj) {
        this.filters.push((row) => {
          return Object.entries(queryObj).every(([col, val]) => row[col] === val);
        });
        return this;
      },

      order: function(column, { ascending = true } = {}) {
        this.sorting = { column, ascending };
        return this;
      },

      limit: function(count) {
        this.rangeLimit = count;
        return this;
      },

      insert: async function(rows) {
        const tableData = getMockTable(tableName);
        const rowsArray = Array.isArray(rows) ? rows : [rows];
        const userSession = JSON.parse(sessionStorage.getItem('current_user_session') || '{}');

        const processedRows = rowsArray.map(r => {
          const newRow = {
            id: r.id || (tableName + '_' + Math.random().toString(36).substr(2, 9)),
            created_at: new Date().toISOString(),
            ...r
          };
          
          // Custom triggers for insert
          if (tableName === 'property_transfers') {
            // Log transfer creation
            logAudit('INITIATE_TRANSFER', tableName, newRow.id, userSession.id, null, newRow);
          } else {
            logAudit(`INSERT_${tableName.toUpperCase()}`, tableName, newRow.id, userSession.id, null, newRow);
          }
          
          tableData.push(newRow);
          return newRow;
        });

        saveMockTable(tableName, tableData);
        return { data: processedRows, error: null };
      },

      update: async function(fields) {
        const tableData = getMockTable(tableName);
        const userSession = JSON.parse(sessionStorage.getItem('current_user_session') || '{}');
        let updatedRows = [];

        const updatedTable = tableData.map(row => {
          const matches = this.filters.every(filter => filter(row));
          if (matches) {
            const oldVal = { ...row };
            const newVal = { ...row, ...fields, updated_at: new Date().toISOString() };
            updatedRows.push(newVal);

            // Custom workflows triggered by update
            if (tableName === 'citizen_requests' && fields.status) {
              logAudit(`REQUEST_${fields.status.toUpperCase()}`, tableName, row.id, userSession.id, oldVal, newVal);
              
              if (fields.status === 'assigned_to_collector') {
                // Emulate: Create a property record with status 'Assigned To Collector'
                const properties = getMockTable('properties');
                const newProperty = {
                  id: 'prop_' + Math.random().toString(36).substr(2, 9),
                  request_id: row.id,
                  citizen_id: row.citizen_id,
                  collector_id: fields.collector_id,
                  ward_id: fields.ward_id || 'ward_1', // default or selected ward
                  ulb: 'Municipal Corporation Zone A',
                  owner_name: row.full_name,
                  owner_phone: row.mobile_number,
                  property_type: 'Residential', // default, to be selected during survey
                  usage_type: '',
                  construction_type: '',
                  number_of_floors: 0,
                  construction_year: 2026,
                  occupancy_status: 'Owner Occupied',
                  status: 'Assigned To Collector',
                  address: row.address,
                  city: 'Metro City',
                  state: 'State A',
                  pincode: '400001',
                  total_area: 0,
                  built_up_area: 0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                properties.push(newProperty);
                saveMockTable('properties', properties);
                logAudit('CREATE_SURVEY_RECORD', 'properties', newProperty.id, userSession.id, null, newProperty);
              }
              
              if (fields.status === 'rejected') {
                // Reject citizen user
                const users = getMockTable('users');
                const userIdx = users.findIndex(u => u.id === row.citizen_id);
                if (userIdx !== -1) {
                  users[userIdx].status = 'rejected';
                  users[userIdx].rejection_reason = fields.rejection_reason || 'Rejected by Admin';
                  saveMockTable('users', users);
                }
              }
            } else if (tableName === 'properties' && fields.status) {
              logAudit(`PROPERTY_${fields.status.toUpperCase()}`, tableName, row.id, userSession.id, oldVal, newVal);

              // On Admin Approval: Assign Sequence Property Number + Activate Citizen + Generate default tax bill
              if (fields.status === 'Approved' && !row.property_number) {
                const nextSeq = getNextSequenceValue(PROP_SEQ_KEY);
                newVal.property_number = `PROP-2026-${nextSeq.toString().padStart(5, '0')}`;
                newVal.status = 'Approved';
                
                // 1. Activate Citizen User account
                const users = getMockTable('users');
                const userIdx = users.findIndex(u => u.id === row.citizen_id);
                if (userIdx !== -1) {
                  users[userIdx].status = 'active';
                  saveMockTable('users', users);
                }

                // 2. Generate Default Tax Record based on template
                const templates = getMockTable('tax_templates');
                const template = templates.find(t => t.property_type === newVal.property_type);
                const defaultAmount = template ? template.default_amount : 2000;

                const taxRecords = getMockTable('tax_records');
                const newTax = {
                  id: 'tax_' + Math.random().toString(36).substr(2, 9),
                  property_id: row.id,
                  financial_year: '2025-26',
                  tax_amount: defaultAmount,
                  penalty: 0,
                  final_amount: defaultAmount,
                  due_date: '2026-09-30',
                  status: 'Pending',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                taxRecords.push(newTax);
                saveMockTable('tax_records', taxRecords);

                // 3. Create Notice alert
                const notices = getMockTable('tax_notices');
                notices.push({
                  id: 'ntc_' + Math.random().toString(36).substr(2, 9),
                  property_id: row.id,
                  notice_type: 'Tax Due Soon',
                  message: `Default tax of ₹${defaultAmount} generated for FY 2025-26 on property ${newVal.property_number}. Due date: 2026-09-30.`,
                  is_active: true,
                  created_at: new Date().toISOString()
                });
                saveMockTable('tax_notices', notices);

                // 4. Send Notification
                const notifications = getMockTable('notifications');
                notifications.push({
                  id: 'not_' + Math.random().toString(36).substr(2, 9),
                  user_id: row.citizen_id,
                  title: 'Property Approved & Activated',
                  message: `Your property request has been approved! Property Number: ${newVal.property_number}. Tax Bill generated for FY 2025-26.`,
                  is_read: false,
                  created_at: new Date().toISOString()
                });
                saveMockTable('notifications', notifications);
              }
            } else if (tableName === 'property_transfers' && fields.status) {
              logAudit(`TRANSFER_${fields.status.toUpperCase()}`, tableName, row.id, userSession.id, oldVal, newVal);
              
              if (fields.status === 'approved') {
                // Swap owner on the property
                const properties = getMockTable('properties');
                const propIdx = properties.findIndex(p => p.id === row.property_id);
                if (propIdx !== -1) {
                  const oldProp = { ...properties[propIdx] };
                  properties[propIdx].citizen_id = row.new_owner_id;
                  
                  // Query new owner name
                  const users = getMockTable('users');
                  const newOwner = users.find(u => u.id === row.new_owner_id);
                  if (newOwner) {
                    properties[propIdx].owner_name = newOwner.full_name;
                    properties[propIdx].owner_phone = newOwner.mobile_number;
                  }
                  
                  saveMockTable('properties', properties);
                  logAudit('EXECUTE_TRANSFER_OWNERSHIP', 'properties', row.property_id, userSession.id, oldProp, properties[propIdx]);

                  // Notify both citizens
                  const notifications = getMockTable('notifications');
                  notifications.push(
                    {
                      id: 'not_tr_1_' + Math.random().toString(36).substr(2, 9),
                      user_id: row.previous_owner_id,
                      title: 'Ownership Transferred',
                      message: `Ownership of your property (No: ${oldProp.property_number}) has been transferred successfully.`,
                      is_read: false,
                      created_at: new Date().toISOString()
                    },
                    {
                      id: 'not_tr_2_' + Math.random().toString(36).substr(2, 9),
                      user_id: row.new_owner_id,
                      title: 'New Property Received',
                      message: `Property (No: ${oldProp.property_number}) has been transferred to your ownership.`,
                      is_read: false,
                      created_at: new Date().toISOString()
                    }
                  );
                  saveMockTable('notifications', notifications);
                }
              }
            } else if (tableName === 'payments' && fields.status) {
              logAudit(`PAYMENT_${fields.status.toUpperCase()}`, tableName, row.id, userSession.id, oldVal, newVal);

              if (fields.status === 'Verified') {
                // Generate RCT sequence
                const nextRctSeq = getNextSequenceValue(RCT_SEQ_KEY);
                newVal.receipt_number = `RCT-2026-${nextRctSeq.toString().padStart(6, '0')}`;

                // Update tax record status to 'Paid'
                const taxRecords = getMockTable('tax_records');
                const taxIdx = taxRecords.findIndex(t => t.id === row.tax_record_id);
                if (taxIdx !== -1) {
                  taxRecords[taxIdx].status = 'Paid';
                  saveMockTable('tax_records', taxRecords);

                  // Update active notices
                  const notices = getMockTable('tax_notices');
                  const activeNoticeIdx = notices.findIndex(n => n.property_id === taxRecords[taxIdx].property_id && n.is_active);
                  if (activeNoticeIdx !== -1) {
                    notices[activeNoticeIdx].is_active = false;
                    saveMockTable('tax_notices', notices);
                  }

                  // Find property to notify citizen
                  const properties = getMockTable('properties');
                  const prop = properties.find(p => p.id === taxRecords[taxIdx].property_id);
                  if (prop) {
                    const notifications = getMockTable('notifications');
                    notifications.push({
                      id: 'not_p_' + Math.random().toString(36).substr(2, 9),
                      user_id: prop.citizen_id,
                      title: 'Tax Payment Verified',
                      message: `Your payment of ₹${row.amount} for FY ${taxRecords[taxIdx].financial_year} has been verified. Receipt: ${newVal.receipt_number}.`,
                      is_read: false,
                      created_at: new Date().toISOString()
                    });
                    saveMockTable('notifications', notifications);
                  }
                }
              }
            } else {
              logAudit(`UPDATE_${tableName.toUpperCase()}`, tableName, row.id, userSession.id, oldVal, newVal);
            }

            return newVal;
          }
          return row;
        });

        saveMockTable(tableName, updatedTable);
        return { data: updatedRows, error: null };
      },

      delete: async function() {
        const tableData = getMockTable(tableName);
        const userSession = JSON.parse(sessionStorage.getItem('current_user_session') || '{}');
        
        const filteredOut = [];
        const remaining = tableData.filter(row => {
          const matches = this.filters.every(filter => filter(row));
          if (matches) {
            filteredOut.push(row);
            logAudit(`DELETE_${tableName.toUpperCase()}`, tableName, row.id, userSession.id, row, null);
            return false;
          }
          return true;
        });

        saveMockTable(tableName, remaining);
        return { data: filteredOut, error: null };
      },

      then: function(onfulfilled) {
        let result = this.data.filter(row => {
          return this.filters.every(filter => filter(row));
        });

        if (this.sorting) {
          const { column, ascending } = this.sorting;
          result.sort((a, b) => {
            const valA = a[column];
            const valB = b[column];
            if (valA < valB) return ascending ? -1 : 1;
            if (valA > valB) return ascending ? 1 : -1;
            return 0;
          });
        }

        if (this.rangeLimit !== null) {
          result = result.slice(0, this.rangeLimit);
        }

        return Promise.resolve(onfulfilled({ data: result, error: null }));
      }
    };

    return query;
  }
};

export const supabase = isMock ? mockSupabase : realSupabase;
export const usingMockData = isMock;
export { mockSupabase };

export const signUpWithoutSessionSwitch = async ({ email, password, options }) => {
  if (isMock) {
    return mockSupabase.auth.signUp({ email, password, options });
  }
  const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
  return tempClient.auth.signUp({ email, password, options });
};

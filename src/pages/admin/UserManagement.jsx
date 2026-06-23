import React, { useState, useEffect } from 'react';
import { supabase, signUpWithoutSessionSwitch } from '../../lib/supabase';
import { toast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  ShieldAlert, 
  Mail, 
  Phone,
  User,
  Shield,
  Filter,
  CheckCircle,
  AlertCircle,
  XCircle,
  UserCheck
} from 'lucide-react';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtering states
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal States
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userForm, setUserForm] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    password: 'password123',
    role: 'citizen',
    status: 'active'
  });

  const [saving, setSaving] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    collectors: 0,
    citizens: 0
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setUsers(data);
        
        // Calculate Stats
        const total = data.length;
        const admins = data.filter(u => u.role === 'admin').length;
        const collectors = data.filter(u => u.role === 'collector').length;
        const citizens = data.filter(u => u.role === 'citizen').length;
        setStats({ total, admins, collectors, citizens });
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Failed to load user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter application logic
  useEffect(() => {
    let result = users;

    // Search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(u => 
        u.full_name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.mobile_number?.includes(term)
      );
    }

    // Role filter
    if (selectedRole !== 'all') {
      result = result.filter(u => u.role === selectedRole);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      result = result.filter(u => u.status === selectedStatus);
    }

    setFilteredUsers(result);
  }, [users, searchTerm, selectedRole, selectedStatus]);

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    const { fullName, email, mobileNumber, password, role, status } = userForm;

    if (!fullName.trim() || !email.trim() || !mobileNumber.trim() || (!selectedUser && !password)) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setSaving(true);
    try {
      if (selectedUser) {
        // EDIT MODE
        // 1. Update in public.users table
        const { error: userError } = await supabase
          .from('users')
          .update({
            full_name: fullName.trim(),
            mobile_number: mobileNumber.trim(),
            role,
            status,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedUser.id);

        if (userError) throw userError;

        toast.success('User updated successfully!');
      } else {
        // CREATE MODE
        // 1. Sign up the user via mock/real signup helper
        const { data, error } = await signUpWithoutSessionSwitch({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              mobile_number: mobileNumber.trim(),
              role: role
            }
          }
        });

        if (error) throw error;
        const newUserId = data.user.id;

        // 2. Update status in users table (since it defaults to pending)
        const { error: statusError } = await supabase
          .from('users')
          .update({ status: status })
          .eq('id', newUserId);

        if (statusError) throw statusError;

        toast.success(`Account for ${fullName} created successfully.`);
      }

      setIsUserModalOpen(false);
      setSelectedUser(null);
      setUserForm({
        fullName: '',
        email: '',
        mobileNumber: '',
        password: 'password123',
        role: 'citizen',
        status: 'active'
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Operation failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (usr) => {
    setSelectedUser(usr);
    setUserForm({
      fullName: usr.full_name,
      email: usr.email,
      mobileNumber: usr.mobile_number,
      password: '', // Empty password during edit
      role: usr.role,
      status: usr.status
    });
    setIsUserModalOpen(true);
  };

  const handleToggleStatus = async (usr) => {
    const nextStatus = usr.status === 'active' ? 'inactive' : 'active';
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: nextStatus })
        .eq('id', usr.id);

      if (error) throw error;
      toast.success(`Account marked ${nextStatus}.`);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to update status.');
    }
  };

  const handleDeleteUser = async (usr) => {
    if (usr.id === currentUser?.id) {
      toast.error('You cannot delete your own logged-in account.');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete user "${usr.full_name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', usr.id);

      if (error) throw error;
      toast.success('User deleted successfully.');
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to delete user.');
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> User Account Management
          </h2>
          <p className="text-sm text-muted-foreground">Monitor system access, configure administrative roles, and create new portal accounts.</p>
        </div>
        <button
          onClick={() => {
            setSelectedUser(null);
            setUserForm({
              fullName: '',
              email: '',
              mobileNumber: '',
              password: 'password123',
              role: 'citizen',
              status: 'active'
            });
            setIsUserModalOpen(true);
          }}
          className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 shadow-md shadow-primary/10 self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4" /> Create User Account
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total Users</span>
            <h3 className="text-xl font-bold text-foreground mt-0.5">{stats.total}</h3>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Administrators</span>
            <h3 className="text-xl font-bold text-foreground mt-0.5">{stats.admins}</h3>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-500">
            <Shield className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Field Collectors</span>
            <h3 className="text-xl font-bold text-foreground mt-0.5">{stats.collectors}</h3>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Registered Citizens</span>
            <h3 className="text-xl font-bold text-foreground mt-0.5">{stats.citizens}</h3>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500">
            <User className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filters and Search Panel */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute inset-y-0 left-3 my-auto h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-input rounded-lg text-xs bg-background focus:border-primary outline-none"
            />
          </div>

          {/* Clean filters title */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Filters
          </div>
        </div>

        {/* Filter Buttons Segment */}
        <div className="flex flex-col gap-3 pt-2 border-t border-border/50 sm:flex-row sm:items-center justify-between">
          {/* Filter by Role */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mr-1">Role:</span>
            {[
              { id: 'all', label: 'All Roles' },
              { id: 'admin', label: 'Admins' },
              { id: 'collector', label: 'Collectors' },
              { id: 'citizen', label: 'Citizens' }
            ].map(role => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`px-3 py-1.5 text-[10px] font-semibold rounded-full border transition-all ${
                  selectedRole === role.id 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-background hover:bg-muted text-muted-foreground border-input'
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>

          {/* Filter by Status */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mr-1">Status:</span>
            {[
              { id: 'all', label: 'All Status' },
              { id: 'active', label: 'Active' },
              { id: 'pending', label: 'Pending' },
              { id: 'inactive', label: 'Inactive' },
              { id: 'rejected', label: 'Rejected' }
            ].map(status => (
              <button
                key={status.id}
                onClick={() => setSelectedStatus(status.id)}
                className={`px-3 py-1.5 text-[10px] font-semibold rounded-full border transition-all ${
                  selectedStatus === status.id 
                    ? 'bg-indigo-600 text-white border-indigo-600' 
                    : 'bg-background hover:bg-muted text-muted-foreground border-input'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Directory Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-muted/40 font-semibold text-muted-foreground border-b border-border">
              <tr>
                <th className="p-4">User Details</th>
                <th className="p-4">Contact Phone</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4">Account Status</th>
                <th className="p-4">Created Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span>Loading accounts registry...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-muted-foreground font-medium">
                    No accounts found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((usr) => (
                  <tr key={usr.id} className="hover:bg-muted/10">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center uppercase">
                          {usr.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{usr.full_name}</div>
                          <div className="text-[10px] text-muted-foreground">{usr.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground font-medium">{usr.mobile_number || 'N/A'}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        usr.role === 'admin' 
                          ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400' 
                          : usr.role === 'collector' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' 
                            : 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400'
                      }`}>
                        {usr.role === 'admin' && <Shield className="h-2.5 w-2.5" />}
                        {usr.role === 'collector' && <UserCheck className="h-2.5 w-2.5" />}
                        {usr.role === 'citizen' && <User className="h-2.5 w-2.5" />}
                        {usr.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded ${
                        usr.status === 'active'
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                          : usr.status === 'pending'
                            ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
                            : usr.status === 'inactive'
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                              : 'bg-destructive/10 text-destructive'
                      }`}>
                        {usr.status === 'active' && <CheckCircle className="h-2.5 w-2.5" />}
                        {usr.status === 'pending' && <AlertCircle className="h-2.5 w-2.5" />}
                        {usr.status === 'inactive' && <XCircle className="h-2.5 w-2.5" />}
                        {usr.status === 'rejected' && <ShieldAlert className="h-2.5 w-2.5" />}
                        {usr.status}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">{new Date(usr.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Toggle active / inactive */}
                        <button
                          onClick={() => handleToggleStatus(usr)}
                          title={usr.status === 'active' ? 'Deactivate User' : 'Activate User'}
                          className={`p-1.5 border rounded hover:bg-muted transition-colors ${
                            usr.status === 'active' ? 'text-amber-500 border-amber-200' : 'text-emerald-500 border-emerald-200'
                          }`}
                        >
                          {usr.status === 'active' ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                        </button>

                        {/* Edit details */}
                        <button
                          onClick={() => handleEditClick(usr)}
                          title="Edit Account Details"
                          className="p-1.5 border border-border rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete account */}
                        <button
                          onClick={() => handleDeleteUser(usr)}
                          title="Permanently Delete Account"
                          className="p-1.5 border border-destructive/20 text-destructive rounded hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal (Create/Edit) */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={selectedUser ? 'Edit User Account Details' : 'Create New Portal Account'}
      >
        <form onSubmit={handleUserSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Full Name *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  required
                  value={userForm.fullName}
                  onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
                  placeholder="e.g. Anand Kumar"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Mobile Number *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="tel"
                  required
                  value={userForm.mobileNumber}
                  onChange={(e) => setUserForm({ ...userForm, mobileNumber: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
                  placeholder="e.g. 9876543210"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Email Address *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="email"
                  required
                  disabled={!!selectedUser}
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary disabled:opacity-50 disabled:bg-muted"
                  placeholder="e.g. anand@gmail.com"
                />
              </div>
            </div>

            {/* Password (Only creation) */}
            {!selectedUser && (
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                  Access Password *
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    type="password"
                    required
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
                    placeholder="Set temporary password"
                  />
                </div>
              </div>
            )}

            {/* Role Selector */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Assign System Role *
              </label>
              <select
                required
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary text-foreground font-semibold"
              >
                <option value="citizen">Citizen (Taxpayer)</option>
                <option value="collector">Collector (Field Auditor)</option>
                <option value="admin">Admin (Full Control)</option>
              </select>
            </div>

            {/* Status Selector */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Account Status *
              </label>
              <select
                required
                value={userForm.status}
                onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary text-foreground font-semibold"
              >
                <option value="active">Active (Verified)</option>
                <option value="pending">Pending Verification</option>
                <option value="inactive">Inactive (Suspended)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
            <button
              type="button"
              onClick={() => setIsUserModalOpen(false)}
              className="px-4 py-2 border border-input text-xs rounded-lg hover:bg-muted font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 font-semibold transition-opacity disabled:opacity-50"
            >
              {saving ? 'Processing...' : selectedUser ? 'Save Changes' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;

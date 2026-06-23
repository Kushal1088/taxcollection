import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase, signUpWithoutSessionSwitch } from '../../lib/supabase';
import { toast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import { 
  Users, 
  Map, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  ShieldAlert, 
  MapPin, 
  Lock, 
  Mail, 
  Phone,
  User
} from 'lucide-react';


const CollectorManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('collectors');
  
  // Sync tab with URL search parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'wards') {
      setActiveTab('wards');
    } else {
      setActiveTab('collectors');
    }
  }, [location.search]);
  
  // States for Wards
  const [wards, setWards] = useState([]);
  const [newWardName, setNewWardName] = useState('');
  
  // States for Collectors
  const [collectors, setCollectors] = useState([]);
  const [selectedCollector, setSelectedCollector] = useState(null);
  
  // Form Modals
  const [isCollectorModalOpen, setIsCollectorModalOpen] = useState(false);
  const [collectorForm, setCollectorForm] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    wardId: '',
    area: '',
    password: 'password' // Default password for new collectors
  });

  const fetchData = async () => {
    try {
      // 1. Fetch Wards
      const { data: wardList } = await supabase.from('wards').select('*');
      if (wardList) setWards(wardList);

      // 2. Fetch Users (role = collector)
      const { data: userList } = await supabase.from('users').select('*').eq('role', 'collector');
      
      // 3. Fetch Collector details
      const { data: colDetails } = await supabase.from('collectors').select('*');

      if (userList) {
        // Merge details
        const merged = userList.map(usr => {
          const detail = colDetails?.find(c => c.id === usr.id) || {};
          const ward = wardList?.find(w => w.id === detail.ward_id);
          return {
            ...usr,
            ward_id: detail.ward_id || '',
            ward_name: ward ? ward.name : 'Unassigned',
            area: detail.area || 'N/A'
          };
        });
        setCollectors(merged);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // -------------------------------------------------------------
  // WARD CRUD METHODS
  // -------------------------------------------------------------
  const handleAddWard = async (e) => {
    e.preventDefault();
    if (!newWardName.trim()) {
      toast.error('Ward name cannot be empty.');
      return;
    }
    
    // Check duplication
    if (wards.some(w => w.name.toLowerCase() === newWardName.trim().toLowerCase())) {
      toast.error('Ward with this name already exists.');
      return;
    }

    const { data, error } = await supabase.from('wards').insert({ name: newWardName.trim() });
    if (error) {
      toast.error(error.message || 'Failed to add ward.');
    } else {
      toast.success('New Ward created successfully.');
      setNewWardName('');
      fetchData();
    }
  };

  const handleDeleteWard = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This could affect collectors and properties associated with this ward.`)) {
      return;
    }

    const { error } = await supabase.from('wards').delete().eq('id', id);
    if (error) {
      toast.error(error.message || 'Failed to delete ward.');
    } else {
      toast.success('Ward deleted successfully.');
      fetchData();
    }
  };

  // -------------------------------------------------------------
  // COLLECTOR CRUD METHODS
  // -------------------------------------------------------------
  const handleCollectorSubmit = async (e) => {
    e.preventDefault();
    const { fullName, email, mobileNumber, wardId, area, password } = collectorForm;

    if (!fullName || !email || !mobileNumber || !wardId || !area) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      if (selectedCollector) {
        // EDIT MODE
        // 1. Update public.users record
        const { error: userError } = await supabase.from('users').update({
          full_name: fullName,
          mobile_number: mobileNumber,
        }).eq('id', selectedCollector.id);
        if (userError) throw userError;

        // 2. Update collectors record
        const { error: collError } = await supabase.from('collectors').update({
          ward_id: wardId,
          area
        }).eq('id', selectedCollector.id);
        if (collError) throw collError;

        toast.success('Collector details updated.');
      } else {
        // ADD MODE
        // In actual Supabase, creating an auth account must be done via Admin API.
        // In our mock, auth.signUp with metadata does it.
        const { data, error } = await signUpWithoutSessionSwitch({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              mobile_number: mobileNumber,
              role: 'collector'
            }
          }
        });

        if (error) throw error;
        
        const newUserId = data.user.id;

        // Insert collector specifics
        const { error: collError } = await supabase.from('collectors').insert({
          id: newUserId,
          ward_id: wardId,
          area
        });
        if (collError) throw collError;

        // Set status to active automatically
        const { error: userError } = await supabase.from('users').update({ status: 'active' }).eq('id', newUserId);
        if (userError) throw userError;

        toast.success('Collector account created successfully.');
      }

      setIsCollectorModalOpen(false);
      setSelectedCollector(null);
      setCollectorForm({ fullName: '', email: '', mobileNumber: '', wardId: '', area: '', password: 'password' });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Operation failed.');
    }
  };

  const handleEditCollector = (col) => {
    setSelectedCollector(col);
    setCollectorForm({
      fullName: col.full_name,
      email: col.email,
      mobileNumber: col.mobile_number,
      wardId: col.ward_id,
      area: col.area,
      password: '' // No need to edit password here
    });
    setIsCollectorModalOpen(true);
  };

  const handleToggleCollectorStatus = async (col) => {
    const nextStatus = col.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('users').update({ status: nextStatus }).eq('id', col.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Collector account marked ${nextStatus}.`);
      fetchData();
    }
  };

  const handleDeleteCollector = async (col) => {
    if (!window.confirm(`Are you sure you want to permanently delete Collector ${col.full_name}?`)) {
      return;
    }

    const { error } = await supabase.from('users').delete().eq('id', col.id);
    if (error) {
      toast.error(error.message || 'Failed to delete collector.');
    } else {
      toast.success('Collector deleted successfully.');
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {activeTab === 'wards' ? 'Ward Management' : 'Collector Management'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {activeTab === 'wards' 
              ? 'Manage administrative zones and geographic areas.' 
              : 'Manage and monitor field collection officers.'}
          </p>
        </div>
      </div>

      {/* Tab: Collectors */}
      {activeTab === 'collectors' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-card p-4 rounded-lg border border-border">
            <span className="text-sm font-semibold text-muted-foreground">{collectors.length} Field Officers</span>
            <button
              onClick={() => {
                setSelectedCollector(null);
                setCollectorForm({ fullName: '', email: '', mobileNumber: '', wardId: '', area: '', password: 'password' });
                setIsCollectorModalOpen(true);
              }}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 shadow-md shadow-primary/15"
            >
              <Plus className="h-4 w-4" /> Add Collector
            </button>
          </div>

          {/* Collectors Grid Cards */}
          {collectors.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
              No collectors added yet. Create a collector above.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {collectors.map((col) => {
                const colAvatar = localStorage.getItem(`avatar_${col.id}`);
                return (
                  <div key={col.id} className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between space-y-4">
                    {/* Header info */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {colAvatar ? (
                          <img 
                            src={colAvatar} 
                            alt={col.full_name} 
                            className="h-12 w-12 rounded-full object-cover border border-primary/20"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg uppercase">
                            {col.full_name?.charAt(0) || 'C'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-foreground truncate">{col.full_name}</h4>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold mt-1 ${
                            col.status === 'active' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                          }`}>
                            {col.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Details section */}
                    <div className="space-y-2.5 text-xs border-t border-border pt-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 text-primary/70 flex-shrink-0" />
                        <span className="truncate text-foreground font-medium">{col.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 text-primary/70 flex-shrink-0" />
                        <span className="text-foreground font-medium">{col.mobile_number}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary/70 flex-shrink-0" />
                        <span className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400">
                          {col.ward_name}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <span className="text-[10px] uppercase tracking-wide font-bold text-primary/70 flex-shrink-0 mt-0.5">Area:</span>
                        <span className="text-foreground font-medium leading-tight">{col.area}</span>
                      </div>
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center justify-between border-t border-border pt-3 mt-auto">
                      <span className="text-[10px] text-muted-foreground">Field Officer</span>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleCollectorStatus(col)}
                          title={col.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                          className={`p-1.5 border rounded hover:bg-muted transition-colors ${
                            col.status === 'active' ? 'text-amber-500 border-amber-200' : 'text-emerald-500 border-emerald-200'
                          }`}
                        >
                          {col.status === 'active' ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleEditCollector(col)}
                          title="Edit Details"
                          className="p-1.5 border border-border rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCollector(col)}
                          title="Delete Collector"
                          className="p-1.5 border border-destructive/20 text-destructive rounded hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Wards */}
      {activeTab === 'wards' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add Ward Panel */}
          <div className="bg-card p-6 rounded-lg border border-border h-fit space-y-4">
            <h3 className="text-lg font-bold text-foreground">Create Administrative Ward</h3>
            <p className="text-xs text-muted-foreground">Wards segment geographical zones. Properties and collectors must associate with a specific ward.</p>
            <form onSubmit={handleAddWard} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Ward Name</label>
                <input
                  type="text"
                  required
                  value={newWardName}
                  onChange={(e) => setNewWardName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:border-primary outline-none"
                  placeholder="e.g. Ward 5"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 shadow-md shadow-primary/10"
              >
                <Plus className="h-4 w-4" /> Create Ward
              </button>
            </form>
          </div>

          {/* Wards List Grid */}
          <div className="md:col-span-2 overflow-hidden rounded-lg border border-border bg-card">
            <div className="bg-muted/40 p-4 border-b border-border font-semibold text-sm">
              Current Wards ({wards.length})
            </div>
            <div className="divide-y divide-border">
              {wards.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No wards created yet.</div>
              ) : (
                wards.map((w) => {
                  const wardCollectors = collectors.filter(c => c.ward_id === w.id);
                  return (
                    <div key={w.id} className="flex justify-between items-center p-4 hover:bg-muted/5">
                      <div className="space-y-0.5">
                        <span className="font-bold text-sm text-foreground">{w.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {wardCollectors.length} Collector(s) Assigned
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteWard(w.id, w.name)}
                        className="p-1.5 rounded-lg border border-destructive/10 text-destructive bg-destructive/5 hover:bg-destructive/10 hover:border-destructive/20 transition-all"
                        title="Delete Ward"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Collector Modal */}
      <Modal
        isOpen={isCollectorModalOpen}
        onClose={() => setIsCollectorModalOpen(false)}
        title={selectedCollector ? 'Edit Collector Details' : 'Add New Collector Account'}
      >
        <form onSubmit={handleCollectorSubmit} className="space-y-4">
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
                  value={collectorForm.fullName}
                  onChange={(e) => setCollectorForm({ ...collectorForm, fullName: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-input bg-background rounded-lg outline-none focus:border-primary"
                  placeholder="e.g. Rajesh Kumar"
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
                  value={collectorForm.mobileNumber}
                  onChange={(e) => setCollectorForm({ ...collectorForm, mobileNumber: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-input bg-background rounded-lg outline-none focus:border-primary"
                  placeholder="e.g. 9876543210"
                />
              </div>
            </div>

            {/* Email (Disabled in edit) */}
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Official Email Address *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="email"
                  required
                  disabled={!!selectedCollector}
                  value={collectorForm.email}
                  onChange={(e) => setCollectorForm({ ...collectorForm, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-input bg-background rounded-lg outline-none focus:border-primary disabled:opacity-50 disabled:bg-muted"
                  placeholder="e.g. rkumar@municipal.gov"
                />
              </div>
            </div>

            {/* Password (Only during creation) */}
            {!selectedCollector && (
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
                    value={collectorForm.password}
                    onChange={(e) => setCollectorForm({ ...collectorForm, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-input bg-background rounded-lg outline-none focus:border-primary"
                    placeholder="Set account password"
                  />
                </div>
              </div>
            )}

            {/* Ward Selector */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Assigned Ward Zone *
              </label>
              <select
                required
                value={collectorForm.wardId}
                onChange={(e) => setCollectorForm({ ...collectorForm, wardId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-input bg-background rounded-lg outline-none focus:border-primary"
              >
                <option value="">Select Ward</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            {/* Zone / Area Description */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Zone / Area Description *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  required
                  value={collectorForm.area}
                  onChange={(e) => setCollectorForm({ ...collectorForm, area: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-input bg-background rounded-lg outline-none focus:border-primary"
                  placeholder="e.g. Sector 4 East Division"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
            <button
              type="button"
              onClick={() => setIsCollectorModalOpen(false)}
              className="px-4 py-2 border border-input text-sm rounded-lg hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/95"
            >
              {selectedCollector ? 'Save Changes' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CollectorManagement;

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import { 
  FileText, 
  UserCheck, 
  XOctagon, 
  MapPin, 
  User, 
  FileSpreadsheet, 
  Phone, 
  Mail, 
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const CitizenRequests = () => {
  const [requests, setRequests] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assignment Modal States
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedWardId, setSelectedWardId] = useState('');
  const [selectedCollectorId, setSelectedCollectorId] = useState('');

  // Rejection Modal States
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('[CitizenRequests] Fetching data: requests, wards, collectors...');
      // 1. Fetch pending reviews
      const { data: reqList, error: reqError } = await supabase
        .from('citizen_requests')
        .select('*')
        .eq('status', 'pending_admin_review')
        .order('created_at', { ascending: false });
      
      if (reqError) {
        console.error('[CitizenRequests] Error fetching citizen requests:', reqError);
        throw reqError;
      }
      console.log('[CitizenRequests] Fetched requests count:', reqList?.length || 0);
      if (reqList) setRequests(reqList);

      // 2. Fetch Wards
      const { data: wardList, error: wardError } = await supabase.from('wards').select('*');
      if (wardError) {
        console.error('[CitizenRequests] Error fetching wards list:', wardError);
        throw wardError;
      }
      if (wardList) setWards(wardList);

      // 3. Fetch collectors mapping
      const { data: collUsers, error: collUsersError } = await supabase.from('users').select('*').eq('role', 'collector').eq('status', 'active');
      const { data: collSpecs, error: collSpecsError } = await supabase.from('collectors').select('*');
      
      if (collUsersError) {
        console.error('[CitizenRequests] Error fetching collector users:', collUsersError);
        throw collUsersError;
      }
      if (collSpecsError) {
        console.error('[CitizenRequests] Error fetching collector details:', collSpecsError);
        throw collSpecsError;
      }

      if (collUsers) {
        const mergedCollectors = collUsers.map(usr => {
          const spec = collSpecs?.find(s => s.id === usr.id) || {};
          return { ...usr, ward_id: spec.ward_id };
        });
        console.log('[CitizenRequests] Merged collectors mapping:', mergedCollectors);
        setCollectors(mergedCollectors);
      }
    } catch (err) {
      console.error('[CitizenRequests] Exception caught during fetchData:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter collectors based on selected ward in the modal
  const filteredCollectors = collectors.filter(c => c.ward_id === selectedWardId);

  const handleOpenAssignModal = (req) => {
    console.log('[CitizenRequests] Opening assign modal for request:', req);
    setSelectedRequest(req);
    setSelectedWardId('');
    setSelectedCollectorId('');
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWardId || !selectedCollectorId) {
      toast.error('Please select both Ward and Collector.');
      return;
    }

    try {
      console.log('[CitizenRequests] Submitting collector assignment. Request:', selectedRequest.id, 'Ward:', selectedWardId, 'Collector:', selectedCollectorId);
      // Update registration request status & assign collector
      const { error } = await supabase
        .from('citizen_requests')
        .update({
          status: 'assigned_to_collector',
          collector_id: selectedCollectorId,
          ward_id: selectedWardId
        })
        .eq('id', selectedRequest.id);

      if (error) {
        console.error('[CitizenRequests] Assignment query failed:', error);
        throw error;
      }

      console.log('[CitizenRequests] Assignment succeeded!');
      toast.success('Request approved & field collector assigned successfully!');
      setIsAssignModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('[CitizenRequests] Exception in assignment submission:', err);
      toast.error(err.message || 'Failed to update assignment.');
    }
  };

  const handleOpenRejectModal = (req) => {
    console.log('[CitizenRequests] Opening reject modal for request:', req);
    setSelectedRequest(req);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is mandatory.');
      return;
    }

    try {
      console.log('[CitizenRequests] Submitting rejection. Request:', selectedRequest.id, 'Reason:', rejectionReason);
      const { error } = await supabase
        .from('citizen_requests')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason.trim()
        })
        .eq('id', selectedRequest.id);

      if (error) {
        console.error('[CitizenRequests] Rejection query failed:', error);
        throw error;
      }

      console.log('[CitizenRequests] Rejection succeeded!');
      toast.warning('Citizen registration request rejected.');
      setIsRejectModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('[CitizenRequests] Exception in rejection submission:', err);
      toast.error(err.message || 'Failed to reject request.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Pending Citizen Requests</h2>
        <p className="text-sm text-muted-foreground">Review incoming registrations, allocate wards, and assign surveys.</p>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center bg-card rounded-lg border border-border">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading pending requests...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-card p-4 rounded-lg border border-border flex justify-between items-center text-sm font-semibold">
            <span className="text-muted-foreground">Awaiting Review: {requests.length} Application(s)</span>
          </div>

          {/* Requests Grid */}
          <div className="grid grid-cols-1 gap-6">
            {requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-card rounded-lg border border-border text-center space-y-3">
                <FileText className="h-12 w-12 text-muted-foreground/40" />
                <p className="font-semibold text-muted-foreground">All clear!</p>
                <p className="text-xs text-muted-foreground">No citizen registration requests are pending review.</p>
              </div>
            ) : (
              requests.map((req) => (
                <div key={req.id} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Basic Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary uppercase font-bold text-sm">
                        {req.full_name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground leading-snug">{req.full_name}</h4>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Applicant Details</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground pt-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        <span>{req.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{req.mobile_number}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
                        <span className="font-medium text-foreground">Aadhaar: {req.aadhaar_number}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Address */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Submitted Address</span>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <p className="leading-relaxed">{req.address}</p>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-col justify-center gap-3 md:items-end">
                    <button
                      onClick={() => handleOpenAssignModal(req)}
                      className="w-full md:w-56 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/10 transition-colors"
                    >
                      <UserCheck className="h-4 w-4" />
                      Approve & Assign Collector
                    </button>
                    <button
                      onClick={() => handleOpenRejectModal(req)}
                      className="w-full md:w-56 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                    >
                      <XOctagon className="h-4 w-4" />
                      Reject Registration
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Approve & Assign Collector Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Approve Citizen & Assign Field Collector"
      >
        {selectedRequest && (
          <form onSubmit={handleAssignSubmit} className="space-y-4">
            <div className="bg-muted/40 p-4 rounded-lg border border-border text-xs space-y-1">
              <span className="font-bold text-foreground block">Applicant: {selectedRequest.full_name}</span>
              <span className="text-muted-foreground block">Address: {selectedRequest.address}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Ward Selector */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                  1. Assign Ward Zone *
                </label>
                <select
                  required
                  value={selectedWardId}
                  onChange={(e) => {
                    setSelectedWardId(e.target.value);
                    setSelectedCollectorId(''); // Reset collector
                  }}
                  className="w-full px-3 py-2 text-sm border border-input bg-background rounded-lg outline-none focus:border-primary"
                >
                  <option value="">Select Ward</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              {/* Collector Selector */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                  2. Select Field Collector *
                </label>
                <select
                  required
                  disabled={!selectedWardId}
                  value={selectedCollectorId}
                  onChange={(e) => setSelectedCollectorId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input bg-background rounded-lg outline-none focus:border-primary disabled:opacity-50"
                >
                  <option value="">Select Collector</option>
                  {filteredCollectors.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_name} ({c.area})</option>
                  ))}
                </select>
                {selectedWardId && filteredCollectors.length === 0 && (
                  <span className="text-[10px] text-destructive font-semibold block mt-1">
                    ⚠️ No active collectors assigned to this ward.
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 border border-input text-sm rounded-lg hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedWardId || !selectedCollectorId}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 disabled:opacity-50"
              >
                Approve & Allocate Survey
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Reject Registration Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Registration Request"
      >
        {selectedRequest && (
          <form onSubmit={handleRejectSubmit} className="space-y-4">
            <div className="flex gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 text-xs">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p>Rejection requires a mandatory clarification reason which will be visible on the citizen status tracker.</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Mandatory Rejection Reason *
              </label>
              <textarea
                required
                rows="3"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-input bg-background rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="e.g. Invalid Documents / Aadhaar details do not match municipal registry"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 border border-input text-sm rounded-lg hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/95"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default CitizenRequests;

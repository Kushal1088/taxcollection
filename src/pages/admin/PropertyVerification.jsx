import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import { 
  CheckSquare, 
  ArrowRightLeft, 
  MapPin, 
  Calendar, 
  Activity, 
  X, 
  Check, 
  AlertTriangle,
  ExternalLink,
  Eye,
  FileText
} from 'lucide-react';

const PropertyVerification = () => {
  const [activeTab, setActiveTab] = useState('surveys');
  const [loading, setLoading] = useState(true);

  // States
  const [properties, setProperties] = useState([]);
  const [transfers, setTransfers] = useState([]);
  
  // Selection/Modal States
  const [selectedItem, setSelectedItem] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false); // Approve/Reject Form
  const [actionType, setActionType] = useState('approve'); // approve | reject
  const [actionContext, setActionContext] = useState('survey'); // survey | transfer
  const [reason, setReason] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch properties awaiting approval
      const { data: propList } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'Verification Completed')
        .order('updated_at', { ascending: false });
      if (propList) setProperties(propList);

      // 2. Fetch pending transfers
      const { data: transList } = await supabase
        .from('property_transfers')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (transList) {
        // Query users to show names in transfers list
        const { data: users } = await supabase.from('users').select('id, full_name, email');
        const { data: props } = await supabase.from('properties').select('id, property_number, address');
        
        const mergedTrans = transList.map(t => {
          const prevOwner = users?.find(u => u.id === t.previous_owner_id);
          const newOwner = users?.find(u => u.id === t.new_owner_id);
          const prop = props?.find(p => p.id === t.property_id);
          return {
            ...t,
            prev_owner_name: prevOwner ? prevOwner.full_name : 'Unknown',
            new_owner_name: newOwner ? newOwner.full_name : 'Unknown',
            property_number: prop ? prop.property_number : 'Unassigned',
            address: prop ? prop.address : 'Unknown'
          };
        });
        setTransfers(mergedTrans);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenActionModal = (item, type, context) => {
    setSelectedItem(item);
    setActionType(type);
    setActionContext(context);
    setReason('');
    setIsActionModalOpen(true);
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (actionType === 'reject' && !reason.trim()) {
      toast.error('Rejection reason is mandatory.');
      return;
    }

    try {
      if (actionContext === 'survey') {
        // Survey Decision
        const status = actionType === 'approve' ? 'Approved' : 'Rejected';
        const { error } = await supabase
          .from('properties')
          .update({
            status,
            rejection_reason: actionType === 'reject' ? reason.trim() : null
          })
          .eq('id', selectedItem.id);

        if (error) throw error;

        // Sync request status as well
        if (selectedItem.request_id) {
          await supabase
            .from('citizen_requests')
            .update({
              status: actionType === 'approve' ? 'approved' : 'rejected',
              rejection_reason: actionType === 'reject' ? reason.trim() : null
            })
            .eq('id', selectedItem.request_id);
        }

        toast.success(`Property report ${actionType === 'approve' ? 'approved' : 'rejected'} successfully.`);
        setIsReportModalOpen(false);
      } else {
        // Transfer Decision
        const status = actionType === 'approve' ? 'approved' : 'rejected';
        const { error } = await supabase
          .from('property_transfers')
          .update({
            status,
            rejection_reason: actionType === 'reject' ? reason.trim() : null
          })
          .eq('id', selectedItem.id);

        if (error) throw error;

        toast.success(`Ownership transfer request ${actionType === 'approve' ? 'approved' : 'rejected'} successfully.`);
      }

      setIsActionModalOpen(false);
      setSelectedItem(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Operation failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Verifications & Approvals</h2>
        <p className="text-sm text-muted-foreground">Approve completed property surveys or verify ownership transfer records.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('surveys')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'surveys'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <CheckSquare className="h-4 w-4" />
          Collector Reports ({properties.length})
        </button>
        <button
          onClick={() => setActiveTab('transfers')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'transfers'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ArrowRightLeft className="h-4 w-4" />
          Ownership Transfers ({transfers.length})
        </button>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center bg-card rounded-lg border border-border">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading reports...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tab: Surveys */}
          {activeTab === 'surveys' && (
            <div className="grid grid-cols-1 gap-4">
              {properties.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-card rounded-lg border border-border text-center space-y-3">
                  <CheckSquare className="h-12 w-12 text-muted-foreground/40" />
                  <p className="font-semibold text-muted-foreground">All clear!</p>
                  <p className="text-xs text-muted-foreground">No field reports are pending administrative activation.</p>
                </div>
              ) : (
                properties.map((prop) => (
                  <div key={prop.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400">
                          {prop.property_type}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Survey Completed</span>
                      </div>
                      <h4 className="font-bold text-base text-foreground leading-snug">{prop.owner_name}</h4>
                      <p className="text-xs text-muted-foreground leading-normal flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        {prop.address}, {prop.city} - {prop.pincode}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 sm:self-end md:self-auto">
                      <button
                        onClick={() => {
                          setSelectedItem(prop);
                          setIsReportModalOpen(true);
                        }}
                        className="flex items-center gap-1 text-xs font-semibold px-3.5 py-2 border border-border rounded-lg bg-muted/40 hover:bg-muted text-foreground transition-all"
                      >
                        <Eye className="h-4 w-4" /> View Full Survey Report
                      </button>
                      <button
                        onClick={() => handleOpenActionModal(prop, 'approve', 'survey')}
                        className="flex items-center gap-1 text-xs font-semibold px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-all shadow-md shadow-emerald-500/10"
                      >
                        <Check className="h-4 w-4" /> Approve
                      </button>
                      <button
                        onClick={() => handleOpenActionModal(prop, 'reject', 'survey')}
                        className="flex items-center gap-1 text-xs font-semibold px-3 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-all"
                      >
                        <X className="h-4 w-4" /> Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: Transfers */}
          {activeTab === 'transfers' && (
            <div className="grid grid-cols-1 gap-4">
              {transfers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-card rounded-lg border border-border text-center space-y-3">
                  <ArrowRightLeft className="h-12 w-12 text-muted-foreground/40" />
                  <p className="font-semibold text-muted-foreground">No pending transfers</p>
                  <p className="text-xs text-muted-foreground">Property ownership logs are fully current.</p>
                </div>
              ) : (
                transfers.map((trans) => (
                  <div key={trans.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all space-y-4">
                    <div className="flex justify-between items-start border-b border-border pb-3">
                      <div>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400">
                          {trans.property_number}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">Request Date: {new Date(trans.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenActionModal(trans, 'approve', 'transfer')}
                          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleOpenActionModal(trans, 'reject', 'transfer')}
                          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground block mb-0.5">Previous Owner:</span>
                        <span className="font-bold text-foreground block">{trans.prev_owner_name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-0.5">Proposed New Owner:</span>
                        <span className="font-bold text-foreground block text-primary">{trans.new_owner_name}</span>
                      </div>
                      <div className="sm:col-span-2 md:col-span-1">
                        <span className="text-muted-foreground block mb-0.5">Transfer Reason:</span>
                        <span className="text-foreground block">{trans.transfer_reason}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Survey Report Details Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Physical Property Survey Report"
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-6 text-sm">
            {/* Owner & Basic Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-border pb-4">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-bold block mb-1">Owner Information</span>
                <p className="font-bold text-foreground text-base">{selectedItem.owner_name}</p>
                <p className="text-xs text-muted-foreground">Phone: {selectedItem.owner_phone}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase font-bold block mb-1">Ward Location</span>
                <p className="font-semibold text-foreground text-base">Ward: {selectedItem.ward}</p>
                <p className="text-xs text-muted-foreground">ULB: {selectedItem.ulb}</p>
              </div>
            </div>

            {/* Property Parameters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-border pb-4">
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">Property Type:</span>
                <span className="font-bold text-foreground">{selectedItem.property_type}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">Usage Type:</span>
                <span className="font-bold text-foreground">{selectedItem.usage_type || 'N/A'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">Occupancy Status:</span>
                <span className="font-bold text-foreground">{selectedItem.occupancy_status}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">Construction Type:</span>
                <span className="font-bold text-foreground">{selectedItem.construction_type || 'N/A'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">Total Area (sqft):</span>
                <span className="font-bold text-foreground">{selectedItem.total_area}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">Built Up Area (sqft):</span>
                <span className="font-bold text-foreground">{selectedItem.built_up_area}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">Number of Floors:</span>
                <span className="font-bold text-foreground">{selectedItem.number_of_floors}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">Construction Year:</span>
                <span className="font-bold text-foreground">{selectedItem.construction_year}</span>
              </div>
            </div>

            {/* Geo Location coordinates */}
            <div className="bg-muted/40 p-4 rounded-lg border border-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <span className="font-bold text-foreground block">GPS Verification Coordinates</span>
                  <span className="text-muted-foreground block">Lat: {selectedItem.latitude || 'N/A'} | Long: {selectedItem.longitude || 'N/A'}</span>
                </div>
              </div>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${selectedItem.latitude},${selectedItem.longitude}`}
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                View on Map <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Photos & Attachments */}
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground uppercase font-bold block">Uploaded Media</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {selectedItem.owner_photo_url && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-semibold block">Owner Photo</span>
                    <img 
                      src={selectedItem.owner_photo_url} 
                      alt="Owner avatar" 
                      className="h-28 w-full object-cover rounded-lg border border-border"
                    />
                  </div>
                )}
                {selectedItem.aadhaar_url && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-semibold block">Aadhaar Proof</span>
                    <img 
                      src={selectedItem.aadhaar_url} 
                      alt="Aadhaar upload" 
                      className="h-28 w-full object-cover rounded-lg border border-border"
                    />
                  </div>
                )}
                {/* Fallback mock photo from collection */}
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold block">Property Photo</span>
                  <img 
                    src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=400" 
                    alt="Property upload" 
                    className="h-28 w-full object-cover rounded-lg border border-border"
                  />
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className="space-y-1 bg-muted/10 p-3 rounded-lg border border-border text-xs">
              <span className="font-semibold text-foreground block">Collector Field Notes / Remarks:</span>
              <p className="text-muted-foreground leading-relaxed italic">"{selectedItem.remarks || 'No remarks added by field surveyor.'}"</p>
            </div>

            {/* Footer Action */}
            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 border border-input text-xs rounded-lg hover:bg-muted"
              >
                Close
              </button>
              <button
                onClick={() => handleOpenActionModal(selectedItem, 'approve', 'survey')}
                className="px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
              >
                Verify & Approve
              </button>
              <button
                onClick={() => handleOpenActionModal(selectedItem, 'reject', 'survey')}
                className="px-4 py-2 text-xs bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/95"
              >
                Reject Report
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Action Decision Form Modal (Mandates Rejection Reason) */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title={actionType === 'approve' ? 'Confirm Approval Action' : 'Confirm Rejection Action'}
      >
        <form onSubmit={handleActionSubmit} className="space-y-4">
          {actionType === 'approve' ? (
            <div className="text-xs space-y-2">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-lg">
                <strong>Confirm Action:</strong> This will approve the {actionContext === 'survey' ? 'property survey details' : 'ownership transfer request'} and update database registries.
              </div>
              {actionContext === 'survey' && (
                <p className="text-muted-foreground">
                  Upon approval, this property will be assigned an auto-incremented property reference ID (e.g. <code>PROP-2026-XXXXX</code>), the citizen's account status will change to <code>active</code>, and a default tax bill will be assessed based on the property type.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 text-xs">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <p>Rejections require a mandatory clarification reason which will be visible on the citizen status tracker.</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                  Mandatory Rejection Reason *
                </label>
                <textarea
                  required
                  rows="3"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input bg-background rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="e.g. Structural floors count mismatch / Uploaded photos are blurry / Transfer reason unclear"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
            <button
              type="button"
              onClick={() => setIsActionModalOpen(false)}
              className="px-4 py-2 border border-input text-sm rounded-lg hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-sm rounded-lg text-white font-semibold transition-colors ${
                actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-destructive hover:bg-destructive/95'
              }`}
            >
              {actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PropertyVerification;

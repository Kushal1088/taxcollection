import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import { 
  Building2, 
  DollarSign, 
  AlertTriangle, 
  FileText, 
  MapPin, 
  ArrowRightLeft, 
  CreditCard, 
  Upload, 
  CheckCircle, 
  Printer, 
  Check, 
  X,
  FileCheck
} from 'lucide-react';

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);

  // Core properties
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);

  // Property details
  const [taxBills, setTaxBills] = useState([]);
  const [notices, setNotices] = useState([]);
  
  // Checkout Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    paymentMode: 'UPI',
    transactionId: '',
  });
  const [paymentProof, setPaymentProof] = useState(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Transfer Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [transferForm, setTransferForm] = useState({
    newOwnerId: '',
    reason: ''
  });

  // Receipt Modal
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState(null);

  // New Property Registration Modal & Tracking states
  const [citizenRequests, setCitizenRequests] = useState([]);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [propertyForm, setPropertyForm] = useState({
    fullName: '',
    mobileNumber: '',
    email: '',
    address: '',
    aadhaarNumber: ''
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const fetchCitizenProperties = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch citizen's approved properties
      const { data: props } = await supabase
        .from('properties')
        .select('*')
        .eq('citizen_id', user.id)
        .eq('status', 'Approved'); // Active properties

      if (props && props.length > 0) {
        setProperties(props);
        // Default to first property
        if (!selectedProperty) {
          setSelectedProperty(props[0]);
        } else {
          // Sync state if already selected
          const updated = props.find(p => p.id === selectedProperty.id);
          setSelectedProperty(updated || props[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPropertyDues = async (propertyId) => {
    try {
      // Fetch tax bills
      const { data: bills } = await supabase
        .from('tax_records')
        .select('*')
        .eq('property_id', propertyId)
        .order('financial_year', { ascending: false });
      if (bills) setTaxBills(bills);

      // Fetch active notices
      const { data: noteList } = await supabase
        .from('tax_notices')
        .select('*')
        .eq('property_id', propertyId)
        .eq('is_active', true);
      if (noteList) setNotices(noteList);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCitizenRequests = async () => {
    if (!user) return;
    try {
      const { data: reqs } = await supabase
        .from('citizen_requests')
        .select('*')
        .eq('citizen_id', user.id)
        .order('created_at', { ascending: false });
      if (reqs) setCitizenRequests(reqs);
    } catch (err) {
      console.error('Error fetching citizen requests:', err);
    }
  };

  const handleRegisterPropertySubmit = async (e) => {
    e.preventDefault();
    const { fullName, mobileNumber, email, address, aadhaarNumber } = propertyForm;
    if (!address || !aadhaarNumber) {
      toast.error('Address and Aadhaar Number are required.');
      return;
    }

    // Validate Aadhaar (12 digits)
    const aadhaarClean = aadhaarNumber.replace(/[-\s]/g, '');
    if (aadhaarClean.length !== 12 || isNaN(aadhaarClean)) {
      toast.error('Aadhaar number must be exactly 12 digits.');
      return;
    }

    setSubmittingRequest(true);
    try {
      const { error } = await supabase.from('citizen_requests').insert({
        citizen_id: user.id,
        full_name: fullName || profile?.full_name || 'Citizen User',
        mobile_number: mobileNumber || profile?.mobile_number || '',
        email: email || profile?.email || user.email,
        address,
        aadhaar_number: aadhaarClean,
        status: 'pending_admin_review'
      });

      if (error) throw error;

      toast.success('Property registration request submitted successfully!');
      setIsRegisterModalOpen(false);
      setPropertyForm({
        fullName: '',
        mobileNumber: '',
        email: '',
        address: '',
        aadhaarNumber: ''
      });
      fetchCitizenRequests();
    } catch (err) {
      toast.error(err.message || 'Failed to submit request.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  useEffect(() => {
    fetchCitizenProperties();
    fetchCitizenRequests();
  }, [user]);

  useEffect(() => {
    if (selectedProperty) {
      fetchPropertyDues(selectedProperty.id);
    }
  }, [selectedProperty]);

  // Load all users to populate the transfer target list
  const fetchAllUsers = async () => {
    const { data } = await supabase.from('users').select('id, full_name, email').eq('role', 'citizen');
    if (data) {
      // Filter out current user
      setAllUsers(data.filter(u => u.id !== user.id));
    }
  };

  // Payment Screenshot helper
  const handleProofUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProof(reader.result);
        toast.success('Screenshot attached.');
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Payment Proof
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const { paymentMode, transactionId } = paymentForm;
    if (!transactionId) {
      toast.error('Transaction ID is required.');
      return;
    }

    setSubmittingPayment(true);
    try {
      // Insert into payments table
      const { error } = await supabase.from('payments').insert({
        tax_record_id: selectedBill.id,
        tax_bill_number: `TX-${selectedBill.financial_year}-${selectedProperty.property_number.slice(-4)}`,
        amount: selectedBill.final_amount,
        payment_mode: paymentMode,
        transaction_id: transactionId,
        proof_url: paymentProof,
        status: 'Pending Verification' // Admin reviews manually
      });

      if (error) throw error;

      // Update tax record status to Pending (or Overdue depending)
      await supabase.from('tax_records').update({
        status: 'Pending' // In verification state
      }).eq('id', selectedBill.id);

      toast.success('Payment proof uploaded successfully! Awaiting administrator verification.');
      setIsPayModalOpen(false);
      fetchPropertyDues(selectedProperty.id);
    } catch (err) {
      toast.error(err.message || 'Payment submission failed.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Submit Transfer Request
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    const { newOwnerId, reason } = transferForm;
    if (!newOwnerId || !reason.trim()) {
      toast.error('Please complete all transfer details.');
      return;
    }

    try {
      const { error } = await supabase.from('property_transfers').insert({
        property_id: selectedProperty.id,
        previous_owner_id: user.id,
        new_owner_id: newOwnerId,
        transfer_reason: reason.trim(),
        status: 'pending'
      });

      if (error) throw error;

      toast.success('Ownership transfer request submitted. Verification pending with Admin.');
      setIsTransferModalOpen(false);
      setTransferForm({ newOwnerId: '', reason: '' });
    } catch (err) {
      toast.error(err.message || 'Transfer request failed.');
    }
  };

  // View Receipt details
  const handleViewReceipt = async (bill) => {
    const { data: pay } = await supabase
      .from('payments')
      .select('*')
      .eq('tax_record_id', bill.id)
      .eq('status', 'Verified')
      .single();

    if (pay) {
      setActiveReceipt({
        bill,
        payment: pay,
        property: selectedProperty
      });
      setIsReceiptModalOpen(true);
    } else {
      toast.error('No verified receipt record found for this tax bill.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Property Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Citizen Dashboard</h2>
          <p className="text-sm text-muted-foreground">Manage owned holdings, view municipal tax histories, and submit payment records.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              setPropertyForm({
                fullName: profile?.full_name || '',
                mobileNumber: profile?.mobile_number || '',
                email: profile?.email || '',
                address: '',
                aadhaarNumber: ''
              });
              setIsRegisterModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 shadow-md shadow-primary/10 transition-colors"
          >
            Register / Buy Property
          </button>

          {properties.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Select Property:</span>
              <select
                value={selectedProperty?.id || ''}
                onChange={(e) => {
                  const found = properties.find(p => p.id === e.target.value);
                  if (found) setSelectedProperty(found);
                }}
                className="px-3 py-2 text-xs font-semibold border border-input bg-card rounded-lg outline-none focus:border-primary"
              >
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.property_number} ({p.property_type})</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="bg-card p-12 text-center rounded-xl border border-border space-y-4">
          <Building2 className="h-16 w-16 text-muted-foreground/30 mx-auto" />
          <h3 className="text-lg font-bold text-foreground">No Active Properties Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            You do not have any registered active properties. Click the button above to register or buy a new property.
          </p>
        </div>
      ) : (
        selectedProperty && (
          <>
            {/* Notices alert banners */}
            {notices.map((n) => (
              <div 
                key={n.id} 
                className="flex items-start gap-3 p-4 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-sm"
              >
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-foreground block">{n.notice_type}</span>
                  <p className="opacity-90">{n.message}</p>
                </div>
              </div>
            ))}

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Paid total */}
              <div className="bg-card p-5 border border-border rounded-xl flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Taxes Paid</span>
                  <h3 className="text-xl font-bold text-foreground">
                    ₹{taxBills.filter(b => b.status === 'Paid').reduce((sum, b) => sum + b.final_amount, 0).toLocaleString()}
                  </h3>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>

              {/* Dues total */}
              <div className="bg-card p-5 border border-border rounded-xl flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Outstanding Dues</span>
                  <h3 className="text-xl font-bold text-destructive">
                    ₹{taxBills.filter(b => b.status === 'Pending' || b.status === 'Overdue').reduce((sum, b) => sum + b.final_amount, 0).toLocaleString()}
                  </h3>
                </div>
                <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>

              {/* Structure tag */}
              <div className="bg-card p-5 border border-border rounded-xl flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Classification</span>
                  <h3 className="text-xl font-bold text-foreground">{selectedProperty.property_type}</h3>
                </div>
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Main breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Dues and Bills Ledger */}
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4 lg:col-span-2">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5 border-b border-border pb-3">
                  <FileText className="h-4 w-4 text-primary" /> Property Tax History (Annual FY)
                </h4>

                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-muted/40 font-semibold text-muted-foreground border-b border-border">
                      <tr>
                        <th className="p-3">Financial Year</th>
                        <th className="p-3">Base Tax</th>
                        <th className="p-3">Penalty</th>
                        <th className="p-3">Total Dues</th>
                        <th className="p-3">Due Date</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {taxBills.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="p-6 text-center text-muted-foreground">No tax bills generated for this property.</td>
                        </tr>
                      ) : (
                        taxBills.map((bill) => (
                          <tr key={bill.id} className="hover:bg-muted/5">
                            <td className="p-3 font-bold text-foreground">{bill.financial_year}</td>
                            <td className="p-3">₹{bill.tax_amount}</td>
                            <td className="p-3 text-destructive">₹{bill.penalty}</td>
                            <td className="p-3 font-bold text-foreground">₹{bill.final_amount}</td>
                            <td className="p-3 text-muted-foreground">{new Date(bill.due_date).toLocaleDateString()}</td>
                            <td className="p-3">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                bill.status === 'Paid'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400'
                              }`}>
                                {bill.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              {bill.status === 'Paid' ? (
                                <button
                                  onClick={() => handleViewReceipt(bill)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-border rounded hover:bg-muted font-semibold"
                                >
                                  <Printer className="h-3 w-3" /> Receipt
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedBill(bill);
                                    setPaymentForm({ paymentMode: 'UPI', transactionId: '' });
                                    setPaymentProof(null);
                                    setIsPayModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/95 font-semibold"
                                >
                                  <CreditCard className="h-3 w-3" /> Pay Dues
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Property Details Column */}
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4 h-fit">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5 border-b border-border pb-3">
                  <Building2 className="h-4 w-4 text-primary" /> Holding Details
                </h4>
                
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Property Code:</span>
                    <strong className="text-foreground">{selectedProperty.property_number}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location Address:</span>
                    <span className="text-right text-foreground max-w-[150px] truncate" title={selectedProperty.address}>
                      {selectedProperty.address}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total / Built Area:</span>
                    <strong className="text-foreground">{selectedProperty.total_area} / {selectedProperty.built_up_area} sqft</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Structural Floors:</span>
                    <strong className="text-foreground">{selectedProperty.number_of_floors} Floors</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Occupancy Status:</span>
                    <strong className="text-foreground">{selectedProperty.occupancy_status}</strong>
                  </div>

                  <button
                    onClick={() => {
                      fetchAllUsers();
                      setIsTransferModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 mt-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-muted font-semibold transition-colors"
                  >
                    <ArrowRightLeft className="h-4 w-4" /> Request Property Transfer
                  </button>
                </div>
              </div>
            </div>
          </>
        )
      )}

      {/* Tax Payment Proof Upload Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Upload Tax Payment Verification Proof"
      >
        {selectedBill && (
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="bg-muted/40 p-4 rounded-lg border border-border text-xs space-y-1">
              <span>Property Reference: <strong>{selectedProperty.property_number}</strong></span>
              <span className="block">FY Assessment: <strong>{selectedBill.financial_year}</strong></span>
              <span className="block text-primary">Final Tax Dues: <strong>₹{selectedBill.final_amount}</strong></span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {/* Payment Mode */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                  Payment Mode *
                </label>
                <select
                  value={paymentForm.paymentMode}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Net Banking">Net Banking Transfer</option>
                  <option value="Cash">Over-the-Counter Cash</option>
                </select>
              </div>

              {/* Transaction ID */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                  Transaction / Ref ID *
                </label>
                <input
                  type="text"
                  required
                  value={paymentForm.transactionId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
                  placeholder="e.g. UPI Ref Number"
                />
              </div>

              {/* Screenshot Upload */}
              <div className="sm:col-span-2 border border-dashed rounded-lg p-4 text-center space-y-2">
                <span className="text-xs font-semibold text-foreground block">Attach Payment Screenshot / Receipt Proof</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProofUpload}
                  className="hidden"
                  id="pay-proof-file"
                />
                <label 
                  htmlFor="pay-proof-file"
                  className="mx-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                >
                  <Upload className="h-5 w-5" />
                </label>
                {paymentProof && (
                  <img src={paymentProof} alt="Proof screenshot" className="h-24 object-contain rounded-lg border border-border mx-auto" />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="px-4 py-2 border border-input text-sm rounded-lg hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingPayment}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 disabled:opacity-50 font-semibold"
              >
                {submittingPayment ? 'Submitting...' : 'Upload Proof'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Property Ownership Transfer Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Initiate Property Ownership Transfer"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          <div className="bg-muted/40 p-3 rounded-lg border border-border text-xs">
            Transferring Property: <strong className="text-foreground">{selectedProperty?.property_number}</strong>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
              Select New Owner (Citizen) *
            </label>
            <select
              required
              value={transferForm.newOwnerId}
              onChange={(e) => setTransferForm({ ...transferForm, newOwnerId: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-input bg-background rounded-lg outline-none focus:border-primary"
            >
              <option value="">Select Citizen</option>
              {allUsers.map(u => (
                <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
              Transfer Reason *
            </label>
            <textarea
              required
              rows="3"
              value={transferForm.reason}
              onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="e.g. Property sold to buyer / Gift deed to family relative"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
              className="px-4 py-2 border border-input text-sm rounded-lg hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/95"
            >
              Request Transfer
            </button>
          </div>
        </form>
      </Modal>

      {/* Verified Receipt / Invoice Printable Modal */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Municipal Corp Tax Receipt"
        size="md"
      >
        {activeReceipt && (
          <div className="space-y-6 print:p-0">
            {/* Logo/Watermark banner */}
            <div className="text-center space-y-1 pb-4 border-b border-double border-muted-foreground/30">
              <div className="flex items-center justify-center gap-2">
                <Building2 className="h-8 w-8 text-primary" />
                <h2 className="text-xl font-bold tracking-tight text-foreground">Municipal Corporation</h2>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Official Property Tax Receipt</p>
            </div>

            {/* Receipt and Property Details */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs leading-normal">
              <div>
                <span className="text-muted-foreground block">Receipt Number:</span>
                <strong className="text-foreground text-sm font-extrabold">{activeReceipt.payment.receipt_number}</strong>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground block">Transaction Date:</span>
                <strong className="text-foreground">{new Date(activeReceipt.payment.payment_date).toLocaleString()}</strong>
              </div>

              <div>
                <span className="text-muted-foreground block">Property Reference:</span>
                <strong className="text-foreground font-bold">{activeReceipt.property.property_number}</strong>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground block">Financial Year:</span>
                <strong className="text-foreground font-bold">FY {activeReceipt.bill.financial_year}</strong>
              </div>

              <div>
                <span className="text-muted-foreground block">Owner Name:</span>
                <strong className="text-foreground font-bold">{activeReceipt.property.owner_name}</strong>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground block">Site Location:</span>
                <span className="text-foreground block truncate">{activeReceipt.property.address}</span>
              </div>
            </div>

            {/* Fee summary table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted font-bold text-muted-foreground border-b border-border">
                  <tr>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="p-3 text-muted-foreground">Property Tax Base Assessment</td>
                    <td className="p-3 text-right text-foreground font-semibold">₹{activeReceipt.bill.tax_amount}</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-muted-foreground">Municipal Delay Penalty Fee</td>
                    <td className="p-3 text-right text-destructive font-semibold">₹{activeReceipt.bill.penalty}</td>
                  </tr>
                  <tr className="bg-muted/10 font-bold border-t border-border">
                    <td className="p-3 text-foreground">Total Taxes Paid (INR)</td>
                    <td className="p-3 text-right text-foreground text-sm font-extrabold">₹{activeReceipt.payment.amount}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Transaction specs */}
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 p-3 rounded-lg flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-emerald-500" />
                <div>
                  <span className="font-bold block">Gateway Verification Confirmed</span>
                  <span className="block">Txn ID: {activeReceipt.payment.transaction_id} • Mode: {activeReceipt.payment.payment_mode}</span>
                </div>
              </div>
              <span className="font-bold text-[10px] uppercase border border-emerald-400 px-2 py-0.5 rounded">Paid</span>
            </div>

            {/* Print trigger footer */}
            <div className="flex justify-end gap-3 border-t border-border pt-4 print:hidden">
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2 border border-input text-xs rounded-lg hover:bg-muted"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 font-semibold"
              >
                <Printer className="h-4 w-4" /> Print Tax Receipt
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Property Registration Request Modal */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Register or Buy New Property"
      >
        <form onSubmit={handleRegisterPropertySubmit} className="space-y-4">
          <div className="bg-muted/40 p-4 rounded-lg border border-border text-xs space-y-1">
            <span className="font-bold text-foreground block">Applicant Profile:</span>
            <span className="text-muted-foreground block">Name: {profile?.full_name || 'Citizen User'}</span>
            <span className="text-muted-foreground block">Email: {profile?.email || user?.email}</span>
            <span className="text-muted-foreground block">Mobile: {profile?.mobile_number || 'N/A'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Aadhaar Number */}
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Aadhaar Number (12 digits) *
              </label>
              <input
                type="text"
                required
                value={propertyForm.aadhaarNumber}
                onChange={(e) => setPropertyForm({ ...propertyForm, aadhaarNumber: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-input bg-background rounded-lg outline-none focus:border-primary"
                placeholder="e.g. 1234-5678-9012"
              />
            </div>

            {/* Property Address */}
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Property Physical Address *
              </label>
              <textarea
                required
                rows="3"
                value={propertyForm.address}
                onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-input bg-background rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Specify the exact location, plot number, division, or landmark"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(false)}
              className="px-4 py-2 border border-input text-sm rounded-lg hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingRequest}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 disabled:opacity-50 font-semibold"
            >
              {submittingRequest ? 'Submitting...' : 'Submit Property Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Property Registration Applications list */}
      {citizenRequests.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5 border-b border-border pb-3">
            Property Registration Applications ({citizenRequests.length})
          </h4>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-muted/40 font-semibold text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3">Track ID</th>
                  <th className="p-3">Property Address</th>
                  <th className="p-3">Aadhaar Number</th>
                  <th className="p-3">Status / Progress</th>
                  <th className="p-3">Rejection Reason</th>
                  <th className="p-3 text-right">Date Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {citizenRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-muted/5">
                    <td className="p-3 font-mono font-bold text-[10px] text-muted-foreground">{req.id.slice(0, 8)}...</td>
                    <td className="p-3 truncate max-w-[200px]" title={req.address}>{req.address}</td>
                    <td className="p-3">{req.aadhaar_number}</td>
                    <td className="p-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        req.status === 'approved'
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                          : req.status === 'rejected'
                          ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                          : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400'
                      }`}>
                        {req.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-destructive">{req.rejection_reason || '-'}</td>
                    <td className="p-3 text-right text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

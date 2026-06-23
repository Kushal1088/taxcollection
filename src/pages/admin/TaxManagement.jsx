import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import { 
  DollarSign, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Plus, 
  Edit3, 
  Eye, 
  Image as ImageIcon,
  History,
  AlertTriangle
} from 'lucide-react';

const TaxManagement = () => {
  const [activeTab, setActiveTab] = useState('ledger');
  const [loading, setLoading] = useState(true);

  // Data states
  const [taxRecords, setTaxRecords] = useState([]);
  const [properties, setProperties] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [templates, setTemplates] = useState([]);

  // Modals & Forms
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [assessmentForm, setAssessmentForm] = useState({
    propertyId: '',
    financialYear: '2025-26',
    taxAmount: '',
    dueDate: '2026-09-30',
  });

  const [isPenaltyModalOpen, setIsPenaltyModalOpen] = useState(false);
  const [selectedTaxRecord, setSelectedTaxRecord] = useState(null);
  const [penaltyForm, setPenaltyForm] = useState({
    penalty: '0',
    reason: ''
  });

  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectMode, setIsRejectMode] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Tax Records
      const { data: records } = await supabase.from('tax_records').select('*');
      
      // 2. Fetch Active Properties
      const { data: propList } = await supabase.from('properties').select('*');
      setProperties(propList || []);

      // Merge records with property numbers & owner details
      if (records) {
        const merged = records.map(r => {
          const prop = propList?.find(p => p.id === r.property_id);
          return {
            ...r,
            property_number: prop ? prop.property_number : 'Unassigned',
            owner_name: prop ? prop.owner_name : 'Unknown',
            property_type: prop ? prop.property_type : 'Residential',
            address: prop ? prop.address : 'N/A'
          };
        });
        setTaxRecords(merged);
      }

      // 3. Fetch Pending Payments
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'Pending Verification');

      if (payments) {
        const { data: taxRecs } = await supabase.from('tax_records').select('id, property_id, financial_year');
        const mergedPayments = payments.map(p => {
          const taxRec = taxRecs?.find(t => t.id === p.tax_record_id);
          const prop = propList?.find(pr => pr.id === taxRec?.property_id);
          return {
            ...p,
            financial_year: taxRec ? taxRec.financial_year : 'Unknown',
            property_number: prop ? prop.property_number : 'Unassigned',
            owner_name: prop ? prop.owner_name : 'Unknown'
          };
        });
        setPendingPayments(mergedPayments);
      }

      // 4. Fetch Templates
      const { data: temps } = await supabase.from('tax_templates').select('*');
      if (temps) setTemplates(temps);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update default tax amount in assessment form based on selected property type
  const handlePropertyChange = (propertyId) => {
    const prop = properties.find(p => p.id === propertyId);
    if (prop) {
      const temp = templates.find(t => t.property_type === prop.property_type);
      setAssessmentForm(prev => ({
        ...prev,
        propertyId,
        taxAmount: temp ? temp.default_amount.toString() : '2000'
      }));
    }
  };

  // Create Tax Bill
  const handleAssessSubmit = async (e) => {
    e.preventDefault();
    const { propertyId, financialYear, taxAmount, dueDate } = assessmentForm;
    if (!propertyId || !taxAmount || !dueDate) {
      toast.error('All fields are mandatory.');
      return;
    }

    // Check duplicate financial year bill
    const duplicate = taxRecords.some(r => r.property_id === propertyId && r.financial_year === financialYear);
    if (duplicate) {
      toast.error(`A tax bill for FY ${financialYear} has already been assessed for this property.`);
      return;
    }

    try {
      const amount = parseFloat(taxAmount);
      const { error } = await supabase.from('tax_records').insert({
        property_id: propertyId,
        financial_year: financialYear,
        tax_amount: amount,
        penalty: 0,
        final_amount: amount,
        due_date: dueDate,
        status: 'Pending'
      });

      if (error) throw error;

      toast.success('Property tax record generated successfully!');
      setIsAssessmentModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Assessment failed.');
    }
  };

  // Update Penalty
  const handlePenaltySubmit = async (e) => {
    e.preventDefault();
    const penaltyAmt = parseFloat(penaltyForm.penalty);
    if (isNaN(penaltyAmt) || penaltyAmt < 0) {
      toast.error('Penalty must be a positive number.');
      return;
    }

    try {
      const finalAmt = selectedTaxRecord.tax_amount + penaltyAmt;
      const { error } = await supabase.from('tax_records').update({
        penalty: penaltyAmt,
        final_amount: finalAmt,
        status: finalAmt > 0 && selectedTaxRecord.status === 'Paid' ? 'Pending' : selectedTaxRecord.status
      }).eq('id', selectedTaxRecord.id);

      if (error) throw error;

      toast.success('Penalty updated successfully.');
      setIsPenaltyModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Template Update
  const handleTemplateUpdate = async (id, amount) => {
    const newAmt = parseFloat(amount);
    if (isNaN(newAmt) || newAmt < 0) {
      toast.error('Amount must be a positive number.');
      return;
    }
    const { error } = await supabase.from('tax_templates').update({ default_amount: newAmt }).eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Tax template rate updated.');
      fetchData();
    }
  };

  // Payment Verification Actions
  const handleVerifyPayment = async (payment) => {
    if (!window.confirm(`Verify payment receipt of ₹${payment.amount} for ${payment.property_number}?`)) {
      return;
    }

    const { error } = await supabase
      .from('payments')
      .update({ status: 'Verified' })
      .eq('id', payment.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Payment verified! Tax Receipt issued.');
      setIsProofModalOpen(false);
      fetchData();
    }
  };

  const handleRejectPayment = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      toast.error('Rejection reason is mandatory.');
      return;
    }

    const { error } = await supabase
      .from('payments')
      .update({
        status: 'Rejected',
        rejection_reason: rejectReason.trim()
      })
      .eq('id', selectedPayment.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.warning('Payment proof rejected.');
      setIsProofModalOpen(false);
      setIsRejectMode(false);
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Tax Management</h2>
          <p className="text-sm text-muted-foreground">Configure tax rates, assess property bills, and verify citizen transaction proofs.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'ledger'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          Taxes Ledger
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'payments'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <CheckCircle className="h-4 w-4" />
          Verify Payments ({pendingPayments.length})
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'templates'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings className="h-4 w-4" />
          Default Templates
        </button>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center bg-card rounded-lg border border-border">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading details...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tab: Taxes Ledger */}
          {activeTab === 'ledger' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-card p-4 rounded-lg border border-border">
                <span className="text-sm font-semibold text-muted-foreground">{taxRecords.length} Generated Bills</span>
                <button
                  onClick={() => {
                    setAssessmentForm({ propertyId: '', financialYear: '2025-26', taxAmount: '', dueDate: '2026-09-30' });
                    setIsAssessmentModalOpen(true);
                  }}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95"
                >
                  <Plus className="h-4 w-4" /> Generate Tax Bill
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-lg border border-border bg-card">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-muted/40 font-semibold text-muted-foreground border-b border-border">
                    <tr>
                      <th className="p-4">Property No.</th>
                      <th className="p-4">Owner</th>
                      <th className="p-4">FY</th>
                      <th className="p-4">Tax Amount</th>
                      <th className="p-4">Penalty</th>
                      <th className="p-4">Final Amount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {taxRecords.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="p-8 text-center text-muted-foreground">No tax records found.</td>
                      </tr>
                    ) : (
                      taxRecords.map((r) => (
                        <tr key={r.id} className="hover:bg-muted/10">
                          <td className="p-4 font-bold text-foreground">{r.property_number}</td>
                          <td className="p-4">
                            <div className="font-semibold">{r.owner_name}</div>
                            <div className="text-[10px] text-muted-foreground">{r.property_type}</div>
                          </td>
                          <td className="p-4 text-muted-foreground">{r.financial_year}</td>
                          <td className="p-4 font-semibold text-foreground">₹{r.tax_amount}</td>
                          <td className="p-4 text-destructive font-medium">₹{r.penalty}</td>
                          <td className="p-4 font-bold text-foreground">₹{r.final_amount}</td>
                          <td className="p-4">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                              r.status === 'Paid' 
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' 
                                : r.status === 'Overdue'
                                  ? 'bg-destructive/10 text-destructive'
                                  : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedTaxRecord(r);
                                  setPenaltyForm({ penalty: r.penalty.toString(), reason: '' });
                                  setIsPenaltyModalOpen(true);
                                }}
                                className="text-xs font-semibold px-2.5 py-1.5 border border-border rounded hover:bg-muted"
                              >
                                Modify Penalty
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
          )}

          {/* Tab: Verify Payments */}
          {activeTab === 'payments' && (
            <div className="grid grid-cols-1 gap-4">
              {pendingPayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-card rounded-lg border border-border text-center space-y-3">
                  <CheckCircle className="h-12 w-12 text-muted-foreground/40" />
                  <p className="font-semibold text-muted-foreground">All Verification Completed</p>
                  <p className="text-xs text-muted-foreground">No citizen payment transactions are pending review.</p>
                </div>
              ) : (
                pendingPayments.map((p) => (
                  <div key={p.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400">
                          {p.property_number}
                        </span>
                        <span className="text-xs text-muted-foreground font-semibold">FY: {p.financial_year}</span>
                      </div>
                      <h4 className="font-bold text-base text-foreground leading-snug">{p.owner_name}</h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                        <div>Mode: <span className="font-medium text-foreground">{p.payment_mode}</span></div>
                        <div>Txn ID: <span className="font-medium text-foreground">{p.transaction_id}</span></div>
                        <div>Bill: <span className="font-medium text-foreground">{p.tax_bill_number}</span></div>
                        <div>Amount: <span className="font-bold text-foreground text-primary">₹{p.amount}</span></div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:self-end md:self-auto">
                      <button
                        onClick={() => {
                          setSelectedPayment(p);
                          setRejectReason('');
                          setIsRejectMode(false);
                          setIsProofModalOpen(true);
                        }}
                        className="flex items-center gap-1 text-xs font-semibold px-3 py-2 border border-border rounded-lg bg-muted/40 hover:bg-muted text-foreground"
                      >
                        <Eye className="h-4 w-4" /> View Payment Proof
                      </button>
                      <button
                        onClick={() => handleVerifyPayment(p)}
                        className="flex items-center gap-1 text-xs font-semibold px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
                      >
                        <CheckCircle className="h-4 w-4" /> Verify
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPayment(p);
                          setRejectReason('');
                          setIsRejectMode(true);
                          setIsProofModalOpen(true);
                        }}
                        className="flex items-center gap-1 text-xs font-semibold px-3 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20"
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: Templates */}
          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {templates.map((temp) => (
                <div key={temp.id} className="bg-card p-6 border border-border rounded-xl shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Classification</span>
                    <h4 className="text-lg font-bold text-foreground mt-0.5">{temp.property_type}</h4>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Default Amount (₹)</label>
                    <input
                      type="number"
                      defaultValue={temp.default_amount}
                      onBlur={(e) => handleTemplateUpdate(temp.id, e.target.value)}
                      className="w-full px-3 py-1.5 border border-input bg-background rounded-lg text-sm font-semibold focus:border-primary outline-none"
                    />
                    <span className="text-[10px] text-muted-foreground mt-1 block">Exit field to auto-save template</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tax Assessment Modal */}
      <Modal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        title="Generate Property Tax Bill"
      >
        <form onSubmit={handleAssessSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Property Selector */}
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Select Property *
              </label>
              <select
                required
                value={assessmentForm.propertyId}
                onChange={(e) => handlePropertyChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-input bg-background rounded-lg outline-none focus:border-primary"
              >
                <option value="">Select Property Number</option>
                {properties
                  .filter(p => p.status === 'Approved' || p.status === 'Tax Active')
                  .map(p => (
                    <option key={p.id} value={p.id}>
                      {p.property_number} ({p.owner_name} - {p.ward})
                    </option>
                  ))
                }
              </select>
            </div>

            {/* Financial Year */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Financial Year *
              </label>
              <select
                required
                value={assessmentForm.financialYear}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, financialYear: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-input bg-background rounded-lg outline-none focus:border-primary"
              >
                <option value="2025-26">2025-26</option>
                <option value="2026-27">2026-27</option>
                <option value="2027-28">2027-28</option>
              </select>
            </div>

            {/* Tax Amount */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Tax Amount (₹) *
              </label>
              <input
                type="number"
                required
                value={assessmentForm.taxAmount}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, taxAmount: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-input bg-background rounded-lg outline-none focus:border-primary"
                placeholder="Rate template default auto-loads"
              />
              <span className="text-[10px] text-muted-foreground block mt-1">Admin override enabled.</span>
            </div>

            {/* Due Date */}
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={assessmentForm.dueDate}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, dueDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-input bg-background rounded-lg outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
            <button
              type="button"
              onClick={() => setIsAssessmentModalOpen(false)}
              className="px-4 py-2 border border-input text-sm rounded-lg hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/95"
            >
              Generate Bill
            </button>
          </div>
        </form>
      </Modal>

      {/* Modify Penalty Modal */}
      <Modal
        isOpen={isPenaltyModalOpen}
        onClose={() => setIsPenaltyModalOpen(false)}
        title="Modify Bill Penalty Fee"
      >
        {selectedTaxRecord && (
          <form onSubmit={handlePenaltySubmit} className="space-y-4">
            <div className="bg-muted/40 p-4 rounded-lg border border-border text-xs space-y-1">
              <span className="font-bold text-foreground block">Property: {selectedTaxRecord.property_number}</span>
              <span className="text-muted-foreground block">Tax Year: {selectedTaxRecord.financial_year}</span>
              <span className="text-muted-foreground block">Base Bill: ₹{selectedTaxRecord.tax_amount}</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Penalty Amount (₹) *
              </label>
              <input
                type="number"
                required
                value={penaltyForm.penalty}
                onChange={(e) => setPenaltyForm({ ...penaltyForm, penalty: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-input bg-background rounded-lg outline-none focus:border-primary"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
              <button
                type="button"
                onClick={() => setIsPenaltyModalOpen(false)}
                className="px-4 py-2 border border-input text-sm rounded-lg hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/95"
              >
                Apply Changes
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Payment Proof View Modal */}
      <Modal
        isOpen={isProofModalOpen}
        onClose={() => {
          setIsProofModalOpen(false);
          setIsRejectMode(false);
        }}
        title={isRejectMode ? 'Reject Payment Transaction' : 'Verify Citizen Payment Proof'}
      >
        {selectedPayment && (
          <div className="space-y-4">
            {/* Payment Details */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-muted/30 p-3 rounded-lg border border-border">
              <div>Property: <strong className="text-foreground">{selectedPayment.property_number}</strong></div>
              <div>Owner: <strong className="text-foreground">{selectedPayment.owner_name}</strong></div>
              <div>FY: <strong className="text-foreground">{selectedPayment.financial_year}</strong></div>
              <div>Amount: <strong className="text-primary">₹{selectedPayment.amount}</strong></div>
              <div>Txn ID: <strong className="text-foreground">{selectedPayment.transaction_id}</strong></div>
              <div>Mode: <strong className="text-foreground">{selectedPayment.payment_mode}</strong></div>
            </div>

            {!isRejectMode ? (
              <div className="space-y-4">
                {/* Proof Image */}
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Uploaded Transaction Receipt Screenshot</span>
                  {selectedPayment.proof_url ? (
                    <img 
                      src={selectedPayment.proof_url} 
                      alt="Payment transaction screenshot upload" 
                      className="w-full max-h-80 object-contain rounded-lg border border-border"
                    />
                  ) : (
                    <div className="h-40 flex flex-col items-center justify-center border border-dashed rounded-lg text-muted-foreground">
                      <ImageIcon className="h-8 w-8 mb-1" />
                      <span className="text-xs font-medium">No screenshot uploaded. Verified manually.</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProofModalOpen(false);
                    }}
                    className="px-4 py-2 border border-input text-sm rounded-lg hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRejectMode(true);
                    }}
                    className="px-4 py-2 text-sm bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 font-semibold"
                  >
                    Reject Proof
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerifyPayment(selectedPayment)}
                    className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 font-semibold"
                  >
                    Confirm & Verify Payment
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRejectPayment} className="space-y-4">
                <div className="flex gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 text-xs">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                  <p>Rejections require a mandatory reason which will be visible on the citizen dashboard.</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                    Mandatory Rejection Reason *
                  </label>
                  <textarea
                    required
                    rows="3"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-input bg-background rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="e.g. Transaction ID mismatch / Screenshot is blur or incomplete / Insufficient transfer amount"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRejectMode(false);
                    }}
                    className="px-4 py-2 border border-input text-sm rounded-lg hover:bg-muted"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/95"
                  >
                    Reject Payment Proof
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TaxManagement;

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from '../../components/ui/Toast';
import { Bell, Search, AlertTriangle, CheckCircle, FileText, Plus, X, Trash2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';

const TaxNotices = () => {
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState([]);
  const [properties, setProperties] = useState([]);
  
  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('active'); // active, inactive, all

  // Manual Notice Modal
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [submittingNotice, setSubmittingNotice] = useState(false);
  const [noticeForm, setNoticeForm] = useState({
    propertyId: '',
    noticeType: 'Tax Due Soon',
    message: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: noteList, error: noteError } = await supabase.from('tax_notices').select('*');
      if (noteError) throw noteError;
      setNotices(noteList || []);

      const { data: props } = await supabase.from('properties').select('*').eq('status', 'Approved');
      setProperties(props || []);
    } catch (err) {
      toast.error('Failed to load notices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getPropertyNumber = (propId) => {
    const p = properties.find(prop => prop.id === propId);
    return p ? p.property_number : 'PROP-REF-NEW';
  };

  const getOwnerName = (propId) => {
    const p = properties.find(prop => prop.id === propId);
    return p ? p.owner_name : 'Citizen Owner';
  };

  // Toggle active status
  const handleToggleActive = async (id, currentVal) => {
    try {
      const { error } = await supabase
        .from('tax_notices')
        .update({ is_active: !currentVal })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Notice status updated successfully!`);
      setNotices(prev => prev.map(n => n.id === id ? { ...n, is_active: !currentVal } : n));
    } catch (err) {
      toast.error('Failed to toggle notice status.');
    }
  };

  // Delete Notice
  const handleDeleteNotice = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice permanently?')) return;
    try {
      const { error } = await supabase.from('tax_notices').delete().eq('id', id);
      if (error) throw error;
      toast.success('Notice deleted successfully.');
      setNotices(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      toast.error('Failed to delete notice.');
    }
  };

  // Submit Notice Form
  const handleSubmitNotice = async (e) => {
    e.preventDefault();
    const { propertyId, noticeType, message } = noticeForm;
    if (!propertyId || !message.trim()) {
      toast.error('Please complete all notice details.');
      return;
    }

    setSubmittingNotice(true);
    try {
      const { data, error } = await supabase.from('tax_notices').insert({
        property_id: propertyId,
        notice_type: noticeType,
        message: message.trim(),
        is_active: true
      }).select();

      if (error) throw error;

      toast.success('Tax notice generated and dispatched successfully!');
      setIsNoticeModalOpen(false);
      setNoticeForm({ propertyId: '', noticeType: 'Tax Due Soon', message: '' });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to dispatch notice.');
    } finally {
      setSubmittingNotice(false);
    }
  };

  // Filter lists
  const filteredNotices = notices.filter(n => {
    const propNum = getPropertyNumber(n.property_id);
    const ownerName = getOwnerName(n.property_id);

    const matchesSearch = 
      propNum.toLowerCase().includes(search.toLowerCase()) ||
      ownerName.toLowerCase().includes(search.toLowerCase()) ||
      n.message.toLowerCase().includes(search.toLowerCase());

    const matchesType = selectedType ? n.notice_type === selectedType : true;
    
    let matchesStatus = true;
    if (selectedStatus === 'active') matchesStatus = n.is_active === true;
    else if (selectedStatus === 'inactive') matchesStatus = n.is_active === false;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Notice & Alert Management</h2>
          <p className="text-sm text-muted-foreground">Issue warnings, due notices, penalties, and alert banners to active property owners.</p>
        </div>
        <button
          onClick={() => setIsNoticeModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 font-semibold text-xs transition-colors shadow-md shadow-primary/10 w-fit"
        >
          <Plus className="h-4 w-4" /> Issue Manual Notice
        </button>
      </div>

      {/* Filters Panel */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Property Code, Owner Name, Message..."
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Notice Type */}
        <div className="w-full md:w-48">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary"
          >
            <option value="">All Notice Types</option>
            <option value="Tax Due Soon">Tax Due Soon</option>
            <option value="Tax Overdue">Tax Overdue</option>
            <option value="Penalty Applied">Penalty Applied</option>
            <option value="Final Notice">Final Notice</option>
          </select>
        </div>

        {/* Status */}
        <div className="w-full md:w-44">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary"
          >
            <option value="all">All States</option>
            <option value="active">Active Alerts</option>
            <option value="inactive">Archived / Resolved</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center bg-card border border-border rounded-xl">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-muted font-bold text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-4">Property Code</th>
                  <th className="p-4">Owner Name</th>
                  <th className="p-4">Notice Type</th>
                  <th className="p-4">Alert Message</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredNotices.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-muted-foreground font-medium">No notices currently issued.</td>
                  </tr>
                ) : (
                  filteredNotices.map(n => (
                    <tr key={n.id} className="hover:bg-muted/5 transition-colors">
                      <td className="p-4 font-bold text-foreground">{getPropertyNumber(n.property_id)}</td>
                      <td className="p-4 font-semibold text-foreground">{getOwnerName(n.property_id)}</td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          n.notice_type === 'Final Notice' || n.notice_type === 'Tax Overdue'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400'
                        }`}>
                          {n.notice_type}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground font-medium max-w-sm truncate" title={n.message}>
                        {n.message}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          n.is_active
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {n.is_active ? 'Active Notice' : 'Archived'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleToggleActive(n.id, n.is_active)}
                          className={`inline-flex items-center px-2 py-1 text-[10px] rounded hover:bg-muted font-bold transition-all border border-border ${
                            n.is_active ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {n.is_active ? 'Archive' : 'Re-Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteNotice(n.id)}
                          className="inline-flex items-center p-1.5 text-destructive hover:bg-destructive/10 rounded transition-all"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Notice Creation Modal */}
      <Modal
        isOpen={isNoticeModalOpen}
        onClose={() => setIsNoticeModalOpen(false)}
        title="Disseminate New Tax Notice Alert"
      >
        <form onSubmit={handleSubmitNotice} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
              Select Target Property *
            </label>
            <select
              required
              value={noticeForm.propertyId}
              onChange={(e) => setNoticeForm({ ...noticeForm, propertyId: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-input bg-background rounded-lg outline-none focus:border-primary"
            >
              <option value="">Select Property Holding</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.property_number} - {p.owner_name} ({p.property_type})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
              Notice / Warning Classification *
            </label>
            <select
              required
              value={noticeForm.noticeType}
              onChange={(e) => setNoticeForm({ ...noticeForm, noticeType: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-input bg-background rounded-lg outline-none focus:border-primary"
            >
              <option value="Tax Due Soon">Tax Due Soon</option>
              <option value="Tax Overdue">Tax Overdue</option>
              <option value="Penalty Applied">Penalty Applied</option>
              <option value="Final Notice">Final Notice</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
              Alert Message *
            </label>
            <textarea
              required
              rows="4"
              value={noticeForm.message}
              onChange={(e) => setNoticeForm({ ...noticeForm, message: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="e.g. Warning: Property tax payment of ₹2,150 is overdue for Financial Year 2025-26. Final deadline: 2026-09-30."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
            <button
              type="button"
              onClick={() => setIsNoticeModalOpen(false)}
              className="px-4 py-2 border border-input text-xs rounded-lg hover:bg-muted font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingNotice}
              className="px-4 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 font-semibold transition-all disabled:opacity-50"
            >
              {submittingNotice ? 'Dispatching...' : 'Dispatch Alert Notice'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TaxNotices;

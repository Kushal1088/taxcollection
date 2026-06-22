import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from '../../components/ui/Toast';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  Building2, 
  History, 
  DollarSign, 
  Users 
} from 'lucide-react';

const Reports = () => {
  const [reportType, setReportType] = useState('properties');
  const [loading, setLoading] = useState(true);

  // Raw states
  const [properties, setProperties] = useState([]);
  const [payments, setPayments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [wards, setWards] = useState([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWard, setFilterWard] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Wards
      const { data: wardList } = await supabase.from('wards').select('*');
      if (wardList) setWards(wardList);

      // Properties
      const { data: propList } = await supabase.from('properties').select('*');
      if (propList) setProperties(propList);

      // Payments (Verified)
      const { data: payList } = await supabase.from('payments').select('*');
      if (payList) {
        const { data: records } = await supabase.from('tax_records').select('id, financial_year');
        const mergedPayments = payList.map(p => {
          const taxRec = records?.find(t => t.id === p.tax_record_id);
          const prop = propList?.find(pr => pr.id === taxRec?.property_id);
          return {
            ...p,
            financial_year: taxRec ? taxRec.financial_year : 'Unknown',
            property_number: prop ? prop.property_number : 'Unassigned',
            owner_name: prop ? prop.owner_name : 'Unknown'
          };
        });
        setPayments(mergedPayments);
      }

      // Audit Logs
      const { data: logs } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
      if (logs) {
        const { data: users } = await supabase.from('users').select('id, full_name');
        const mergedLogs = logs.map(l => {
          const usr = users?.find(u => u.id === l.performed_by);
          return {
            ...l,
            performed_by_name: usr ? usr.full_name : 'System/Trigger'
          };
        });
        setAuditLogs(mergedLogs);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [reportType]);

  // Handle simulated downloads
  const handleExportCSV = () => {
    let dataToExport = [];
    let headers = [];
    let filename = '';

    if (reportType === 'properties') {
      dataToExport = getFilteredProperties().map(p => ({
        PropertyNumber: p.property_number || 'PENDING',
        OwnerName: p.owner_name,
        OwnerPhone: p.owner_phone,
        Type: p.property_type,
        Occupancy: p.occupancy_status,
        Status: p.status,
        Address: p.address,
        City: p.city
      }));
      headers = ['PropertyNumber', 'OwnerName', 'OwnerPhone', 'Type', 'Occupancy', 'Status', 'Address', 'City'];
      filename = 'properties_registry_report.csv';
    } else if (reportType === 'payments') {
      dataToExport = getFilteredPayments().map(p => ({
        ReceiptNumber: p.receipt_number || 'PENDING',
        PropertyNumber: p.property_number,
        OwnerName: p.owner_name,
        Amount: p.amount,
        Date: new Date(p.payment_date).toLocaleDateString(),
        Mode: p.payment_mode,
        TxnID: p.transaction_id,
        Status: p.status
      }));
      headers = ['ReceiptNumber', 'PropertyNumber', 'OwnerName', 'Amount', 'Date', 'Mode', 'TxnID', 'Status'];
      filename = 'revenue_collection_report.csv';
    } else {
      dataToExport = getFilteredAuditLogs().map(l => ({
        Timestamp: new Date(l.timestamp).toLocaleString(),
        User: l.performed_by_name,
        Action: l.action,
        Table: l.table_name,
        RecordID: l.record_id
      }));
      headers = ['Timestamp', 'User', 'Action', 'Table', 'RecordID'];
      filename = 'system_audit_logs.csv';
    }

    if (dataToExport.length === 0) {
      toast.error('No data to export.');
      return;
    }

    // Convert to CSV string format
    const csvRows = [];
    csvRows.push(headers.join(','));
    for (const row of dataToExport) {
      const values = headers.map(header => {
        const escaped = ('' + row[header]).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`${filename} exported successfully.`);
  };

  // Filter Functions
  const getFilteredProperties = () => {
    return properties.filter(p => {
      const matchesSearch = p.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (p.property_number && p.property_number.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesWard = filterWard ? p.ward_id === filterWard : true;
      const matchesStatus = filterStatus ? p.status === filterStatus : true;
      return matchesSearch && matchesWard && matchesStatus;
    });
  };

  const getFilteredPayments = () => {
    return payments.filter(p => {
      const matchesSearch = p.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.property_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.transaction_id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus ? p.status === filterStatus : true;
      return matchesSearch && matchesStatus;
    });
  };

  const getFilteredAuditLogs = () => {
    return auditLogs.filter(l => {
      const matchesSearch = l.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
        l.performed_by_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.table_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Municipal Registry Reports</h2>
          <p className="text-sm text-muted-foreground">Generate registry reports, financial statements, and track system change trails.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 shadow-md shadow-primary/10 transition-all self-start sm:self-center"
        >
          <Download className="h-4 w-4" /> Export Report (CSV)
        </button>
      </div>

      {/* Select Report Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => {
            setReportType('properties');
            setFilterStatus('');
            setSearchQuery('');
            setFilterWard('');
          }}
          className={`p-4 rounded-xl border text-left space-y-2 transition-all hover:scale-[1.01] ${
            reportType === 'properties'
              ? 'bg-primary/5 border-primary shadow-sm shadow-primary/5'
              : 'bg-card border-border hover:bg-muted/10'
          }`}
        >
          <Building2 className={`h-6 w-6 ${reportType === 'properties' ? 'text-primary' : 'text-muted-foreground'}`} />
          <div>
            <h4 className="font-bold text-xs text-foreground uppercase tracking-wide">Properties Registry</h4>
            <span className="text-[10px] text-muted-foreground">List layouts, statuses, type distributions</span>
          </div>
        </button>

        <button
          onClick={() => {
            setReportType('payments');
            setFilterStatus('');
            setSearchQuery('');
          }}
          className={`p-4 rounded-xl border text-left space-y-2 transition-all hover:scale-[1.01] ${
            reportType === 'payments'
              ? 'bg-primary/5 border-primary shadow-sm shadow-primary/5'
              : 'bg-card border-border hover:bg-muted/10'
          }`}
        >
          <DollarSign className={`h-6 w-6 ${reportType === 'payments' ? 'text-primary' : 'text-muted-foreground'}`} />
          <div>
            <h4 className="font-bold text-xs text-foreground uppercase tracking-wide">Revenue Payments Log</h4>
            <span className="text-[10px] text-muted-foreground">Receipt collections, gateways, audit logs</span>
          </div>
        </button>

        <button
          onClick={() => {
            setReportType('audit');
            setSearchQuery('');
          }}
          className={`p-4 rounded-xl border text-left space-y-2 transition-all hover:scale-[1.01] ${
            reportType === 'audit'
              ? 'bg-primary/5 border-primary shadow-sm shadow-primary/5'
              : 'bg-card border-border hover:bg-muted/10'
          }`}
        >
          <History className={`h-6 w-6 ${reportType === 'audit' ? 'text-primary' : 'text-muted-foreground'}`} />
          <div>
            <h4 className="font-bold text-xs text-foreground uppercase tracking-wide">System Change Trail</h4>
            <span className="text-[10px] text-muted-foreground">Creation, edit & approval security logs</span>
          </div>
        </button>
      </div>

      {/* Filter Toolbox */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-input bg-background focus:border-primary outline-none"
            placeholder={
              reportType === 'properties' 
                ? 'Search owner name, property number...' 
                : reportType === 'payments' 
                  ? 'Search owner, txn ID, property...' 
                  : 'Search actions, tables, usernames...'
            }
          />
        </div>

        {/* Properties Ward Filter */}
        {reportType === 'properties' && (
          <select
            value={filterWard}
            onChange={(e) => setFilterWard(e.target.value)}
            className="w-full sm:w-44 px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none"
          >
            <option value="">All Wards</option>
            {wards.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        )}

        {/* Status Filter */}
        {reportType !== 'audit' && (
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-44 px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none"
          >
            <option value="">All Statuses</option>
            {reportType === 'properties' ? (
              <>
                <option value="Registration Pending">Registration Pending</option>
                <option value="Assigned To Collector">Assigned To Collector</option>
                <option value="Survey In Progress">Survey In Progress</option>
                <option value="Verification Completed">Verification Completed</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </>
            ) : (
              <>
                <option value="Pending Verification">Pending Verification</option>
                <option value="Verified">Verified</option>
                <option value="Rejected">Rejected</option>
              </>
            )}
          </select>
        )}
      </div>

      {/* Report Data Display */}
      {loading ? (
        <div className="flex h-60 items-center justify-center bg-card rounded-lg border border-border">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          {/* Properties Table */}
          {reportType === 'properties' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-muted/40 font-bold text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-4">Property No.</th>
                  <th className="p-4">Owner Name</th>
                  <th className="p-4">Mobile</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Occupancy</th>
                  <th className="p-4">City / Wards</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {getFilteredProperties().length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-muted-foreground">No properties match search criteria.</td>
                  </tr>
                ) : (
                  getFilteredProperties().map(p => (
                    <tr key={p.id} className="hover:bg-muted/5">
                      <td className="p-4 font-bold text-foreground">{p.property_number || 'PENDING'}</td>
                      <td className="p-4 font-semibold text-foreground">{p.owner_name}</td>
                      <td className="p-4 text-muted-foreground">{p.owner_phone}</td>
                      <td className="p-4 text-muted-foreground">{p.property_type}</td>
                      <td className="p-4 text-muted-foreground">{p.occupancy_status}</td>
                      <td className="p-4 text-muted-foreground">{p.city} (Ward: {wards.find(w => w.id === p.ward_id)?.name || 'N/A'})</td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          p.status === 'Approved' || p.status === 'Tax Active'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                            : p.status === 'Rejected'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* Payments Table */}
          {reportType === 'payments' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-muted/40 font-bold text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-4">Receipt No.</th>
                  <th className="p-4">Property No.</th>
                  <th className="p-4">Owner Name</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Mode</th>
                  <th className="p-4">Txn ID</th>
                  <th className="p-4">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {getFilteredPayments().length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-muted-foreground">No payments match search criteria.</td>
                  </tr>
                ) : (
                  getFilteredPayments().map(pay => (
                    <tr key={pay.id} className="hover:bg-muted/5">
                      <td className="p-4 font-bold text-foreground">{pay.receipt_number || 'PENDING'}</td>
                      <td className="p-4 font-bold text-foreground">{pay.property_number}</td>
                      <td className="p-4 font-medium text-foreground">{pay.owner_name}</td>
                      <td className="p-4 font-bold text-foreground">₹{pay.amount}</td>
                      <td className="p-4 text-muted-foreground">{new Date(pay.payment_date).toLocaleDateString()}</td>
                      <td className="p-4 text-muted-foreground">{pay.payment_mode}</td>
                      <td className="p-4 text-muted-foreground font-mono">{pay.transaction_id}</td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          pay.status === 'Verified'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                            : pay.status === 'Rejected'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400'
                        }`}>
                          {pay.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* Audit Logs Table */}
          {reportType === 'audit' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-muted/40 font-bold text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Affected Register</th>
                  <th className="p-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {getFilteredAuditLogs().length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-muted-foreground">No audit trails match search criteria.</td>
                  </tr>
                ) : (
                  getFilteredAuditLogs().map(log => (
                    <tr key={log.id} className="hover:bg-muted/5">
                      <td className="p-4 text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-4 font-semibold text-foreground">{log.performed_by_name}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-bold tracking-wide">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground uppercase">{log.table_name}</td>
                      <td className="p-4 font-mono text-[10px] text-muted-foreground max-w-sm truncate" title={JSON.stringify(log.new_values || {})}>
                        {JSON.stringify(log.new_values || {})}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;

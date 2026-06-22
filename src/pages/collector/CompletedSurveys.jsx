import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '../../components/ui/Toast';
import { CheckCircle, Search, Calendar, MapPin, Eye, Building2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';

const CompletedSurveys = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [search, setSearch] = useState('');
  
  // Selected Property details modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeProperty, setActiveProperty] = useState(null);

  const fetchCompletedSurveys = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch properties surveyed by this collector that are either approved, rejected, or pending final verification
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('collector_id', user.id)
        .in('status', ['Verification Completed', 'Approved', 'Rejected']);

      if (error) throw error;
      setProperties(data || []);
    } catch (err) {
      toast.error('Failed to load completed surveys.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedSurveys();
  }, [user]);

  const handleOpenDetails = (prop) => {
    setActiveProperty(prop);
    setIsDetailModalOpen(true);
  };

  // Filter properties
  const filteredProperties = properties.filter(p => {
    return (
      (p.property_number && p.property_number.toLowerCase().includes(search.toLowerCase())) ||
      (p.owner_name && p.owner_name.toLowerCase().includes(search.toLowerCase())) ||
      (p.address && p.address.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Completed Survey Audits</h2>
        <p className="text-sm text-muted-foreground">Historical ledger of physical property verification audits completed and submitted.</p>
      </div>

      {/* Filter bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search completed holdings by owner name, address, property code..."
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg text-xs bg-background focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Surveys List Table */}
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
                  <th className="p-4">Physical Site Address</th>
                  <th className="p-4">Date Completed</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProperties.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-muted-foreground font-medium">No completed surveys found.</td>
                  </tr>
                ) : (
                  filteredProperties.map(p => (
                    <tr key={p.id} className="hover:bg-muted/5 transition-colors">
                      <td className="p-4 font-bold text-foreground">{p.property_number || 'N/A (Pending)'}</td>
                      <td className="p-4 font-semibold text-foreground">{p.owner_name}</td>
                      <td className="p-4 text-muted-foreground max-w-xs truncate" title={p.address}>{p.address}</td>
                      <td className="p-4 text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(p.updated_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          p.status === 'Approved'
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                            : p.status === 'Rejected'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenDetails(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-border rounded hover:bg-muted font-semibold text-foreground"
                        >
                          <Eye className="h-3.5 w-3.5" /> View Details
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

      {/* Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Survey Inspection Summary"
        size="lg"
      >
        {activeProperty && (
          <div className="space-y-6 text-xs max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4 border-b border-border pb-4">
              <div>
                <span className="text-muted-foreground block mb-0.5">Owner Name:</span>
                <strong className="text-foreground text-sm">{activeProperty.owner_name}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block mb-0.5">Contact Phone:</span>
                <strong className="text-foreground text-sm">{activeProperty.owner_phone}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-b border-border pb-4">
              <div>
                <span className="text-muted-foreground block">Property Classification:</span>
                <strong className="text-foreground text-sm">{activeProperty.property_type}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block">Occupancy Status:</span>
                <strong className="text-foreground text-sm">{activeProperty.occupancy_status}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block">Floors Count / Year:</span>
                <strong className="text-foreground text-sm">{activeProperty.number_of_floors} Floors ({activeProperty.construction_year})</strong>
              </div>
              <div className="mt-2">
                <span className="text-muted-foreground block">Total / Built Area:</span>
                <strong className="text-foreground text-sm">{activeProperty.total_area} / {activeProperty.built_up_area} sqft</strong>
              </div>
              <div className="mt-2">
                <span className="text-muted-foreground block">GPS Coordinates:</span>
                <strong className="text-foreground text-sm">{activeProperty.latitude || '0'}, {activeProperty.longitude || '0'}</strong>
              </div>
            </div>

            <div>
              <span className="text-muted-foreground block mb-2 font-semibold">Survey Attachment References:</span>
              <div className="grid grid-cols-2 gap-4">
                {activeProperty.owner_photo_url && (
                  <div className="border rounded-lg p-2 bg-muted/10">
                    <span className="text-[10px] text-muted-foreground block mb-1">Owner Photograph:</span>
                    <img src={activeProperty.owner_photo_url} alt="Owner" className="max-h-36 object-contain mx-auto rounded border" />
                  </div>
                )}
                {activeProperty.aadhaar_url && (
                  <div className="border rounded-lg p-2 bg-muted/10">
                    <span className="text-[10px] text-muted-foreground block mb-1">Aadhaar Verification Copy:</span>
                    <img src={activeProperty.aadhaar_url} alt="Aadhaar" className="max-h-36 object-contain mx-auto rounded border" />
                  </div>
                )}
              </div>
            </div>

            {activeProperty.remarks && (
              <div className="bg-muted/40 p-3 rounded-lg border border-border">
                <span className="font-bold block text-foreground mb-1">Survey Remarks:</span>
                <p className="text-muted-foreground leading-normal">{activeProperty.remarks}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CompletedSurveys;

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from '../../components/ui/Toast';
import { Search, Filter, Eye, Plus, Building2, User, Phone, MapPin, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from '../../components/ui/Modal';

const PropertyManagement = () => {
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [wards, setWards] = useState([]);
  
  // Search & Filter
  const [search, setSearch] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Selected Property Modal Details
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeProperty, setActiveProperty] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: props, error: propsError } = await supabase.from('properties').select('*');
      if (propsError) throw propsError;
      setProperties(props || []);

      const { data: wrds } = await supabase.from('wards').select('*');
      setWards(wrds || []);
    } catch (err) {
      toast.error('Failed to load properties.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter properties
  const filteredProperties = properties.filter(p => {
    const matchesSearch = 
      (p.property_number && p.property_number.toLowerCase().includes(search.toLowerCase())) ||
      (p.owner_name && p.owner_name.toLowerCase().includes(search.toLowerCase())) ||
      (p.owner_phone && p.owner_phone.includes(search));

    const matchesWard = selectedWard ? p.ward_id === selectedWard : true;
    const matchesType = selectedType ? p.property_type === selectedType : true;
    const matchesStatus = selectedStatus ? p.status === selectedStatus : true;

    return matchesSearch && matchesWard && matchesType && matchesStatus;
  });

  const getWardName = (wardId) => {
    const w = wards.find(ward => ward.id === wardId);
    return w ? w.name : 'Unknown';
  };

  const handleOpenDetails = (prop) => {
    setActiveProperty(prop);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Property Management</h2>
          <p className="text-sm text-muted-foreground">Monitor, filter, and inspect all municipal property holdings.</p>
        </div>
        <Link
          to="/admin/properties/add"
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 font-semibold text-xs transition-colors shadow-md shadow-primary/10 w-fit"
        >
          <Plus className="h-4 w-4" /> Add New Property
        </Link>
      </div>

      {/* Filters Panel */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Property Code, Owner Name, Phone..."
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Ward Filter */}
        <div className="w-full md:w-48">
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary"
          >
            <option value="">All Wards</option>
            {wards.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="w-full md:w-44">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary"
          >
            <option value="">All Classifications</option>
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
            <option value="Industrial">Industrial</option>
            <option value="Mixed Use">Mixed Use</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-44">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary"
          >
            <option value="">All Statuses</option>
            <option value="Registration Pending">Registration Pending</option>
            <option value="Assigned To Collector">Assigned To Collector</option>
            <option value="Survey In Progress">Survey In Progress</option>
            <option value="Verification Completed">Verification Completed</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
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
                  <th className="p-4">Ward</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Built-Up Area</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProperties.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-muted-foreground font-medium">No properties found matching the selected criteria.</td>
                  </tr>
                ) : (
                  filteredProperties.map(p => (
                    <tr key={p.id} className="hover:bg-muted/5 transition-colors">
                      <td className="p-4 font-bold text-foreground">{p.property_number || 'N/A (Pending)'}</td>
                      <td className="p-4 font-semibold text-foreground">
                        <div>
                          <span>{p.owner_name}</span>
                          <span className="block text-[10px] text-muted-foreground font-normal mt-0.5">{p.owner_phone}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{getWardName(p.ward_id)}</td>
                      <td className="p-4 font-medium text-foreground">{p.property_type}</td>
                      <td className="p-4">{p.built_up_area || '0'} sqft</td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          p.status === 'Approved' || p.status === 'Tax Active'
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
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-border rounded hover:bg-muted text-foreground transition-all font-semibold"
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

      {/* Property Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Holding Detail Inspection"
        size="lg"
      >
        {activeProperty && (
          <div className="space-y-6 text-xs max-h-[75vh] overflow-y-auto pr-2">
            {/* Owner Details */}
            <div className="border-b border-border pb-4">
              <h4 className="font-bold text-sm text-primary mb-3 flex items-center gap-1.5">
                <User className="h-4 w-4" /> Owner Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-muted-foreground block mb-0.5">Owner Name:</span>
                  <strong className="text-foreground text-sm">{activeProperty.owner_name}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Owner Mobile:</span>
                  <strong className="text-foreground text-sm">{activeProperty.owner_phone}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Assigned Property ID:</span>
                  <strong className="text-foreground text-sm">{activeProperty.property_number || 'Pending Approval'}</strong>
                </div>
              </div>
            </div>

            {/* Structure Metrics */}
            <div className="border-b border-border pb-4">
              <h4 className="font-bold text-sm text-primary mb-3 flex items-center gap-1.5">
                <Building2 className="h-4 w-4" /> Structural Dimensions
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-muted-foreground block">Classification:</span>
                  <strong className="text-foreground text-sm">{activeProperty.property_type}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Usage Type:</span>
                  <strong className="text-foreground text-sm">{activeProperty.usage_type || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Occupancy Status:</span>
                  <strong className="text-foreground text-sm">{activeProperty.occupancy_status}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Construction Details:</span>
                  <strong className="text-foreground text-sm">{activeProperty.construction_type || 'N/A'}</strong>
                </div>
                <div className="mt-2">
                  <span className="text-muted-foreground block">Total Area (sqft):</span>
                  <strong className="text-foreground text-sm">{activeProperty.total_area} sqft</strong>
                </div>
                <div className="mt-2">
                  <span className="text-muted-foreground block">Built-Up Area (sqft):</span>
                  <strong className="text-foreground text-sm">{activeProperty.built_up_area} sqft</strong>
                </div>
                <div className="mt-2">
                  <span className="text-muted-foreground block">No of Floors:</span>
                  <strong className="text-foreground text-sm">{activeProperty.number_of_floors}</strong>
                </div>
                <div className="mt-2">
                  <span className="text-muted-foreground block">Construction Year:</span>
                  <strong className="text-foreground text-sm">{activeProperty.construction_year}</strong>
                </div>
              </div>
            </div>

            {/* Address Details */}
            <div className="border-b border-border pb-4">
              <h4 className="font-bold text-sm text-primary mb-3 flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> Location & Site Info
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground block">Site Location:</span>
                  <span className="text-foreground text-sm block font-medium leading-relaxed">{activeProperty.address}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground block">City:</span>
                    <strong className="text-foreground font-semibold">{activeProperty.city}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Pincode:</span>
                    <strong className="text-foreground font-semibold">{activeProperty.pincode}</strong>
                  </div>
                  <div className="mt-1">
                    <span className="text-muted-foreground block">Latitude:</span>
                    <strong className="text-foreground font-semibold">{activeProperty.latitude || 'N/A'}</strong>
                  </div>
                  <div className="mt-1">
                    <span className="text-muted-foreground block">Longitude:</span>
                    <strong className="text-foreground font-semibold">{activeProperty.longitude || 'N/A'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Image Attachments */}
            {(activeProperty.owner_photo_url || activeProperty.aadhaar_url) && (
              <div>
                <h4 className="font-bold text-sm text-primary mb-3">Verification Documents</h4>
                <div className="grid grid-cols-2 gap-4">
                  {activeProperty.owner_photo_url && (
                    <div className="border rounded-lg p-2 bg-muted/20">
                      <span className="text-muted-foreground block mb-2 font-semibold">Owner Photo:</span>
                      <img src={activeProperty.owner_photo_url} alt="Owner" className="max-h-48 object-contain rounded border border-border mx-auto" />
                    </div>
                  )}
                  {activeProperty.aadhaar_url && (
                    <div className="border rounded-lg p-2 bg-muted/20">
                      <span className="text-muted-foreground block mb-2 font-semibold">Aadhaar Proof:</span>
                      <img src={activeProperty.aadhaar_url} alt="Aadhaar" className="max-h-48 object-contain rounded border border-border mx-auto" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeProperty.remarks && (
              <div className="bg-muted/40 p-3 rounded-lg border border-border">
                <span className="font-bold block text-foreground mb-1">Surveyor Remarks:</span>
                <p className="text-muted-foreground leading-normal">{activeProperty.remarks}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PropertyManagement;

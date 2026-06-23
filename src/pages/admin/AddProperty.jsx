import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from '../../components/ui/Toast';
import { 
  Building2, 
  MapPin, 
  Camera, 
  Upload, 
  Save, 
  ArrowLeft,
  Phone,
  User,
  Plus
} from 'lucide-react';

const AddProperty = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Database states
  const [wards, setWards] = useState([]);
  const [citizens, setCitizens] = useState([]);

  // Form states
  const [formData, setFormData] = useState({
    ulb: '',
    propertyNumber: '',
    wardId: '',
    ownerPhone: '',
    ownerName: '',
    propertyType: 'Residential',
    usageType: 'Residential',
    constructionType: 'RCC',
    numberOfFloors: '1',
    constructionYear: '2020',
    occupancyStatus: 'Owner Occupied',
    status: 'Approved',
    address: '',
    city: '',
    state: '',
    pincode: '',
    totalArea: '',
    builtUpArea: '',
    latitude: '28.6139',
    longitude: '77.2090',
    remarks: ''
  });

  const [ownerPhoto, setOwnerPhoto] = useState(null);
  const [propertyPhoto, setPropertyPhoto] = useState(null);

  useEffect(() => {
    const loadFormData = async () => {
      // 1. Fetch Wards
      const { data: wardList } = await supabase.from('wards').select('*');
      if (wardList) setWards(wardList);

      // 2. Fetch Citizens to check existing details
      const { data: usersList } = await supabase.from('users').select('*').eq('role', 'citizen');
      if (usersList) setCitizens(usersList);
    };

    loadFormData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-fill owner name if phone matches an existing citizen
    if (name === 'ownerPhone' && value.length >= 10) {
      const existingCitizen = citizens.find(c => c.mobile_number === value);
      if (existingCitizen) {
        setFormData(prev => ({
          ...prev,
          ownerPhone: value,
          ownerName: existingCitizen.full_name
        }));
        toast.info(`Found existing citizen: ${existingCitizen.full_name}`);
      }
    }
  };

  // Simulated photo reader
  const handlePhotoUpload = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result);
        toast.success(`${file.name} uploaded successfully.`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const {
      ulb,
      propertyNumber,
      wardId,
      ownerPhone,
      ownerName,
      propertyType,
      usageType,
      constructionType,
      numberOfFloors,
      constructionYear,
      occupancyStatus,
      status,
      address,
      city,
      state,
      pincode,
      totalArea,
      builtUpArea,
      latitude,
      longitude,
      remarks
    } = formData;

    if (!ulb || !wardId || !ownerPhone || !ownerName || !address || !city || !state || !pincode || !totalArea) {
      toast.error('Please fill in all mandatory fields.');
      return;
    }

    setLoading(true);
    try {
      // 1. Check if owner exists in auth/users. If not, auto-create a mock user record.
      let citizenId = '';
      const existingCitizen = citizens.find(c => c.mobile_number === ownerPhone);
      
      if (existingCitizen) {
        citizenId = existingCitizen.id;
      } else {
        // Create new citizen user entry
        citizenId = 'usr_cit_' + Math.random().toString(36).substr(2, 9);
        const newEmail = `citizen_${ownerPhone}@gmail.com`;
        
        await supabase.from('users').insert({
          id: citizenId,
          full_name: ownerName,
          email: newEmail,
          mobile_number: ownerPhone,
          role: 'citizen',
          status: 'active'
        });
        toast.info(`Registered owner as a citizen account (${newEmail})`);
      }

      // 2. Select Ward Name
      const wardObj = wards.find(w => w.id === wardId);
      const wardName = wardObj ? wardObj.name : 'Ward 1';

      // 3. Assemble and Insert Property details
      const propPayload = {
        citizen_id: citizenId,
        ward_id: wardId,
        ulb,
        owner_name: ownerName,
        owner_phone: ownerPhone,
        owner_photo_url: ownerPhoto || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
        aadhaar_url: ownerPhoto || 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=400',
        property_type: propertyType,
        usage_type: usageType,
        construction_type: constructionType,
        number_of_floors: parseInt(numberOfFloors, 10),
        construction_year: parseInt(constructionYear, 10),
        occupancy_status: occupancyStatus,
        status: status, // Approved / pending_approval / active
        address,
        city,
        state,
        pincode,
        total_area: parseFloat(totalArea),
        built_up_area: builtUpArea ? parseFloat(builtUpArea) : parseFloat(totalArea),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        remarks,
        ward: wardName // mock DB fallback uses name directly
      };

      // If manual property number is defined, include it
      if (propertyNumber.trim()) {
        propPayload.property_number = propertyNumber.trim();
      }

      const { data: createdProps, error: propErr } = await supabase
        .from('properties')
        .insert(propPayload);

      if (propErr) throw propErr;

      toast.success('Property created and activated in registry!');
      navigate('/admin');
    } catch (err) {
      toast.error(err.message || 'Failed to create property.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-3">
        <Link 
          to="/admin" 
          className="p-2 border border-border bg-card rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <span>Dashboard</span> &gt; <span>Tax Management</span> &gt; <span>Property Tax</span> &gt; <span>Properties</span> &gt; <span className="font-medium text-foreground">Add Property</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground mt-1">Add New Property</h2>
          <p className="text-xs text-muted-foreground">Enter property and owner details below.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
        
        {/* Grid: Basic Info & Owner Photo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Block: Basic Info Fields */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b border-border pb-2 flex items-center gap-1.5 uppercase tracking-wide">
              <Building2 className="h-4 w-4 text-primary" /> Basic Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* ULB Selector */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">ULB *</label>
                <select
                  name="ulb"
                  required
                  value={formData.ulb}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
                >
                  <option value="">Select ULB</option>
                  <option value="Municipal Corporation Zone A">Municipal Corporation Zone A</option>
                  <option value="Municipal Corporation Zone B">Municipal Corporation Zone B</option>
                  <option value="Municipal Corporation Zone C">Municipal Corporation Zone C</option>
                </select>
              </div>

              {/* Property Number */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Property Number</label>
                <input
                  type="text"
                  name="propertyNumber"
                  value={formData.propertyNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
                  placeholder="Leave empty to auto-generate"
                />
              </div>

              {/* Ward Selector */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Ward *</label>
                <select
                  name="wardId"
                  required
                  value={formData.wardId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
                >
                  <option value="">Select Ward</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              {/* Owner Phone */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Owner Phone *</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    type="tel"
                    name="ownerPhone"
                    required
                    value={formData.ownerPhone}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
                    placeholder="+91 1234567890"
                  />
                </div>
              </div>

              {/* Owner Name */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Owner Name *</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    name="ownerName"
                    required
                    value={formData.ownerName}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
                    placeholder="Enter owner's full name"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Block: Photo Uploader */}
          <div className="border border-border bg-muted/10 rounded-xl p-6 space-y-4 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-foreground block">Owner Photo / Document</span>
              <span className="text-[10px] text-muted-foreground block">Passport-size image (JPG, PNG) or PDF, max 5MB</span>
            </div>
            
            <div className="flex-1 min-h-[120px] border border-dashed rounded-lg flex items-center justify-center bg-card/50 overflow-hidden mt-2 relative">
              {ownerPhoto ? (
                <img src={ownerPhoto} alt="Owner Preview" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="text-center text-xs text-muted-foreground">Photo preview here</div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e, setOwnerPhoto)}
                className="hidden"
                id="owner-doc-upload"
              />
              <label 
                htmlFor="owner-doc-upload"
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-input rounded-lg bg-card text-xs font-semibold hover:bg-muted cursor-pointer transition-colors"
              >
                <Upload className="h-4 w-4 text-muted-foreground" /> Choose File
              </label>
              <button
                type="button"
                onClick={() => toast.info('Camera integration mock triggered.')}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-input rounded-lg bg-card text-xs font-semibold hover:bg-muted transition-colors"
              >
                <Camera className="h-4 w-4 text-muted-foreground" /> Camera
              </button>
            </div>
          </div>
        </div>

        {/* Section: Property Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-foreground border-b border-border pb-2 flex items-center gap-1.5 uppercase tracking-wide">
            <Building2 className="h-4 w-4 text-primary" /> Property Details
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Property Type */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Property Type *</label>
              <select
                name="propertyType"
                value={formData.propertyType}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
                <option value="Mixed Use">Mixed Use</option>
              </select>
            </div>

            {/* Usage Type */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Usage Type</label>
              <select
                name="usageType"
                value={formData.usageType}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
              </select>
            </div>

            {/* Construction Type */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Construction Type</label>
              <select
                name="constructionType"
                value={formData.constructionType}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
              >
                <option value="RCC">RCC</option>
                <option value="Load Bearing">Load Bearing</option>
                <option value="Steel Frame">Steel Frame</option>
              </select>
            </div>

            {/* Number of Floors */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Number of Floors</label>
              <input
                type="number"
                name="numberOfFloors"
                value={formData.numberOfFloors}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
              />
            </div>

            {/* Construction Year */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Construction Year</label>
              <input
                type="number"
                name="constructionYear"
                value={formData.constructionYear}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
              />
            </div>

            {/* Occupancy Status */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Occupancy Status</label>
              <select
                name="occupancyStatus"
                value={formData.occupancyStatus}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
              >
                <option value="Owner Occupied">Owner Occupied</option>
                <option value="Rented">Rented</option>
                <option value="Vacant">Vacant</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary font-semibold text-primary"
              >
                <option value="Approved">Active</option>
                <option value="Registration Pending">Registration Pending</option>
                <option value="Tax Closed">Tax Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section: Address */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-foreground border-b border-border pb-2 flex items-center gap-1.5 uppercase tracking-wide">
            <MapPin className="h-4 w-4 text-primary" /> Address
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Address *</label>
              <textarea
                name="address"
                required
                rows="2"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Complete address"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">City *</label>
              <input
                type="text"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">State *</label>
              <input
                type="text"
                name="state"
                required
                value={formData.state}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Pincode *</label>
              <input
                type="text"
                name="pincode"
                required
                value={formData.pincode}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Section: Area Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-foreground border-b border-border pb-2 flex items-center gap-1.5 uppercase tracking-wide">
            Area Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Total Area (sq. meters) *</label>
              <input
                type="number"
                name="totalArea"
                required
                value={formData.totalArea}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Built-up Area (sq. meters)</label>
              <input
                type="number"
                name="builtUpArea"
                value={formData.builtUpArea}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Section: Geolocation */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-foreground border-b border-border pb-2 flex items-center gap-1.5 uppercase tracking-wide">
            Geolocation (Optional)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Latitude</label>
              <input
                type="text"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Longitude</label>
              <input
                type="text"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Section: Property Photos */}
        <div className="space-y-2 border border-dashed rounded-lg p-6 text-center">
          <span className="text-xs font-bold text-foreground block">Property Photos *</span>
          <span className="text-[10px] text-muted-foreground block mb-3">At least one photo required. Max 5MB per image (JPEG, PNG, GIF, WebP).</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handlePhotoUpload(e, setPropertyPhoto)}
            className="hidden"
            id="property-photo-upload"
          />
          <label 
            htmlFor="property-photo-upload"
            className="mx-auto inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/95 cursor-pointer shadow-md shadow-primary/10 transition-colors"
          >
            <Upload className="h-4 w-4" /> Choose File
          </label>
          {propertyPhoto && (
            <img src={propertyPhoto} alt="Property Preview" className="h-32 object-contain rounded-lg border border-border mx-auto mt-4" />
          )}
        </div>

        {/* Section: Remarks */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
            Remarks
          </label>
          <textarea
            name="remarks"
            rows="3"
            value={formData.remarks}
            onChange={handleChange}
            className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Any additional notes..."
          />
        </div>

        {/* Form Footer Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
          <Link
            to="/admin"
            className="px-5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary/95 transition-colors shadow-md shadow-primary/10"
          >
            <Plus className="h-4 w-4" />
            {loading ? 'Creating...' : 'Create Property'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default AddProperty;

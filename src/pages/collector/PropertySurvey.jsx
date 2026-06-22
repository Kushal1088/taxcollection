import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from '../../components/ui/Toast';
import { 
  Building2, 
  MapPin, 
  ArrowLeft, 
  Compass, 
  Upload, 
  FileText, 
  Save 
} from 'lucide-react';

const PropertySurvey = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    ulb: 'Municipal Corporation Zone A',
    ward: '',
    ownerName: '',
    ownerPhone: '',
    propertyType: 'Residential',
    usageType: 'Self Occupied',
    constructionType: 'RCC Framed Structure',
    numberOfFloors: '1',
    constructionYear: '2020',
    occupancyStatus: 'Owner Occupied',
    address: '',
    city: '',
    state: '',
    pincode: '',
    totalArea: '',
    builtUpArea: '',
    latitude: '',
    longitude: '',
    remarks: ''
  });

  // Mock Upload States
  const [ownerPhoto, setOwnerPhoto] = useState(null);
  const [aadhaarPhoto, setAadhaarPhoto] = useState(null);
  const [propertyPhotos, setPropertyPhotos] = useState([]);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      setLoading(true);
      try {
        const { data: prop } = await supabase.from('properties').select('*').eq('id', id).single();
        if (prop) {
          // Query ward name
          const { data: wrd } = await supabase.from('wards').select('*').eq('id', prop.ward_id).single();
          
          setFormData(prev => ({
            ...prev,
            ward: wrd ? wrd.name : 'Ward 1',
            ownerName: prop.owner_name || '',
            ownerPhone: prop.owner_phone || '',
            address: prop.address || '',
            city: prop.city || 'Metro City',
            state: prop.state || 'State A',
            pincode: prop.pincode || '',
            propertyType: prop.property_type || 'Residential',
            usageType: prop.usage_type || 'Self Occupied',
            constructionType: prop.construction_type || 'RCC Framed Structure',
            numberOfFloors: prop.number_of_floors ? prop.number_of_floors.toString() : '1',
            constructionYear: prop.construction_year ? prop.construction_year.toString() : '2020',
            occupancyStatus: prop.occupancy_status || 'Owner Occupied',
            totalArea: prop.total_area ? prop.total_area.toString() : '',
            builtUpArea: prop.built_up_area ? prop.built_up_area.toString() : '',
            latitude: prop.latitude ? prop.latitude.toString() : '',
            longitude: prop.longitude ? prop.longitude.toString() : '',
            remarks: prop.remarks || ''
          }));

          if (prop.owner_photo_url) setOwnerPhoto(prop.owner_photo_url);
          if (prop.aadhaar_url) setAadhaarPhoto(prop.aadhaar_url);
        }
      } catch (err) {
        toast.error('Failed to load property details.');
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyDetails();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // HTML5 Geolocation API
  const handleGetLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          }));
          toast.success('GPS coordinates retrieved successfully!');
        },
        (error) => {
          console.warn(error);
          // Fallback mockup coordinates
          setFormData(prev => ({
            ...prev,
            latitude: (19.0760 + (Math.random() - 0.5) * 0.01).toFixed(6),
            longitude: (72.8777 + (Math.random() - 0.5) * 0.01).toFixed(6)
          }));
          toast.info('Simulating GPS coordinates based on ward proximity.');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser.');
    }
  };

  // File Upload Helper (Read as Base64 data-uri for mock storage)
  const handleFileChange = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result);
      };
      reader.readAsDataURL(file);
      toast.success(`${file.name} uploaded successfully.`);
    }
  };

  const handleMultipleFilesChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPropertyPhotos(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
    toast.success(`${files.length} property photo(s) added.`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const {
      ulb,
      propertyType,
      usageType,
      constructionType,
      numberOfFloors,
      constructionYear,
      occupancyStatus,
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

    if (!address || !city || !state || !pincode || !totalArea || !builtUpArea) {
      toast.error('Please fill in all physical structure details.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('properties')
        .update({
          ulb,
          property_type: propertyType,
          usage_type: usageType,
          construction_type: constructionType,
          number_of_floors: parseInt(numberOfFloors, 10),
          construction_year: parseInt(constructionYear, 10),
          occupancy_status: occupancyStatus,
          address,
          city,
          state,
          pincode,
          total_area: parseFloat(totalArea),
          built_up_area: parseFloat(builtUpArea),
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          remarks,
          owner_photo_url: ownerPhoto,
          aadhaar_url: aadhaarPhoto,
          status: 'Verification Completed' // Shift status to Verification Completed
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Survey completed and uploaded for final Admin approval.');
      navigate('/collector/assigned');
    } catch (err) {
      toast.error(err.message || 'Failed to submit survey.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center gap-3">
        <Link 
          to="/collector/assigned"
          className="p-2 border border-border bg-card rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-foreground">Municipal Property Survey Form</h2>
          <p className="text-xs text-muted-foreground">Complete physical structural audit of the property.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-80 items-center justify-center bg-card rounded-lg border border-border">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8 bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
          
          {/* Section: Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b border-border pb-2 uppercase tracking-wide">
              1. Basic Location Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">ULB Zone Name</label>
                <input
                  type="text"
                  name="ulb"
                  value={formData.ulb}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-input bg-muted/30 rounded-lg outline-none cursor-not-allowed"
                  disabled
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Assigned Ward</label>
                <input
                  type="text"
                  value={formData.ward}
                  className="w-full px-3 py-2 text-xs border border-input bg-muted/30 rounded-lg outline-none cursor-not-allowed"
                  disabled
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Owner Name</label>
                <input
                  type="text"
                  value={formData.ownerName}
                  className="w-full px-3 py-2 text-xs border border-input bg-muted/30 rounded-lg outline-none cursor-not-allowed"
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Section: Structural Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b border-border pb-2 uppercase tracking-wide">
              2. Property Structural details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Usage Category</label>
                <input
                  type="text"
                  name="usageType"
                  value={formData.usageType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
                  placeholder="e.g. Tenanted / Self Occupied"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Occupancy Status *</label>
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

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Construction Type</label>
                <input
                  type="text"
                  name="constructionType"
                  value={formData.constructionType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
                  placeholder="e.g. RCC / Load Bearing"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Number of Floors *</label>
                <input
                  type="number"
                  name="numberOfFloors"
                  min="0"
                  required
                  value={formData.numberOfFloors}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Year of Construction *</label>
                <input
                  type="number"
                  name="constructionYear"
                  required
                  value={formData.constructionYear}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Section: Address & Dimensions */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b border-border pb-2 uppercase tracking-wide">
              3. Address & Geographical Dimensions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Property Site Address *</label>
                <input
                  type="text"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
                  placeholder="Plot details, street name, area"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">City / Municipality *</label>
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
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Total Plot Area (sqft) *</label>
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
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Total Built-Up Area (sqft) *</label>
                <input
                  type="number"
                  name="builtUpArea"
                  required
                  value={formData.builtUpArea}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Section: GPS Coordinates */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b border-border pb-2 uppercase tracking-wide">
              4. GPS Geolocation Alignment
            </h3>
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-muted/20 p-4 rounded-lg border border-border">
              <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Latitude</label>
                  <input
                    type="text"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none"
                    placeholder="Auto-capture latitude"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Longitude</label>
                  <input
                    type="text"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none"
                    placeholder="Auto-capture longitude"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleGetLocation}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/10"
              >
                <Compass className="h-4 w-4 animate-spin-slow" /> Capture GPS Coordinates
              </button>
            </div>
          </div>

          {/* Section: Document / Image Uploads */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b border-border pb-2 uppercase tracking-wide">
              5. Media Verification Attachments
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Owner Photo */}
              <div className="space-y-2 border border-dashed rounded-lg p-4 text-center">
                <span className="text-xs font-semibold text-foreground block">Owner Photograph *</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setOwnerPhoto)}
                  className="hidden"
                  id="owner-file"
                />
                <label 
                  htmlFor="owner-file"
                  className="mx-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                >
                  <Upload className="h-5 w-5" />
                </label>
                {ownerPhoto && (
                  <img src={ownerPhoto} alt="Owner preview" className="h-20 w-20 object-cover rounded-lg border border-border mx-auto" />
                )}
              </div>

              {/* Aadhaar Upload */}
              <div className="space-y-2 border border-dashed rounded-lg p-4 text-center">
                <span className="text-xs font-semibold text-foreground block">Aadhaar Card copy *</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setAadhaarPhoto)}
                  className="hidden"
                  id="aadhaar-file"
                />
                <label 
                  htmlFor="aadhaar-file"
                  className="mx-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                >
                  <Upload className="h-5 w-5" />
                </label>
                {aadhaarPhoto && (
                  <img src={aadhaarPhoto} alt="Aadhaar preview" className="h-20 w-20 object-cover rounded-lg border border-border mx-auto" />
                )}
              </div>

              {/* Property Photos */}
              <div className="space-y-2 border border-dashed rounded-lg p-4 text-center">
                <span className="text-xs font-semibold text-foreground block">Property Structure images *</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleMultipleFilesChange}
                  className="hidden"
                  id="prop-files"
                />
                <label 
                  htmlFor="prop-files"
                  className="mx-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                >
                  <Upload className="h-5 w-5" />
                </label>
                <span className="text-[10px] text-muted-foreground block">{propertyPhotos.length} photo(s) selected</span>
              </div>
            </div>
          </div>

          {/* Section: Remarks */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
              Field Surveyor Remarks / Audit Notes
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 text-xs border border-input bg-background rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Record structural condition, land registry validation notes, boundary confirmation..."
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
            <Link
              to="/collector/assigned"
              className="px-4 py-2.5 border border-input text-xs rounded-lg hover:bg-muted font-semibold"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg text-xs font-semibold shadow-md shadow-primary/15"
            >
              <Save className="h-4 w-4" />
              {submitting ? 'Uploading Survey...' : 'Verify & Submit Report'}
            </button>
          </div>

        </form>
      )}
    </div>
  );
};

export default PropertySurvey;

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  ClipboardList, 
  CheckCircle, 
  Clock, 
  ShieldAlert, 
  MapPin, 
  ChevronRight, 
  Calendar,
  Building2
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // States
  const [wardInfo, setWardInfo] = useState(null);
  const [stats, setStats] = useState({
    assigned: 0,
    pending: 0,
    completed: 0,
    rejected: 0
  });
  const [recentAssigned, setRecentAssigned] = useState([]);

  useEffect(() => {
    if (!user) return;

    const fetchCollectorDashboard = async () => {
      setLoading(true);
      try {
        // 1. Get collector details (ward assignment)
        const { data: colSpecs } = await supabase
          .from('collectors')
          .select('*')
          .eq('id', user.id)
          .single();

        if (colSpecs) {
          const { data: ward } = await supabase.from('wards').select('*').eq('id', colSpecs.ward_id).single();
          setWardInfo({
            wardName: ward ? ward.name : 'Unknown Ward',
            area: colSpecs.area
          });
        }

        // 2. Fetch properties associated with this collector
        const { data: props } = await supabase
          .from('properties')
          .select('*')
          .eq('collector_id', user.id);

        if (props) {
          const assigned = props.length;
          const pending = props.filter(p => p.status === 'Assigned To Collector' || p.status === 'Survey In Progress').length;
          const completed = props.filter(p => p.status === 'Verification Completed' || p.status === 'Approved' || p.status === 'Tax Active').length;
          const rejected = props.filter(p => p.status === 'Rejected').length;
          
          setStats({ assigned, pending, completed, rejected });

          // Recent pending surveys
          const recents = props
            .filter(p => p.status === 'Assigned To Collector' || p.status === 'Survey In Progress')
            .slice(0, 3);
          setRecentAssigned(recents);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCollectorDashboard();
  }, [user]);

  const cards = [
    { title: 'Total Assigned', value: stats.assigned, desc: 'All property assignments', icon: ClipboardList, color: 'bg-blue-500/10 text-primary' },
    { title: 'Pending Surveys', value: stats.pending, desc: 'Visits outstanding', icon: Clock, color: 'bg-amber-500/10 text-amber-500' },
    { title: 'Completed Audits', value: stats.completed, desc: 'Verified and submitted', icon: CheckCircle, color: 'bg-emerald-500/10 text-emerald-500' },
    { title: 'Rejected Audits', value: stats.rejected, desc: 'Requires re-survey', icon: ShieldAlert, color: 'bg-rose-500/10 text-destructive' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Collector Survey Center</h2>
        <p className="text-sm text-muted-foreground">Welcome back! Review assigned structures and log site verifications.</p>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center bg-card rounded-lg border border-border">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Ward Summary Panel */}
          {wardInfo && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary text-primary-foreground">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Assigned Administrative Jurisdiction</h4>
                  <p className="text-xs text-muted-foreground">{wardInfo.wardName} • Zone: {wardInfo.area}</p>
                </div>
              </div>
              <span className="text-[10px] bg-primary text-primary-foreground font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                Jurisdiction Locked
              </span>
            </div>
          )}

          {/* Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {cards.map((c, idx) => {
              const Icon = c.icon;
              return (
                <div key={idx} className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">{c.title}</span>
                    <div className={`p-1.5 rounded-lg ${c.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground leading-none">{c.value}</h3>
                  <p className="text-[9px] text-muted-foreground">{c.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Core Layout split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recents pending */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4 lg:col-span-2">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-primary" /> Urgent Outstanding Surveys
                </h4>
                <Link to="/collector/assigned" className="text-xs font-semibold text-primary flex items-center hover:underline">
                  View All <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="divide-y divide-border">
                {recentAssigned.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">No urgent surveys pending in your queue.</p>
                ) : (
                  recentAssigned.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-3.5 hover:bg-muted/5">
                      <div className="space-y-1">
                        <span className="font-bold text-sm text-foreground block">{item.owner_name}</span>
                        <span className="text-xs text-muted-foreground block flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-primary flex-shrink-0" />
                          {item.address}
                        </span>
                      </div>
                      <button
                        onClick={() => navigate(`/collector/survey/${item.id}`)}
                        className="text-xs font-semibold px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 shadow-sm"
                      >
                        Start Survey
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4 h-fit">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5 border-b border-border pb-3">
                <Building2 className="h-4 w-4 text-primary" /> Survey Guidelines
              </h4>
              <ul className="text-xs text-muted-foreground space-y-2.5 leading-relaxed list-disc pl-4">
                <li>Verify citizen ID proofs (Aadhaar cards) physically during inspection.</li>
                <li>Verify built-up area matching layout plan designs.</li>
                <li>Always capture high-resolution exterior structural photos.</li>
                <li>Make sure GPS coordinates are recorded while standing physically inside property boundaries.</li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;

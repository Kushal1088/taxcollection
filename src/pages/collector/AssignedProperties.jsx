import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  ClipboardList, 
  MapPin, 
  Phone, 
  AlertTriangle,
  Play,
  RotateCcw
} from 'lucide-react';

const AssignedProperties = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignedProperties = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('properties')
        .select('*')
        .eq('collector_id', user.id);

      if (data) {
        // Filter down to surveys needing attention (Assigned, In Progress, or Rejected)
        const activeSurveys = data.filter(p => 
          p.status === 'Assigned To Collector' || 
          p.status === 'Survey In Progress' || 
          p.status === 'Rejected'
        );
        setProperties(activeSurveys);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedProperties();
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Assigned Surveys Ledger</h2>
        <p className="text-sm text-muted-foreground">Select a citizen assignment to record geographical structures and verify identities.</p>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center bg-card rounded-lg border border-border">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-card p-4 rounded-lg border border-border text-sm font-semibold text-muted-foreground">
            Awaiting Inspection: {properties.length} Property Record(s)
          </div>

          <div className="grid grid-cols-1 gap-4">
            {properties.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-card rounded-lg border border-border text-center space-y-3">
                <ClipboardList className="h-12 w-12 text-muted-foreground/40" />
                <p className="font-semibold text-muted-foreground">Queue Completed!</p>
                <p className="text-xs text-muted-foreground">No pending properties need field surveys at the moment.</p>
              </div>
            ) : (
              properties.map((prop) => {
                const isReSurvey = prop.status === 'Rejected';
                return (
                  <div 
                    key={prop.id} 
                    className={`bg-card border rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                      isReSurvey ? 'border-destructive/30 bg-destructive/5' : 'border-border'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {isReSurvey ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-destructive/10 text-destructive uppercase">
                            <AlertTriangle className="h-3 w-3" /> Action: Re-Survey Required
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 uppercase">
                            New Assignment
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">Assigned: {new Date(prop.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      <h4 className="font-bold text-base text-foreground">{prop.owner_name}</h4>
                      
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          <span>{prop.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-primary" />
                          <span>Contact: {prop.owner_phone}</span>
                        </div>
                      </div>

                      {/* Display Rejection details */}
                      {isReSurvey && prop.rejection_reason && (
                        <div className="p-3 bg-card border border-destructive/20 rounded-lg text-xs text-destructive max-w-lg mt-2">
                          <strong>Admin Feedback:</strong> "{prop.rejection_reason}"
                        </div>
                      )}
                    </div>

                    <div>
                      <button
                        onClick={() => navigate(`/collector/survey/${prop.id}`)}
                        className={`w-full md:w-44 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold text-white transition-all shadow-md ${
                          isReSurvey 
                            ? 'bg-destructive hover:bg-destructive/90 shadow-destructive/10' 
                            : 'bg-primary hover:bg-primary/95 shadow-primary/10'
                        }`}
                      >
                        {isReSurvey ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        {isReSurvey ? 'Restart Survey' : 'Start Property Survey'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedProperties;

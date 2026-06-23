import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from '../../components/ui/Toast';
import { Settings as SettingsIcon, Save, Map, Shield, Plus, Trash2 } from 'lucide-react';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [wards, setWards] = useState([]);
  const [newWardName, setNewWardName] = useState('');
  const [savingTemplates, setSavingTemplates] = useState(false);
  const [submittingWard, setSubmittingWard] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: tpls, error: tplsError } = await supabase.from('tax_templates').select('*');
      if (tplsError) throw tplsError;
      setTemplates(tpls || []);

      const { data: wrds, error: wrdsError } = await supabase.from('wards').select('*');
      if (wrdsError) throw wrdsError;
      setWards(wrds || []);
    } catch (err) {
      toast.error('Failed to load system settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTemplateValueChange = (id, val) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, default_amount: parseFloat(val) || 0 } : t));
  };

  const handleSaveTemplates = async () => {
    setSavingTemplates(true);
    try {
      for (const tpl of templates) {
        const { error } = await supabase
          .from('tax_templates')
          .update({ default_amount: tpl.default_amount })
          .eq('id', tpl.id);
        if (error) throw error;
      }
      toast.success('Tax templates updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to save templates.');
    } finally {
      setSavingTemplates(false);
    }
  };

  const handleCreateWard = async (e) => {
    e.preventDefault();
    if (!newWardName.trim()) {
      toast.error('Ward name is required.');
      return;
    }

    setSubmittingWard(true);
    try {
      const { error } = await supabase.from('wards').insert({ name: newWardName.trim() });
      if (error) throw error;
      
      toast.success(`Ward "${newWardName}" added successfully.`);
      setNewWardName('');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to create ward.');
    } finally {
      setSubmittingWard(false);
    }
  };

  const handleDeleteWard = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ward? This may affect linked properties/collectors.')) return;
    try {
      const { error } = await supabase.from('wards').delete().eq('id', id);
      if (error) throw error;
      toast.success('Ward deleted successfully.');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete ward. Ensure no active references exist.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-primary" /> System Settings
        </h2>
        <p className="text-sm text-muted-foreground">Configure default municipal parameters, tax brackets, and administrative parameters.</p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center bg-card border border-border rounded-xl">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Tax Assessment Templates Card */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-primary" /> Global Tax Template Rates
              </h3>
              <span className="text-[10px] text-muted-foreground font-bold uppercase">Defaults</span>
            </div>

            <div className="space-y-4">
              {templates.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No tax templates found in database.</p>
              ) : (
                templates.map(tpl => (
                  <div key={tpl.id} className="flex justify-between items-center bg-muted/20 border p-3 rounded-lg">
                    <div>
                      <span className="font-bold text-sm text-foreground block">{tpl.property_type}</span>
                      <span className="text-[10px] text-muted-foreground block">Default FY tax generated on approval</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={tpl.default_amount}
                        onChange={(e) => handleTemplateValueChange(tpl.id, e.target.value)}
                        className="w-28 px-2 py-1.5 text-xs text-right font-bold border border-input rounded-md bg-background focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {templates.length > 0 && (
              <button
                onClick={handleSaveTemplates}
                disabled={savingTemplates}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 text-xs font-semibold shadow-md shadow-primary/10 transition-all disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {savingTemplates ? 'Saving Template Changes...' : 'Save Default Tax Changes'}
              </button>
            )}
          </div>

          {/* Ward Management Card */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6 h-fit">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Map className="h-4 w-4 text-primary" /> Ward Registry Index
              </h3>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded font-bold uppercase">
                {wards.length} Active
              </span>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleCreateWard} className="flex gap-2">
              <input
                type="text"
                required
                value={newWardName}
                onChange={(e) => setNewWardName(e.target.value)}
                placeholder="Enter Ward Name (e.g. Ward A / Zone 5)"
                className="flex-1 px-3 py-2 text-xs border border-input rounded-lg bg-background focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="submit"
                disabled={submittingWard}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-indigo-600/10 disabled:opacity-50"
              >
                <Plus className="h-4.5 w-4.5" /> Add
              </button>
            </form>

            {/* Ward List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {wards.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No wards currently registered.</p>
              ) : (
                wards.map(w => (
                  <div key={w.id} className="flex justify-between items-center p-2.5 border border-border/80 hover:bg-muted/10 rounded-lg transition-colors">
                    <span className="font-bold text-xs text-foreground">{w.name}</span>
                    <button
                      onClick={() => handleDeleteWard(w.id)}
                      className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors"
                      title="Delete Ward"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

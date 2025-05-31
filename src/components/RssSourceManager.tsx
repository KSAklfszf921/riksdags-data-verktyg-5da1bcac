
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Rss, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { Alert, AlertDescription } from './ui/alert';

interface RssSource {
  id: string;
  name: string;
  url: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const RssSourceManager = () => {
  const [sources, setSources] = useState<RssSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: ''
  });

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      const { data, error } = await supabase
        .from('rss_sources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSources(data || []);
    } catch (error) {
      console.error('Error loading RSS sources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        const { error } = await supabase
          .from('rss_sources')
          .update({
            name: formData.name,
            url: formData.url,
            description: formData.description || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('rss_sources')
          .insert({
            name: formData.name,
            url: formData.url,
            description: formData.description || null
          });

        if (error) throw error;
      }

      setFormData({ name: '', url: '', description: '' });
      setEditingId(null);
      setShowAddForm(false);
      loadSources();
    } catch (error) {
      console.error('Error saving RSS source:', error);
    }
  };

  const handleEdit = (source: RssSource) => {
    setFormData({
      name: source.name,
      url: source.url,
      description: source.description || ''
    });
    setEditingId(source.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna RSS källa?')) return;

    try {
      const { error } = await supabase
        .from('rss_sources')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadSources();
    } catch (error) {
      console.error('Error deleting RSS source:', error);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('rss_sources')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      loadSources();
    } catch (error) {
      console.error('Error updating RSS source status:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', url: '', description: '' });
    setEditingId(null);
    setShowAddForm(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-sm text-gray-500">Laddar RSS källor...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Rss className="w-5 h-5" />
              <span>RSS Källhantering</span>
            </div>
            <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
              <Plus className="w-4 h-4 mr-1" />
              Lägg till källa
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAddForm && (
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingId ? 'Redigera RSS källa' : 'Lägg till ny RSS källa'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Namn</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="t.ex. SVT Nyheter"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">RSS URL</label>
                    <Input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://example.com/rss.xml"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Beskrivning (valfritt)</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Beskrivning av RSS källan..."
                      rows={3}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button type="submit">
                      <Check className="w-4 h-4 mr-1" />
                      {editingId ? 'Uppdatera' : 'Lägg till'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      <X className="w-4 h-4 mr-1" />
                      Avbryt
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {sources.length === 0 ? (
            <Alert>
              <AlertDescription>
                Inga RSS källor hittades. Lägg till din första RSS källa för att komma igång.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {sources.map((source) => (
                <Card key={source.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium">{source.name}</h3>
                          <Badge variant={source.is_active ? "default" : "secondary"}>
                            {source.is_active ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{source.url}</p>
                        {source.description && (
                          <p className="text-sm text-gray-500 mt-1">{source.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Skapad: {new Date(source.created_at).toLocaleDateString('sv-SE')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={source.is_active}
                          onCheckedChange={(checked) => toggleActive(source.id, checked)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(source)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(source.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RssSourceManager;

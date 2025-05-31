
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Newspaper, ExternalLink, Clock, AlertCircle, Loader2, Database, Wifi, WifiOff, CheckCircle, RefreshCw, Download } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useToast } from './ui/use-toast';

interface NewsItem {
  title: string;
  link: string;
  pub_date: string;
  description: string;
  image_url?: string;
  created_at?: string;
}

interface FormattedNewsItem {
  member_name: string;
  title: string;
  headline: string;
  body: string;
  image_url: string | null;
  link: string;
  source: string;
  pub_date: string;
}

interface MemberNewsFieldProps {
  memberName: string;
  memberId: string;
  maxItems?: number;
}

const MemberNewsField = ({ memberName, memberId, maxItems = 5 }: MemberNewsFieldProps) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [formattedItems, setFormattedItems] = useState<FormattedNewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'database' | 'live' | 'cache'>('database');
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const { toast } = useToast();

  // Fetch news from database
  const fetchNewsFromDatabase = async () => {
    console.log(`Fetching news from database for ${memberName} (${memberId})`);
    
    try {
      const { data, error } = await supabase
        .from('member_news')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(maxItems);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      if (data && data.length > 0) {
        console.log(`Found ${data.length} news items in database`);
        const formattedNews: NewsItem[] = data.map(item => ({
          title: item.title,
          link: item.link,
          pub_date: item.pub_date,
          description: item.description || '',
          image_url: item.image_url || undefined,
          created_at: item.created_at
        }));
        setNewsItems(formattedNews);
        setDataSource('database');
        setLastFetchTime(new Date(data[0].created_at));
        return true;
      } else {
        console.log('No news found in database');
        return false;
      }
    } catch (err) {
      console.error('Error fetching from database:', err);
      return false;
    }
  };

  // Fetch news via edge function
  const fetchNewsFromAPI = async (manualFetch = false) => {
    console.log(`Fetching news via edge function for ${memberName} (${memberId})`);
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-member-news', {
        body: { memberName, memberId, manualFetch }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data?.newsItems && data.newsItems.length > 0) {
        console.log(`Successfully fetched ${data.newsItems.length} news items via API`);
        
        const formattedNews: NewsItem[] = data.newsItems.map((item: any) => ({
          title: item.title,
          link: item.link,
          pub_date: item.pubDate,
          description: item.description || '',
          image_url: item.imageUrl
        }));
        
        setNewsItems(formattedNews);
        setFormattedItems(data.formattedItems || []);
        setDataSource(data.source === 'cache' ? 'cache' : 'live');
        setLastFetchTime(new Date());
        
        // Show success message with storage info
        if (data.stored && data.stored > 0) {
          const message = `${data.stored} nya artiklar sparades i databasen`;
          setSuccess(message);
          toast({
            title: "Nyheter uppdaterade",
            description: message,
          });
          setTimeout(() => setSuccess(null), 5000);
        }
        
        // Refresh database data after successful API fetch if it was live data
        if (data.source !== 'cache') {
          setTimeout(() => fetchNewsFromDatabase(), 2000);
        }
        
        return true;
      } else {
        console.log('No news items returned from API');
        if (data?.error) {
          throw new Error(data.error);
        }
        return false;
      }
    } catch (err) {
      console.error('Error fetching from API:', err);
      throw err;
    }
  };

  // Main fetch function
  const fetchNews = async (forceRefresh = false, manualFetch = false) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // If manual fetch requested, always go to API
      if (manualFetch) {
        await fetchNewsFromAPI(true);
        toast({
          title: "Manuell hämtning slutförd",
          description: "Nyheter har hämtats direkt från RSS-flödet",
        });
      } else if (!forceRefresh) {
        // Try database first if not force refresh
        const dbSuccess = await fetchNewsFromDatabase();
        if (dbSuccess) {
          setLoading(false);
          return;
        }
        // If nothing in database, fetch via API
        await fetchNewsFromAPI(false);
      } else {
        // Force refresh - go directly to API
        await fetchNewsFromAPI(false);
      }
      
    } catch (err) {
      console.error('Error in fetchNews:', err);
      
      let errorMessage = 'Okänt fel uppstod';
      
      if (err instanceof Error) {
        if (err.message.includes('403') || err.message.includes('Forbidden')) {
          errorMessage = 'Åtkomst nekad - Google News blockerar förfrågningar för tillfället';
        } else if (err.message.includes('429') || err.message.includes('Rate limit')) {
          errorMessage = 'För många förfrågningar - vänta en stund innan du försöker igen';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Tidsgräns överskreds - Google News svarar långsamt';
        } else if (err.message.includes('CORS')) {
          errorMessage = 'CORS-fel - kan inte komma åt nyheterna från denna webbläsare';
        } else if (err.message.includes('Network')) {
          errorMessage = 'Nätverksfel - kontrollera din internetanslutning';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(`Kunde inte hämta nyheter: ${errorMessage}`);
      toast({
        title: "Fel vid hämtning",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Get source icon
  const getSourceIcon = () => {
    switch (dataSource) {
      case 'cache':
        return <WifiOff className="w-3 h-3 mr-1" />;
      case 'live':
        return <Wifi className="w-3 h-3 mr-1" />;
      default:
        return <Database className="w-3 h-3 mr-1" />;
    }
  };

  // Get source text
  const getSourceText = () => {
    switch (dataSource) {
      case 'cache':
        return 'Cache';
      case 'live':
        return 'Live RSS';
      default:
        return 'Databas';
    }
  };

  // Fetch news when component loads
  useEffect(() => {
    if (memberName && memberId) {
      fetchNews();
    }
  }, [memberName, memberId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Newspaper className="w-5 h-5" />
            <span>Senaste nyheterna</span>
            <Badge variant="outline" className="text-xs">
              {getSourceIcon()}
              {getSourceText()}
            </Badge>
            {lastFetchTime && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {formatDate(lastFetchTime.toISOString())}
              </Badge>
            )}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchNews(false)}
              disabled={loading}
              className="flex items-center space-x-1"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Database className="w-4 h-4" />
              )}
              <span className="text-sm">Databas</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchNews(true)}
              disabled={loading}
              className="flex items-center space-x-1"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="text-sm">Uppdatera</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchNews(false, true)}
              disabled={loading}
              className="flex items-center space-x-1"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="text-sm">Manuell hämtning</span>
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          </div>
        )}
        
        {loading && newsItems.length === 0 ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Hämtar senaste nyheterna...</p>
          </div>
        ) : error && newsItems.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-4" />
            <p className="text-orange-600 text-sm mb-4">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchNews(true)}
              disabled={loading}
              className="mt-2"
            >
              Försök igen
            </Button>
          </div>
        ) : newsItems.length === 0 ? (
          <div className="text-center py-8">
            <Newspaper className="w-8 h-8 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Inga nyheter tillgängliga</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchNews(false, true)}
              disabled={loading}
              className="mt-2"
            >
              Hämta nyheter manuellt
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                <p className="text-orange-700 text-sm">{error}</p>
              </div>
            )}
            {newsItems.map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full md:w-32 h-24 object-cover rounded-md"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-blue-600 hover:underline mb-2">
                      {item.link !== '#' ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1"
                        >
                          <span>{item.title}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span>{item.title}</span>
                      )}
                    </h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(item.pub_date)}</span>
                      {item.created_at && dataSource === 'database' && (
                        <>
                          <span>•</span>
                          <span className="text-xs">Sparad: {formatDate(item.created_at)}</span>
                        </>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MemberNewsField;

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Newspaper, ExternalLink, Clock, AlertCircle, Loader2, Database, Wifi, WifiOff, CheckCircle } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';

interface NewsItem {
  title: string;
  link: string;
  pub_date: string;
  description: string;
  image_url?: string;
  created_at?: string;
}

interface MemberNewsFieldProps {
  memberName: string;
  memberId: string;
  maxItems?: number;
}

interface DatabaseNewsItem {
  id: string;
  member_id: string;
  title: string;
  link: string;
  pub_date: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

const MemberNewsField = ({ memberName, memberId, maxItems = 5 }: MemberNewsFieldProps) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'database' | 'live' | 'cache'>('database');
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Hämta nyheter från databasen
  const fetchNewsFromDatabase = async () => {
    console.log(`Fetching news from database for ${memberName} (${memberId})`);
    
    try {
      const { data, error } = await supabase
        .from('member_news')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(maxItems) as { data: DatabaseNewsItem[] | null; error: any };

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

  // Hämta nyheter via edge function
  const fetchNewsFromAPI = async () => {
    console.log(`Fetching news via edge function for ${memberName} (${memberId})`);
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-member-news', {
        body: { memberName, memberId }
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
        setDataSource(data.source === 'cache' ? 'cache' : 'live');
        setLastFetchTime(new Date());
        
        // Show success message with storage info
        if (data.stored && data.stored > 0) {
          setSuccess(`${data.stored} nya artiklar sparades i databasen`);
          setTimeout(() => setSuccess(null), 5000);
        }
        
        // Refresh database data after successful API fetch if it was live data
        if (data.source !== 'cache') {
          setTimeout(() => fetchNewsFromDatabase(), 2000);
        }
        
        return true;
      } else {
        console.log('No news items returned from API');
        return false;
      }
    } catch (err) {
      console.error('Error fetching from API:', err);
      throw err;
    }
  };

  // Huvudfunktion för att hämta nyheter
  const fetchNews = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Försök först med databasen om inte force refresh
      if (!forceRefresh) {
        const dbSuccess = await fetchNewsFromDatabase();
        if (dbSuccess) {
          setLoading(false);
          setRetryCount(0);
          return;
        }
      }
      
      // Om inget i databasen eller force refresh, hämta via API
      await fetchNewsFromAPI();
      setRetryCount(0);
      
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
      setRetryCount(prev => prev + 1);
      
      // Visa mockdata som fallback vid upprepade fel
      if (retryCount >= 2) {
        const mockNews: NewsItem[] = [
          {
            title: `Senaste nyheterna om ${memberName} kommer snart`,
            link: '#',
            pub_date: new Date().toISOString(),
            description: 'Nyhetsflödet är tillfälligt otillgängligt. Försök igen senare.',
          }
        ];
        setNewsItems(mockNews);
        setDataSource('database');
      }
    } finally {
      setLoading(false);
    }
  };

  // Formatera datum
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

  // Få rätt ikon för datakälla
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

  // Få rätt text för datakälla
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

  // Hämta nyheter när komponenten laddas
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
                <Wifi className="w-4 h-4" />
              )}
              <span className="text-sm">Uppdatera</span>
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
            {retryCount > 0 && (
              <p className="text-sm text-orange-500 mt-2">
                Försök {retryCount + 1} - detta kan ta lite tid...
              </p>
            )}
          </div>
        ) : error && newsItems.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-4" />
            <p className="text-orange-600 text-sm mb-4">{error}</p>
            <div className="text-xs text-gray-500 mb-4">
              Tips: Nyhetsflödet kan vara tillfälligt otillgängligt på grund av Google News begränsningar.
              {retryCount > 0 && ` (${retryCount} misslyckade försök)`}
            </div>
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

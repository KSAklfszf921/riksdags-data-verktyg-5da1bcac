
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Newspaper, ExternalLink, Clock, AlertCircle, Loader2 } from 'lucide-react';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  imageUrl?: string;
}

interface MemberNewsFieldProps {
  memberName: string;
  maxItems?: number;
}

const MemberNewsField = ({ memberName, maxItems = 5 }: MemberNewsFieldProps) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Funktion för att skapa Google News RSS-URL
  const createGoogleNewsRssUrl = (name: string) => {
    const encodedName = encodeURIComponent(`"${name}"`);
    return `https://news.google.com/rss/search?q=${encodedName}&hl=sv&gl=SE`;
  };

  // Funktion för att extrahera bild från beskrivning
  const extractImageFromDescription = (description: string): string | undefined => {
    const imgMatch = description.match(/<img[^>]+src=["'](.*?)["']/i);
    return imgMatch ? imgMatch[1] : undefined;
  };

  // Funktion för att rensa HTML från text
  const cleanHtmlFromText = (htmlText: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlText;
    const cleanText = tempDiv.textContent || tempDiv.innerText || '';
    return cleanText.substring(0, 150) + (cleanText.length > 150 ? '...' : '');
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

  // Hämta nyheter
  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const rssUrl = createGoogleNewsRssUrl(memberName);
      console.log(`Fetching news for ${memberName} from RSS: ${rssUrl}`);
      
      // Använd CORS-proxy för att undvika CORS-problem
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(rssUrl)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      
      // Parsa XML
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'text/xml');
      
      // Kontrollera om XML är giltigt
      const parseError = xml.querySelector('parsererror');
      if (parseError) {
        throw new Error('Invalid XML response from RSS feed');
      }
      
      const items = xml.querySelectorAll('item');
      
      if (items.length === 0) {
        setNewsItems([]);
        setError(`Inga nyheter hittades för ${memberName}`);
        return;
      }
      
      const newsData: NewsItem[] = [];
      
      // Begränsa till maxItems antal
      const itemsToProcess = Math.min(items.length, maxItems);
      
      for (let i = 0; i < itemsToProcess; i++) {
        const item = items[i];
        const title = item.querySelector('title')?.textContent || 'Ingen titel';
        const link = item.querySelector('link')?.textContent || '#';
        const pubDate = item.querySelector('pubDate')?.textContent || '';
        const description = item.querySelector('description')?.textContent || '';
        const imageUrl = extractImageFromDescription(description);
        
        newsData.push({
          title,
          link,
          pubDate,
          description: cleanHtmlFromText(description),
          imageUrl
        });
      }
      
      setNewsItems(newsData);
      console.log(`Successfully fetched ${newsData.length} news items for ${memberName}`);
      
    } catch (err) {
      console.error('Error fetching news:', err);
      const errorMessage = err instanceof Error ? err.message : 'Okänt fel uppstod';
      setError(`Kunde inte hämta nyheter: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Hämta nyheter när komponenten laddas
  useEffect(() => {
    if (memberName) {
      fetchNews();
    }
  }, [memberName]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Newspaper className="w-5 h-5" />
            <span>Senaste nyheterna</span>
            <Badge variant="outline" className="text-xs">
              Google News
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchNews}
            disabled={loading}
            className="flex items-center space-x-1"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="text-sm">Uppdatera</span>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && newsItems.length === 0 ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Hämtar senaste nyheterna...</p>
          </div>
        ) : error && newsItems.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchNews}
              className="mt-4"
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
            {newsItems.map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
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
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1"
                      >
                        <span>{item.title}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(item.pubDate)}</span>
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

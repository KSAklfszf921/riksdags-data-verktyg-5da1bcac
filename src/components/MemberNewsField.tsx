
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

  // Lista över CORS-proxies att testa
  const corsProxies = [
    'https://corsproxy.io/?',
    'https://cors-anywhere.herokuapp.com/',
    'https://api.allorigins.win/get?url=',
    'https://cors.isomorphic-git.org/'
  ];

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

  // Försök hämta med olika proxies
  const tryFetchWithProxy = async (proxyUrl: string, rssUrl: string) => {
    let finalUrl;
    
    if (proxyUrl.includes('allorigins')) {
      finalUrl = `${proxyUrl}${encodeURIComponent(rssUrl)}`;
    } else {
      finalUrl = `${proxyUrl}${encodeURIComponent(rssUrl)}`;
    }

    console.log(`Trying proxy: ${proxyUrl} with URL: ${finalUrl}`);
    
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    let text = await response.text();
    
    // Hantera allorigins-format
    if (proxyUrl.includes('allorigins')) {
      try {
        const jsonResponse = JSON.parse(text);
        text = jsonResponse.contents;
      } catch (e) {
        console.log('Not allorigins JSON format, using text directly');
      }
    }

    return text;
  };

  // Hämta nyheter med fallback-strategi
  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const rssUrl = createGoogleNewsRssUrl(memberName);
      console.log(`Fetching news for ${memberName} from RSS: ${rssUrl}`);
      
      let xmlText = null;
      let lastError = null;

      // Försök med olika CORS-proxies
      for (const proxy of corsProxies) {
        try {
          xmlText = await tryFetchWithProxy(proxy, rssUrl);
          console.log(`Successfully fetched with proxy: ${proxy}`);
          break;
        } catch (err) {
          console.log(`Failed with proxy ${proxy}:`, err);
          lastError = err;
          continue;
        }
      }

      if (!xmlText) {
        throw lastError || new Error('Alla CORS-proxies misslyckades');
      }
      
      // Parsa XML
      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlText, 'text/xml');
      
      // Kontrollera om XML är giltigt
      const parseError = xml.querySelector('parsererror');
      if (parseError) {
        console.error('XML Parse Error:', parseError.textContent);
        throw new Error('Ogiltig XML-respons från RSS-flödet');
      }
      
      const items = xml.querySelectorAll('item');
      console.log(`Found ${items.length} news items`);
      
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
      let errorMessage = 'Okänt fel uppstod';
      
      if (err instanceof Error) {
        if (err.message.includes('403')) {
          errorMessage = 'Åtkomst nekad - Google News blockerar förfrågningar för tillfället';
        } else if (err.message.includes('CORS')) {
          errorMessage = 'CORS-fel - kan inte komma åt nyheterna från denna webbläsare';
        } else if (err.message.includes('Network')) {
          errorMessage = 'Nätverksfel - kontrollera din internetanslutning';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(`Kunde inte hämta nyheter: ${errorMessage}`);
      
      // Visa mockdata som fallback
      const mockNews: NewsItem[] = [
        {
          title: `Senaste nyheterna om ${memberName} kommer snart`,
          link: '#',
          pubDate: new Date().toISOString(),
          description: 'Nyhetsflödet är tillfälligt otillgängligt. Försök igen senare.',
        }
      ];
      setNewsItems(mockNews);
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
            <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-4" />
            <p className="text-orange-600 text-sm mb-4">{error}</p>
            <div className="text-xs text-gray-500 mb-4">
              Tips: Nyhetsflödet kan vara tillfälligt otillgängligt på grund av Google News begränsningar.
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchNews}
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

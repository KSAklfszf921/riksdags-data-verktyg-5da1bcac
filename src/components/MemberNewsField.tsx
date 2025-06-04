
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Newspaper,
  ExternalLink,
  Calendar,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface NewsItem {
  title: string;
  link: string;
  pub_date: string;
  description: string;
  image_url?: string;
}

interface MemberNewsFieldProps {
  memberId: string;
  memberName: string;
}

const MemberNewsField = ({ memberId, memberName }: MemberNewsFieldProps) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMemberNews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock data for now since we removed the news functionality
      const mockNews: NewsItem[] = [
        {
          title: `Senaste aktiviteter för ${memberName}`,
          link: '#',
          pub_date: new Date().toISOString(),
          description: 'Ingen aktuell nyhetsinformation tillgänglig för närvarande.',
          image_url: undefined
        }
      ];
      
      setNews(mockNews);
    } catch (err) {
      setError('Kunde inte hämta nyheter för ledamoten');
      console.error('Error fetching member news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (memberId && memberName) {
      fetchMemberNews();
    }
  }, [memberId, memberName]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Hämtar nyheter...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchMemberNews} variant="outline">
            Försök igen
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Newspaper className="w-5 h-5" />
          <span>Senaste Nyheter</span>
          <Badge variant="secondary">{news.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {news.length === 0 ? (
          <div className="text-center py-8">
            <Newspaper className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Inga nyheter tillgängliga</p>
            <Button onClick={fetchMemberNews} variant="outline">
              Uppdatera
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {news.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium text-gray-900 flex-1">
                    {item.title}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(item.pub_date).toLocaleDateString('sv-SE')}
                  </Badge>
                </div>
                
                {item.description && (
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {item.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    {item.image_url && (
                      <img 
                        src={item.image_url} 
                        alt={item.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => item.link !== '#' && window.open(item.link, '_blank')}
                    disabled={item.link === '#'}
                    className="flex items-center space-x-1"
                  >
                    <span>Läs mer</span>
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            <div className="text-center pt-4">
              <Button onClick={fetchMemberNews} variant="outline" size="sm">
                <Newspaper className="w-4 h-4 mr-2" />
                Uppdatera nyheter
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MemberNewsField;


import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, ChevronRight, Loader2 } from "lucide-react";
import { 
  fetchUpcomingEvents, 
  formatEventDate, 
  formatEventTime, 
  isEventToday, 
  type CachedCalendarData 
} from '../services/cachedCalendarApi';
import { useNavigate } from 'react-router-dom';

const UpcomingEventsWidget = () => {
  const [events, setEvents] = useState<CachedCalendarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUpcomingEvents();
  }, []);

  const loadUpcomingEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await fetchUpcomingEvents(7); // Next 7 days
      setEvents(result.slice(0, 6)); // Show max 6 events
    } catch (err) {
      setError('Kunde inte hämta kommande händelser');
      console.error('Error loading upcoming events:', err);
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeColor = (organ: string) => {
    const colors: { [key: string]: string } = {
      'kamm': 'bg-blue-100 text-blue-800',
      'AU': 'bg-green-100 text-green-800',
      'CU': 'bg-purple-100 text-purple-800',
      'FiU': 'bg-red-100 text-red-800',
      'FöU': 'bg-orange-100 text-orange-800',
      'JuU': 'bg-indigo-100 text-indigo-800',
      'KU': 'bg-pink-100 text-pink-800',
      'KrU': 'bg-yellow-100 text-yellow-800',
      'MjU': 'bg-emerald-100 text-emerald-800',
      'NU': 'bg-cyan-100 text-cyan-800',
    };
    return colors[organ] || 'bg-gray-100 text-gray-800';
  };

  const formatEventDateShort = (dateString: string | null) => {
    if (!dateString) return 'Okänt datum';
    
    try {
      const date = new Date(dateString);
      if (isEventToday(dateString)) {
        return 'Idag';
      }
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (date.toDateString() === tomorrow.toDateString()) {
        return 'Imorgon';
      }
      
      return date.toLocaleDateString('sv-SE', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Kommande händelser</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-gray-600">Laddar händelser...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Kommande händelser</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="outline" onClick={loadUpcomingEvents}>
              Försök igen
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Kommande händelser</span>
            </CardTitle>
            <CardDescription>
              Nästa 7 dagarna
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/kalender')}
            className="text-blue-600 hover:text-blue-700"
          >
            Visa alla
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Inga kommande händelser de närmaste dagarna
          </p>
        ) : (
          <div className="space-y-3">
            {events.map((event, index) => (
              <div key={event.id || index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="text-center min-w-[60px]">
                  <div className="text-xs font-medium text-gray-500 uppercase">
                    {formatEventDateShort(event.datum)}
                  </div>
                  {event.start_time && (
                    <div className="text-xs text-gray-400 mt-1">
                      {formatEventTime(event.start_time)}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {event.summary || 'Händelse'}
                      </h4>
                      {event.location && (
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
                    {event.organ && (
                      <Badge variant="secondary" className={`ml-2 text-xs ${getEventTypeColor(event.organ)}`}>
                        {event.organ}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {events.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/kalender')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Se fullständig kalender
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingEventsWidget;

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, ChevronRight, Loader2, Activity } from "lucide-react";
import { 
  fetchUpcomingEvents, 
  fetchRecentActivities,
  formatEventDate, 
  formatEventTime, 
  isEventToday,
  getEventTitle,
  getEventTypeDescription,
  type CachedCalendarData 
} from '../services/cachedCalendarApi';
import { useNavigate } from 'react-router-dom';

const UpcomingEventsWidget = () => {
  const [events, setEvents] = useState<CachedCalendarData[]>([]);
  const [recentActivities, setRecentActivities] = useState<CachedCalendarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRecent, setShowRecent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadEventsAndActivities();
  }, []);

  const loadEventsAndActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [upcomingEvents, latestActivities] = await Promise.all([
        fetchUpcomingEvents(7), // Next 7 days
        fetchRecentActivities(5) // Last 5 activities
      ]);
      
      setEvents(upcomingEvents.slice(0, 6)); // Show max 6 upcoming events
      setRecentActivities(latestActivities);
    } catch (err) {
      setError('Kunde inte hämta kalenderhändelser');
      console.error('Error loading events and activities:', err);
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

  const formatActivityTitle = (activity: CachedCalendarData) => {
    return getEventTitle(activity);
  };

  const formatActivityTime = (activity: CachedCalendarData) => {
    if (!activity.created_at) return '';
    
    try {
      const date = new Date(activity.created_at);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffHours < 1) return 'Nu';
      if (diffHours < 24) return `${diffHours}h sedan`;
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Igår';
      return `${diffDays}d sedan`;
    } catch {
      return 'Nyligen';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Kalenderhändelser</span>
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
            <span>Kalenderhändelser</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="outline" onClick={loadEventsAndActivities}>
              Försök igen
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentData = showRecent ? recentActivities : events;
  const hasData = currentData.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              {showRecent ? (
                <Activity className="w-5 h-5" />
              ) : (
                <Calendar className="w-5 h-5" />
              )}
              <span>{showRecent ? 'Senaste aktiviteter' : 'Kommande händelser'}</span>
            </CardTitle>
            <CardDescription>
              {showRecent ? 'Nyligen inlagda' : 'Nästa 7 dagarna'}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowRecent(!showRecent)}
              className="text-blue-600 hover:text-blue-700"
            >
              {showRecent ? 'Kommande' : 'Senaste'}
            </Button>
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
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-gray-500 text-center py-4">
            {showRecent ? 'Inga senaste aktiviteter' : 'Inga kommande händelser de närmaste dagarna'}
          </p>
        ) : (
          <div className="space-y-3">
            {currentData.map((item, index) => (
              <div key={item.id || index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="text-center min-w-[60px]">
                  <div className="text-xs font-medium text-gray-500 uppercase">
                    {showRecent ? formatActivityTime(item) : formatEventDateShort(item.datum)}
                  </div>
                  {!showRecent && item.tid && (
                    <div className="text-xs text-gray-400 mt-1">
                      {formatEventTime(item.tid)}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {getEventTitle(item)}
                      </h4>
                      {getEventTypeDescription(item) && (
                        <div className="text-xs text-gray-600 mt-1">
                          {getEventTypeDescription(item)}
                        </div>
                      )}
                      {item.plats && (
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          <span className="truncate">{item.plats}</span>
                        </div>
                      )}
                    </div>
                    {item.organ && (
                      <Badge variant="secondary" className={`ml-2 text-xs ${getEventTypeColor(item.organ)}`}>
                        {item.organ}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {hasData && (
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

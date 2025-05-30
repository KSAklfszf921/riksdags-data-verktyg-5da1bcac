
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { 
  RiksdagCalendarEvent, 
  formatEventDate, 
  formatEventTime, 
  getEventTypeName, 
  getOrganName, 
  getActivityName 
} from '../services/riksdagCalendarApi';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, parseISO, isValid } from 'date-fns';
import { sv } from 'date-fns/locale';

interface RiksdagCalendarViewProps {
  events: RiksdagCalendarEvent[];
  loading?: boolean;
}

const eventTypeColors: { [key: string]: string } = {
  'kamm': 'bg-blue-500 text-white',
  'AU': 'bg-green-500 text-white',
  'CU': 'bg-purple-500 text-white',
  'FiU': 'bg-red-500 text-white',
  'FöU': 'bg-orange-500 text-white',
  'JuU': 'bg-indigo-500 text-white',
  'KU': 'bg-pink-500 text-white',
  'KrU': 'bg-yellow-500 text-black',
  'MjU': 'bg-emerald-500 text-white',
  'NU': 'bg-cyan-500 text-white',
  'eun': 'bg-violet-500 text-white',
  'debatt': 'bg-blue-600 text-white',
  'sammantrade': 'bg-gray-600 text-white',
  'besök': 'bg-green-600 text-white',
  'default': 'bg-gray-500 text-white'
};

const getEventColor = (event: RiksdagCalendarEvent) => {
  return eventTypeColors[event.org] || eventTypeColors[event.typ] || eventTypeColors.default;
};

const parseEventDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  
  try {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) return parsed;
    
    const date = new Date(dateString);
    if (isValid(date)) return date;
    
    return null;
  } catch {
    return null;
  }
};

const RiksdagCalendarView = ({ events, loading }: RiksdagCalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: { [key: string]: RiksdagCalendarEvent[] } = {};
    events.forEach(event => {
      const eventDate = parseEventDate(event.datum);
      if (eventDate) {
        const dateKey = format(eventDate, 'yyyy-MM-dd');
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(event);
      }
    });
    return grouped;
  }, [events]);

  // Navigation functions
  const navigatePrevious = () => {
    switch (view) {
      case 'month':
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
        break;
    }
  };

  const navigateNext = () => {
    switch (view) {
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
        break;
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Month view
  const MonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { locale: sv });
    const calendarEnd = endOfWeek(monthEnd, { locale: sv });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <div className="grid grid-cols-7 gap-1">
        {['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'].map(day => (
          <div key={day} className="p-2 text-center font-medium text-gray-500 text-sm">
            {day}
          </div>
        ))}
        {days.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDate[dateKey] || [];
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          
          return (
            <div
              key={day.toISOString()}
              className={`
                min-h-[100px] p-1 border border-gray-200 cursor-pointer hover:bg-gray-50
                ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                ${isToday(day) ? 'bg-blue-50 border-blue-300' : ''}
                ${selectedDate && isSameDay(day, selectedDate) ? 'ring-2 ring-blue-500' : ''}
              `}
              onClick={() => setSelectedDate(day)}
            >
              <div className={`text-sm font-medium ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-1 mt-1">
                {dayEvents.slice(0, 3).map((event, index) => (
                  <div
                    key={event.id || index}
                    className={`text-xs p-1 rounded truncate ${getEventColor(event)}`}
                    title={event.titel || 'Händelse'}
                  >
                    {event.titel || 'Händelse'}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500">+{dayEvents.length - 3} fler</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Week view
  const WeekView = () => {
    const weekStart = startOfWeek(currentDate, { locale: sv });
    const weekEnd = endOfWeek(currentDate, { locale: sv });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDate[dateKey] || [];
          
          return (
            <div key={day.toISOString()} className="border border-gray-200 rounded-lg p-2">
              <div className={`text-sm font-medium mb-2 ${isToday(day) ? 'text-blue-600' : 'text-gray-900'}`}>
                {format(day, 'EEE d/M', { locale: sv })}
              </div>
              <div className="space-y-1">
                {dayEvents.map((event, index) => (
                  <div
                    key={event.id || index}
                    className={`text-xs p-2 rounded ${getEventColor(event)}`}
                  >
                    <div className="font-medium truncate">{event.titel || 'Händelse'}</div>
                    {event.tid && <div className="opacity-75">{formatEventTime(event.tid)}</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Day view
  const DayView = () => {
    const dateKey = format(currentDate, 'yyyy-MM-dd');
    const dayEvents = eventsByDate[dateKey] || [];

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          {format(currentDate, 'EEEE d MMMM yyyy', { locale: sv })}
        </h3>
        {dayEvents.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Inga händelser denna dag</p>
        ) : (
          <div className="space-y-3">
            {dayEvents.map((event, index) => (
              <Card key={event.id || index}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{event.titel || 'Händelse'}</CardTitle>
                    <div className="flex space-x-2">
                      {event.org && <Badge className={getEventColor(event)}>{getOrganName(event.org)}</Badge>}
                      {event.typ && <Badge variant="secondary">{getEventTypeName(event.typ)}</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    {event.tid && (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatEventTime(event.tid)}</span>
                      </div>
                    )}
                    {event.plats && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>{event.plats}</span>
                      </div>
                    )}
                    {event.beskrivning && (
                      <p className="text-gray-700 mt-2">{event.beskrivning}</p>
                    )}
                    {event.akt && (
                      <Badge variant="outline">
                        {getActivityName(event.akt)}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  const formatPeriod = () => {
    switch (view) {
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: sv });
      case 'week':
        const weekStart = startOfWeek(currentDate, { locale: sv });
        const weekEnd = endOfWeek(currentDate, { locale: sv });
        return `${format(weekStart, 'd MMM', { locale: sv })} - ${format(weekEnd, 'd MMM yyyy', { locale: sv })}`;
      case 'day':
        return format(currentDate, 'EEEE d MMMM yyyy', { locale: sv });
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <CardTitle>Riksdagens Kalender</CardTitle>
            </div>
            <Tabs value={view} onValueChange={(value) => setView(value as any)} className="w-auto">
              <TabsList>
                <TabsTrigger value="month">Månad</TabsTrigger>
                <TabsTrigger value="week">Vecka</TabsTrigger>
                <TabsTrigger value="day">Dag</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Idag
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{formatPeriod()}</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={navigatePrevious}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={navigateNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Laddar kalenderhändelser...</p>
          </div>
        ) : (
          <>
            {view === 'month' && <MonthView />}
            {view === 'week' && <WeekView />}
            {view === 'day' && <DayView />}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RiksdagCalendarView;

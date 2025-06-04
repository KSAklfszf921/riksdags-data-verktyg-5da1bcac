
import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Grid, List, Eye, Heart, Star, MapPin, Calendar, Activity, Users } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Member {
  id: string;
  member_id: string;
  first_name: string;
  last_name: string;
  party: string;
  constituency?: string;
  birth_year?: number;
  gender?: string;
  current_committees?: string[];
  committee_assignments?: any;
  image_urls?: { [key: string]: string };
  activity_data?: any;
  is_active?: boolean;
}

interface EnhancedMemberGridProps {
  members: Member[];
  loading?: boolean;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  onMemberSelect?: (member: Member) => void;
  favorites?: string[];
  onToggleFavorite?: (memberId: string) => void;
  className?: string;
}

const EnhancedMemberGrid: React.FC<EnhancedMemberGridProps> = ({
  members,
  loading = false,
  viewMode = 'grid',
  onViewModeChange,
  onMemberSelect,
  favorites = [],
  onToggleFavorite,
  className = ""
}) => {
  const navigate = useNavigate();
  const [hoveredMember, setHoveredMember] = useState<string | null>(null);

  const getAge = (birthYear?: number) => {
    if (!birthYear) return null;
    return new Date().getFullYear() - birthYear;
  };

  const getActivityLevel = (activityData?: any) => {
    if (!activityData) return 'Okänd';
    // Mock activity calculation - in real app this would be based on actual data
    const level = Math.random();
    if (level > 0.7) return 'Hög';
    if (level > 0.4) return 'Medel';
    return 'Låg';
  };

  const getActivityColor = (level: string) => {
    switch (level) {
      case 'Hög': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'Medel': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'Låg': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      // Prioritize active members
      if (a.is_active !== b.is_active) {
        return a.is_active ? -1 : 1;
      }
      // Then sort alphabetically
      return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
    });
  }, [members]);

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-20" />
        </div>
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          : "space-y-2"
        }>
          {Array.from({ length: 12 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const MemberCard = ({ member }: { member: Member }) => {
    const age = getAge(member.birth_year);
    const activityLevel = getActivityLevel(member.activity_data);
    const isFavorite = favorites.includes(member.member_id);

    const handleCardClick = () => {
      if (onMemberSelect) {
        onMemberSelect(member);
      } else {
        navigate(`/ledamoter/${member.member_id}`);
      }
    };

    const handleFavoriteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleFavorite?.(member.member_id);
    };

    if (viewMode === 'list') {
      return (
        <Card 
          className="cursor-pointer hover:shadow-md transition-all duration-200 group"
          onClick={handleCardClick}
          onMouseEnter={() => setHoveredMember(member.member_id)}
          onMouseLeave={() => setHoveredMember(null)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarImage 
                    src={member.image_urls?.['192'] || member.image_urls?.['128']} 
                    alt={`${member.first_name} ${member.last_name}`}
                  />
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                    {member.first_name[0]}{member.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {member.first_name} {member.last_name}
                    </h3>
                    {!member.is_active && (
                      <Badge variant="outline" className="text-xs">Inaktiv</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <span className="font-medium">{member.party}</span>
                    {member.constituency && (
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{member.constituency}</span>
                      </span>
                    )}
                    {age && (
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{age} år</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Badge className={cn("text-xs", getActivityColor(activityLevel))}>
                  <Activity className="w-3 h-3 mr-1" />
                  {activityLevel}
                </Badge>
                
                {onToggleFavorite && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFavoriteClick}
                    className={cn(
                      "opacity-0 group-hover:opacity-100 transition-opacity",
                      isFavorite && "opacity-100 text-red-500"
                    )}
                  >
                    <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
                  </Button>
                )}
                
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card 
        className={cn(
          "cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group overflow-hidden",
          !member.is_active && "opacity-75",
          hoveredMember === member.member_id && "shadow-xl scale-[1.02]"
        )}
        onClick={handleCardClick}
        onMouseEnter={() => setHoveredMember(member.member_id)}
        onMouseLeave={() => setHoveredMember(null)}
      >
        <CardContent className="p-4">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <Avatar className="h-16 w-16">
                <AvatarImage 
                  src={member.image_urls?.['192'] || member.image_urls?.['128']} 
                  alt={`${member.first_name} ${member.last_name}`}
                />
                <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-lg">
                  {member.first_name[0]}{member.last_name[0]}
                </AvatarFallback>
              </Avatar>
              
              {onToggleFavorite && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFavoriteClick}
                  className={cn(
                    "absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-white dark:bg-gray-800 shadow-md opacity-0 group-hover:opacity-100 transition-opacity",
                    isFavorite && "opacity-100 text-red-500"
                  )}
                >
                  <Heart className={cn("w-3 h-3", isFavorite && "fill-current")} />
                </Button>
              )}
            </div>
            
            <div className="space-y-1 min-h-0 flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">
                {member.first_name} {member.last_name}
              </h3>
              
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs">
                  {member.party}
                </Badge>
                
                {member.constituency && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{member.constituency}</span>
                  </p>
                )}
                
                <div className="flex items-center justify-center space-x-2 text-xs">
                  {age && (
                    <span className="text-gray-600 dark:text-gray-400">{age} år</span>
                  )}
                  <Badge className={cn("text-xs", getActivityColor(activityLevel))}>
                    {activityLevel}
                  </Badge>
                </div>
              </div>
            </div>
            
            {!member.is_active && (
              <Badge variant="secondary" className="text-xs">
                Inaktiv
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {members.length} ledamöter
          </h2>
          {favorites.length > 0 && (
            <Badge variant="outline" className="flex items-center space-x-1">
              <Star className="w-3 h-3" />
              <span>{favorites.length} favoriter</span>
            </Badge>
          )}
        </div>
        
        {onViewModeChange && (
          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="h-8 w-8 p-0"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Members Grid/List */}
      {members.length === 0 ? (
        <Card className="p-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Inga ledamöter hittades</h3>
            <p className="text-sm">Prova att justera dina filter eller sökord</p>
          </div>
        </Card>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          : "space-y-2"
        }>
          {sortedMembers.map((member) => (
            <MemberCard key={member.member_id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedMemberGrid;

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Grid, List, Eye, Heart, Star, MapPin, Calendar, Users, Rss } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { EnhancedMember } from '@/hooks/useEnhancedMembers';
import MemberProfile from './MemberProfile';
import MemberImageHandler from './MemberImageHandler';
import CommitteeDisplay from './CommitteeDisplay';
import ActivityIndicator from './ActivityIndicator';

interface EnhancedMemberGridProps {
  members: EnhancedMember[];
  loading?: boolean;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  onMemberSelect?: (member: EnhancedMember) => void;
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
  const [selectedMember, setSelectedMember] = useState<EnhancedMember | null>(null);

  const getAge = (birthYear?: number) => {
    if (!birthYear) return null;
    return new Date().getFullYear() - birthYear;
  };

  // Helper function to safely handle image_urls from Supabase Json type
  const getImageUrls = (imageUrls: any): Record<string, string> | null => {
    if (!imageUrls) return null;
    if (typeof imageUrls === 'string') {
      // If it's a string, try to parse it as JSON
      try {
        const parsed = JSON.parse(imageUrls);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          return parsed as Record<string, string>;
        }
      } catch {
        return null;
      }
      return null;
    }
    if (typeof imageUrls === 'object' && imageUrls !== null && !Array.isArray(imageUrls)) {
      return imageUrls as Record<string, string>;
    }
    return null;
  };

  // Convert enhanced member to legacy member format for MemberProfile
  const convertToLegacyMember = (enhancedMember: EnhancedMember) => {
    const activityData = enhancedMember.activity_data as any;
    const assignments = enhancedMember.assignments as any;
    const imageUrls = getImageUrls(enhancedMember.image_urls);
    
    return {
      id: enhancedMember.member_id,
      firstName: enhancedMember.first_name,
      lastName: enhancedMember.last_name,
      party: enhancedMember.party,
      constituency: enhancedMember.constituency || '',
      imageUrl: imageUrls ? 
        imageUrls['192'] || 
        imageUrls['128'] || 
        imageUrls['80'] || 
        `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face` :
        `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face`,
      email: `${enhancedMember.first_name.toLowerCase()}.${enhancedMember.last_name.toLowerCase()}@riksdagen.se`,
      birthYear: enhancedMember.birth_year || 1970,
      profession: 'Riksdagsledamot',
      committees: enhancedMember.current_committees || [],
      speeches: activityData?.speeches || [],
      votes: activityData?.votes || [],
      proposals: activityData?.proposals || [],
      documents: activityData?.documents || [],
      calendarEvents: activityData?.calendar_events || [],
      activityScore: enhancedMember.current_year_stats?.total_documents || 0,
      motions: enhancedMember.current_year_stats?.motions || 0,
      interpellations: enhancedMember.current_year_stats?.interpellations || 0,
      writtenQuestions: enhancedMember.current_year_stats?.written_questions || 0,
      assignments: Array.isArray(assignments) ? assignments.map((assignment: any) => ({
        organ_kod: assignment.organ_kod || assignment.organ || '',
        roll: assignment.roll || assignment.role || '',
        status: assignment.status || 'Aktiv',
        from: assignment.from || assignment.start_date || '',
        tom: assignment.tom || assignment.end_date || '',
        typ: assignment.typ || assignment.type || 'uppdrag',
        ordning: assignment.ordning || '',
        uppgift: assignment.uppgift || assignment.description || assignment.organ_kod || ''
      })) : []
    };
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

  const MemberCard = ({ member }: { member: EnhancedMember }) => {
    const age = getAge(member.birth_year);
    const isFavorite = favorites.includes(member.member_id);
    const imageUrls = getImageUrls(member.image_urls);

    const handleCardClick = () => {
      if (onMemberSelect) {
        onMemberSelect(member);
      } else {
        setSelectedMember(member);
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
                <div className="relative flex-shrink-0">
                  <MemberImageHandler
                    imageUrls={imageUrls}
                    firstName={member.first_name}
                    lastName={member.last_name}
                    size="md"
                  />
                  <div className="absolute -bottom-1 -right-1">
                    <Rss className="w-3 h-3 text-orange-500 bg-white rounded-full p-0.5" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {member.first_name} {member.last_name}
                    </h3>
                    {!member.is_active && (
                      <Badge variant="outline" className="text-xs">Inaktiv</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <Badge variant="outline" className="text-xs">
                      {member.party}
                    </Badge>
                    {member.constituency && (
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{member.constituency}</span>
                      </span>
                    )}
                    {age && (
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{age} år</span>
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 flex items-center space-x-2">
                    <CommitteeDisplay 
                      committees={member.current_committees}
                      assignments={member.assignments as any}
                      variant="compact"
                      maxDisplay={3}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 flex-shrink-0">
                <ActivityIndicator 
                  stats={member.current_year_stats}
                  variant="compact"
                />
                
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
              <MemberImageHandler
                imageUrls={imageUrls}
                firstName={member.first_name}
                lastName={member.last_name}
                size="lg"
              />
              
              <div className="absolute -bottom-1 -right-1">
                <Rss className="w-4 h-4 text-orange-500 bg-white rounded-full p-0.5" />
              </div>
              
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
            
            <div className="space-y-2 min-h-0 flex-1 w-full">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">
                {member.first_name} {member.last_name}
              </h3>
              
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs">
                  {member.party}
                </Badge>
                
                {member.constituency && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{member.constituency}</span>
                  </p>
                )}
                
                <div className="flex flex-col items-center space-y-1">
                  {age && (
                    <span className="text-xs text-gray-600 dark:text-gray-400">{age} år</span>
                  )}
                  
                  <ActivityIndicator 
                    stats={member.current_year_stats}
                    variant="compact"
                  />
                </div>
                
                <CommitteeDisplay 
                  committees={member.current_committees}
                  assignments={member.assignments as any}
                  variant="compact"
                  maxDisplay={2}
                />
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
    <>
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

      {/* Member Profile Modal */}
      {selectedMember && (
        <MemberProfile 
          member={convertToLegacyMember(selectedMember)} 
          onClose={() => setSelectedMember(null)} 
        />
      )}
    </>
  );
};

export default EnhancedMemberGrid;

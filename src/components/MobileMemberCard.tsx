
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Share2, Download, MapPin, Calendar, Eye } from "lucide-react";
import { cn } from '@/lib/utils';
import { EnhancedMember } from '@/hooks/useEnhancedMembers';
import MemberImageHandler from './MemberImageHandler';
import ActivityIndicator from './ActivityIndicator';
import CommitteeDisplay from './CommitteeDisplay';
import MemberShareDialog from './MemberShareDialog';
import MemberExportDialog from './MemberExportDialog';

interface MobileMemberCardProps {
  member: EnhancedMember;
  isFavorite: boolean;
  onToggleFavorite: (memberId: string) => void;
  onMemberSelect: (member: EnhancedMember) => void;
  className?: string;
}

const MobileMemberCard: React.FC<MobileMemberCardProps> = ({
  member,
  isFavorite,
  onToggleFavorite,
  onMemberSelect,
  className = ""
}) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [showActions, setShowActions] = useState(false);

  const getAge = (birthYear?: number) => {
    if (!birthYear) return null;
    return new Date().getFullYear() - birthYear;
  };

  const getImageUrls = (imageUrls: any): Record<string, string> | null => {
    if (!imageUrls) return null;
    if (typeof imageUrls === 'string') return null;
    if (typeof imageUrls === 'object' && imageUrls !== null) {
      return imageUrls as Record<string, string>;
    }
    return null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    // Swipe left to show actions
    if (diff > 50) {
      setShowActions(true);
    }
    // Swipe right to hide actions
    else if (diff < -50) {
      setShowActions(false);
    }
    
    setTouchStart(null);
  };

  const handleCardClick = () => {
    if (!showActions) {
      onMemberSelect(member);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(member.member_id);
  };

  const age = getAge(member.birth_year);
  const imageUrls = getImageUrls(member.image_urls);

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-300 overflow-hidden relative",
        !member.is_active && "opacity-75",
        showActions && "shadow-lg",
        className
      )}
      onClick={handleCardClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <CardContent className="p-3">
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <MemberImageHandler
              imageUrls={imageUrls}
              firstName={member.first_name}
              lastName={member.last_name}
              size="md"
            />
            
            {/* Favorite indicator */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavoriteClick}
              className={cn(
                "absolute -top-1 -right-1 h-6 w-6 p-0 rounded-full bg-white dark:bg-gray-800 shadow-sm",
                isFavorite ? "text-red-500" : "text-gray-400"
              )}
            >
              <Heart className={cn("w-3 h-3", isFavorite && "fill-current")} />
            </Button>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                {member.first_name} {member.last_name}
              </h3>
              {!member.is_active && (
                <Badge variant="outline" className="text-xs ml-2">
                  Inaktiv
                </Badge>
              )}
            </div>
            
            {/* Party and basic info */}
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {member.party}
              </Badge>
              {member.constituency && (
                <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{member.constituency}</span>
                </span>
              )}
            </div>
            
            {/* Activity and age */}
            <div className="flex items-center justify-between">
              <ActivityIndicator 
                stats={member.current_year_stats}
                variant="compact"
              />
              {age && (
                <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{age} år</span>
                </span>
              )}
            </div>
            
            {/* Committees */}
            <div className="mt-1">
              <CommitteeDisplay 
                committees={member.current_committees}
                assignments={member.assignments as any}
                variant="compact"
                maxDisplay={2}
              />
            </div>
          </div>
        </div>
        
        {/* Action buttons (shown on swipe) */}
        {showActions && (
          <div className="mt-3 pt-3 border-t flex justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onMemberSelect(member);
              }}
            >
              <Eye className="w-4 h-4 mr-1" />
              Visa
            </Button>
            
            <MemberShareDialog member={member}>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-1" />
                Dela
              </Button>
            </MemberShareDialog>
            
            <MemberExportDialog member={member}>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </MemberExportDialog>
          </div>
        )}
      </CardContent>
      
      {/* Swipe indicator */}
      {!showActions && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
          <div className="text-xs">←</div>
        </div>
      )}
    </Card>
  );
};

export default MobileMemberCard;

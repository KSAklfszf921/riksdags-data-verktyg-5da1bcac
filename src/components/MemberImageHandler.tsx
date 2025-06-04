
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface MemberImageHandlerProps {
  imageUrls?: Record<string, string> | null;
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const MemberImageHandler: React.FC<MemberImageHandlerProps> = ({
  imageUrls,
  firstName,
  lastName,
  size = 'md',
  className = ""
}) => {
  const [imageError, setImageError] = useState(false);
  const [loadingError, setLoadingError] = useState(false);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const getOptimalImageUrl = () => {
    if (!imageUrls || typeof imageUrls !== 'object' || imageError) {
      return null;
    }

    // Priority order with additional size options
    const priorityOrder = ['192', 'max', '128', '80'];
    
    for (const size of priorityOrder) {
      if (imageUrls[size] && typeof imageUrls[size] === 'string') {
        return imageUrls[size];
      }
    }

    // If we didn't find a match in the priority order,
    // just use the first available image URL
    const keys = Object.keys(imageUrls);
    if (keys.length > 0) {
      return imageUrls[keys[0]];
    }

    return null;
  };

  const imageUrl = getOptimalImageUrl();
  
  // Generate initials with better fallback handling
  const generateInitials = () => {
    const first = firstName?.trim() || '';
    const last = lastName?.trim() || '';
    
    if (first && last) {
      return `${first[0]}${last[0]}`.toUpperCase();
    } else if (last) {
      // If only last name available, use first two letters of last name
      return last.substring(0, 2).toUpperCase();
    } else if (first) {
      return first.substring(0, 2).toUpperCase();
    }
    
    return '??'; // Fallback for completely missing names
  };

  const initials = generateInitials();
  
  const partyColor = (): string => {
    // Since we don't have party information here, 
    // we'll use a default blue color scheme
    return 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400';
  };

  const handleImageError = () => {
    console.log(`Failed to load image for ${firstName} ${lastName}`);
    setImageError(true);
    setLoadingError(true);
  };

  const handleImageLoad = () => {
    setLoadingError(false);
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {imageUrl && !imageError ? (
        <AvatarImage 
          src={imageUrl}
          alt={`${firstName} ${lastName}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
          className="object-cover"
        />
      ) : null}
      <AvatarFallback className={partyColor()}>
        {initials !== '??' ? initials : <User className="w-4 h-4" />}
      </AvatarFallback>
    </Avatar>
  );
};

export default MemberImageHandler;

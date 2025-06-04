
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Image, User } from "lucide-react";
import { EnhancedMember } from '@/hooks/useEnhancedMembers';

interface MemberDataStatusProps {
  member: EnhancedMember;
  compact?: boolean;
}

const MemberDataStatus: React.FC<MemberDataStatusProps> = ({ member, compact = false }) => {
  // Check data completeness
  const hasName = member.first_name && member.first_name.trim() !== '';
  const hasImage = member.image_urls && Object.keys(member.image_urls as any || {}).length > 0;
  const hasCommittees = member.current_committees && member.current_committees.length > 0;
  const hasConstituency = member.constituency && member.constituency.trim() !== '';
  const hasBirthYear = member.birth_year && member.birth_year > 0;

  const completionScore = [hasName, hasImage, hasCommittees, hasConstituency, hasBirthYear]
    .filter(Boolean).length;
  const totalChecks = 5;
  const completionPercentage = (completionScore / totalChecks) * 100;

  const getStatusColor = () => {
    if (completionPercentage >= 80) return 'text-green-600';
    if (completionPercentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = () => {
    if (completionPercentage >= 80) return <CheckCircle className="w-4 h-4 text-green-600" />;
    return <AlertCircle className="w-4 h-4 text-red-600" />;
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {getStatusIcon()}
        <span className={`text-xs ${getStatusColor()}`}>
          {Math.round(completionPercentage)}% komplett
        </span>
      </div>
    );
  }

  return (
    <Card className="border-gray-200">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Datastatus</h4>
            <Badge variant={completionPercentage >= 80 ? 'default' : 'destructive'}>
              {Math.round(completionPercentage)}% komplett
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <User className="w-3 h-3" />
                <span>Namn</span>
              </div>
              {hasName ? (
                <CheckCircle className="w-3 h-3 text-green-600" />
              ) : (
                <AlertCircle className="w-3 h-3 text-red-600" />
              )}
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Image className="w-3 h-3" />
                <span>Profilbild</span>
              </div>
              {hasImage ? (
                <CheckCircle className="w-3 h-3 text-green-600" />
              ) : (
                <AlertCircle className="w-3 h-3 text-red-600" />
              )}
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span>Utskott</span>
              {hasCommittees ? (
                <CheckCircle className="w-3 h-3 text-green-600" />
              ) : (
                <AlertCircle className="w-3 h-3 text-red-600" />
              )}
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span>Valkrets</span>
              {hasConstituency ? (
                <CheckCircle className="w-3 h-3 text-green-600" />
              ) : (
                <AlertCircle className="w-3 h-3 text-red-600" />
              )}
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span>Födelseår</span>
              {hasBirthYear ? (
                <CheckCircle className="w-3 h-3 text-green-600" />
              ) : (
                <AlertCircle className="w-3 h-3 text-red-600" />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MemberDataStatus;

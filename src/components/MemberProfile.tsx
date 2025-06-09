
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Calendar, MapPin, Phone, Mail, ExternalLink, X } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

interface MemberData {
  id: string;
  member_id: string;
  first_name: string;
  last_name: string;
  party: string;
  constituency?: string;
  birth_year?: number;
  gender?: string;
  riksdag_status?: string;
  current_committees?: string[];
  assignments?: Json;
  activity_data?: Json;
  image_urls?: Json;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

interface MemberProfileProps {
  memberId: string;
  onClose: () => void;
}

const MemberProfile = ({ memberId, onClose }: MemberProfileProps) => {
  const [member, setMember] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (memberId) {
      loadMemberData();
    }
  }, [memberId]);

  const loadMemberData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('member_data')
        .select('*')
        .eq('member_id', memberId)
        .single();

      if (error) {
        console.error('Error fetching member data:', error);
        setError('Kunde inte hämta ledamotens information');
        return;
      }

      // Convert the data to match our interface
      const convertedData: MemberData = {
        ...data,
        id: String(data.id) // Convert number to string
      };

      setMember(convertedData);
    } catch (err) {
      console.error('Error in loadMemberData:', err);
      setError('Ett fel uppstod vid hämtning av data');
    } finally {
      setLoading(false);
    }
  };

  const getProfileImage = () => {
    if (member?.image_urls && typeof member.image_urls === 'object') {
      const imageUrls = member.image_urls as any;
      return imageUrls.max || imageUrls['192'] || imageUrls['80'] || null;
    }
    return null;
  };

  const getAge = () => {
    if (member?.birth_year) {
      return new Date().getFullYear() - member.birth_year;
    }
    return null;
  };

  const getAssignments = () => {
    if (member?.assignments && typeof member.assignments === 'object') {
      return Array.isArray(member.assignments) ? member.assignments : [];
    }
    return [];
  };

  const getActivityData = () => {
    if (member?.activity_data && typeof member.activity_data === 'object') {
      return member.activity_data as any;
    }
    return {};
  };

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Laddar ledamot...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !member) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error || 'Ledamot hittades inte'}</p>
            <Button onClick={onClose}>Stäng</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {getProfileImage() ? (
                <img
                  src={getProfileImage()}
                  alt={`${member.first_name} ${member.last_name}`}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div>
                <DialogTitle className="text-xl">
                  {member.first_name} {member.last_name}
                </DialogTitle>
                <DialogDescription className="text-lg">
                  {member.party}
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Grundläggande information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {member.constituency && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>Valkrets: {member.constituency}</span>
                  </div>
                )}
                {getAge() && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>Ålder: {getAge()} år</span>
                  </div>
                )}
                {member.gender && (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span>Kön: {member.gender}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Badge variant={member.is_active ? "default" : "secondary"}>
                    {member.is_active ? "Aktiv" : "Inaktiv"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Committees */}
          {member.current_committees && member.current_committees.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Utskottsmedlemskap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {member.current_committees.map((committee, index) => (
                    <Badge key={index} variant="outline">
                      {committee}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Data */}
          {Object.keys(getActivityData()).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Aktivitetsstatistik</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {Object.entries(getActivityData()).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div className="font-semibold text-lg text-blue-600">
                        {typeof value === 'number' ? value : String(value)}
                      </div>
                      <div className="text-gray-600 capitalize">{key.replace('_', ' ')}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemberProfile;

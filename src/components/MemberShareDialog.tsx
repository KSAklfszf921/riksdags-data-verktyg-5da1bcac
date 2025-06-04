
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Share2, Copy, Check, Users } from "lucide-react";
import { EnhancedMember } from '@/hooks/useEnhancedMembers';

interface MemberShareDialogProps {
  member: EnhancedMember;
  children?: React.ReactNode;
}

const MemberShareDialog: React.FC<MemberShareDialogProps> = ({ member, children }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const memberUrl = `${window.location.origin}/ledamoter?member=${member.member_id}`;
  
  const shareText = `Kolla in ${member.first_name} ${member.last_name} (${member.party}) - Riksdagsledamot från ${member.constituency}`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(memberUrl);
      setCopied(true);
      toast.success('Länk kopierad!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Kunde inte kopiera länken');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${member.first_name} ${member.last_name} - Riksdagsledamot`,
          text: shareText,
          url: memberUrl,
        });
        toast.success('Delat!');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
          toast.error('Kunde inte dela');
        }
      }
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`${member.first_name} ${member.last_name} - Riksdagsledamot`);
    const body = encodeURIComponent(`${shareText}\n\n${memberUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(`${shareText} ${memberUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const shareViaFacebook = () => {
    const url = encodeURIComponent(memberUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareViaLinkedIn = () => {
    const url = encodeURIComponent(memberUrl);
    const title = encodeURIComponent(`${member.first_name} ${member.last_name} - Riksdagsledamot`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Dela
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Dela ledamotsprofil</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Member info */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-medium">{member.first_name} {member.last_name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {member.party}
              </Badge>
              {member.constituency && (
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {member.constituency}
                </span>
              )}
            </div>
          </div>

          {/* URL Copy */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Länk</label>
            <div className="flex space-x-2">
              <Input
                value={memberUrl}
                readOnly
                className="text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Share actions */}
          <div className="space-y-3">
            {navigator.share && (
              <Button 
                onClick={handleNativeShare}
                className="w-full"
                variant="default"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Dela via systemet
              </Button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={shareViaEmail}
                variant="outline"
                size="sm"
              >
                E-post
              </Button>
              <Button
                onClick={shareViaTwitter}
                variant="outline"
                size="sm"
              >
                Twitter
              </Button>
              <Button
                onClick={shareViaFacebook}
                variant="outline"
                size="sm"
              >
                Facebook
              </Button>
              <Button
                onClick={shareViaLinkedIn}
                variant="outline"
                size="sm"
              >
                LinkedIn
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemberShareDialog;

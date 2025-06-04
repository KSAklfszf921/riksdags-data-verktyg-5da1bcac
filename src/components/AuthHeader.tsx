
import React from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";

const AuthHeader: React.FC = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        toast.error('Fel vid utloggning');
      } else {
        toast.success('Du har loggats ut');
      }
    } catch (error) {
      toast.error('Ett oväntat fel inträffade');
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-gray-700">
          {user.email}
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        className="flex items-center space-x-1"
      >
        <LogOut className="h-4 w-4" />
        <span>Logga ut</span>
      </Button>
    </div>
  );
};

export default AuthHeader;

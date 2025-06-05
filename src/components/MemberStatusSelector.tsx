
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { useResponsive } from "../hooks/use-responsive";

interface MemberStatusSelectorProps {
  memberStatus: 'current' | 'all' | 'former';
  onStatusChange: (newStatus: 'current' | 'all' | 'former') => void;
}

const MemberStatusSelector = ({ memberStatus, onStatusChange }: MemberStatusSelectorProps) => {
  const { isMobile } = useResponsive();

  return (
    <Card className={`mb-6 ${isMobile ? 'mx-0' : ''}`}>
      <CardHeader className={isMobile ? 'pb-3' : ''}>
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Filter className="w-5 h-5" />
          <span>Ledamotstyp</span>
        </CardTitle>
        {!isMobile && (
          <CardDescription>
            Välj vilken kategori av ledamöter du vill visa
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'flex-wrap gap-4'}`}>
          <Button
            variant={memberStatus === 'current' ? 'default' : 'outline'}
            onClick={() => onStatusChange('current')}
            className={isMobile ? 'w-full justify-start' : ''}
            size={isMobile ? 'default' : 'default'}
          >
            Nuvarande ledamöter
          </Button>
          <Button
            variant={memberStatus === 'all' ? 'default' : 'outline'}
            onClick={() => onStatusChange('all')}
            className={isMobile ? 'w-full justify-start' : ''}
            size={isMobile ? 'default' : 'default'}
          >
            Alla ledamöter
          </Button>
          <Button
            variant={memberStatus === 'former' ? 'default' : 'outline'}
            onClick={() => onStatusChange('former')}
            className={isMobile ? 'w-full justify-start' : ''}
            size={isMobile ? 'default' : 'default'}
          >
            Tidigare ledamöter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MemberStatusSelector;


import { Users } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useResponsive } from "../hooks/use-responsive";
import EnhancedMembersPage from "../components/EnhancedMembersPage";

const Ledamoter = () => {
  const { isMobile } = useResponsive();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4 py-0' : 'px-4 sm:px-6 lg:px-8 py-8'}`}>
        <PageHeader
          title="Riksdagsledamöter"
          description="Utforska alla riksdagsledamöter med avancerade filter och sortering"
          icon={<Users className="w-6 h-6 text-white" />}
        />

        <EnhancedMembersPage />
      </div>
    </div>
  );
};

export default Ledamoter;

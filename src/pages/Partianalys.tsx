
import { Users } from "lucide-react";
import OptimizedPartyAnalysis from "../components/OptimizedPartyAnalysis";
import ResponsiveHeader from "../components/ResponsiveHeader";
import { useResponsive } from "../hooks/use-responsive";

const Partianalys = () => {
  const { isMobile } = useResponsive();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4 py-0' : 'px-4 sm:px-6 lg:px-8 py-8'}`}>
        <ResponsiveHeader
          title="Partianalys"
          description="Analysera riksdagens partier - demografi, utskott och aktivitet (optimerad med cache)"
          icon={<Users className="w-6 h-6 text-white" />}
        />

        <OptimizedPartyAnalysis />
      </div>
    </div>
  );
};

export default Partianalys;


import { Calendar } from "lucide-react";
import RiksdagCalendarSearch from "../components/RiksdagCalendarSearch";
import { PageHeader } from "../components/PageHeader";
import { useResponsive } from "../hooks/use-responsive";

const Kalender = () => {
  const { isMobile } = useResponsive();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4 py-0' : 'px-4 sm:px-6 lg:px-8 py-8'}`}>
        <PageHeader
          title="Riksdagens Kalender"
          description="Sök och utforska kalenderhändelser direkt från Sveriges riksdag med korrekt API-integration"
          icon={<Calendar className="w-6 h-6 text-white" />}
        />

        <RiksdagCalendarSearch />
      </div>
    </div>
  );
};

export default Kalender;

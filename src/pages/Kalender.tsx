
import { Calendar } from "lucide-react";
import CalendarSearch from "../components/CalendarSearch";
import ResponsiveHeader from "../components/ResponsiveHeader";
import { useResponsive } from "../hooks/use-responsive";

const Kalender = () => {
  const { isMobile } = useResponsive();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4 py-0' : 'px-4 sm:px-6 lg:px-8 py-8'}`}>
        <ResponsiveHeader
          title="Kalender"
          description="Sök och utforska riksdagens kalenderhändelser med förbättrade vyer och funktioner"
          icon={<Calendar className="w-6 h-6 text-white" />}
        />

        <CalendarSearch />
      </div>
    </div>
  );
};

export default Kalender;

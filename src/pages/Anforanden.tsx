
import { MessageSquare } from "lucide-react";
import SpeechSearch from "../components/SpeechSearch";
import { ResponsiveHeader } from "../components/ResponsiveHeader";
import { useResponsive } from "../hooks/use-responsive";

const Anforanden = () => {
  const { isMobile } = useResponsive();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4 py-0' : 'px-4 sm:px-6 lg:px-8 py-8'}`}>
        <ResponsiveHeader
          title="Anföranden"
          description="Sök och analysera riksdagsanföranden med avancerade filter"
          icon={<MessageSquare className="w-6 h-6 text-white" />}
        />

        <SpeechSearch />
      </div>
    </div>
  );
};

export default Anforanden;

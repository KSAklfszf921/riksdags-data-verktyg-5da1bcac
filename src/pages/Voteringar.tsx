
import { Vote } from "lucide-react";
import VoteSearch from "../components/VoteSearch";
import ResponsiveHeader from "../components/ResponsiveHeader";
import { useResponsive } from "../hooks/use-responsive";

const Voteringar = () => {
  const { isMobile } = useResponsive();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4 py-0' : 'px-4 sm:px-6 lg:px-8 py-8'}`}>
        <ResponsiveHeader
          title="Voteringar"
          description="Sök och analysera riksdagsvoteringar med avancerade filter och visualiseringar"
          icon={<Vote className="w-6 h-6 text-white" />}
        />

        <VoteSearch />
      </div>
    </div>
  );
};

export default Voteringar;

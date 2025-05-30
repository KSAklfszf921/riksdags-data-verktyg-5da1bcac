
import { FileText } from "lucide-react";
import DocumentSearch from "../components/DocumentSearch";
import { ResponsiveHeader } from "../components/ResponsiveHeader";
import { useResponsive } from "../hooks/use-responsive";

const Dokument = () => {
  const { isMobile } = useResponsive();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4 py-0' : 'px-4 sm:px-6 lg:px-8 py-8'}`}>
        <ResponsiveHeader
          title="Dokumentanalys"
          description="Sök och analysera riksdagsdokument med avancerade filter"
          icon={<FileText className="w-6 h-6 text-white" />}
        />

        <DocumentSearch />
      </div>
    </div>
  );
};

export default Dokument;

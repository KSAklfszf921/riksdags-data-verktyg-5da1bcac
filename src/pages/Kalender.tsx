
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CalendarSearch from "../components/CalendarSearch";

const Kalender = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till startsidan
          </Button>
          
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kalender</h1>
              <p className="text-gray-600">Sök och utforska riksdagens kalenderhändelser med förbättrade vyer och funktioner</p>
            </div>
          </div>
        </div>

        <CalendarSearch />
      </div>
    </div>
  );
};

export default Kalender;

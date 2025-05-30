
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Vote, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Voteringar = () => {
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
          
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Vote className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Voteringar</h1>
              <p className="text-gray-600">Analysera röstningsdata</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Kommer snart</CardTitle>
            <CardDescription>
              Här kommer du kunna analysera röstningsdata från riksdagen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Denna sida är under utveckling. Snart kommer du att kunna:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
              <li>Se senaste voteringar</li>
              <li>Analysera röstmönster</li>
              <li>Jämföra partiers röstning</li>
              <li>Hitta avvikande röster</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Voteringar;

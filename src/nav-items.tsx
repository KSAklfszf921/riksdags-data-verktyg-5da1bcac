
import { HomeIcon, Users, FileText, Vote, MessageSquare, Calendar, BarChart3, Settings } from "lucide-react";
import Index from "./pages/Index";
import Ledamoter from "./pages/Ledamoter";
import Dokument from "./pages/Dokument";
import Voteringar from "./pages/Voteringar";
import Anforanden from "./pages/Anforanden";
import Kalender from "./pages/Kalender";
import Partianalys from "./pages/Partianalys";
import Topplistor from "./pages/Topplistor";
import Admin from "./pages/Admin";

export const navItems = [
  {
    title: "Hem",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Index />,
  },
  {
    title: "Ledamöter",
    to: "/ledamoter",
    icon: <Users className="h-4 w-4" />,
    page: <Ledamoter />,
  },
  {
    title: "Dokument",
    to: "/dokument",
    icon: <FileText className="h-4 w-4" />,
    page: <Dokument />,
  },
  {
    title: "Voteringar",
    to: "/voteringar",
    icon: <Vote className="h-4 w-4" />,
    page: <Voteringar />,
  },
  {
    title: "Anföranden",
    to: "/anforanden",
    icon: <MessageSquare className="h-4 w-4" />,
    page: <Anforanden />,
  },
  {
    title: "Kalender",
    to: "/kalender",
    icon: <Calendar className="h-4 w-4" />,
    page: <Kalender />,
  },
  {
    title: "Partianalys",
    to: "/partianalys",
    icon: <BarChart3 className="h-4 w-4" />,
    page: <Partianalys />,
  },
  {
    title: "Topplistor",
    to: "/topplistor", 
    icon: <BarChart3 className="h-4 w-4" />,
    page: <Topplistor />,
  },
  {
    title: "Admin",
    to: "/admin",
    icon: <Settings className="h-4 w-4" />,
    page: <Admin />,
  },
];

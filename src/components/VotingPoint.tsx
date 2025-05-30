
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RiksdagVote } from "../services/riksdagApi";
import VoteStats from "./VoteStats";
import VoteResults from "./VoteResults";

interface VotingPointProps {
  punkt: string;
  votes: RiksdagVote[];
  beteckning: string;
}

const VotingPoint = ({ punkt, votes, beteckning }: VotingPointProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const punktKey = `${beteckning}-${punkt}`;

  return (
    <div className="border rounded-lg">
      <Collapsible 
        open={isExpanded}
        onOpenChange={setIsExpanded}
      >
        <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <div className="flex items-center space-x-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <span className="font-medium">Punkt {punkt}</span>
          </div>
          <VoteStats votes={votes} />
        </CollapsibleTrigger>
        
        <CollapsibleContent className="px-3 pb-3">
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="info">
              <AccordionTrigger className="text-sm">
                Öppna punktinformation
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
                  <p>Information om punkt {punkt} i {beteckning}</p>
                  <p className="mt-1">Antal röster: {votes.length}</p>
                  {votes.length > 0 && (
                    <>
                      <p className="mt-1">Riksmöte: {votes[0].rm}</p>
                      <p>Avser: {votes[0].avser}</p>
                    </>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="resultat">
              <AccordionTrigger className="text-sm">
                Voteringsresultat
              </AccordionTrigger>
              <AccordionContent>
                <VoteResults votes={votes} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default VotingPoint;

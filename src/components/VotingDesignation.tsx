
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RiksdagVote } from "../services/riksdagApi";
import VotingPoint from "./VotingPoint";

interface GroupedVotes {
  [punkt: string]: RiksdagVote[];
}

interface VotingDesignationProps {
  beteckning: string;
  punkter: GroupedVotes;
}

const VotingDesignation = ({ beteckning, punkter }: VotingDesignationProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded-lg">
      <Collapsible 
        open={isExpanded}
        onOpenChange={setIsExpanded}
      >
        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <div className="flex items-center space-x-3">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <h3 className="text-lg font-semibold text-gray-900">
              {beteckning}
            </h3>
          </div>
          <Badge variant="secondary">
            {Object.keys(punkter).length} punkt{Object.keys(punkter).length !== 1 ? 'er' : ''}
          </Badge>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="px-4 pb-4">
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="texter">
              <AccordionTrigger>
                <span className="flex items-center space-x-2">
                  <span>Öppna texter för {beteckning}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded">
                  <p>Texter och bakgrund för {beteckning} visas här...</p>
                  {Object.values(punkter)[0]?.[0] && (
                    <>
                      <p className="mt-2">Riksmöte: {Object.values(punkter)[0][0].rm}</p>
                      <p>Typ: {Object.values(punkter)[0][0].avser}</p>
                    </>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="beslut">
              <AccordionTrigger>
                <span className="flex items-center space-x-2">
                  <span>Beslut ({Object.keys(punkter).length} punkt{Object.keys(punkter).length !== 1 ? 'er' : ''})</span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {Object.entries(punkter).map(([punkt, votes]) => (
                    <VotingPoint
                      key={punkt}
                      punkt={punkt}
                      votes={votes}
                      beteckning={beteckning}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default VotingDesignation;

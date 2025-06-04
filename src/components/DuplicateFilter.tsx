
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Filter, CheckCircle } from "lucide-react";

interface DuplicateFilterProps {
  duplicatesFound: number;
  duplicatesRemoved: number;
  isActive: boolean;
}

const DuplicateFilter: React.FC<DuplicateFilterProps> = ({
  duplicatesFound,
  duplicatesRemoved,
  isActive
}) => {
  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Filter className="w-4 h-4" />
          Duplicate Filter
          {isActive && <Badge variant="secondary" className="text-xs">Active</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-3 h-3 text-orange-500" />
            Duplicates Found
          </span>
          <span className="font-medium">{duplicatesFound}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-green-500" />
            Duplicates Removed
          </span>
          <span className="font-medium">{duplicatesRemoved}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default DuplicateFilter;

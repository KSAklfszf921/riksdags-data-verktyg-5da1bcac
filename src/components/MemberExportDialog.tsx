
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, FileText, Table } from "lucide-react";
import { EnhancedMember } from '@/hooks/useEnhancedMembers';

interface MemberExportDialogProps {
  member: EnhancedMember;
  children?: React.ReactNode;
}

interface ExportOptions {
  basicInfo: boolean;
  committees: boolean;
  activityStats: boolean;
  assignments: boolean;
}

const MemberExportDialog: React.FC<MemberExportDialogProps> = ({ member, children }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    basicInfo: true,
    committees: true,
    activityStats: true,
    assignments: true,
  });

  const generateCSVData = () => {
    const data: any[] = [];
    
    if (options.basicInfo) {
      data.push({
        Kategori: 'Grunduppgifter',
        Fält: 'Namn',
        Värde: `${member.first_name} ${member.last_name}`
      });
      data.push({
        Kategori: 'Grunduppgifter',
        Fält: 'Parti',
        Värde: member.party
      });
      if (member.constituency) {
        data.push({
          Kategori: 'Grunduppgifter',
          Fält: 'Valkrets',
          Värde: member.constituency
        });
      }
      if (member.birth_year) {
        data.push({
          Kategori: 'Grunduppgifter',
          Fält: 'Födelseår',
          Värde: member.birth_year.toString()
        });
      }
      data.push({
        Kategori: 'Grunduppgifter',
        Fält: 'Status',
        Värde: member.is_active ? 'Aktiv' : 'Tidigare'
      });
    }

    if (options.activityStats && member.current_year_stats) {
      const stats = member.current_year_stats;
      data.push({
        Kategori: 'Aktivitetsstatistik',
        Fält: 'Motioner',
        Värde: stats.motions.toString()
      });
      data.push({
        Kategori: 'Aktivitetsstatistik',
        Fält: 'Interpellationer',
        Värde: stats.interpellations.toString()
      });
      data.push({
        Kategori: 'Aktivitetsstatistik',
        Fält: 'Skriftliga frågor',
        Värde: stats.written_questions.toString()
      });
      data.push({
        Kategori: 'Aktivitetsstatistik',
        Fält: 'Anföranden',
        Värde: stats.speeches.toString()
      });
      data.push({
        Kategori: 'Aktivitetsstatistik',
        Fält: 'Totalt dokument',
        Värde: stats.total_documents.toString()
      });
    }

    if (options.committees && member.current_committees) {
      member.current_committees.forEach((committee, index) => {
        data.push({
          Kategori: 'Utskott',
          Fält: `Utskott ${index + 1}`,
          Värde: committee
        });
      });
    }

    return data;
  };

  const downloadCSV = () => {
    try {
      const data = generateCSVData();
      const csvContent = [
        ['Kategori', 'Fält', 'Värde'].join(','),
        ...data.map(row => [
          `"${row.Kategori}"`,
          `"${row.Fält}"`,
          `"${row.Värde}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${member.first_name}_${member.last_name}_ledamotsprofil.csv`;
      link.click();
      
      toast.success('CSV-fil nedladdad!');
      setOpen(false);
    } catch (error) {
      console.error('Error generating CSV:', error);
      toast.error('Kunde inte generera CSV-fil');
    }
  };

  const generatePDFContent = () => {
    const data = generateCSVData();
    let content = `${member.first_name} ${member.last_name} - Ledamotsprofil\n\n`;
    
    let currentCategory = '';
    data.forEach(row => {
      if (row.Kategori !== currentCategory) {
        content += `\n${row.Kategori}:\n`;
        currentCategory = row.Kategori;
      }
      content += `  ${row.Fält}: ${row.Värde}\n`;
    });

    content += `\nGenererad: ${new Date().toLocaleDateString('sv-SE')}\n`;
    content += `Källa: Riksdagen.se\n`;
    
    return content;
  };

  const downloadPDF = () => {
    try {
      // Simple text-based PDF alternative since we don't have jsPDF
      const content = generatePDFContent();
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${member.first_name}_${member.last_name}_ledamotsprofil.txt`;
      link.click();
      
      toast.success('Textfil nedladdad!');
      setOpen(false);
    } catch (error) {
      console.error('Error generating text file:', error);
      toast.error('Kunde inte generera fil');
    }
  };

  const updateOption = (key: keyof ExportOptions, value: boolean) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportera
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Exportera ledamotsprofil</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Member info */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-medium">{member.first_name} {member.last_name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {member.party}
              </Badge>
              {member.constituency && (
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {member.constituency}
                </span>
              )}
            </div>
          </div>

          {/* Export options */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Välj data att inkludera:</h4>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="basicInfo"
                  checked={options.basicInfo}
                  onCheckedChange={(checked) => updateOption('basicInfo', !!checked)}
                />
                <label htmlFor="basicInfo" className="text-sm">
                  Grunduppgifter
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="committees"
                  checked={options.committees}
                  onCheckedChange={(checked) => updateOption('committees', !!checked)}
                />
                <label htmlFor="committees" className="text-sm">
                  Utskott
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="activityStats"
                  checked={options.activityStats}
                  onCheckedChange={(checked) => updateOption('activityStats', !!checked)}
                />
                <label htmlFor="activityStats" className="text-sm">
                  Aktivitetsstatistik
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="assignments"
                  checked={options.assignments}
                  onCheckedChange={(checked) => updateOption('assignments', !!checked)}
                />
                <label htmlFor="assignments" className="text-sm">
                  Uppdrag
                </label>
              </div>
            </div>
          </div>

          {/* Export buttons */}
          <div className="space-y-2">
            <Button
              onClick={downloadCSV}
              className="w-full"
              variant="default"
            >
              <Table className="w-4 h-4 mr-2" />
              Ladda ner som CSV
            </Button>
            
            <Button
              onClick={downloadPDF}
              variant="outline"
              className="w-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              Ladda ner som textfil
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemberExportDialog;

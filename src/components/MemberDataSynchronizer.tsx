
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { fetchAllMembers, fetchMemberDetails, RiksdagMember, RiksdagMemberDetails } from '@/services/riksdagApi';
import { toast } from "sonner";
import { RefreshCw, Database, Users, CheckCircle, AlertCircle } from "lucide-react";

interface SyncStats {
  totalMembers: number;
  processedMembers: number;
  successfulUpdates: number;
  errors: number;
  currentMember?: string;
}

const MemberDataSynchronizer: React.FC = () => {
  const [isRunning, setSyncRunning] = useState(false);
  const [stats, setStats] = useState<SyncStats>({
    totalMembers: 0,
    processedMembers: 0,
    successfulUpdates: 0,
    errors: 0
  });
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev.slice(-20), logMessage]);
    console.log(logMessage);
  };

  const updateMemberInDatabase = async (member: RiksdagMember, details?: RiksdagMemberDetails) => {
    try {
      // Prepare image URLs
      const imageUrls: Record<string, string> = {};
      if (member.bild_url_80) imageUrls['80'] = member.bild_url_80;
      if (member.bild_url_192) imageUrls['192'] = member.bild_url_192;
      if (member.bild_url_max) imageUrls['max'] = member.bild_url_max;

      // Prepare committee data
      const currentCommittees = details?.assignments
        ?.filter(assignment => assignment.typ === 'uppdrag' && !assignment.tom)
        ?.map(assignment => assignment.organ_kod) || [];

      // Prepare member data
      const memberData = {
        member_id: member.intressent_id,
        first_name: member.tilltalsnamn || '',
        last_name: member.efternamn || '',
        party: member.parti || '',
        constituency: member.valkrets || null,
        gender: member.kon || null,
        birth_year: member.fodd_ar ? parseInt(member.fodd_ar) : null,
        is_active: !member.datum_tom || new Date(member.datum_tom) > new Date(),
        riksdag_status: member.status || 'Okänd',
        current_committees: currentCommittees.length > 0 ? currentCommittees : null,
        image_urls: Object.keys(imageUrls).length > 0 ? imageUrls : null,
        assignments: details?.assignments || [],
        activity_data: {
          motions: 0,
          speeches: 0,
          interpellations: 0,
          written_questions: 0,
          yearly_stats: {}
        }
      };

      // Upsert member data
      const { error } = await supabase
        .from('member_data')
        .upsert(memberData, { 
          onConflict: 'member_id',
          ignoreDuplicates: false 
        });

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error(`Error updating member ${member.tilltalsnamn} ${member.efternamn}:`, error);
      throw error;
    }
  };

  const runFullSync = async () => {
    setSyncRunning(true);
    setStats({
      totalMembers: 0,
      processedMembers: 0,
      successfulUpdates: 0,
      errors: 0
    });
    setLogs([]);

    try {
      addLog('Startar fullständig synkronisering av medlemsdata...');
      
      // Fetch all members
      addLog('Hämtar alla ledamöter från Riksdag API...');
      const allMembers = await fetchAllMembers();
      
      setStats(prev => ({ ...prev, totalMembers: allMembers.length }));
      addLog(`Hittade ${allMembers.length} ledamöter att bearbeta`);

      // Process members in batches to avoid overwhelming the API
      const batchSize = 3;
      for (let i = 0; i < allMembers.length; i += batchSize) {
        const batch = allMembers.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (member) => {
          try {
            setStats(prev => ({ 
              ...prev, 
              currentMember: `${member.tilltalsnamn} ${member.efternamn}` 
            }));
            
            addLog(`Bearbetar: ${member.tilltalsnamn} ${member.efternamn} (${member.parti})`);
            
            // Fetch detailed member information
            const details = await fetchMemberDetails(member.intressent_id);
            
            // Update database
            await updateMemberInDatabase(member, details || undefined);
            
            setStats(prev => ({ 
              ...prev, 
              processedMembers: prev.processedMembers + 1,
              successfulUpdates: prev.successfulUpdates + 1
            }));
            
          } catch (error) {
            addLog(`❌ Fel vid bearbetning av ${member.tilltalsnamn} ${member.efternamn}: ${error}`);
            setStats(prev => ({ 
              ...prev, 
              processedMembers: prev.processedMembers + 1,
              errors: prev.errors + 1
            }));
          }
        }));

        // Add delay between batches
        if (i + batchSize < allMembers.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      addLog('✅ Synkronisering komplett!');
      toast.success(`Synkronisering slutförd! ${stats.successfulUpdates} ledamöter uppdaterade, ${stats.errors} fel.`);

    } catch (error) {
      addLog(`❌ Kritiskt fel under synkronisering: ${error}`);
      toast.error('Synkronisering misslyckades');
    } finally {
      setSyncRunning(false);
      setStats(prev => ({ ...prev, currentMember: undefined }));
    }
  };

  const progress = stats.totalMembers > 0 ? (stats.processedMembers / stats.totalMembers) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>Medlemsdata Synkronisering</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Synkroniserar all medlemsdata från Riksdag API till Supabase
            </p>
            <Button 
              onClick={runFullSync} 
              disabled={isRunning}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Synkroniserar...' : 'Starta Synkronisering'}</span>
            </Button>
          </div>

          {isRunning && (
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Framsteg</span>
                  <span>{stats.processedMembers} / {stats.totalMembers}</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>

              {stats.currentMember && (
                <p className="text-sm text-blue-600">
                  Bearbetar: {stats.currentMember}
                </p>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">{stats.successfulUpdates}</div>
                  <div className="text-xs text-gray-500">Uppdaterade</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-red-600">{stats.errors}</div>
                  <div className="text-xs text-gray-500">Fel</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">{stats.totalMembers}</div>
                  <div className="text-xs text-gray-500">Totalt</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Synkroniseringslogg</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md max-h-60 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="text-xs font-mono mb-1">
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MemberDataSynchronizer;

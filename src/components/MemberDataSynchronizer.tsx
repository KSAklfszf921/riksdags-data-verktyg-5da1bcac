
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { fetchAllMembers, fetchMemberDetails, RiksdagMember, RiksdagMemberDetails } from '@/services/riksdagApi';
import { toast } from "sonner";
import { RefreshCw, Database, Users, CheckCircle, AlertCircle, Image, UserCheck } from "lucide-react";

interface SyncStats {
  totalMembers: number;
  processedMembers: number;
  successfulUpdates: number;
  errors: number;
  currentMember?: string;
  imagesProcessed: number;
  statusUpdates: number;
}

const MemberDataSynchronizer: React.FC = () => {
  const [isRunning, setSyncRunning] = useState(false);
  const [stats, setStats] = useState<SyncStats>({
    totalMembers: 0,
    processedMembers: 0,
    successfulUpdates: 0,
    errors: 0,
    imagesProcessed: 0,
    statusUpdates: 0
  });
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    let prefix = '';
    
    switch (type) {
      case 'success':
        prefix = '✅ ';
        break;
      case 'error':
        prefix = '❌ ';
        break;
      case 'warning':
        prefix = '⚠️ ';
        break;
      default:
        prefix = '📝 ';
        break;
    }
    
    const logMessage = `[${timestamp}] ${prefix}${message}`;
    setLogs(prev => [...prev.slice(-30), logMessage]);
    console.log(logMessage);
  };

  const updateMemberActiveStatus = async () => {
    try {
      addLog('Uppdaterar medlemsstatus baserat på uppdrag...', 'info');
      
      const { error } = await supabase.rpc('update_member_active_status');
      
      if (error) {
        throw error;
      }
      
      addLog('Medlemsstatus uppdaterad framgångsrikt', 'success');
      return true;
    } catch (error) {
      addLog(`Fel vid uppdatering av medlemsstatus: ${error}`, 'error');
      return false;
    }
  };

  const updateMemberInDatabase = async (member: RiksdagMember, details?: RiksdagMemberDetails) => {
    try {
      if (!member.intressent_id) {
        throw new Error('Missing member ID');
      }
      
      const imageUrls: Record<string, string> = {};
      if (member.bild_url_80 && typeof member.bild_url_80 === 'string') {
        imageUrls['80'] = member.bild_url_80;
      }
      if (member.bild_url_192 && typeof member.bild_url_192 === 'string') {
        imageUrls['192'] = member.bild_url_192;
      }
      if (member.bild_url_max && typeof member.bild_url_max === 'string') {
        imageUrls['max'] = member.bild_url_max;
      }

      if (Object.keys(imageUrls).length > 0) {
        setStats(prev => ({ ...prev, imagesProcessed: prev.imagesProcessed + 1 }));
      }

      const currentCommittees = details?.assignments
        ?.filter(assignment => assignment.typ === 'uppdrag' && !assignment.tom)
        ?.map(assignment => assignment.organ_kod) || [];

      const firstName = member.tilltalsnamn || '';
      const lastName = member.efternamn || '';
      
      const assignmentsForDb = details?.assignments ? 
        JSON.parse(JSON.stringify(details.assignments)) : 
        [];

      // Enhanced biographical data extraction
      const statusHistory = details?.assignments?.map(assignment => ({
        from: assignment.from,
        to: assignment.tom,
        organ: assignment.organ_kod,
        role: assignment.roll,
        type: assignment.typ
      })) || [];

      const memberData = {
        member_id: member.intressent_id,
        first_name: firstName,
        last_name: lastName,
        party: member.parti || '',
        constituency: member.valkrets || null,
        gender: member.kon || null,
        birth_year: member.fodd_ar ? parseInt(member.fodd_ar) : null,
        is_active: !member.datum_tom || new Date(member.datum_tom) > new Date(),
        riksdag_status: member.status || 'Okänd',
        current_committees: currentCommittees.length > 0 ? currentCommittees : null,
        image_urls: Object.keys(imageUrls).length > 0 ? imageUrls : null,
        assignments: assignmentsForDb,
        date_from: member.datum_from || null,
        date_to: member.datum_tom || null,
        status_history: statusHistory.length > 0 ? statusHistory : null,
        last_sync_at: new Date().toISOString(),
        activity_data: {
          motions: 0,
          speeches: 0,
          interpellations: 0,
          written_questions: 0,
          yearly_stats: {}
        }
      };

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

  const fetchWithRetry = async <T,>(
    fetchFn: () => Promise<T>,
    maxRetries: number = 3,
    description: string
  ): Promise<T | null> => {
    let retries = 0;
    let error: any;
    
    while (retries <= maxRetries) {
      try {
        if (retries > 0) {
          addLog(`Försök ${retries}/${maxRetries} för ${description}`, 'warning');
          await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retries)));
        }
        
        const result = await fetchFn();
        if (retries > 0) {
          addLog(`Lyckades efter återförsök för ${description}`, 'success');
        }
        return result;
      } catch (err) {
        error = err;
        addLog(`Försök ${retries + 1} misslyckades för ${description}: ${err}`, 'error');
        retries++;
      }
    }
    
    addLog(`Alla ${maxRetries} återförsök misslyckades för ${description}`, 'error');
    throw error;
  };

  const runFullSync = async () => {
    setSyncRunning(true);
    setStats({
      totalMembers: 0,
      processedMembers: 0,
      successfulUpdates: 0,
      errors: 0,
      imagesProcessed: 0,
      statusUpdates: 0
    });
    setLogs([]);

    try {
      addLog('Startar fullständig synkronisering av medlemsdata...', 'info');
      
      addLog('Hämtar alla ledamöter från Riksdag API...', 'info');
      
      let allMembers: RiksdagMember[];
      try {
        allMembers = await fetchWithRetry(
          () => fetchAllMembers(),
          3,
          "hämtning av alla ledamöter"
        ) || [];
        
        if (allMembers.length === 0) {
          throw new Error('Inga ledamöter returnerades från API');
        }
      } catch (error) {
        addLog(`Kritiskt fel vid hämtning av ledamöter: ${error}`, 'error');
        toast.error('Kunde inte hämta ledamotlista');
        setSyncRunning(false);
        return;
      }
      
      setStats(prev => ({ ...prev, totalMembers: allMembers.length }));
      addLog(`Hittade ${allMembers.length} ledamöter att bearbeta`, 'success');

      const batchSize = 3;
      for (let i = 0; i < allMembers.length; i += batchSize) {
        const batch = allMembers.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (member) => {
          try {
            setStats(prev => ({ 
              ...prev, 
              currentMember: `${member.tilltalsnamn || 'Okänd'} ${member.efternamn || 'Ledamot'} (${member.parti || 'Okänt parti'})` 
            }));
            
            addLog(`Bearbetar: ${member.tilltalsnamn || 'Okänd'} ${member.efternamn || 'Ledamot'} (${member.parti || 'Okänt parti'})`, 'info');
            
            let details: RiksdagMemberDetails | null = null;
            try {
              details = await fetchWithRetry(
                () => fetchMemberDetails(member.intressent_id),
                2,
                `hämtning av detaljer för ${member.tilltalsnamn} ${member.efternamn}`
              );
            } catch (error) {
              addLog(`Kan inte hämta detaljer för ${member.tilltalsnamn} ${member.efternamn}: ${error}`, 'warning');
            }
            
            if (!details) {
              addLog(`Använder grundläggande information för ${member.tilltalsnamn} ${member.efternamn} - detaljinformation saknas`, 'warning');
            }
            
            await updateMemberInDatabase(member, details || undefined);
            
            setStats(prev => ({ 
              ...prev, 
              processedMembers: prev.processedMembers + 1,
              successfulUpdates: prev.successfulUpdates + 1
            }));
            
            addLog(`Uppdaterad: ${member.tilltalsnamn || 'Okänd'} ${member.efternamn || 'Ledamot'}`, 'success');
            
          } catch (error) {
            addLog(`Fel vid bearbetning av ${member.tilltalsnamn || 'Okänd'} ${member.efternamn || 'Ledamot'}: ${error}`, 'error');
            setStats(prev => ({ 
              ...prev, 
              processedMembers: prev.processedMembers + 1,
              errors: prev.errors + 1
            }));
          }
        }));

        if (i + batchSize < allMembers.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Update member active status using the database function
      addLog('Uppdaterar medlemsstatus...', 'info');
      const statusUpdateSuccess = await updateMemberActiveStatus();
      if (statusUpdateSuccess) {
        setStats(prev => ({ ...prev, statusUpdates: prev.successfulUpdates }));
      }

      addLog('Synkronisering komplett!', 'success');
      toast.success(`Synkronisering slutförd! ${stats.successfulUpdates} ledamöter uppdaterade, ${stats.errors} fel, ${stats.imagesProcessed} bilder processade.`);

    } catch (error) {
      addLog(`Kritiskt fel under synkronisering: ${error}`, 'error');
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
            <span>Förbättrad Medlemsdata Synkronisering</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Synkroniserar all medlemsdata med förbättrad statusinformation och biografiska data
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

              <div className="grid grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">{stats.successfulUpdates}</div>
                  <div className="text-xs text-gray-500">Uppdaterade</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-red-600">{stats.errors}</div>
                  <div className="text-xs text-gray-500">Fel</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">{stats.imagesProcessed}</div>
                  <div className="text-xs text-gray-500">Bilder</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600">{stats.statusUpdates}</div>
                  <div className="text-xs text-gray-500">Status</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">{stats.totalMembers}</div>
                  <div className="text-xs text-gray-500">Totalt</div>
                </div>
              </div>
            </div>
          )}

          {!isRunning && stats.processedMembers > 0 && (
            <div className="bg-green-50 border border-green-100 rounded-md p-3">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-green-800">Synkronisering slutförd</h4>
                  <p className="text-xs text-green-600">
                    {stats.successfulUpdates} ledamöter uppdaterade, {stats.imagesProcessed} bilder processade, {stats.statusUpdates} statusuppdateringar, {stats.errors} fel
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced status update button */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5" />
            <span>Statusuppdatering</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Uppdatera medlemsstatus baserat på aktiva uppdrag
            </p>
            <Button 
              onClick={updateMemberActiveStatus} 
              disabled={isRunning}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Uppdatera Status</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-2">
              <span>Synkroniseringslogg</span>
              <Badge variant="outline" className="ml-2">
                {logs.length} händelser
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md max-h-80 overflow-y-auto">
              {logs.map((log, index) => (
                <div 
                  key={index} 
                  className={`text-xs font-mono mb-1 ${
                    log.includes('❌') ? 'text-red-600' : 
                    log.includes('✅') ? 'text-green-600' : 
                    log.includes('⚠️') ? 'text-amber-600' : 
                    'text-gray-700'
                  }`}
                >
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

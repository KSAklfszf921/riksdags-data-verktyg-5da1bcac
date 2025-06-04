
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { fetchAllMembers, fetchMemberDetails, RiksdagMember, RiksdagMemberDetails } from '@/services/riksdagApi';
import { toast } from "sonner";
import { RefreshCw, Database, Users, CheckCircle, AlertCircle, Image } from "lucide-react";

interface SyncStats {
  totalMembers: number;
  processedMembers: number;
  successfulUpdates: number;
  errors: number;
  currentMember?: string;
  imagesProcessed: number;
}

const MemberDataSynchronizer: React.FC = () => {
  const [isRunning, setSyncRunning] = useState(false);
  const [stats, setStats] = useState<SyncStats>({
    totalMembers: 0,
    processedMembers: 0,
    successfulUpdates: 0,
    errors: 0,
    imagesProcessed: 0
  });
  const [logs, setLogs] = useState<string[]>([]);

  // Enhanced logging with timestamp and color indicators
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

  const updateMemberInDatabase = async (member: RiksdagMember, details?: RiksdagMemberDetails) => {
    try {
      // Validate member data
      if (!member.intressent_id) {
        throw new Error('Missing member ID');
      }
      
      // Prepare image URLs with validation
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

      // Track if we found images
      if (Object.keys(imageUrls).length > 0) {
        setStats(prev => ({ ...prev, imagesProcessed: prev.imagesProcessed + 1 }));
      }

      // Prepare committee data with fallback
      const currentCommittees = details?.assignments
        ?.filter(assignment => assignment.typ === 'uppdrag' && !assignment.tom)
        ?.map(assignment => assignment.organ_kod) || [];

      // Ensure member has at least basic info if details are missing
      const firstName = member.tilltalsnamn || '';
      const lastName = member.efternamn || '';
      
      // Convert assignments to match the database type (Json)
      const assignmentsForDb = details?.assignments ? 
        JSON.parse(JSON.stringify(details.assignments)) : 
        [];

      // Check if member is active using the correct property
      const isActive = !(member as any).datum_tom || new Date((member as any).datum_tom) > new Date();

      // Prepare member data with validated fields - using enhanced_member_profiles table
      const memberData = {
        member_id: member.intressent_id,
        first_name: firstName,
        last_name: lastName,
        party: member.parti || '',
        constituency: member.valkrets || null,
        gender: member.kon || null,
        birth_year: member.fodd_ar ? parseInt(member.fodd_ar) : null,
        is_active: isActive,
        riksdag_status: member.status || 'Okänd',
        current_committees: currentCommittees.length > 0 ? currentCommittees : null,
        image_urls: Object.keys(imageUrls).length > 0 ? imageUrls : null,
        primary_image_url: imageUrls['max'] || imageUrls['192'] || imageUrls['80'] || null,
        assignments: assignmentsForDb,
        activity_summary: {
          motions: 0,
          speeches: 0,
          interpellations: 0,
          written_questions: 0,
          yearly_stats: {}
        }
      };

      // Upsert member data to enhanced_member_profiles
      const { error } = await supabase
        .from('enhanced_member_profiles')
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

  // Enhanced retry logic with exponential backoff
  const fetchWithRetry = async <T,>(
    fetchFn: () => Promise<T>,
    maxRetries: number = 3,
    description: string,
    baseDelay: number = 1000
  ): Promise<T | null> => {
    let retries = 0;
    let error: any;
    
    while (retries <= maxRetries) {
      try {
        if (retries > 0) {
          const delay = baseDelay * Math.pow(2, retries - 1);
          addLog(`Retry attempt ${retries}/${maxRetries} for ${description} (waiting ${delay}ms)`, 'warning');
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        const result = await fetchFn();
        if (retries > 0) {
          addLog(`Retry successful for ${description}`, 'success');
        }
        return result;
      } catch (err) {
        error = err;
        addLog(`Attempt ${retries + 1} failed for ${description}: ${err instanceof Error ? err.message : String(err)}`, 'error');
        retries++;
      }
    }
    
    addLog(`All ${maxRetries} retry attempts failed for ${description}`, 'error');
    return null;
  };

  const runFullSync = async () => {
    setSyncRunning(true);
    setStats({
      totalMembers: 0,
      processedMembers: 0,
      successfulUpdates: 0,
      errors: 0,
      imagesProcessed: 0
    });
    setLogs([]);

    try {
      addLog('Startar fullständig synkronisering av medlemsdata...', 'info');
      
      // Fetch all members with enhanced retry
      addLog('Hämtar alla ledamöter från Riksdag API...', 'info');
      
      const allMembers = await fetchWithRetry(
        () => fetchAllMembers(),
        5,
        "fetching all members",
        2000
      );
      
      if (!allMembers || allMembers.length === 0) {
        throw new Error('No members returned from API');
      }
      
      setStats(prev => ({ ...prev, totalMembers: allMembers.length }));
      addLog(`Hittade ${allMembers.length} ledamöter att bearbeta`, 'success');

      // Process members in smaller batches with longer delays
      const batchSize = 2;
      const batchDelay = 3000; // 3 seconds between batches
      
      for (let i = 0; i < allMembers.length; i += batchSize) {
        const batch = allMembers.slice(i, i + batchSize);
        
        addLog(`Bearbetar batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allMembers.length/batchSize)}`, 'info');
        
        await Promise.all(batch.map(async (member) => {
          try {
            setStats(prev => ({ 
              ...prev, 
              currentMember: `${member.tilltalsnamn || 'Okänd'} ${member.efternamn || 'Ledamot'} (${member.parti || 'Okänt parti'})` 
            }));
            
            addLog(`Bearbetar: ${member.tilltalsnamn || 'Okänd'} ${member.efternamn || 'Ledamot'}`, 'info');
            
            // Fetch detailed member information with enhanced retry
            const details = await fetchWithRetry(
              () => fetchMemberDetails(member.intressent_id),
              3,
              `fetching details for ${member.tilltalsnamn} ${member.efternamn}`,
              1500
            );
            
            if (!details) {
              addLog(`Använder grundläggande information för ${member.tilltalsnamn} ${member.efternamn}`, 'warning');
            }
            
            // Update database
            await updateMemberInDatabase(member, details || undefined);
            
            setStats(prev => ({ 
              ...prev, 
              processedMembers: prev.processedMembers + 1,
              successfulUpdates: prev.successfulUpdates + 1
            }));
            
            addLog(`Uppdaterad: ${member.tilltalsnamn || 'Okänd'} ${member.efternamn || 'Ledamot'}`, 'success');
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            addLog(`Fel vid bearbetning av ${member.tilltalsnamn || 'Okänd'} ${member.efternamn || 'Ledamot'}: ${errorMessage}`, 'error');
            setStats(prev => ({ 
              ...prev, 
              processedMembers: prev.processedMembers + 1,
              errors: prev.errors + 1
            }));
          }
        }));

        // Add delay between batches to respect rate limits
        if (i + batchSize < allMembers.length) {
          addLog(`Väntar ${batchDelay}ms innan nästa batch...`, 'info');
          await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
      }

      addLog('Synkronisering komplett!', 'success');
      toast.success(`Synkronisering slutförd! ${stats.successfulUpdates} ledamöter uppdaterade, ${stats.errors} fel.`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`Kritiskt fel under synkronisering: ${errorMessage}`, 'error');
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
              Synkroniserar all medlemsdata från Riksdag API till Supabase med förbättrad rate limiting
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

              <div className="grid grid-cols-4 gap-4">
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
                    {stats.successfulUpdates} ledamöter uppdaterade, {stats.imagesProcessed} bilder processade, {stats.errors} fel
                  </p>
                </div>
              </div>
            </div>
          )}
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

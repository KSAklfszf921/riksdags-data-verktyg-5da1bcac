
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const startTime = Date.now()
    console.log('Starting comprehensive data sync at:', new Date().toISOString())

    // Initialize counters
    let membersProcessed = 0
    let partiesProcessed = 0
    let votesProcessed = 0
    let documentsProcessed = 0
    let speechesProcessed = 0
    let calendarEventsProcessed = 0
    let errorsCount = 0
    const errors: string[] = []

    // Helper function to fetch from Riksdag API with retry logic
    const fetchWithRetry = async (url: string, maxRetries = 3) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch(url)
          if (response.ok) {
            return await response.json()
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        } catch (error) {
          console.log(`Attempt ${attempt} failed for ${url}:`, error.message)
          if (attempt === maxRetries) throw error
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      }
    }

    // 1. Sync Member Data (existing logic)
    try {
      console.log('Syncing member data...')
      const membersResponse = await fetchWithRetry('https://data.riksdagen.se/personlista/?format=json&utformat=json')
      const members = membersResponse?.personlista?.person || []

      for (const member of members.slice(0, 50)) { // Limit to prevent timeout
        try {
          // Fetch detailed member info
          const detailResponse = await fetchWithRetry(
            `https://data.riksdagen.se/person/${member.intressent_id}?format=json&utformat=json`
          )
          const personDetail = detailResponse?.personuppgift?.person

          if (personDetail) {
            const assignments = personDetail.personuppdrag?.uppdrag || []
            const currentCommittees = assignments
              .filter((assignment: any) => {
                const endDate = assignment.tom ? new Date(assignment.tom) : null
                return !endDate || endDate > new Date()
              })
              .map((assignment: any) => assignment.organ_kod)
              .filter((code: string) => code && code !== 'kam')

            await supabase
              .from('member_data')
              .upsert({
                member_id: member.intressent_id,
                first_name: member.fornamn,
                last_name: member.efternamn,
                party: member.parti,
                constituency: member.valkrets || null,
                gender: member.kon || null,
                birth_year: member.fodd_ar ? parseInt(member.fodd_ar) : null,
                is_active: member.status === 'Tjänstgörande',
                riksdag_status: member.status,
                current_committees: currentCommittees,
                assignments: assignments,
                committee_assignments: assignments,
                activity_data: null,
                image_urls: personDetail.bild_url_max ? { large: personDetail.bild_url_max } : null,
                updated_at: new Date().toISOString()
              })

            membersProcessed++
          }
        } catch (error) {
          console.error(`Error processing member ${member.intressent_id}:`, error)
          errorsCount++
          errors.push(`Member ${member.intressent_id}: ${error.message}`)
        }
      }
    } catch (error) {
      console.error('Error syncing member data:', error)
      errorsCount++
      errors.push(`Member sync: ${error.message}`)
    }

    // 2. Sync Party Data (existing logic)
    try {
      console.log('Syncing party data...')
      const { data: memberData } = await supabase
        .from('member_data')
        .select('*')

      if (memberData) {
        const partyStats = memberData.reduce((acc: any, member: any) => {
          const party = member.party
          if (!acc[party]) {
            acc[party] = {
              total: 0,
              active: 0,
              male: 0,
              female: 0,
              committees: {},
              members: []
            }
          }

          acc[party].total++
          if (member.is_active) acc[party].active++
          if (member.gender === 'man') acc[party].male++
          if (member.gender === 'kvinna') acc[party].female++

          // Committee distribution
          if (member.current_committees) {
            member.current_committees.forEach((committee: string) => {
              if (!acc[party].committees[committee]) {
                acc[party].committees[committee] = 0
              }
              acc[party].committees[committee]++
            })
          }

          acc[party].members.push({
            id: member.member_id,
            name: `${member.first_name} ${member.last_name}`,
            constituency: member.constituency,
            committees: member.current_committees || []
          })

          return acc
        }, {})

        for (const [partyCode, stats] of Object.entries(partyStats as any)) {
          await supabase
            .from('party_data')
            .upsert({
              party_code: partyCode,
              party_name: partyCode, // Could be enhanced with full names
              total_members: stats.total,
              active_members: stats.active,
              gender_distribution: {
                male: stats.male,
                female: stats.female
              },
              committee_distribution: stats.committees,
              committee_members: stats.committees,
              member_list: stats.members,
              activity_stats: null,
              updated_at: new Date().toISOString()
            })

          partiesProcessed++
        }
      }
    } catch (error) {
      console.error('Error syncing party data:', error)
      errorsCount++
      errors.push(`Party sync: ${error.message}`)
    }

    // 3. Sync Vote Data
    try {
      console.log('Syncing vote data...')
      const votesResponse = await fetchWithRetry(
        'https://data.riksdagen.se/voteringlista/?format=json&utformat=json&sz=50'
      )
      const votes = votesResponse?.voteringlista?.votering || []

      for (const vote of votes) {
        try {
          // Fetch detailed vote results
          const voteDetailResponse = await fetchWithRetry(
            `https://data.riksdagen.se/votering/${vote.hangar_id}/${vote.votering}?format=json&utformat=json`
          )
          const voteDetail = voteDetailResponse?.voteringsutfall

          const partyBreakdown: any = {}
          const constituencyBreakdown: any = {}
          
          if (voteDetail?.votering_resultat_lista?.votering_resultat) {
            voteDetail.votering_resultat_lista.votering_resultat.forEach((result: any) => {
              if (!partyBreakdown[result.parti]) {
                partyBreakdown[result.parti] = { ja: 0, nej: 0, avstår: 0, frånvarande: 0 }
              }
              if (!constituencyBreakdown[result.valkrets]) {
                constituencyBreakdown[result.valkrets] = { ja: 0, nej: 0, avstår: 0, frånvarande: 0 }
              }
              
              const voteType = result.rost.toLowerCase()
              if (partyBreakdown[result.parti][voteType] !== undefined) {
                partyBreakdown[result.parti][voteType]++
              }
              if (constituencyBreakdown[result.valkrets][voteType] !== undefined) {
                constituencyBreakdown[result.valkrets][voteType]++
              }
            })
          }

          await supabase
            .from('vote_data')
            .upsert({
              vote_id: `${vote.hangar_id}-${vote.votering}`,
              hangar_id: vote.hangar_id,
              rm: vote.rm,
              beteckning: vote.beteckning,
              punkt: vote.punkt,
              votering: vote.votering,
              avser: vote.avser,
              dok_id: vote.dok_id,
              systemdatum: vote.systemdatum,
              vote_results: voteDetail,
              vote_statistics: {
                total_votes: voteDetail?.votering_resultat_lista?.votering_resultat?.length || 0
              },
              party_breakdown: partyBreakdown,
              constituency_breakdown: constituencyBreakdown,
              updated_at: new Date().toISOString()
            })

          votesProcessed++
        } catch (error) {
          console.error(`Error processing vote ${vote.hangar_id}:`, error)
          errorsCount++
          errors.push(`Vote ${vote.hangar_id}: ${error.message}`)
        }
      }
    } catch (error) {
      console.error('Error syncing vote data:', error)
      errorsCount++
      errors.push(`Vote sync: ${error.message}`)
    }

    // 4. Sync Document Data
    try {
      console.log('Syncing document data...')
      const documentsResponse = await fetchWithRetry(
        'https://data.riksdagen.se/dokumentlista/?format=json&utformat=json&sz=50'
      )
      const documents = documentsResponse?.dokumentlista?.dokument || []

      for (const document of documents) {
        try {
          await supabase
            .from('document_data')
            .upsert({
              document_id: document.id,
              titel: document.titel,
              beteckning: document.beteckning,
              datum: document.datum,
              typ: document.typ,
              organ: document.organ,
              intressent_id: document.intressent_id,
              party: document.parti,
              hangar_id: document.hangar_id,
              document_url_text: document.dokument_url_text,
              document_url_html: document.dokument_url_html,
              dokumentstatus: document.dokumentstatus,
              publicerad: document.publicerad,
              rm: document.rm,
              summary: document.summary,
              content_preview: document.summary?.substring(0, 500),
              metadata: {
                tempbeteckning: document.tempbeteckning,
                notis: document.notis,
                notisrubrik: document.notisrubrik
              },
              updated_at: new Date().toISOString()
            })

          documentsProcessed++
        } catch (error) {
          console.error(`Error processing document ${document.id}:`, error)
          errorsCount++
          errors.push(`Document ${document.id}: ${error.message}`)
        }
      }
    } catch (error) {
      console.error('Error syncing document data:', error)
      errorsCount++
      errors.push(`Document sync: ${error.message}`)
    }

    // 5. Sync Speech Data
    try {
      console.log('Syncing speech data...')
      const speechesResponse = await fetchWithRetry(
        'https://data.riksdagen.se/anforandelista/?format=json&utformat=json&sz=50'
      )
      const speeches = speechesResponse?.anforandelista?.anforande || []

      for (const speech of speeches) {
        try {
          const wordCount = speech.anforandetext ? speech.anforandetext.split(' ').length : 0

          await supabase
            .from('speech_data')
            .upsert({
              speech_id: speech.anforande_id || `${speech.dok_id}-${speech.anforande_nummer}`,
              anforande_id: speech.anforande_id,
              intressent_id: speech.intressent_id,
              rel_dok_id: speech.rel_dok_id,
              namn: speech.namn,
              party: speech.parti,
              anforandedatum: speech.anforandedatum,
              anforandetext: speech.anforandetext,
              anforandetyp: speech.anforandetyp,
              kammaraktivitet: speech.kammaraktivitet,
              anforande_nummer: speech.anforande_nummer,
              talare: speech.talare,
              rel_dok_titel: speech.rel_dok_titel,
              rel_dok_beteckning: speech.rel_dok_beteckning,
              anf_klockslag: speech.anf_klockslag,
              anforande_url_html: speech.anforande_url_html,
              content_summary: speech.anforandetext?.substring(0, 200),
              word_count: wordCount,
              metadata: {
                kammaraktivitet: speech.kammaraktivitet,
                systemdatum: speech.systemdatum
              },
              updated_at: new Date().toISOString()
            })

          speechesProcessed++
        } catch (error) {
          console.error(`Error processing speech ${speech.anforande_id}:`, error)
          errorsCount++
          errors.push(`Speech ${speech.anforande_id}: ${error.message}`)
        }
      }
    } catch (error) {
      console.error('Error syncing speech data:', error)
      errorsCount++
      errors.push(`Speech sync: ${error.message}`)
    }

    // 6. Sync Calendar Data
    try {
      console.log('Syncing calendar data...')
      const calendarResponse = await fetchWithRetry(
        'https://data.riksdagen.se/aktivitetslista/?format=json&utformat=json&sz=50'
      )
      const events = calendarResponse?.aktivitetslista?.aktivitet || []

      for (const event of events) {
        try {
          await supabase
            .from('calendar_data')
            .upsert({
              event_id: event.id || `${event.datum}-${event.tid}`,
              datum: event.datum,
              tid: event.tid,
              plats: event.plats,
              aktivitet: event.aktivitet,
              typ: event.typ,
              organ: event.organ,
              summary: event.titel || event.aktivitet,
              description: event.beskrivning,
              status: event.status,
              url: event.url,
              sekretess: event.sekretess,
              participants: event.deltagare ? [event.deltagare] : null,
              related_documents: event.dokument ? [event.dokument] : null,
              metadata: {
                planerad_startdatum: event.planerad_startdatum,
                planerad_slutdatum: event.planerad_slutdatum
              },
              updated_at: new Date().toISOString()
            })

          calendarEventsProcessed++
        } catch (error) {
          console.error(`Error processing calendar event ${event.id}:`, error)
          errorsCount++
          errors.push(`Calendar ${event.id}: ${error.message}`)
        }
      }
    } catch (error) {
      console.error('Error syncing calendar data:', error)
      errorsCount++
      errors.push(`Calendar sync: ${error.message}`)
    }

    // Log sync results
    const syncDuration = Date.now() - startTime
    const syncStatus = errorsCount > 0 ? 'completed_with_errors' : 'success'

    await supabase
      .from('data_sync_log')
      .insert({
        sync_type: 'comprehensive_sync',
        status: syncStatus,
        members_processed: membersProcessed,
        parties_processed: partiesProcessed,
        votes_processed: votesProcessed,
        documents_processed: documentsProcessed,
        speeches_processed: speechesProcessed,
        calendar_events_processed: calendarEventsProcessed,
        errors_count: errorsCount,
        sync_duration_ms: syncDuration,
        error_details: errors.length > 0 ? errors : null
      })

    console.log(`Comprehensive sync completed in ${syncDuration}ms:`, {
      membersProcessed,
      partiesProcessed,
      votesProcessed,
      documentsProcessed,
      speechesProcessed,
      calendarEventsProcessed,
      errorsCount,
      status: syncStatus
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Comprehensive data sync completed',
        results: {
          membersProcessed,
          partiesProcessed,
          votesProcessed,
          documentsProcessed,
          speechesProcessed,
          calendarEventsProcessed,
          errorsCount,
          syncDuration,
          status: syncStatus
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Critical error in comprehensive sync:', error)
    
    await supabase
      .from('data_sync_log')
      .insert({
        sync_type: 'comprehensive_sync',
        status: 'failed',
        errors_count: 1,
        error_details: [error.message]
      })

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

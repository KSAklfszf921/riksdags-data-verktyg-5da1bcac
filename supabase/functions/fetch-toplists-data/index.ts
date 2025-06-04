
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const BASE_URL = 'https://data.riksdagen.se'

async function fetchWithRetry(url: string, maxRetries = 3): Promise<any> {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      console.log(`📡 Fetching: ${url} (attempt ${i + 1}/${maxRetries + 1})`)
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'RiksdagDataSync/1.0'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error(`❌ Fetch attempt ${i + 1} failed:`, error)
      if (i === maxRetries) throw error
      
      const delay = 1000 * (i + 1)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

async function generateTopLists(riksdagsYear: string = '2024/25') {
  console.log(`📊 Generating top lists for ${riksdagsYear}`)
  
  try {
    // Fetch current year documents with specific date range
    const currentDate = new Date()
    const fromDate = `${currentDate.getFullYear()}-01-01`
    const toDate = currentDate.toISOString().split('T')[0]
    
    console.log(`📅 Fetching documents from ${fromDate} to ${toDate}`)
    
    // Fetch documents with increased size limit and proper filtering
    const documentUrl = `${BASE_URL}/dokumentlista/?utformat=json&from=${fromDate}&tom=${toDate}&sz=10000&sort=datum&sortorder=desc`
    const documentData = await fetchWithRetry(documentUrl)
    
    if (!documentData.dokumentlista?.dokument) {
      console.warn('⚠️ No documents found for top lists')
      return null
    }
    
    const documents = Array.isArray(documentData.dokumentlista.dokument) 
      ? documentData.dokumentlista.dokument 
      : [documentData.dokumentlista.dokument]
    
    console.log(`📄 Processing ${documents.length} documents`)
    
    // Get enhanced member profiles for name mapping
    const { data: memberProfiles } = await supabase
      .from('enhanced_member_profiles')
      .select('member_id, first_name, last_name, party, constituency, primary_image_url')
    
    if (!memberProfiles || memberProfiles.length === 0) {
      console.warn('⚠️ No member profiles found in database')
      return null
    }
    
    // Create member lookup map
    const memberLookup = new Map()
    memberProfiles.forEach(member => {
      memberLookup.set(member.member_id, {
        name: `${member.first_name} ${member.last_name}`,
        party: member.party,
        constituency: member.constituency,
        imageUrl: member.primary_image_url
      })
    })
    
    console.log(`👥 Created lookup for ${memberLookup.size} members`)
    
    // Initialize counters for different document types
    const motionCounts = new Map()
    const interpellationCounts = new Map()
    const writtenQuestionCounts = new Map()
    
    // Process documents by type
    let processedCount = 0
    documents.forEach(doc => {
      if (!doc.intressent_id) return
      
      const memberInfo = memberLookup.get(doc.intressent_id)
      if (!memberInfo) return
      
      const memberKey = doc.intressent_id
      processedCount++
      
      switch (doc.typ) {
        case 'mot':
          motionCounts.set(memberKey, (motionCounts.get(memberKey) || 0) + 1)
          break
        case 'ip':
          interpellationCounts.set(memberKey, (interpellationCounts.get(memberKey) || 0) + 1)
          break
        case 'fr':
          writtenQuestionCounts.set(memberKey, (writtenQuestionCounts.get(memberKey) || 0) + 1)
          break
      }
    })
    
    console.log(`📊 Processed ${processedCount} documents with member IDs`)
    console.log(`📈 Found ${motionCounts.size} members with motions, ${interpellationCounts.size} with interpellations, ${writtenQuestionCounts.size} with written questions`)
    
    // Fetch speech data for current year with retry and better error handling
    let speechCounts = new Map()
    
    try {
      console.log(`🎤 Fetching speeches for ${riksdagsYear}`)
      const speechUrl = `${BASE_URL}/anforandelista?utformat=json&rm=${encodeURIComponent(riksdagsYear)}&sz=10000`
      const speechData = await fetchWithRetry(speechUrl)
      
      if (speechData.anforandelista?.anforande) {
        const speeches = Array.isArray(speechData.anforandelista.anforande) 
          ? speechData.anforandelista.anforande 
          : [speechData.anforandelista.anforande]
        
        console.log(`🎤 Processing ${speeches.length} speeches`)
        
        speeches.forEach(speech => {
          if (!speech.intressent_id) return
          const memberInfo = memberLookup.get(speech.intressent_id)
          if (!memberInfo) return
          
          speechCounts.set(speech.intressent_id, (speechCounts.get(speech.intressent_id) || 0) + 1)
        })
        
        console.log(`🎤 Found ${speechCounts.size} members with speeches`)
      }
    } catch (error) {
      console.error('❌ Error fetching speech data:', error)
      // Continue without speech data rather than failing completely
    }
    
    // Create top lists with improved sorting and data validation
    const createTopList = (countMap: Map<string, number>, type: string) => {
      console.log(`📋 Creating top list for ${type} with ${countMap.size} entries`)
      
      const topList = Array.from(countMap.entries())
        .map(([memberId, count]) => {
          const memberInfo = memberLookup.get(memberId)
          if (!memberInfo) {
            console.warn(`⚠️ Member info not found for ID: ${memberId}`)
            return null
          }
          
          return {
            id: memberId,
            name: memberInfo.name,
            party: memberInfo.party,
            constituency: memberInfo.constituency,
            imageUrl: memberInfo.imageUrl,
            count
          }
        })
        .filter(item => item !== null && item.count > 0) // Only include members with actual activity
        .sort((a, b) => {
          // Primary sort by count (descending)
          if (b.count !== a.count) return b.count - a.count
          // Secondary sort by name (ascending) for ties
          return a.name.localeCompare(b.name)
        })
        .slice(0, 20) // Keep top 20 instead of 10 for more comprehensive data
      
      console.log(`✅ Created ${type} top list with ${topList.length} entries`)
      return topList
    }
    
    const topLists = {
      motions: createTopList(motionCounts, 'motions'),
      speeches: createTopList(speechCounts, 'speeches'),
      interpellations: createTopList(interpellationCounts, 'interpellations'),
      writtenQuestions: createTopList(writtenQuestionCounts, 'writtenQuestions'),
      lastUpdated: new Date().toISOString(),
      metadata: {
        totalDocuments: documents.length,
        processedDocuments: processedCount,
        riksdagsYear,
        dateRange: { from: fromDate, to: toDate },
        memberCount: memberLookup.size
      }
    }
    
    console.log(`✅ Generated comprehensive top lists:`)
    console.log(`   - Motions: ${topLists.motions.length} leaders`)
    console.log(`   - Speeches: ${topLists.speeches.length} leaders`)
    console.log(`   - Interpellations: ${topLists.interpellations.length} leaders`)
    console.log(`   - Written Questions: ${topLists.writtenQuestions.length} leaders`)
    
    return topLists
  } catch (error) {
    console.error('💥 Error generating top lists:', error)
    throw error
  }
}

async function generatePartyData() {
  console.log(`👥 Generating party analysis data`)
  
  try {
    // Use enhanced member profiles instead of fetching from API
    const { data: memberProfiles } = await supabase
      .from('enhanced_member_profiles')
      .select('*')
      .eq('is_active', true)
    
    if (!memberProfiles || memberProfiles.length === 0) {
      throw new Error('No enhanced member profiles found')
    }
    
    console.log(`👥 Processing ${memberProfiles.length} active members`)
    
    // Group by party and calculate statistics
    const partyMap = new Map()
    
    for (const member of memberProfiles) {
      if (!member.party) continue
      
      if (!partyMap.has(member.party)) {
        partyMap.set(member.party, {
          party_code: member.party,
          party_name: member.party,
          total_members: 0,
          active_members: 0,
          members: [],
          committees: new Set(),
          ages: [],
          genders: { male: 0, female: 0, unknown: 0 }
        })
      }
      
      const partyData = partyMap.get(member.party)
      partyData.total_members++
      partyData.active_members++
      partyData.members.push({
        id: member.member_id,
        name: `${member.first_name} ${member.last_name}`,
        constituency: member.constituency,
        birth_year: member.birth_year
      })
      
      // Add committee information
      if (member.current_committees) {
        member.current_committees.forEach(committee => {
          partyData.committees.add(committee)
        })
      }
      
      // Calculate age
      if (member.birth_year) {
        const age = new Date().getFullYear() - member.birth_year
        partyData.ages.push(age)
      }
      
      // Count gender
      if (member.gender === 'man') {
        partyData.genders.male++
      } else if (member.gender === 'kvinna') {
        partyData.genders.female++
      } else {
        partyData.genders.unknown++
      }
    }
    
    // Convert to final format and store
    const partyDataArray = []
    
    for (const [partyCode, data] of partyMap) {
      const totalMembers = data.total_members
      const avgAge = data.ages.length > 0 ? data.ages.reduce((a, b) => a + b, 0) / data.ages.length : 0
      
      // Age distribution
      const ageGroups = { '20-30': 0, '31-40': 0, '41-50': 0, '51-60': 0, '61+': 0 }
      data.ages.forEach(age => {
        if (age <= 30) ageGroups['20-30']++
        else if (age <= 40) ageGroups['31-40']++
        else if (age <= 50) ageGroups['41-50']++
        else if (age <= 60) ageGroups['51-60']++
        else ageGroups['61+']++
      })
      
      // Committee distribution
      const committeeDistribution = {}
      Array.from(data.committees).forEach(committee => {
        committeeDistribution[committee] = data.members.filter(member => 
          memberProfiles.find(p => p.member_id === member.id && 
            p.current_committees && p.current_committees.includes(committee))
        ).length
      })
      
      partyDataArray.push({
        party_code: partyCode,
        party_name: data.party_name,
        total_members: totalMembers,
        active_members: data.active_members,
        gender_distribution: {
          male: totalMembers > 0 ? Math.round((data.genders.male / totalMembers) * 100) : 0,
          female: totalMembers > 0 ? Math.round((data.genders.female / totalMembers) * 100) : 0,
          unknown: totalMembers > 0 ? Math.round((data.genders.unknown / totalMembers) * 100) : 0
        },
        age_distribution: ageGroups,
        committee_distribution: committeeDistribution,
        committee_members: {},
        member_list: data.members,
        activity_stats: {
          average_age: Math.round(avgAge),
          total_active: data.active_members,
          total_committees: data.committees.size
        }
      })
    }
    
    console.log(`✅ Generated party data for ${partyDataArray.length} parties`)
    return partyDataArray
  } catch (error) {
    console.error('💥 Error generating party data:', error)
    throw error
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    console.log('🚀 Starting enhanced toplists and party data sync')
    
    const startTime = Date.now()
    let topListsStored = false
    let partyDataStored = false
    
    // Generate and store top lists
    try {
      console.log('📊 Generating enhanced top lists...')
      const topListsData = await generateTopLists()
      
      if (topListsData) {
        const { error: topListsError } = await supabase
          .from('cached_toplists')
          .upsert({
            riksdags_year: '2024/25',
            data: topListsData,
            updated_at: new Date().toISOString()
          }, { onConflict: 'riksdags_year' })
        
        if (topListsError) {
          console.error('❌ Error storing top lists:', topListsError)
        } else {
          topListsStored = true
          console.log('✅ Enhanced top lists stored successfully')
        }
      }
    } catch (error) {
      console.error('💥 Top lists generation failed:', error)
    }
    
    // Generate and store party data
    try {
      console.log('👥 Generating enhanced party data...')
      const partyData = await generatePartyData()
      
      // Clear existing party data
      await supabase.from('party_data').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      
      // Insert new party data
      const { error: partyError } = await supabase
        .from('party_data')
        .insert(partyData)
      
      if (partyError) {
        console.error('❌ Error storing party data:', partyError)
      } else {
        partyDataStored = true
        console.log(`✅ Enhanced party data stored successfully for ${partyData.length} parties`)
      }
    } catch (error) {
      console.error('💥 Party data generation failed:', error)
    }
    
    const duration = Date.now() - startTime
    
    const response = {
      success: true,
      message: 'Enhanced toplists and party data sync completed',
      stats: {
        toplists_stored: topListsStored,
        party_data_stored: partyDataStored,
        duration_ms: duration
      },
      timestamp: new Date().toISOString()
    }
    
    console.log('📤 Enhanced sync response:', response)
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('💥 Enhanced toplists and party data sync failed:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})


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
    // Fetch documents for current year
    const currentDate = new Date()
    const fromDate = `${currentDate.getFullYear()}-01-01`
    const toDate = currentDate.toISOString().split('T')[0]
    
    const documentUrl = `${BASE_URL}/dokumentlista/?utformat=json&from=${fromDate}&tom=${toDate}&sz=5000&sort=datum&sortorder=desc`
    const documentData = await fetchWithRetry(documentUrl)
    
    if (!documentData.dokumentlista?.dokument) {
      console.warn('⚠️ No documents found for top lists')
      return null
    }
    
    const documents = Array.isArray(documentData.dokumentlista.dokument) 
      ? documentData.dokumentlista.dokument 
      : [documentData.dokumentlista.dokument]
    
    // Fetch members data
    const memberUrl = `${BASE_URL}/personlista?utformat=json&sz=1000`
    const memberData = await fetchWithRetry(memberUrl)
    
    if (!memberData.personlista?.person) {
      console.warn('⚠️ No members found for top lists')
      return null
    }
    
    const members = Array.isArray(memberData.personlista.person) 
      ? memberData.personlista.person 
      : [memberData.personlista.person]
    
    // Create member lookup
    const memberLookup = new Map()
    members.forEach(member => {
      memberLookup.set(member.intressent_id, {
        name: `${member.tilltalsnamn} ${member.efternamn}`,
        party: member.parti,
        constituency: member.valkrets,
        imageUrl: member.bild_url_192 || member.bild_url_80
      })
    })
    
    // Count documents by type and member
    const motionCounts = new Map()
    const interpellationCounts = new Map()
    const writtenQuestionCounts = new Map()
    
    documents.forEach(doc => {
      if (!doc.intressent_id) return
      
      const memberInfo = memberLookup.get(doc.intressent_id)
      if (!memberInfo) return
      
      const memberKey = doc.intressent_id
      
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
    
    // Fetch speech data for current year
    const speechUrl = `${BASE_URL}/anforandelista?utformat=json&rm=${encodeURIComponent(riksdagsYear)}&sz=5000`
    let speechCounts = new Map()
    
    try {
      const speechData = await fetchWithRetry(speechUrl)
      if (speechData.anforandelista?.anforande) {
        const speeches = Array.isArray(speechData.anforandelista.anforande) 
          ? speechData.anforandelista.anforande 
          : [speechData.anforandelista.anforande]
        
        speeches.forEach(speech => {
          if (!speech.intressent_id) return
          speechCounts.set(speech.intressent_id, (speechCounts.get(speech.intressent_id) || 0) + 1)
        })
      }
    } catch (error) {
      console.error('Error fetching speech data:', error)
    }
    
    // Create top lists
    const createTopList = (countMap: Map<string, number>) => {
      return Array.from(countMap.entries())
        .map(([memberId, count]) => {
          const memberInfo = memberLookup.get(memberId)
          if (!memberInfo) return null
          
          return {
            id: memberId,
            name: memberInfo.name,
            party: memberInfo.party,
            constituency: memberInfo.constituency,
            imageUrl: memberInfo.imageUrl,
            count
          }
        })
        .filter(item => item !== null)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    }
    
    const topLists = {
      motions: createTopList(motionCounts),
      speeches: createTopList(speechCounts),
      interpellations: createTopList(interpellationCounts),
      writtenQuestions: createTopList(writtenQuestionCounts),
      lastUpdated: new Date().toISOString()
    }
    
    console.log(`✅ Generated top lists with ${topLists.motions.length} motion leaders, ${topLists.speeches.length} speech leaders`)
    
    return topLists
  } catch (error) {
    console.error('💥 Error generating top lists:', error)
    throw error
  }
}

async function generatePartyData() {
  console.log(`👥 Generating party analysis data`)
  
  try {
    // Fetch all current members with committee data
    const memberUrl = `${BASE_URL}/personlista?utformat=json&sz=1000`
    const memberData = await fetchWithRetry(memberUrl)
    
    if (!memberData.personlista?.person) {
      throw new Error('No members data found')
    }
    
    const members = Array.isArray(memberData.personlista.person) 
      ? memberData.personlista.person 
      : [memberData.personlista.person]
    
    // Filter current members only
    const currentMembers = members.filter(member => 
      member.status === 'Tjänstgörande' || !member.status
    )
    
    // Group by party and calculate statistics
    const partyMap = new Map()
    
    for (const member of currentMembers) {
      if (!member.parti) continue
      
      if (!partyMap.has(member.parti)) {
        partyMap.set(member.parti, {
          party_code: member.parti,
          party_name: member.parti, // You might want to map this to full names
          total_members: 0,
          active_members: 0,
          members: [],
          committees: new Set(),
          ages: [],
          genders: { male: 0, female: 0, unknown: 0 }
        })
      }
      
      const partyData = partyMap.get(member.parti)
      partyData.total_members++
      partyData.active_members++
      partyData.members.push({
        id: member.intressent_id,
        name: `${member.tilltalsnamn} ${member.efternamn}`,
        constituency: member.valkrets,
        birth_year: parseInt(member.fodd_ar) || null
      })
      
      // Calculate age
      if (member.fodd_ar) {
        const age = new Date().getFullYear() - parseInt(member.fodd_ar)
        partyData.ages.push(age)
      }
      
      // Count gender
      if (member.kon === 'man') {
        partyData.genders.male++
      } else if (member.kon === 'kvinna') {
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
      
      partyDataArray.push({
        party_code: partyCode,
        party_name: data.party_name,
        total_members: totalMembers,
        active_members: data.active_members,
        gender_distribution: {
          male: totalMembers > 0 ? (data.genders.male / totalMembers) * 100 : 0,
          female: totalMembers > 0 ? (data.genders.female / totalMembers) * 100 : 0,
          unknown: totalMembers > 0 ? (data.genders.unknown / totalMembers) * 100 : 0
        },
        age_distribution: ageGroups,
        committee_distribution: {},
        committee_members: {},
        member_list: data.members,
        activity_stats: {
          average_age: avgAge,
          total_active: data.active_members
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
    console.log('🚀 Starting toplists and party data sync')
    
    const startTime = Date.now()
    let topListsStored = false
    let partyDataStored = false
    
    // Generate and store top lists
    try {
      console.log('📊 Generating top lists...')
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
          console.log('✅ Top lists stored successfully')
        }
      }
    } catch (error) {
      console.error('💥 Top lists generation failed:', error)
    }
    
    // Generate and store party data
    try {
      console.log('👥 Generating party data...')
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
        console.log(`✅ Party data stored successfully for ${partyData.length} parties`)
      }
    } catch (error) {
      console.error('💥 Party data generation failed:', error)
    }
    
    const duration = Date.now() - startTime
    
    const response = {
      success: true,
      message: 'Toplists and party data sync completed',
      stats: {
        toplists_stored: topListsStored,
        party_data_stored: partyDataStored,
        duration_ms: duration
      },
      timestamp: new Date().toISOString()
    }
    
    console.log('📤 Toplists and party data sync response:', response)
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('💥 Toplists and party data sync failed:', error)
    
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

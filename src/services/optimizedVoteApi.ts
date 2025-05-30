
import { searchVotes, VoteSearchParams, RiksdagVote } from './riksdagApi';

export interface OptimizedVoteSearchParams {
  beteckningPattern?: string; // e.g., "AU10"
  rm?: string; // e.g., "2024/25"
  limit?: number; // default 5 for recent designations
}

export interface OptimizedVoteResult {
  designations: string[];
  proposalPoints: { [designation: string]: string[] };
  votes: RiksdagVote[];
  totalCount: number;
}

/**
 * Step 1: Fetch the most recent unique designations (beteckningar)
 */
const fetchRecentDesignations = async (
  beteckningPattern: string,
  rm: string,
  limit: number = 5
): Promise<string[]> => {
  console.log(`=== STEP 1: Fetching recent designations for ${beteckningPattern} in ${rm} ===`);
  
  try {
    // Search for votes with the designation pattern to get all matching designations
    const result = await searchVotes({
      beteckning: beteckningPattern,
      rm: [rm],
      pageSize: 200 // Get more results to find unique designations
    });
    
    console.log(`Found ${result.votes.length} votes for pattern ${beteckningPattern}`);
    
    // Extract unique designations and sort by most recent (using systemdatum)
    const designationMap = new Map<string, Date>();
    
    result.votes.forEach(vote => {
      if (vote.beteckning && vote.systemdatum) {
        const currentDate = designationMap.get(vote.beteckning);
        const voteDate = new Date(vote.systemdatum);
        
        if (!currentDate || voteDate > currentDate) {
          designationMap.set(vote.beteckning, voteDate);
        }
      }
    });
    
    // Sort by date and take the most recent ones
    const sortedDesignations = Array.from(designationMap.entries())
      .sort(([, dateA], [, dateB]) => dateB.getTime() - dateA.getTime())
      .slice(0, limit)
      .map(([designation]) => designation);
    
    console.log(`Recent designations found:`, sortedDesignations);
    return sortedDesignations;
    
  } catch (error) {
    console.error('Error fetching recent designations:', error);
    return [];
  }
};

/**
 * Step 2: Fetch proposal points for each designation
 */
const fetchProposalPoints = async (
  designations: string[],
  rm: string
): Promise<{ [designation: string]: string[] }> => {
  console.log(`=== STEP 2: Fetching proposal points for designations ===`);
  
  const proposalPoints: { [designation: string]: string[] } = {};
  
  for (const designation of designations) {
    try {
      console.log(`Fetching points for ${designation}`);
      
      const result = await searchVotes({
        beteckning: designation,
        rm: [rm],
        pageSize: 100
      });
      
      // Extract unique proposal points
      const points = [...new Set(
        result.votes
          .map(vote => vote.punkt)
          .filter(punkt => punkt && punkt.trim() !== '')
      )].sort((a, b) => parseInt(a) - parseInt(b));
      
      proposalPoints[designation] = points;
      console.log(`${designation} has ${points.length} proposal points: [${points.join(', ')}]`);
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Error fetching points for ${designation}:`, error);
      proposalPoints[designation] = [];
    }
  }
  
  return proposalPoints;
};

/**
 * Step 3: Fetch all voting results for the designations and points
 */
const fetchVotingResults = async (
  designations: string[],
  proposalPoints: { [designation: string]: string[] },
  rm: string
): Promise<{ votes: RiksdagVote[], totalCount: number }> => {
  console.log(`=== STEP 3: Fetching voting results ===`);
  
  let allVotes: RiksdagVote[] = [];
  let totalCount = 0;
  
  for (const designation of designations) {
    const points = proposalPoints[designation] || [];
    
    if (points.length === 0) {
      // If no specific points, fetch all votes for this designation
      try {
        const result = await searchVotes({
          beteckning: designation,
          rm: [rm],
          pageSize: 200
        });
        
        allVotes.push(...result.votes);
        totalCount += result.totalCount;
        
        console.log(`Fetched ${result.votes.length} votes for ${designation} (no specific points)`);
        
      } catch (error) {
        console.error(`Error fetching votes for ${designation}:`, error);
      }
    } else {
      // Fetch votes for each proposal point
      for (const point of points) {
        try {
          const result = await searchVotes({
            beteckning: designation,
            punkt: point,
            rm: [rm],
            pageSize: 200
          });
          
          allVotes.push(...result.votes);
          totalCount += result.totalCount;
          
          console.log(`Fetched ${result.votes.length} votes for ${designation} punkt ${point}`);
          
          // Small delay between API calls
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Error fetching votes for ${designation} punkt ${point}:`, error);
        }
      }
    }
  }
  
  // Remove duplicates based on votering_id and intressent_id
  const uniqueVotes = allVotes.reduce((acc, vote) => {
    const key = `${vote.votering_id}-${vote.intressent_id}`;
    if (!acc.has(key)) {
      acc.set(key, vote);
    }
    return acc;
  }, new Map<string, RiksdagVote>());
  
  const finalVotes = Array.from(uniqueVotes.values());
  console.log(`Final result: ${finalVotes.length} unique votes (removed ${allVotes.length - finalVotes.length} duplicates)`);
  
  return {
    votes: finalVotes,
    totalCount: finalVotes.length
  };
};

/**
 * Main optimized search function
 */
export const optimizedVoteSearch = async (
  params: OptimizedVoteSearchParams
): Promise<OptimizedVoteResult> => {
  console.log('=== OPTIMIZED VOTE SEARCH START ===');
  console.log('Search parameters:', params);
  
  if (!params.beteckningPattern || !params.rm) {
    throw new Error('Beteckning pattern and riksmöte are required for optimized search');
  }
  
  try {
    // Step 1: Get recent designations
    const designations = await fetchRecentDesignations(
      params.beteckningPattern,
      params.rm,
      params.limit || 5
    );
    
    if (designations.length === 0) {
      console.log('No designations found, returning empty result');
      return {
        designations: [],
        proposalPoints: {},
        votes: [],
        totalCount: 0
      };
    }
    
    // Step 2: Get proposal points for each designation
    const proposalPoints = await fetchProposalPoints(designations, params.rm);
    
    // Step 3: Get voting results
    const { votes, totalCount } = await fetchVotingResults(designations, proposalPoints, params.rm);
    
    console.log('=== OPTIMIZED VOTE SEARCH COMPLETE ===');
    console.log('Final summary:', {
      designations: designations.length,
      totalProposalPoints: Object.values(proposalPoints).flat().length,
      totalVotes: votes.length,
      totalCount
    });
    
    return {
      designations,
      proposalPoints,
      votes,
      totalCount
    };
    
  } catch (error) {
    console.error('Error in optimized vote search:', error);
    throw error;
  }
};

/**
 * Check if search parameters are suitable for optimized search
 */
export const shouldUseOptimizedSearch = (params: VoteSearchParams): boolean => {
  // Use optimized search when:
  // 1. We have a beteckning pattern (like "AU10")
  // 2. We have exactly one riksmöte
  // 3. No specific punkt is specified (we want to find all points)
  return !!(
    params.beteckning &&
    params.rm &&
    params.rm.length === 1 &&
    !params.punkt &&
    !params.rost &&
    !params.valkrets &&
    (!params.party || params.party.length === 0)
  );
};

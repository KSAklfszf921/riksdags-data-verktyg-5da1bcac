
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

// Validation helper
const validateSearchParams = (params: OptimizedVoteSearchParams): void => {
  if (!params.beteckningPattern?.trim()) {
    throw new Error('Beteckning pattern is required and cannot be empty');
  }
  if (!params.rm?.trim()) {
    throw new Error('Riksmöte is required and cannot be empty');
  }
  if (params.limit && (params.limit < 1 || params.limit > 20)) {
    throw new Error('Limit must be between 1 and 20');
  }
};

/**
 * Step 1: Fetch the most recent unique designations (beteckningar)
 */
const fetchRecentDesignations = async (
  beteckningPattern: string,
  rm: string,
  limit: number = 5
): Promise<string[]> => {
  console.log(`Fetching recent designations for ${beteckningPattern} in ${rm}`);
  
  try {
    const result = await searchVotes({
      beteckning: beteckningPattern,
      rm: [rm], // Always use array format for consistency
      pageSize: 200
    });
    
    console.log(`Found ${result.votes.length} votes for pattern ${beteckningPattern}`);
    
    // Extract unique designations and sort by most recent
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
    
    const sortedDesignations = Array.from(designationMap.entries())
      .sort(([, dateA], [, dateB]) => dateB.getTime() - dateA.getTime())
      .slice(0, limit)
      .map(([designation]) => designation);
    
    console.log(`Recent designations found:`, sortedDesignations);
    return sortedDesignations;
    
  } catch (error) {
    console.error('Error fetching recent designations:', error);
    throw new Error(`Failed to fetch designations: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Step 2: Fetch proposal points for each designation
 */
const fetchProposalPoints = async (
  designations: string[],
  rm: string
): Promise<{ [designation: string]: string[] }> => {
  console.log(`Fetching proposal points for ${designations.length} designations`);
  
  const proposalPoints: { [designation: string]: string[] } = {};
  
  for (const designation of designations) {
    try {
      console.log(`Fetching points for ${designation}`);
      
      const result = await searchVotes({
        beteckning: designation,
        rm: [rm], // Consistent array format
        pageSize: 100
      });
      
      const points = [...new Set(
        result.votes
          .map(vote => vote.punkt)
          .filter(punkt => punkt !== null && punkt !== undefined)
          .map(punkt => String(punkt)) // Convert to string for consistency
      )].sort((a, b) => parseInt(a) - parseInt(b));
      
      proposalPoints[designation] = points;
      console.log(`${designation} has ${points.length} proposal points`);
      
      // Rate limiting
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
  console.log(`Fetching voting results for ${designations.length} designations`);
  
  const allVotes: RiksdagVote[] = [];
  let totalCount = 0;
  
  for (const designation of designations) {
    const points = proposalPoints[designation] || [];
    
    if (points.length === 0) {
      try {
        const result = await searchVotes({
          beteckning: designation,
          rm: [rm], // Consistent array format
          pageSize: 200
        });
        
        allVotes.push(...result.votes);
        totalCount += result.totalCount;
        
        console.log(`Fetched ${result.votes.length} votes for ${designation} (no specific points)`);
        
      } catch (error) {
        console.error(`Error fetching votes for ${designation}:`, error);
      }
    } else {
      for (const point of points) {
        try {
          const result = await searchVotes({
            beteckning: designation,
            punkt: point,
            rm: [rm], // Consistent array format
            pageSize: 200
          });
          
          allVotes.push(...result.votes);
          totalCount += result.totalCount;
          
          console.log(`Fetched ${result.votes.length} votes for ${designation} punkt ${point}`);
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Error fetching votes for ${designation} punkt ${point}:`, error);
        }
      }
    }
  }
  
  // Remove duplicates with better key generation
  const uniqueVotes = allVotes.reduce((acc, vote) => {
    const key = `${vote.votering_id || 'no-voting-id'}-${vote.intressent_id || 'no-member-id'}-${vote.beteckning || 'no-bet'}-${vote.punkt || 'no-punkt'}`;
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
  console.log('Starting optimized vote search with params:', params);
  
  // Validate input parameters
  validateSearchParams(params);
  
  const { beteckningPattern, rm, limit = 5 } = params;
  
  try {
    // Step 1: Get recent designations
    const designations = await fetchRecentDesignations(
      beteckningPattern!,
      rm!,
      limit
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
    const proposalPoints = await fetchProposalPoints(designations, rm!);
    
    // Step 3: Get voting results
    const { votes, totalCount } = await fetchVotingResults(designations, proposalPoints, rm!);
    
    console.log('Optimized vote search complete:', {
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

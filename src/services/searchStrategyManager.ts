
interface SearchStrategy {
  id: string;
  name: string;
  generator: (memberName: string) => string;
  priority: number;
  successRate: number;
  averageResults: number;
  lastUsed: number;
}

class SearchStrategyManager {
  private strategies: SearchStrategy[] = [
    {
      id: 'high_precision_news',
      name: 'High Precision News Sites',
      generator: (name: string) => `"${name}" riksdag (site:svt.se OR site:dn.se OR site:aftonbladet.se OR site:expressen.se)`,
      priority: 1,
      successRate: 0.8,
      averageResults: 5,
      lastUsed: 0
    },
    {
      id: 'medium_precision_politics',
      name: 'Medium Precision Politics',
      generator: (name: string) => `"${name}" politik Sverige (site:svt.se OR site:dn.se)`,
      priority: 2,
      successRate: 0.7,
      averageResults: 8,
      lastUsed: 0
    },
    {
      id: 'lastname_focused',
      name: 'Last Name Focused',
      generator: (name: string) => {
        const [firstName, ...lastNameParts] = name.split(' ');
        const lastName = lastNameParts.join(' ');
        return `"${lastName}" riksdag Sverige`;
      },
      priority: 3,
      successRate: 0.6,
      averageResults: 12,
      lastUsed: 0
    },
    {
      id: 'broad_politics',
      name: 'Broad Politics Search',
      generator: (name: string) => `"${name}" politik`,
      priority: 4,
      successRate: 0.5,
      averageResults: 15,
      lastUsed: 0
    },
    {
      id: 'general_sweden',
      name: 'General Sweden Search',
      generator: (name: string) => `"${name}" Sverige`,
      priority: 5,
      successRate: 0.4,
      averageResults: 20,
      lastUsed: 0
    },
    {
      id: 'alternative_spelling',
      name: 'Alternative Name Combinations',
      generator: (name: string) => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
          const firstName = parts[0];
          const lastName = parts[parts.length - 1];
          return `("${firstName} ${lastName}" OR "${lastName}, ${firstName}") riksdag`;
        }
        return `"${name}" riksdag`;
      },
      priority: 6,
      successRate: 0.3,
      averageResults: 10,
      lastUsed: 0
    }
  ];

  getOptimalStrategies(memberName: string, maxStrategies: number = 4): SearchStrategy[] {
    // Sort strategies by success rate and priority
    const sortedStrategies = [...this.strategies]
      .sort((a, b) => {
        // Primary sort: success rate (higher is better)
        const successDiff = b.successRate - a.successRate;
        if (Math.abs(successDiff) > 0.1) return successDiff;
        
        // Secondary sort: priority (lower number is higher priority)
        return a.priority - b.priority;
      });

    return sortedStrategies.slice(0, maxStrategies);
  }

  updateStrategyPerformance(strategyId: string, wasSuccessful: boolean, resultCount: number): void {
    const strategy = this.strategies.find(s => s.id === strategyId);
    if (strategy) {
      // Update success rate with exponential moving average
      const alpha = 0.2; // Learning rate
      strategy.successRate = alpha * (wasSuccessful ? 1 : 0) + (1 - alpha) * strategy.successRate;
      
      // Update average results
      strategy.averageResults = alpha * resultCount + (1 - alpha) * strategy.averageResults;
      
      strategy.lastUsed = Date.now();
      
      console.log(`📊 Updated strategy ${strategyId}: success rate ${(strategy.successRate * 100).toFixed(1)}%, avg results ${strategy.averageResults.toFixed(1)}`);
    }
  }

  getStrategyStats(): SearchStrategy[] {
    return [...this.strategies];
  }
}

export const searchStrategyManager = new SearchStrategyManager();


interface ProxyStatus {
  url: string;
  isWorking: boolean;
  lastTested: number;
  consecutiveFailures: number;
  responseTime?: number;
}

class ProxyManager {
  private proxies: ProxyStatus[] = [
    { url: '', isWorking: true, lastTested: 0, consecutiveFailures: 0 }, // Direct
    { url: 'https://corsproxy.io/?', isWorking: true, lastTested: 0, consecutiveFailures: 0 },
    { url: 'https://api.allorigins.win/get?url=', isWorking: true, lastTested: 0, consecutiveFailures: 0 },
    { url: 'https://proxy.cors.sh/', isWorking: true, lastTested: 0, consecutiveFailures: 0 },
    { url: 'https://cors-anywhere.herokuapp.com/', isWorking: true, lastTested: 0, consecutiveFailures: 0 },
  ];

  private readonly MAX_FAILURES = 3;
  private readonly RETRY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  getWorkingProxies(): string[] {
    const now = Date.now();
    return this.proxies
      .filter(proxy => {
        // Reset proxy status if enough time has passed since last failure
        if (!proxy.isWorking && (now - proxy.lastTested) > this.RETRY_TIMEOUT) {
          proxy.isWorking = true;
          proxy.consecutiveFailures = 0;
          console.log(`🔄 Retrying proxy: ${proxy.url || 'direct'}`);
        }
        return proxy.isWorking;
      })
      .sort((a, b) => {
        // Sort by response time, then by failure count
        const aScore = (a.responseTime || 1000) + (a.consecutiveFailures * 500);
        const bScore = (b.responseTime || 1000) + (b.consecutiveFailures * 500);
        return aScore - bScore;
      })
      .map(proxy => proxy.url);
  }

  markProxyFailure(proxyUrl: string, error: Error): void {
    const proxy = this.proxies.find(p => p.url === proxyUrl);
    if (proxy) {
      proxy.consecutiveFailures++;
      proxy.lastTested = Date.now();
      
      if (proxy.consecutiveFailures >= this.MAX_FAILURES) {
        proxy.isWorking = false;
        console.log(`❌ Proxy disabled due to failures: ${proxyUrl || 'direct'} (${error.message})`);
      }
    }
  }

  markProxySuccess(proxyUrl: string, responseTime: number): void {
    const proxy = this.proxies.find(p => p.url === proxyUrl);
    if (proxy) {
      proxy.isWorking = true;
      proxy.consecutiveFailures = 0;
      proxy.responseTime = responseTime;
      proxy.lastTested = Date.now();
    }
  }

  getProxyStats(): ProxyStatus[] {
    return [...this.proxies];
  }
}

export const proxyManager = new ProxyManager();

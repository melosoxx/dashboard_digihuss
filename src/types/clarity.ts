export interface ClarityInsights {
  traffic: {
    totalSessions: number;
    botSessions: number;
    distinctUsers: number;
    pagesPerSession: number;
  };
  engagement: {
    totalTime: number;
    activeTime: number;
  };
  scrollDepth: number;
  frustration: {
    deadClicks: number;
    rageClicks: number;
    quickbacks: number;
    errorClicks: number;
    scriptErrors: number;
    excessiveScrolls: number;
  };
  topPages: Array<{
    url: string;
    visits: number;
  }>;
  devices: Array<{
    name: string;
    sessions: number;
  }>;
  browsers: Array<{
    name: string;
    sessions: number;
  }>;
  countries: Array<{
    name: string;
    sessions: number;
  }>;
}

export interface ClarityVersion {
  id: string;
  fetchedAt: string;
  numOfDays: 1 | 2 | 3;
}

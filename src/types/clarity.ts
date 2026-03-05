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

/** A single daily clarity snapshot as stored in the database */
export interface ClarityDailySnapshot {
  date: string;
  data: ClarityInsights;
  fetchedAt: string;
}

/** Response from /api/clarity/daily in aggregate mode */
export interface ClarityDailyResponse {
  data: ClarityInsights | null;
  daysAvailable: number;
  dateRange: { start: string; end: string } | null;
  lastFetchedAt: string | null;
}

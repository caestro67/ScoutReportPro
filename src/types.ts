export interface Criterion {
  id: string;
  name: string;
  group?: string;
}

export interface SectionConfig {
  criteria: Criterion[];
}

export interface UserConfig {
  id: string;
  userId: string;
  categories: {
    performance: SectionConfig;
    injuries: SectionConfig;
    psychological: SectionConfig;
  };
  performanceByPosition?: Record<string, SectionConfig>;
  updatedAt: number;
}

export interface ReportSection {
  [criteriaId: string]: {
    name: string;
    value: string | number;
  };
}

export interface InjuryRecord {
  id: string;
  date: string;
  region: string;
  type: string;
  duration: string;
  description: string;
}

export interface PlayerList {
  id: string;
  name: string;
  description: string;
  playerNames: string[];
  createdAt: number;
}

export interface Lineup {
  id: string;
  name: string;
  formation: string;
  players: Record<string, string | string[]>; // Maps position index/identifier to player name(s)
  createdAt: number;
}

export interface Report {
  id: string;
  userId: string;
  playerName: string;
  age?: string;
  nationality?: string;
  club?: string;
  league?: string;
  height?: string;
  position?: string;
  foot?: string;
  value?: string;
  favorite?: boolean;
  scoutNotes?: string;
  imageUrl?: string;
  reportDate: string;
  performance: ReportSection;
  injuries: ReportSection;
  psychological: ReportSection;
  injuryHistory?: InjuryRecord[];
  videos?: { id: string; url: string; title: string }[];
  createdAt: number;
  updatedAt: number;
}

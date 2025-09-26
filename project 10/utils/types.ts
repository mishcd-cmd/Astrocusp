import { CuspResult } from './astrology';

export interface CuspDetail {
  name: string;
  title: string;
  symbol: string;
  dateRange: string;
  description: string;
  traits: string[];
  element: string;
  ruling: string;
  gemstone?: string;
  gemstoneDescription?: string;
  ritualTitle?: string;
  ritualDescription?: string;
}

export interface UserProfile {
  email: string;
  name: string;
  birthDate: string; // ISO string
  birthTime: string;
  birthLocation: string;
  hemisphere: 'Northern' | 'Southern';
  cuspResult: CuspResult;
  createdAt: string; // ISO string
  lastLoginAt?: string; // ISO string
}

export interface AstronomicalEvent {
  name: string;
  description: string;
  date: string;
  hemisphere?: 'Northern' | 'Southern' | 'Both';
  type: 'moon' | 'planet' | 'meteor' | 'solstice' | 'equinox' | 'conjunction' | 'comet';
}

export interface MoonPhase {
  phase: string;
  illumination: number;
  nextPhase: string;
  nextPhaseDate: string;
}

export interface PlanetaryPosition {
  planet: string;
  sign: string;
  degree: number;
  retrograde: boolean;
}

export interface HoroscopeData {
  daily: string;
  affirmation?: string;
  mysticOpening?: string;
  celestialInsight?: string;
  deeper?: string;
  hasAccess: boolean;
}
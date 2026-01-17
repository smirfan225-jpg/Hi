
export type WeatherType = 'CLEAR' | 'FOGGY' | 'SNOWING' | 'BLIZZARD';

export interface Weather {
  type: WeatherType;
  intensity: number; // 0 to 1
  description: string;
}

export interface PlayerStats {
  warmth: number;
  energy: number;
  health: number;
  hunger: number;
}

export interface GameState {
  location: string;
  inventory: string[];
  history: GameLog[];
  stats: PlayerStats;
  day: number;
  weather: Weather;
}

export interface GameLog {
  role: 'system' | 'user' | 'ai';
  message: string;
  timestamp: Date;
  imageUrl?: string;
}

export interface LocationInfo {
  id: string;
  name: string;
  description: string;
  connections: string[];
}

export const LOCATIONS: Record<string, LocationInfo> = {
  'tundra_edge': {
    id: 'tundra_edge',
    name: 'Tundra Edge',
    description: 'A vast expanse of permafrost where the sky meets the ice. Sparse shrubs struggle against the wind.',
    connections: ['pine_heart', 'glacial_wall']
  },
  'pine_heart': {
    id: 'pine_heart',
    name: 'Pine Heart Forest',
    description: 'Ancient, towering pines laden with heavy snow. The air is still, but you feel eyes watching from the shadows.',
    connections: ['tundra_edge', 'mammoth_valley', 'crystal_cave']
  },
  'mammoth_valley': {
    id: 'mammoth_valley',
    name: 'Mammoth Valley',
    description: 'A wide valley where the great woolly behemoths roam. Steam rises from hidden geothermal vents.',
    connections: ['pine_heart', 'frozen_lake']
  },
  'crystal_cave': {
    id: 'crystal_cave',
    name: 'Crystal Cave',
    description: 'A subterranean labyrinth lined with glowing ice crystals. Shelter from the blizzard, but dangers lurk within.',
    connections: ['pine_heart']
  },
  'glacial_wall': {
    id: 'glacial_wall',
    name: 'The Glacial Wall',
    description: 'A towering cliff of solid blue ice. Rumors say a path leads to the verdant peaks beyond.',
    connections: ['tundra_edge']
  },
  'frozen_lake': {
    id: 'frozen_lake',
    name: 'Frozen Lake',
    description: 'A glass-like surface stretching for miles. Perfect for travel, if the ice holds your weight.',
    connections: ['mammoth_valley']
  }
};

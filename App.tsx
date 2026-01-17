
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Wind, 
  MapPin, 
  MessageSquare, 
  Backpack, 
  ChevronRight, 
  Camera, 
  Snowflake,
  RefreshCw,
  Sun,
  CloudFog,
  CloudSnow,
  AlertTriangle
} from 'lucide-react';
import { GameState, GameLog, LOCATIONS, PlayerStats, WeatherType, Weather } from './types';
import { getNarrativeResponse, generateSceneImage } from './services/geminiService';
import StatsPanel from './components/StatsPanel';
import WorldMap from './components/WorldMap';

const WEATHER_DATA: Record<WeatherType, { description: string, icon: React.ReactNode, color: string }> = {
  CLEAR: { description: 'Bitingly clear and cold.', icon: <Sun size={18} />, color: 'text-yellow-400' },
  FOGGY: { description: 'A thick, freezing mist obscures the world.', icon: <CloudFog size={18} />, color: 'text-slate-400' },
  SNOWING: { description: 'Heavy flakes drift from a grey sky.', icon: <CloudSnow size={18} />, color: 'text-blue-200' },
  BLIZZARD: { description: 'A violent storm of ice and wind. Lethal.', icon: <Wind size={18} />, color: 'text-blue-500' }
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    location: 'tundra_edge',
    inventory: ['Sharp Flint', 'Tattered Furs'],
    history: [
      {
        role: 'system',
        message: 'You awake on the edge of a vast, frozen tundra. The wind bites at your exposed skin. Survival is your only goal.',
        timestamp: new Date()
      }
    ],
    stats: {
      warmth: 80,
      energy: 90,
      health: 100,
      hunger: 30
    },
    day: 1,
    weather: {
      type: 'CLEAR',
      intensity: 0.2,
      description: 'Bitingly clear and cold.'
    }
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [gameState.history]);

  const rollForWeatherChange = useCallback(() => {
    const chance = Math.random();
    if (chance > 0.7) {
      const types: WeatherType[] = ['CLEAR', 'FOGGY', 'SNOWING', 'BLIZZARD'];
      const newType = types[Math.floor(Math.random() * types.length)];
      if (newType !== gameState.weather.type) {
        setGameState(prev => ({
          ...prev,
          weather: {
            type: newType,
            intensity: Math.random(),
            description: WEATHER_DATA[newType].description
          },
          history: [...prev.history, {
            role: 'system',
            message: `The weather shifts. ${WEATHER_DATA[newType].description}`,
            timestamp: new Date()
          }]
        }));
      }
    }
  }, [gameState.weather.type]);

  const handleAction = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const playerAction = input;
    setInput('');
    setLoading(true);

    const newUserLog: GameLog = {
      role: 'user',
      message: playerAction,
      timestamp: new Date()
    };

    setGameState(prev => ({
      ...prev,
      history: [...prev.history, newUserLog]
    }));

    const responseText = await getNarrativeResponse(
      playerAction,
      LOCATIONS[gameState.location].name,
      gameState.stats,
      gameState.inventory,
      gameState.weather
    );

    // Update stats based on action and weather
    const lowerAction = playerAction.toLowerCase();
    const newStats = { ...gameState.stats };
    
    // Base decay
    let warmthDecay = 8;
    let energyDecay = 10;
    
    // Weather impacts
    if (gameState.weather.type === 'BLIZZARD') {
      warmthDecay = 20;
      energyDecay = 15;
    } else if (gameState.weather.type === 'SNOWING') {
      warmthDecay = 12;
    }

    if (lowerAction.includes('rest') || lowerAction.includes('sleep')) {
      newStats.energy = Math.min(100, newStats.energy + 20);
      // Resting without fire in blizzard is dangerous
      if (gameState.weather.type === 'BLIZZARD' && !lowerAction.includes('fire')) {
        newStats.warmth = Math.max(0, newStats.warmth - 15);
      }
    } else {
      newStats.energy = Math.max(0, newStats.energy - energyDecay);
    }
    
    if (lowerAction.includes('eat') || lowerAction.includes('consume')) {
      newStats.hunger = Math.max(0, newStats.hunger - 25);
    } else {
      newStats.hunger = Math.min(100, newStats.hunger + 5);
    }

    if (lowerAction.includes('fire') || lowerAction.includes('warm')) {
      newStats.warmth = Math.min(100, newStats.warmth + 35);
    } else {
      newStats.warmth = Math.max(0, newStats.warmth - warmthDecay);
    }

    // Health impacts
    if (newStats.warmth === 0 || newStats.hunger === 100) {
      newStats.health = Math.max(0, newStats.health - 10);
    }

    const newAiLog: GameLog = {
      role: 'ai',
      message: responseText,
      timestamp: new Date()
    };

    setGameState(prev => ({
      ...prev,
      stats: newStats,
      history: [...prev.history, newAiLog]
    }));

    rollForWeatherChange();
    setLoading(false);
  };

  const handleNavigate = (locationId: string) => {
    if (gameState.location === locationId) return;
    
    if (!LOCATIONS[gameState.location].connections.includes(locationId)) {
      alert("You cannot reach that location from here.");
      return;
    }

    // Navigating in a blizzard is harder
    const energyCost = gameState.weather.type === 'BLIZZARD' ? 25 : 15;

    const loc = LOCATIONS[locationId];
    setGameState(prev => ({
      ...prev,
      location: locationId,
      stats: {
        ...prev.stats,
        energy: Math.max(0, prev.stats.energy - energyCost)
      },
      history: [...prev.history, {
        role: 'system',
        message: `You struggle through the ${gameState.weather.type.toLowerCase()} to reach ${loc.name}. ${loc.description}`,
        timestamp: new Date()
      }]
    }));

    rollForWeatherChange();
  };

  const generateVisual = async () => {
    setLoading(true);
    const location = LOCATIONS[gameState.location];
    const imageUrl = await generateSceneImage(location.name, location.description, gameState.weather);
    
    if (imageUrl) {
      setGameState(prev => ({
        ...prev,
        history: [...prev.history, {
          role: 'ai',
          message: `Behold, ${location.name} under the ${gameState.weather.type.toLowerCase()} sky:`,
          timestamp: new Date(),
          imageUrl
        }]
      }));
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#020617] overflow-hidden">
      {/* Sidebar: Status & Map */}
      <aside className="lg:w-80 w-full p-4 space-y-4 bg-[#020617] border-r border-slate-800 flex flex-col overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-600 rounded-lg ice-glow">
            <Snowflake className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-none">GLACIAL</h1>
            <span className="text-xs text-blue-400 font-semibold tracking-tighter uppercase">Frontier Survival</span>
          </div>
        </div>

        <StatsPanel stats={gameState.stats} />

        <div className="glass-effect p-4 rounded-xl ice-glow">
          <h3 className="text-sm font-bold uppercase tracking-widest text-blue-300 mb-3 flex items-center gap-2">
            <Backpack size={16} />
            Inventory
          </h3>
          <div className="flex flex-wrap gap-2">
            {gameState.inventory.map((item, i) => (
              <span key={i} className="px-2 py-1 bg-slate-800 rounded text-[10px] text-blue-200 border border-slate-700">
                {item}
              </span>
            ))}
          </div>
        </div>

        <WorldMap currentLocationId={gameState.location} onNavigate={handleNavigate} />
        
        <div className="mt-auto pt-4 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
          <span>Day {gameState.day} of the Deep Freeze</span>
          <span className="animate-pulse text-blue-500">Active Session</span>
        </div>
      </aside>

      {/* Main Content: Narrative Feed */}
      <main className="flex-1 flex flex-col h-full bg-[#0f172a] relative">
        {/* Header */}
        <header className="p-4 bg-[#1e293b]/50 backdrop-blur-md border-b border-slate-800 flex justify-between items-center z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border-r border-slate-700 pr-4">
              <MapPin size={18} className="text-blue-400" />
              <div>
                <h2 className="text-sm font-semibold text-slate-200">{LOCATIONS[gameState.location].name}</h2>
                <p className="text-[10px] text-slate-400">Current Region</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={WEATHER_DATA[gameState.weather.type].color}>
                {WEATHER_DATA[gameState.weather.type].icon}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-200 capitalize">{gameState.weather.type.toLowerCase()}</h2>
                <p className="text-[10px] text-slate-400">Atmosphere</p>
              </div>
              {gameState.weather.type === 'BLIZZARD' && (
                <AlertTriangle size={14} className="text-red-500 animate-pulse ml-2" />
              )}
            </div>
          </div>
          
          <button 
            onClick={generateVisual}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-xs font-medium transition-all border border-blue-600/30 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={14} /> : <Camera size={14} />}
            Visualize Area
          </button>
        </header>

        {/* Narrative Stream */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
        >
          {gameState.history.map((log, idx) => (
            <div 
              key={idx} 
              className={`flex ${log.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div className={`max-w-[85%] lg:max-w-[70%] ${
                log.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none' 
                  : log.role === 'system'
                  ? 'bg-slate-800/50 text-slate-300 rounded-2xl border border-slate-700/50 italic'
                  : 'bg-slate-800 text-slate-200 rounded-2xl rounded-tl-none'
              } p-4 shadow-xl border border-white/5`}>
                <div className="flex items-center gap-2 mb-1 opacity-60">
                  {log.role === 'user' ? <MessageSquare size={12} /> : <Wind size={12} />}
                  <span className="text-[10px] uppercase font-bold tracking-widest">
                    {log.role === 'user' ? 'Struggler' : log.role === 'system' ? 'Environment' : 'The Wild'}
                  </span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{log.message}</p>
                {log.imageUrl && (
                  <div className="mt-4 rounded-lg overflow-hidden border border-white/10 ice-glow">
                    <img src={log.imageUrl} alt="AI Scene" className="w-full object-cover aspect-video" />
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
                <span className="text-[10px] text-blue-300 uppercase font-bold tracking-widest">The cold is thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-[#0f172a] border-t border-slate-800">
          <form onSubmit={handleAction} className="relative group">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What will you do? (e.g., 'Build a fire', 'Search for food', 'Climb the rocks')"
              className="w-full bg-[#1e293b] text-slate-200 text-sm rounded-xl py-4 px-6 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all border border-slate-700 placeholder:text-slate-500"
            />
            <button 
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              <ChevronRight size={20} />
            </button>
          </form>
          <div className="mt-2 flex gap-4 text-[10px] text-slate-500 overflow-x-auto whitespace-nowrap pb-1">
            <span className="text-blue-400 font-bold">WEATHER EFFECT:</span>
            {gameState.weather.type === 'BLIZZARD' && <span className="text-red-400">Rapid Warmth Loss</span>}
            {gameState.weather.type === 'SNOWING' && <span className="text-blue-200">Moderate Warmth Loss</span>}
            {gameState.weather.type === 'FOGGY' && <span className="text-slate-400">Reduced Visibility</span>}
            {gameState.weather.type === 'CLEAR' && <span className="text-yellow-400">Normal Stat Decay</span>}
            <span className="border-l border-slate-700 pl-2">Action consumes energy.</span>
          </div>
        </div>
      </main>

      {/* Decorative Frost Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 mix-blend-screen opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-200/20 blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/20 blur-[120px]" />
      </div>
    </div>
  );
};

export default App;

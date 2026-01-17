
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { PlayerStats } from '../types';
import { Thermometer, Zap, Heart, Utensils } from 'lucide-react';

interface StatsPanelProps {
  stats: PlayerStats;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  const data = [
    { name: 'Warmth', value: stats.warmth, color: '#60a5fa', icon: <Thermometer size={16} /> },
    { name: 'Energy', value: stats.energy, color: '#facc15', icon: <Zap size={16} /> },
    { name: 'Health', value: stats.health, color: '#f87171', icon: <Heart size={16} /> },
    { name: 'Hunger', value: stats.hunger, color: '#fb923c', icon: <Utensils size={16} /> },
  ];

  return (
    <div className="glass-effect p-4 rounded-xl ice-glow">
      <h3 className="text-sm font-bold uppercase tracking-widest text-blue-300 mb-4 flex items-center gap-2">
        <Zap size={18} className="text-yellow-400" />
        Vital Signs
      </h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        {data.map((item) => (
          <div key={item.name} className="flex flex-col">
            <div className="flex items-center gap-2 mb-1 text-xs text-slate-400">
              {item.icon}
              {item.name}
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-500 ease-out"
                style={{ width: `${item.value}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="h-32 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
              itemStyle={{ color: '#60a5fa' }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatsPanel;

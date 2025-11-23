import React from 'react';
import { PAOItem } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Trophy, AlertCircle, Film, CheckCircle2, LayoutGrid, Clapperboard } from 'lucide-react';

interface StatsProps {
  items: PAOItem[];
}

export const Stats: React.FC<StatsProps> = ({ items }) => {
  // --- Metrics Calculation ---
  const total = items.length;
  const completedCount = items.filter(i => i.completed).length;
  const completedPercentage = Math.round((completedCount / total) * 100) || 0;
  
  // Items with Person but incomplete PAO
  const partialCount = items.filter(i => i.person && !i.completed).length;
  
  // Completed items that have a Scene description
  const withSceneCount = items.filter(i => i.completed && i.scene && i.scene.trim().length > 0).length;
  const scenePercentage = completedCount > 0 ? Math.round((withSceneCount / completedCount) * 100) : 0;

  // Decade Analysis (00-09, 10-19...)
  const decadeData = Array.from({ length: 10 }, (_, i) => {
    const start = i * 10;
    const end = start + 9;
    const rangeItems = items.filter(item => item.number >= start && item.number <= end);
    const done = rangeItems.filter(i => i.completed).length;
    return {
      name: `${start.toString().padStart(2, '0')}s`,
      completed: done,
      total: 10,
      fill: done === 10 ? '#10b981' : '#6366f1' // Emerald if full, Indigo otherwise
    };
  });

  // Pie Chart Data
  const pieData = [
    { name: 'Completed', value: completedCount },
    { name: 'Remaining', value: total - completedCount },
  ];
  const PIE_COLORS = ['#4f46e5', '#1e293b'];

  return (
    <div className="py-6 sm:py-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full mx-auto">
      
      <div className="text-center mb-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Clapperboard className="text-indigo-400 w-6 h-6 sm:w-8 sm:h-8" /> Production Analytics
        </h2>
        <p className="text-sm sm:text-base text-slate-400">Studio Report: 00-99 Major System Status</p>
      </div>

      {/* 1. Top Level Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
            label="Studio Completion" 
            value={`${completedPercentage}%`} 
            sub={`${completedCount} / ${total} Cast Members`}
            icon={<Trophy className="text-emerald-400" />}
            color="emerald"
        />
        <StatCard 
            label="Scene Fidelity" 
            value={`${scenePercentage}%`} 
            sub={`${withSceneCount} scenes directed`}
            icon={<Film className="text-purple-400" />}
            color="purple"
        />
        <StatCard 
            label="In Pre-Production" 
            value={partialCount.toString()} 
            sub="Casting incomplete"
            icon={<AlertCircle className="text-amber-400" />}
            color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 2. Decade Distribution Chart */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 sm:p-6 shadow-xl">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
                <LayoutGrid size={16} className="sm:w-[18px] sm:h-[18px] text-indigo-400" /> Decade Breakdown
            </h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={decadeData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis 
                            dataKey="name" 
                            stroke="#94a3b8" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                        />
                        <YAxis 
                            stroke="#94a3b8" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            domain={[0, 10]}
                        />
                        <RechartsTooltip 
                            cursor={{fill: '#334155', opacity: 0.4}}
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#475569', color: '#f8fafc', borderRadius: '8px' }}
                        />
                        <Bar 
                            dataKey="completed" 
                            radius={[4, 4, 0, 0]}
                            barSize={20}
                        >
                            {decadeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-500 text-center mt-4">
                Completed scenes per decade group.
            </p>
        </div>

        {/* 3. Milestones & Pie */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                    <CheckCircle2 size={16} className="sm:w-[18px] sm:h-[18px] text-indigo-400" /> Director Rank
                </h3>
                {/* Mini Pie */}
                <div className="w-16 h-16">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={15}
                                outerRadius={30}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="space-y-6 flex-1 justify-center flex flex-col">
                <Milestone label="Indie Director (0-25)" current={completedCount} target={25} />
                <Milestone label="Studio Regular (26-50)" current={completedCount} target={50} />
                <Milestone label="A-List Director (51-75)" current={completedCount} target={75} />
                <Milestone label="Legendary Visionary (76-100)" current={completedCount} target={100} />
            </div>
        </div>
      </div>

      {/* 4. The Matrix Heatmap */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 sm:p-6 shadow-xl">
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <LayoutGrid size={16} className="sm:w-[18px] sm:h-[18px] text-indigo-400" /> The Matrix (00-99)
            </h3>
            <div className="flex gap-2 sm:gap-3 text-[10px] sm:text-xs">
                <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-emerald-500"></div> Wrapped</div>
                <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-amber-500"></div> Casting</div>
                <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-slate-700"></div> Empty</div>
            </div>
         </div>
         
         <div className="grid grid-cols-10 gap-1 sm:gap-1.5 md:gap-2">
            {items.map((item) => {
                let statusColor = 'bg-slate-700/50 hover:bg-slate-600';
                if (item.completed) statusColor = 'bg-emerald-500 hover:bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
                else if (item.person) statusColor = 'bg-amber-500/80 hover:bg-amber-400';

                return (
                    <div 
                        key={item.number}
                        className={`aspect-square rounded-sm sm:rounded-md flex items-center justify-center text-[9px] sm:text-[10px] md:text-xs font-mono font-bold text-white cursor-help transition-all duration-300 group relative ${statusColor}`}
                    >
                        {item.number.toString().padStart(2, '0')}
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 w-max max-w-[150px] bg-slate-900 text-white text-xs p-2 rounded border border-slate-600 shadow-xl pointer-events-none">
                            <div className="font-bold text-indigo-400">#{item.number.toString().padStart(2, '0')}</div>
                            {item.person ? (
                                <div>{item.person}</div>
                            ) : (
                                <div className="italic text-slate-500">Role Empty</div>
                            )}
                            {item.completed && <div className="text-emerald-400 text-[10px] mt-1 flex items-center gap-1"><CheckCircle2 size={10} /> Scene Ready</div>}
                        </div>
                    </div>
                );
            })}
         </div>
      </div>

    </div>
  );
};

// --- Helper Components ---

const StatCard = ({ label, value, sub, icon, color }: { label: string, value: string, sub: string, icon: React.ReactNode, color: string }) => {
    const colorClasses: Record<string, string> = {
        emerald: 'bg-emerald-500/10 border-emerald-500/20',
        purple: 'bg-purple-500/10 border-purple-500/20',
        amber: 'bg-amber-500/10 border-amber-500/20',
    };

    return (
        <div className={`p-5 rounded-xl border ${colorClasses[color]} backdrop-blur-sm flex items-start justify-between`}>
            <div>
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{label}</div>
                <div className="text-2xl font-black text-white mb-1 font-mono">{value}</div>
                <div className="text-xs text-slate-500">{sub}</div>
            </div>
            <div className="p-2 bg-slate-900/50 rounded-lg">
                {icon}
            </div>
        </div>
    );
};

const Milestone = ({ label, current, target }: { label: string, current: number, target: number }) => {
    const isAchieved = current >= target;
    const progress = Math.min(100, (current / target) * 100);

    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className={`font-medium ${isAchieved ? 'text-emerald-400' : 'text-slate-300'}`}>{label}</span>
                <span className="text-slate-500 font-mono text-xs">{current}/{target}</span>
            </div>
            <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/50">
                <div 
                    className={`h-full transition-all duration-1000 ease-out ${isAchieved ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-indigo-600'}`}
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    )
}
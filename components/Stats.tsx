import React, { useState, useEffect } from 'react';
import { PAOItem, PAOVersion } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { Trophy, AlertCircle, Film, LayoutGrid, BookOpen } from 'lucide-react';
import { listVersions, getActiveVersion } from '../services/paoStore';
import { Card, Select, Badge } from './ui';

interface StatsProps {
  items: PAOItem[];
  onSelect?: (number: number) => void;
}

export const Stats: React.FC<StatsProps> = ({ items, onSelect }) => {
  const [versions, setVersions] = useState<PAOVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [displayItems, setDisplayItems] = useState<PAOItem[]>(items);

  useEffect(() => {
    const loadedVersions = listVersions();
    setVersions(loadedVersions);

    const active = getActiveVersion();
    if (active) {
      setSelectedVersionId(active.id);
    }
  }, []);

  useEffect(() => {
    if (selectedVersionId) {
      const version = versions.find((v) => v.id === selectedVersionId);
      if (version) {
        setDisplayItems(version.items);
      }
    } else {
      setDisplayItems(items);
    }
  }, [selectedVersionId, versions, items]);

  const total = displayItems.length;
  const completedCount = displayItems.filter((i) => i.completed).length;
  const completedPercentage = Math.round((completedCount / total) * 100) || 0;
  const partialCount = displayItems.filter((i) => i.person && !i.completed).length;
  const withSceneCount = displayItems.filter(
    (i) => i.completed && i.scene && i.scene.trim().length > 0,
  ).length;
  const scenePercentage =
    completedCount > 0 ? Math.round((withSceneCount / completedCount) * 100) : 0;

  const decadeData = Array.from({ length: 10 }, (_, i) => {
    const start = i * 10;
    const end = start + 9;
    const rangeItems = displayItems.filter((item) => item.number >= start && item.number <= end);
    const done = rangeItems.filter((item) => item.completed).length;
    return {
      name: `${start.toString().padStart(2, '0')}s`,
      completed: done,
      total: 10,
    };
  });

  const selectedVersion = versions.find((v) => v.id === selectedVersionId);
  const canEdit = selectedVersion?.isActive ?? true;

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto py-2 font-sans">
      {/* Header & Version Select */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-charcoal">
            Production Analytics
          </h2>
          <p className="text-steel text-xs sm:text-sm">
            00–99 Major System Deck Completion Metrics
          </p>
        </div>

        {versions.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-steel">Deck Version:</span>
            <div className="w-52">
              <Select
                value={selectedVersionId || ''}
                onChange={(e) => setSelectedVersionId(e.target.value)}
                className="h-9 text-xs"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} {v.isActive ? '(Active)' : ''}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Deck Completion"
          value={`${completedPercentage}%`}
          sub={`${completedCount} / ${total} Cards Cast`}
          icon={<Trophy className="w-5 h-5 text-accent" />}
        />
        <StatCard
          label="Director's Cut Coverage"
          value={`${scenePercentage}%`}
          sub={`${withSceneCount} of ${completedCount} with scenes`}
          icon={<Film className="w-5 h-5 text-accent" />}
        />
        <StatCard
          label="In Progress"
          value={partialCount.toString()}
          sub="Character cast, missing action/object"
          icon={<AlertCircle className="w-5 h-5 text-conflict" />}
        />
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Decade Distribution */}
        <Card variant="paper" padding="md" className="space-y-4">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-accent" />
            <h3 className="font-display font-bold text-charcoal text-base">
              Decade Group Progress
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={decadeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e4e6" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#4c5c68"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#c5c3c6' }}
                />
                <YAxis
                  stroke="#4c5c68"
                  fontSize={11}
                  domain={[0, 10]}
                  tickLine={false}
                  axisLine={{ stroke: '#c5c3c6' }}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#c5c3c6',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#46494c',
                  }}
                  cursor={{ fill: '#e5e4e6' }}
                />
                <Bar dataKey="completed" fill="#1985a1" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Milestones */}
        <Card variant="paper" padding="md" className="space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-charcoal text-base mb-4">
              Mnemonic Milestones
            </h3>
            <div className="space-y-4">
              <Milestone label="Quarter Century (25 cards)" current={completedCount} target={25} />
              <Milestone label="Half Matrix (50 cards)" current={completedCount} target={50} />
              <Milestone label="Home Stretch (75 cards)" current={completedCount} target={75} />
              <Milestone label="Centurion Complete (100 cards)" current={completedCount} target={100} />
            </div>
          </div>

          <div className="p-3 bg-surface-subtle rounded-xl border border-border text-xs text-steel mt-4">
            Practice each completed card with Anki to establish sub-second recognition during recall.
          </div>
        </Card>
      </div>

      {/* Gaps in Matrix */}
      <Card variant="paper" padding="md" className="space-y-3">
        <h3 className="font-display font-bold text-charcoal text-base">Next Incomplete Slots</h3>
        <p className="text-xs text-steel">Focus your next casting session on these open cards:</p>

        <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2 pt-1">
          {displayItems
            .filter((i) => !i.completed)
            .slice(0, 20)
            .map((item) => (
              <button
                key={item.number}
                type="button"
                onClick={() => canEdit && onSelect?.(item.number)}
                className="p-2 rounded-lg border border-border bg-surface-subtle hover:bg-surface hover:border-accent text-center transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span className="font-display font-bold text-base text-charcoal group-hover:text-accent block">
                  {item.number.toString().padStart(2, '0')}
                </span>
                <span className="text-xs text-steel truncate block mt-0.5">
                  {item.person || 'Empty'}
                </span>
              </button>
            ))}
        </div>
      </Card>
    </div>
  );
};

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <Card variant="paper" padding="md" className="space-y-1">
      <div className="flex items-center justify-between text-steel text-xs uppercase font-semibold tracking-wider">
        <span>{label}</span>
        {icon}
      </div>
      <div className="font-display font-extrabold text-3xl text-charcoal">{value}</div>
      <p className="text-xs text-steel">{sub}</p>
    </Card>
  );
}

function Milestone({ label, current, target }: { label: string; current: number; target: number }) {
  const isAchieved = current >= target;
  const progress = Math.min(100, Math.round((current / target) * 100));

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-semibold">
        <span className={isAchieved ? 'text-accent' : 'text-charcoal'}>{label}</span>
        <span className="text-steel font-mono">
          {current}/{target}
        </span>
      </div>
      <div className="h-2 w-full bg-surface-subtle rounded-full overflow-hidden border border-border">
        <div
          className={`h-full transition-all duration-300 ${
            isAchieved ? 'bg-accent' : 'bg-steel'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

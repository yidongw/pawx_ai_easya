import type { StatusHistoryEntry } from '@/app/[locale]/(marketing)/profiles/[username]/types';
import React, { useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const formatXAxisTick = (timestamp: number) => {
  return new Date(timestamp).toLocaleString([], {
    month: 'numeric',
    day: 'numeric',
  });
};
const formatYAxisTick = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}k`;
  }
  return value.toString();
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dateStr = new Date(label).toLocaleString([], {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return (
      <div className="bg-white/90 dark:bg-gray-900/90 p-2.5 border border-gray-600 rounded text-gray-900 dark:text-white text-sm">
        <p className="m-0 mb-1.5 font-bold">{dateStr}</p>
        {payload.map((pld: any) => (
          pld.value !== undefined && pld.value !== null && (
            <p key={pld.dataKey} className="m-0" style={{ color: pld.color }}>
              {`${pld.name}: ${pld.value.toLocaleString()}`}
            </p>
          )
        ))}
      </div>
    );
  }
  return null;
};

const CustomLegend: React.FC<{
  payload?: Array<{
    value: string;
    color: string;
    dataKey: string;
  }>;
  hiddenSeries: { [key: string]: boolean };
  onClick?: (dataKey: string) => void;
}> = ({ payload, hiddenSeries, onClick }) => {
  if (!payload) {
    return null;
  }

  return (
    <ul className="list-none p-0 m-0 flex flex-wrap gap-4 justify-center">
      {payload.map(entry => (
        <li key={entry.value} className="inline-flex">
          <button
            type="button"
            className={`
              inline-flex items-center px-2 py-1 rounded
              text-black dark:text-white
              transition-all duration-200
              hover:bg-gray-100 dark:hover:bg-gray-800
              focus:outline-none focus:ring-2 focus:ring-orange-500
              ${hiddenSeries[entry.dataKey] ? 'opacity-50' : 'opacity-100'}
            `}
            onClick={() => onClick?.(entry.dataKey)}
          >
            <span
              className="inline-block w-3 h-3 mr-2 rounded-sm flex-shrink-0"
              style={{ backgroundColor: entry.color }}
              aria-hidden="true"
            />
            <span>{entry.value}</span>
          </button>
        </li>
      ))}
    </ul>
  );
};

const StatusHistorySection: React.FC<{ history: StatusHistoryEntry[] }> = ({ history }) => {
  const [hiddenSeries, setHiddenSeries] = useState<{ [key: string]: boolean }>({
    followersCount: false,
    friendsCount: false,
    statusesCount: false,
    kolFollowersCount: false,
  });

  if (!history || history.length < 2) {
    return (
      <div className="px-4">
        <div className="w-full h-[480px] flex justify-center items-center border border-dashed border-gray-600 dark:border-gray-500 rounded">
          <div className="text-gray-500 dark:text-gray-400 text-center">
            Not enough data points to display history.
          </div>
        </div>
      </div>
    );
  }

  const chartData = history
    .map(entry => ({
      timestamp: new Date(entry.createdAt).getTime(),
      followersCount: entry.followersCount ?? 0,
      friendsCount: entry.friendsCount ?? 0,
      statusesCount: entry.statusesCount ?? 0,
      kolFollowersCount: entry.kolFollowersCount,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  const hasKolFollowersData = chartData.some(entry => entry.kolFollowersCount !== undefined && entry.kolFollowersCount !== null);

  let minY = Infinity;
  let maxY = -Infinity;

  chartData.forEach((entry) => {
    const values = [
      !hiddenSeries.followersCount ? entry.followersCount : undefined,
      !hiddenSeries.friendsCount ? entry.friendsCount : undefined,
      !hiddenSeries.statusesCount ? entry.statusesCount : undefined,
      hasKolFollowersData && !hiddenSeries.kolFollowersCount ? entry.kolFollowersCount : undefined,
    ].filter(v => v !== undefined && v !== null) as number[];

    if (values.length > 0) {
      const currentMin = Math.min(...values);
      const currentMax = Math.max(...values);
      if (currentMin < minY) {
        minY = currentMin;
      }
      if (currentMax > maxY) {
        maxY = currentMax;
      }
    }
  });

  let yDomain: [number | string, number | string] = ['auto', 'auto'];

  if (minY !== Infinity && maxY !== -Infinity) {
    if (minY === maxY) {
      const padding = Math.max(1, Math.abs(minY * 0.05));
      yDomain = [minY - padding, minY + padding];
    } else {
      const range = maxY - minY;
      const padding = range * 0.1;
      yDomain = [
        Math.floor(minY - padding),
        Math.ceil(maxY + padding),
      ];
    }
    if (typeof yDomain[0] === 'number' && yDomain[0] < 0 && minY >= 0) {
      yDomain[0] = 0;
    }
  }

  const handleLegendClick = (dataKey: string) => {
    setHiddenSeries(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey],
    }));
  };

  return (
    <div className="px-4 pb-4">
      <div className="w-full h-[480px]">
        <ResponsiveContainer>
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#555" />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatXAxisTick}
              stroke="#666"
              angle={-30}
              textAnchor="end"
              height={50}
              tick={{ fontSize: '0.8em', fill: '#666' }}
            />
            <YAxis
              stroke="#666"
              tick={{ fontSize: '0.8em', fill: '#666' }}
              tickFormatter={formatYAxisTick}
              domain={yDomain}
              allowDataOverflow={true}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              content={<CustomLegend hiddenSeries={hiddenSeries} onClick={handleLegendClick} />}
              wrapperStyle={{ fontSize: '0.9em' }}
            />
            <Line
              type="monotone"
              dataKey="followersCount"
              name="Followers"
              stroke="#8884d8"
              strokeWidth={2}
              dot={false}
              connectNulls
              activeDot={{ r: 4 }}
              hide={hiddenSeries.followersCount}
            />
            <Line
              type="monotone"
              dataKey="friendsCount"
              name="Following"
              stroke="#82ca9d"
              strokeWidth={2}
              dot={false}
              connectNulls
              activeDot={{ r: 4 }}
              hide={hiddenSeries.friendsCount}
            />
            <Line
              type="monotone"
              dataKey="statusesCount"
              name="Tweets"
              stroke="#ffc658"
              strokeWidth={2}
              dot={false}
              connectNulls
              activeDot={{ r: 4 }}
              hide={hiddenSeries.statusesCount}
            />
            {hasKolFollowersData && (
              <Line
                type="monotone"
                dataKey="kolFollowersCount"
                name="Tracked KOL"
                stroke="#ff7300"
                strokeWidth={2}
                dot={false}
                connectNulls
                activeDot={{ r: 4 }}
                hide={hiddenSeries.kolFollowersCount}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatusHistorySection;

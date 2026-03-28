import React, { useState, useEffect, useMemo } from 'react';

interface SessionWithTasks {
  id: string;
  title: string;
  start_time: string;
  total_duration: number;
  totalTasks: number;
  completedTasks: number;
}

interface Props {
  sessions: SessionWithTasks[];
}

export const ProductivityGraph = ({ sessions }: Props) => {
  const [selectedPeriod, setSelectedPeriod] = useState('Last 30 days');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [chartVisible, setChartVisible] = useState(false);

  // Process data based on actual sessions
  const chartData = useMemo(() => {
    const now = new Date();
    const periods = {
      'Last 30 days': 30,
      'Last 7 days': 7,
      'Today': 1
    };

    const result: Record<string, any> = {};

    Object.entries(periods).forEach(([label, days]) => {
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      if (label === 'Today') cutoff.setHours(0, 0, 0, 0);

      const filtered = sessions
        .filter(s => new Date(s.start_time) >= cutoff)
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

      // If no sessions, provide fallback zero data
      if (filtered.length === 0) {
        result[label] = {
          dates: ['No Data'],
          completed: [0],
          total: [0],
          peak: 0,
          average: 0,
          growth: '0%'
        };
        return;
      }

      // Group by day for longer periods, or by session for Today
      const dates: string[] = [];
      const completed: number[] = [];
      const total: number[] = [];

      filtered.forEach(s => {
        const d = new Date(s.start_time);
        const dateStr = label === 'Today' 
          ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : `${d.getMonth() + 1}/${d.getDate()}`;
        
        dates.push(dateStr);
        completed.push(s.completedTasks);
        total.push(s.totalTasks);
      });

      const peakTasks = Math.max(...completed, 0);
      const avgTasks = Math.round(completed.reduce((a, b) => a + b, 0) / (completed.length || 1));
      
      // Calculate fake "growth" comparing first half vs second half just for visuals
      const half = Math.floor(completed.length / 2);
      const firstHalf = completed.slice(0, half).reduce((a, b) => a + b, 0);
      const secondHalf = completed.slice(half).reduce((a, b) => a + b, 0);
      const growthPct = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : 0;
      const growthSign = growthPct >= 0 ? '+' : '';

      result[label] = {
        dates,
        completed,
        total,
        peak: peakTasks,
        average: avgTasks,
        growth: `${growthSign}${growthPct}%`
      };
    });

    return result;
  }, [sessions]);

  const currentData = chartData[selectedPeriod] || chartData['Last 30 days'];
  // Keep max value padding to prevent touching top
  const maxValue = Math.max(1, Math.max(...currentData.completed, ...currentData.total)) * 1.2;

  // Generate path for smooth curves
  const generateSmoothPath = (values: number[], height = 300, isArea = false) => {
    const width = 800;
    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // If only one point exists, draw a flat line across
    if (values.length === 1) {
      const y = padding + (1 - values[0] / maxValue) * chartHeight;
      if (isArea) return `M ${padding},${y} L ${width - padding},${y} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;
      return `M ${padding},${y} L ${width - padding},${y}`;
    }
    
    const points = values.map((value, index) => ({
      x: padding + (index / (values.length - 1)) * chartWidth,
      y: padding + (1 - value / maxValue) * chartHeight
    }));

    if (points.length < 2) return '';

    let path = `M ${points[0].x},${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      
      const cp1x = prev.x + (curr.x - prev.x) * 0.5;
      const cp1y = prev.y;
      const cp2x = curr.x - (next ? (next.x - curr.x) * 0.3 : 0);
      const cp2y = curr.y;
      
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
    }
    
    if (isArea) {
      path += ` L ${points[points.length - 1].x},${height - padding} L ${padding},${height - padding} Z`;
    }
    
    return path;
  };

  useEffect(() => {
    setChartVisible(false);
    setAnimationPhase(0);
    
    const timers = [
      setTimeout(() => setAnimationPhase(1), 100),
      setTimeout(() => setAnimationPhase(2), 400),
      setTimeout(() => setAnimationPhase(3), 800),
      setTimeout(() => setChartVisible(true), 1200)
    ];
    
    return () => timers.forEach(clearTimeout);
  }, [selectedPeriod]);

  const periods = [
    { label: 'Today', size: 'Daily', color: 'bg-green-500' },
    { label: 'Last 7 days', size: 'Weekly', color: 'bg-orange-500' },
    { label: 'Last 30 days', size: 'Monthly', color: 'bg-blue-500' }
  ];

  const metrics = [
    { label: 'Peak Tasks', value: currentData.peak, color: 'border-accent/40', size: 'High' },
    { label: 'Average', value: currentData.average, color: 'border-amber/40', size: 'Mean' },
    { label: 'Trend', value: currentData.growth, color: 'border-primary/40', size: 'Growth' }
  ];

  return (
    <div className="w-full bg-bg-primary font-light rounded-2xl overflow-hidden border border-border">
      <div className="p-8">
        {/* Header */}
        <div className="mb-12">
          <h2 
            className={`text-3xl font-bold text-text-primary mb-2 tracking-tight transition-all duration-1000 ${
              animationPhase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Productivity Over Time
          </h2>
          <p 
            className={`text-sm text-text-secondary font-medium transition-all duration-1000 delay-200 ${
              animationPhase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Tasks Completed vs Created
          </p>
        </div>

        {/* Main Chart Container */}
        <div className="relative bg-bg-surface/50 rounded-xl shadow-sm border border-border overflow-hidden">
          
          {/* Legend */}
          <div className="absolute top-6 left-6 z-10 flex gap-6">
            <div 
              className={`flex items-center gap-2 transition-all duration-800 delay-300 ${
                animationPhase >= 2 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full border-2 border-accent bg-accent/20"></div>
              <span className="text-text-secondary text-xs uppercase tracking-wider font-semibold">Completed</span>
              <span className="text-text-primary font-bold text-sm">
                {currentData.completed[currentData.completed.length - 1]}
              </span>
            </div>
            <div 
              className={`flex items-center gap-2 transition-all duration-800 delay-400 ${
                animationPhase >= 2 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full border-2 border-text-muted bg-text-muted/20"></div>
              <span className="text-text-secondary text-xs uppercase tracking-wider font-semibold">Created</span>
              <span className="text-text-primary font-bold text-sm">
                {currentData.total[currentData.total.length - 1]}
              </span>
            </div>
          </div>

          {/* Period Selection */}
          <div className="absolute top-6 right-6 z-10 flex flex-col gap-2">
            {periods.map((period, index) => (
              <div
                key={period.label}
                className={`
                  cursor-pointer transition-all duration-500 hover:scale-105 border
                  ${selectedPeriod === period.label 
                    ? 'bg-primary border-primary text-white shadow-lg' 
                    : 'bg-bg-elevated text-text-secondary border-border hover:bg-bg-hover'
                  }
                  ${animationPhase >= 2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}
                `}
                style={{
                  transitionDelay: `${300 + index * 100}ms`,
                  borderRadius: '12px',
                  padding: '8px 12px',
                  minWidth: '120px'
                }}
                onClick={() => setSelectedPeriod(period.label)}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${period.color}`}></div>
                  <span className="text-[10px] font-semibold opacity-70 uppercase tracking-wider">{period.size}</span>
                </div>
                <div className="text-xs font-medium">{period.label}</div>
              </div>
            ))}
          </div>

          {/* Chart Area */}
          <div className="p-6 pt-20 pb-12">
            <div className="h-80 relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 800 400">
                {/* Background Grid */}
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="800" height="400" fill="url(#grid)"/>

                {/* Total Area */}
                <path
                  d={generateSmoothPath(currentData.total, 340, true)}
                  fill="rgba(107, 114, 128, 0.05)"
                  className={`transition-all duration-1000 ${
                    chartVisible ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    transform: chartVisible ? 'scale(1)' : 'scale(0.95)',
                    transformOrigin: 'center bottom'
                  }}
                />

                {/* Completed Area */}
                <path
                  d={generateSmoothPath(currentData.completed, 340, true)}
                  fill="rgba(0, 212, 170, 0.1)"
                   className={`transition-all duration-1000 ${
                    chartVisible ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    transform: chartVisible ? 'scale(1)' : 'scale(0.95)',
                    transformOrigin: 'center bottom',
                    transitionDelay: '100ms'
                  }}
                />

                {/* Total Line */}
                <path
                  d={generateSmoothPath(currentData.total, 340)}
                  fill="none"
                  stroke="#4b5563"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className={`transition-all duration-1500 ${
                    chartVisible ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    strokeDasharray: chartVisible ? 'none' : '1000',
                    strokeDashoffset: chartVisible ? '0' : '1000',
                    transitionDelay: '300ms'
                  }}
                />

                {/* Completed Line */}
                <path
                  d={generateSmoothPath(currentData.completed, 340)}
                  fill="none"
                  stroke="#00d4aa"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className={`transition-all duration-1500 ${
                    chartVisible ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    strokeDasharray: chartVisible ? 'none' : '1000',
                    strokeDashoffset: chartVisible ? '0' : '1000',
                    transitionDelay: '500ms'
                  }}
                />

                {/* Data Points */}
                {currentData.dates.length > 0 && currentData.dates[0] !== 'No Data' && currentData.dates.map((date: string, index: number) => {
                  const padding = 60;
                  const chartWidth = 800 - padding * 2;
                  const chartHeight = 340 - padding * 2;
                  const factor = currentData.dates.length > 1 ? (index / (currentData.dates.length - 1)) : 0.5;
                  const x = padding + factor * chartWidth;
                  const completedY = padding + (1 - currentData.completed[index] / maxValue) * chartHeight;
                  const totalY = padding + (1 - currentData.total[index] / maxValue) * chartHeight;
                  
                  return (
                    <g key={index}>
                      {/* Total Point */}
                      <circle
                        cx={x}
                        cy={totalY}
                        r={hoveredPoint === index ? 6 : 4}
                        fill="#1a1a2e"
                        stroke="#4b5563"
                        strokeWidth="2"
                        className={`transition-all duration-300 cursor-pointer ${
                          chartVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                        }`}
                        style={{
                          transitionDelay: `${800 + index * 50}ms`,
                          transformOrigin: `${x}px ${totalY}px`
                        }}
                        onMouseEnter={() => setHoveredPoint(index)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                      
                      {/* Completed Point */}
                      <circle
                        cx={x}
                        cy={completedY}
                        r={hoveredPoint === index ? 6 : 4}
                        fill="#1a1a2e"
                        stroke="#00d4aa"
                        strokeWidth="2"
                        className={`transition-all duration-300 cursor-pointer ${
                          chartVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                        }`}
                        style={{
                          transitionDelay: `${900 + index * 50}ms`,
                          transformOrigin: `${x}px ${completedY}px`
                        }}
                        onMouseEnter={() => setHoveredPoint(index)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    </g>
                  );
                })}

                {/* X-axis Labels */}
                {currentData.dates.length > 0 && currentData.dates[0] !== 'No Data' && currentData.dates.map((date: string, index: number) => {
                  const padding = 60;
                  const chartWidth = 800 - padding * 2;
                  const factor = currentData.dates.length > 1 ? (index / (currentData.dates.length - 1)) : 0.5;
                  const x = padding + factor * chartWidth;
                  
                  // Only show ~5 labels to avoid clutter if too many
                  const step = Math.ceil(currentData.dates.length / 8);
                  if (index % step !== 0 && index !== currentData.dates.length - 1) return null;

                  return (
                    <text
                      key={index}
                      x={x}
                      y={365}
                      textAnchor="middle"
                      fill="#8585a0"
                      fontSize="11"
                      fontWeight="500"
                      className={`transition-all duration-500 ${
                        chartVisible ? 'opacity-100' : 'opacity-0'
                      }`}
                      style={{
                        transitionDelay: `${1000 + index * 30}ms`
                      }}
                    >
                      {date}
                    </text>
                  );
                })}

                {/* Hover Tooltip */}
                {hoveredPoint !== null && currentData.dates[0] !== 'No Data' && (
                  <g>
                    {(() => {
                      const padding = 60;
                      const chartWidth = 800 - padding * 2;
                      const factor = currentData.dates.length > 1 ? (hoveredPoint / (currentData.dates.length - 1)) : 0.5;
                      const rectX = padding + factor * chartWidth - 50;
                      
                      return (
                        <>
                          <rect
                            x={rectX}
                            y={10}
                            width="100"
                            height="75"
                            fill="#161628"
                            stroke="#222240"
                            strokeWidth="1"
                            rx="8"
                            className="drop-shadow-2xl"
                          />
                          <text
                            x={rectX + 50}
                            y={30}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="11"
                            fontWeight="600"
                          >
                            {currentData.dates[hoveredPoint]}
                          </text>
                          <text
                            x={rectX + 50}
                            y={50}
                            textAnchor="middle"
                            fill="#00d4aa"
                            fontSize="10"
                            fontWeight="600"
                          >
                            Completed: {currentData.completed[hoveredPoint]}
                          </text>
                          <text
                            x={rectX + 50}
                            y={70}
                            textAnchor="middle"
                            fill="#a1a1b5"
                            fontSize="10"
                            fontWeight="600"
                          >
                            Created: {currentData.total[hoveredPoint]}
                          </text>
                        </>
                      );
                    })()}
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* Bottom Metrics */}
          <div className="px-6 pb-6 pt-2 flex flex-col md:flex-row justify-between items-end gap-4 border-t border-border mt-4">
            <div className="flex gap-4">
              {metrics.map((metric, index) => (
                <div
                  key={metric.label}
                  className={`
                    bg-bg-elevated rounded-xl border ${metric.color} p-4 min-w-[120px]
                    transition-all duration-800 hover:scale-105 hover:bg-bg-hover
                    ${animationPhase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
                  `}
                  style={{
                    transitionDelay: `${1200 + index * 100}ms`
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></div>
                    <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold">{metric.size}</span>
                  </div>
                  <div className="text-2xl font-bold text-text-primary mb-0.5">{metric.value}</div>
                  <div className="text-xs text-text-secondary font-medium">{metric.label}</div>
                </div>
              ))}
            </div>

            {/* Total Completion Bar */}
            <div 
              className={`bg-primary/10 border border-primary/20 text-text-primary px-5 py-3.5 rounded-xl transition-all duration-800 ${
                animationPhase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: '1600ms' }}
            >
              <div className="flex items-center justify-between gap-6 mb-2.5">
                <span className="text-primary text-xs font-bold uppercase tracking-wider">Total Output</span>
                <span className="font-bold text-sm">{currentData.completed.reduce((a:number,b:number)=>a+b,0)} tasks</span>
              </div>
              <div className="w-48 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-2000 ${
                    chartVisible ? 'w-full' : 'w-0'
                  }`}
                  style={{ transitionDelay: '1900ms' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductivityGraph;

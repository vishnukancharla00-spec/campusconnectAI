import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ScatterChart, Scatter, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ZAxis,
} from 'recharts';
import {
  Compass, SlidersHorizontal, Search, RotateCcw, Download,
  ChevronDown, ChevronUp, ScatterChart as ScatterIcon, BarChart3, Activity,
} from 'lucide-react';

const BRANCHES = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'];
const SEMESTERS = ['Sem_1', 'Sem_3', 'Sem_4', 'Sem_5'];
const RISK_COLORS = {
  'High Risk': '#ef4444',
  'Medium Risk': '#f59e0b',
  Satisfactory: '#10b981',
};

const CHART_TYPES = [
  { key: 'scatter', label: 'Scatter', icon: ScatterIcon },
  { key: 'bar', label: 'Distribution', icon: BarChart3 },
  { key: 'area', label: 'Trend', icon: Activity },
];

const ScatterTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="glass-card p-3 !rounded-lg text-xs border border-white/10 animate-fade-in">
      <p className="text-white font-semibold">{d.name}</p>
      <p className="text-slate-400 font-mono">{d.roll_no}</p>
      <p className="text-brand-300 mt-1">Attendance: {d.attendance}%</p>
      <p className="text-purple-300">Marks: {d.average_marks}</p>
      <p className="text-slate-500">{d.branch} • {d.semester?.replace('_', ' ')}</p>
      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
        d.risk === 'High Risk' ? 'badge-risk-high' : d.risk === 'Medium Risk' ? 'badge-risk-medium' : 'badge-risk-low'
      }`}>{d.risk}</span>
    </div>
  );
};

function buildAttendanceBuckets(students) {
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 10}-${(i + 1) * 10}%`,
    count: 0,
    label: `${i * 10}%`,
  }));
  students.forEach((s) => {
    const idx = Math.min(Math.floor(s.attendance / 10), 9);
    buckets[idx].count += 1;
  });
  return buckets;
}

function buildSemesterTrend(students) {
  return SEMESTERS.map((sem) => {
    const group = students.filter((s) => s.semester === sem);
    return {
      name: sem.replace('_', ' '),
      attendance: group.length ? group.reduce((a, s) => a + s.attendance, 0) / group.length : 0,
      marks: group.length ? group.reduce((a, s) => a + s.average_marks, 0) / group.length : 0,
      count: group.length,
    };
  });
}

const exportCSV = (students, filename) => {
  const headers = ['Roll No', 'Name', 'Branch', 'Semester', 'Section', 'Attendance', 'Avg Marks', 'Risk', 'Fee Pending'];
  const rows = students.map((s) => [
    s.roll_no,
    `"${(s.name || '').replace(/"/g, '""')}"`,
    s.branch,
    s.semester,
    s.section || '',
    s.attendance,
    s.average_marks,
    s.risk,
    s.fee_pending ? 'Yes' : 'No',
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export default function InteractiveDataExplorer({ defaultExpanded = true }) {
  const { user, authFetch } = useAuth();
  const isPrincipal = user?.role === 'PRINCIPAL';
  const defaultBranch = user?.branch || 'CSE';

  const [expanded, setExpanded] = useState(defaultExpanded);
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState(null);

  const [branch, setBranch] = useState(isPrincipal ? 'All' : defaultBranch);
  const [semester, setSemester] = useState('All');
  const [chartType, setChartType] = useState('scatter');
  const [attMin, setAttMin] = useState(0);
  const [attMax, setAttMax] = useState(100);
  const [marksMin, setMarksMin] = useState(0);
  const [marksMax, setMarksMax] = useState(100);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (branch && branch !== 'All') params.set('branch', branch);
      if (semester && semester !== 'All') params.set('semester', semester);
      const res = await authFetch(`/api/analytics/explore?${params}`);
      if (res.ok) setRawData(await res.json());
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [authFetch, branch, semester]);

  useEffect(() => {
    if (expanded) loadData();
  }, [expanded, loadData]);

  const studentsBeforeRisk = useMemo(() => {
    if (!rawData?.students) return [];
    let list = rawData.students;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (s) => s.name?.toLowerCase().includes(q) || s.roll_no?.toLowerCase().includes(q)
      );
    }
    return list.filter(
      (s) => s.attendance >= attMin && s.attendance <= attMax
        && s.average_marks >= marksMin && s.average_marks <= marksMax
    );
  }, [rawData, searchQuery, attMin, attMax, marksMin, marksMax]);

  const filteredStudents = useMemo(() => {
    if (!riskFilter) return studentsBeforeRisk;
    return studentsBeforeRisk.filter((s) => s.risk === riskFilter);
  }, [studentsBeforeRisk, riskFilter]);

  const riskCounts = useMemo(() => ({
    'High Risk': studentsBeforeRisk.filter((s) => s.risk === 'High Risk').length,
    'Medium Risk': studentsBeforeRisk.filter((s) => s.risk === 'Medium Risk').length,
    Satisfactory: studentsBeforeRisk.filter((s) => s.risk === 'Satisfactory').length,
  }), [studentsBeforeRisk]);

  const scatterData = useMemo(
    () => filteredStudents.map((s) => ({
      ...s,
      x: s.attendance,
      y: s.average_marks,
    })),
    [filteredStudents]
  );

  const bucketData = useMemo(() => buildAttendanceBuckets(filteredStudents), [filteredStudents]);
  const trendData = useMemo(() => buildSemesterTrend(filteredStudents), [filteredStudents]);

  const liveStats = useMemo(() => {
    const n = filteredStudents.length;
    if (!n) return { count: 0, avgAtt: 0, avgMarks: 0, highRisk: 0 };
    return {
      count: n,
      avgAtt: (filteredStudents.reduce((a, s) => a + s.attendance, 0) / n).toFixed(1),
      avgMarks: (filteredStudents.reduce((a, s) => a + s.average_marks, 0) / n).toFixed(1),
      highRisk: filteredStudents.filter((s) => s.risk === 'High Risk').length,
    };
  }, [filteredStudents]);

  const resetFilters = () => {
    setAttMin(0);
    setAttMax(100);
    setMarksMin(0);
    setMarksMax(100);
    setSearchQuery('');
    setRiskFilter(null);
    setSelectedStudent(null);
  };

  const handleScatterClick = (data) => {
    const point = data?.payload || data;
    if (point?.roll_no) {
      setSelectedStudent(selectedStudent === point.roll_no ? null : point.roll_no);
    }
  };

  return (
    <div className="glass-card border border-brand-500/20 overflow-hidden animate-slide-up">
      <button
        type="button"
        className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500/30 to-purple-500/30 flex items-center justify-center">
            <Compass className="w-4 h-4 text-brand-300" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-white">Interactive Data Playground</h3>
            <p className="text-xs text-slate-500">Explore, filter &amp; visualize student data in real time</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-white/[0.06] pt-5">
          {/* Controls */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-2 text-brand-400">
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-sm font-semibold">Controls</span>
            </div>

            {isPrincipal && (
              <div>
                <label className="block text-xs text-slate-500 mb-1">Branch</label>
                <select className="input-field w-32 py-2 text-sm" value={branch} onChange={(e) => setBranch(e.target.value)}>
                  <option value="All">All Branches</option>
                  {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-500 mb-1">Semester</label>
              <select className="input-field w-36 py-2 text-sm" value={semester} onChange={(e) => setSemester(e.target.value)}>
                <option value="All">All Semesters</option>
                {SEMESTERS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Chart Type</label>
              <div className="flex gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                {CHART_TYPES.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${
                      chartType === key ? 'bg-brand-600/40 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    onClick={() => setChartType(key)}
                  >
                    <Icon className="w-3 h-3" /> {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-slate-500 mb-1">Attendance {attMin}–{attMax}%</label>
              <div className="flex gap-2 items-center">
                <input type="range" min="0" max="100" value={attMin} onChange={(e) => setAttMin(Math.min(+e.target.value, attMax))} className="flex-1 h-2 accent-brand-500 cursor-pointer" />
                <input type="range" min="0" max="100" value={attMax} onChange={(e) => setAttMax(Math.max(+e.target.value, attMin))} className="flex-1 h-2 accent-brand-500 cursor-pointer" />
              </div>
            </div>

            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-slate-500 mb-1">Marks {marksMin}–{marksMax}</label>
              <div className="flex gap-2 items-center">
                <input type="range" min="0" max="100" value={marksMin} onChange={(e) => setMarksMin(Math.min(+e.target.value, marksMax))} className="flex-1 h-2 accent-purple-500 cursor-pointer" />
                <input type="range" min="0" max="100" value={marksMax} onChange={(e) => setMarksMax(Math.max(+e.target.value, marksMin))} className="flex-1 h-2 accent-purple-500 cursor-pointer" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  className="input-field pl-9 py-2 text-sm w-44"
                  placeholder="Name / Roll No"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button type="button" className="btn-ghost text-xs py-2 flex items-center gap-1" onClick={resetFilters}>
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
              <button
                type="button"
                className="btn-ghost text-xs py-2 flex items-center gap-1"
                onClick={() => exportCSV(filteredStudents, `campusconnect_export_${Date.now()}.csv`)}
                disabled={!filteredStudents.length}
              >
                <Download className="w-3.5 h-3.5" /> Export
              </button>
            </div>
          </div>

          {/* Risk filter chips */}
          <div className="flex flex-wrap gap-2">
            {['High Risk', 'Medium Risk', 'Satisfactory'].map((risk) => (
              <button
                key={risk}
                type="button"
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-300 ${
                  riskFilter === risk
                    ? 'ring-2 ring-white/20 scale-105'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: `${RISK_COLORS[risk]}22`,
                  borderColor: `${RISK_COLORS[risk]}66`,
                  color: RISK_COLORS[risk],
                }}
                onClick={() => setRiskFilter(riskFilter === risk ? null : risk)}
              >
                {risk} ({riskCounts[risk]})
              </button>
            ))}
          </div>

          {/* Live stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Filtered Students', value: liveStats.count, color: 'text-white' },
              { label: 'Avg Attendance', value: `${liveStats.avgAtt}%`, color: 'text-emerald-400' },
              { label: 'Avg Marks', value: liveStats.avgMarks, color: 'text-brand-400' },
              { label: 'High Risk', value: liveStats.highRisk, color: 'text-red-400' },
            ].map((stat) => (
              <div key={stat.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] transition-all duration-300">
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Loading explorer data...</p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              {chartType === 'scatter' && (
                <>
                  <p className="text-xs text-slate-500 mb-3">Click a dot to highlight the student in the table below</p>
                  <ResponsiveContainer width="100%" height={320}>
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis type="number" dataKey="x" name="Attendance" unit="%" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis type="number" dataKey="y" name="Marks" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <ZAxis range={[40, 400]} />
                      <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                      {['High Risk', 'Medium Risk', 'Satisfactory'].map((risk) => (
                        <Scatter
                          key={risk}
                          name={risk}
                          data={scatterData.filter((s) => s.risk === risk)}
                          fill={RISK_COLORS[risk]}
                          onClick={handleScatterClick}
                          cursor="pointer"
                        />
                      ))}
                    </ScatterChart>
                  </ResponsiveContainer>
                </>
              )}

              {chartType === 'bar' && (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={bucketData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      content={({ active, payload, label }) => active && payload?.length ? (
                        <div className="glass-card p-3 !rounded-lg text-xs border border-white/10">
                          <p className="text-white font-semibold">{label} – {payload[0]?.payload?.range}</p>
                          <p className="text-brand-300">Students: {payload[0]?.value}</p>
                        </div>
                      ) : null}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} name="Students">
                      {bucketData.map((_, i) => (
                        <Cell key={i} fill={`hsl(${240 + i * 8}, 70%, ${55 + i * 2}%)`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {chartType === 'area' && (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip
                      content={({ active, payload, label }) => active && payload?.length ? (
                        <div className="glass-card p-3 !rounded-lg text-xs border border-white/10">
                          <p className="text-white font-semibold mb-1">{label}</p>
                          {payload.map((p, i) => (
                            <p key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</p>
                          ))}
                          <p className="text-slate-400 mt-1">Students: {payload[0]?.payload?.count}</p>
                        </div>
                      ) : null}
                    />
                    <Area type="monotone" dataKey="attendance" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} name="Avg Attendance" />
                    <Area type="monotone" dataKey="marks" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.15} name="Avg Marks" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* Data table */}
          {!loading && (
            <div className="overflow-x-auto rounded-xl border border-white/[0.06] max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface-900/95 backdrop-blur-sm z-10">
                  <tr>
                    <th className="p-2.5 text-left text-slate-400 font-medium">Roll No</th>
                    <th className="p-2.5 text-left text-slate-400 font-medium">Name</th>
                    {isPrincipal && branch === 'All' && <th className="p-2.5 text-left text-slate-400 font-medium">Branch</th>}
                    <th className="p-2.5 text-left text-slate-400 font-medium">Semester</th>
                    <th className="p-2.5 text-left text-slate-400 font-medium">Attendance</th>
                    <th className="p-2.5 text-left text-slate-400 font-medium">Marks</th>
                    <th className="p-2.5 text-left text-slate-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.slice(0, 100).map((s) => (
                    <tr
                      key={`${s.roll_no}-${s.semester}`}
                      className={`border-t border-white/[0.04] transition-colors cursor-pointer ${
                        selectedStudent === s.roll_no
                          ? 'bg-brand-500/15 ring-1 ring-brand-500/30'
                          : 'hover:bg-white/[0.02]'
                      }`}
                      onClick={() => setSelectedStudent(selectedStudent === s.roll_no ? null : s.roll_no)}
                    >
                      <td className="p-2.5 font-mono text-xs text-slate-300">{s.roll_no}</td>
                      <td className="p-2.5 text-white">{s.name}</td>
                      {isPrincipal && branch === 'All' && <td className="p-2.5 text-slate-400">{s.branch}</td>}
                      <td className="p-2.5 text-slate-400">{s.semester?.replace('_', ' ')}</td>
                      <td className="p-2.5"><span className={s.attendance < 75 ? 'text-red-400' : 'text-emerald-400'}>{s.attendance}%</span></td>
                      <td className="p-2.5"><span className={s.average_marks < 40 ? 'text-red-400' : 'text-emerald-400'}>{s.average_marks}</span></td>
                      <td className="p-2.5">
                        {s.risk === 'High Risk' ? <span className="badge-risk-high">High</span>
                          : s.risk === 'Medium Risk' ? <span className="badge-risk-medium">Medium</span>
                          : <span className="badge-risk-low">OK</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredStudents.length > 100 && (
                <p className="text-center text-xs text-slate-500 py-2">Showing 100 of {filteredStudents.length} — export for full list</p>
              )}
              {filteredStudents.length === 0 && (
                <p className="text-center text-slate-500 py-8">No students match current filters</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

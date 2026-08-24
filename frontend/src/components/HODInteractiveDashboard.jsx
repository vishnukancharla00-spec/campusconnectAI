import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  Users, TrendingUp, AlertTriangle, BookOpen, Search, SlidersHorizontal,
  Target, Activity, Trophy, TrendingDown, X,
} from 'lucide-react';
import InteractiveDataExplorer from './InteractiveDataExplorer';

const SEMESTERS = ['Sem_1', 'Sem_3', 'Sem_4', 'Sem_5'];

const getRiskCategory = (student) => {
  const isHigh = student.attendance < 75 && student.average_marks < 40;
  const isMed = student.attendance < 75 || student.average_marks < 40;
  if (isHigh) return 'High Risk';
  if (isMed) return 'Medium Risk';
  return 'Satisfactory';
};

const SubjectTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="glass-card p-3 !rounded-lg text-xs border border-white/10 animate-fade-in">
      <p className="text-white font-semibold mb-2">{d.label || d.name}</p>
      <p className="text-brand-300">Average: <strong>{d.average?.toFixed?.(1) ?? d.average}%</strong></p>
      {d.student_count != null && <p className="text-slate-300">Students: {d.student_count}</p>}
      {d.highest != null && <p className="text-emerald-400">Highest: {d.highest}</p>}
      {d.lowest != null && <p className="text-red-400">Lowest: {d.lowest}</p>}
      <p className="text-slate-500 mt-1">Click to view scorers</p>
    </div>
  );
};

const RiskTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const total = payload[0]?.payload?.total || 0;
  const pct = total ? ((d.value / total) * 100).toFixed(1) : 0;
  return (
    <div className="glass-card p-3 !rounded-lg text-xs border border-white/10">
      <p className="text-white font-semibold mb-1">{d.name}</p>
      <p style={{ color: d.payload?.color }}>Count: {d.value}</p>
      <p className="text-slate-400">Share: {pct}%</p>
      <p className="text-slate-500 mt-1">Click to filter list</p>
    </div>
  );
};

const SemTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 !rounded-lg text-xs border border-white/10">
      <p className="text-white font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function HODInteractiveDashboard() {
  const { user, authFetch } = useAuth();
  const branch = user?.branch || 'CSE';

  const [deptData, setDeptData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedSemester, setSelectedSemester] = useState('All');
  const [attThreshold, setAttThreshold] = useState(75);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectDetail, setSubjectDetail] = useState(null);
  const [subjectDetailLoading, setSubjectDetailLoading] = useState(false);
  const [riskFilter, setRiskFilter] = useState(null);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [semesterSubjectData, setSemesterSubjectData] = useState({});
  const [subjectTooltipMeta, setSubjectTooltipMeta] = useState({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [deptRes, riskRes] = await Promise.all([
          authFetch(`/api/analytics/hod?branch=${branch}`),
          authFetch(`/api/analytics/risk-distribution?branch=${branch}`),
        ]);
        if (deptRes.ok) setDeptData(await deptRes.json());
        if (riskRes.ok) setRiskData(await riskRes.json());
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    load();
  }, [branch]);

  const activeSems = useMemo(
    () => (selectedSemester === 'All' ? SEMESTERS : [selectedSemester]),
    [selectedSemester]
  );

  useEffect(() => {
    const loadSubjects = async () => {
      const dataMap = {};
      for (const sem of activeSems) {
        try {
          const res = await authFetch(`/api/analytics/faculty?branch=${branch}&semester=${sem}`);
          if (res.ok) {
            const data = await res.json();
            dataMap[sem] = data.subject_averages || {};
          }
        } catch (err) {
          console.error(err);
        }
      }
      setSemesterSubjectData(dataMap);
    };
    if (!loading) loadSubjects();
  }, [branch, selectedSemester, loading]);

  useEffect(() => {
    const filterStudents = async () => {
      const sems = activeSems;
      const useFullPool = Boolean(riskFilter);
      let allStudents = [];

      for (const sem of sems) {
        try {
          const res = await authFetch('/api/analytics/filter', {
            method: 'POST',
            body: JSON.stringify({
              branch,
              semester: sem,
              attendance_threshold: useFullPool ? 100 : attThreshold,
              marks_threshold: 100,
              search_query: searchQuery || undefined,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            allStudents = [
              ...allStudents,
              ...(data.students || []).map((s) => ({ ...s, semester: sem })),
            ];
          }
        } catch (err) {
          console.error(err);
        }
      }

      if (riskFilter) {
        allStudents = allStudents.filter((s) => getRiskCategory(s) === riskFilter);
      }

      setFilteredStudents(allStudents);
    };
    if (!loading) filterStudents();
  }, [selectedSemester, attThreshold, searchQuery, branch, loading, riskFilter]);

  const subjectChartData = useMemo(() => {
    const rows = [];
    for (const sem of activeSems) {
      const averages = semesterSubjectData[sem] || {};
      for (const [subj, avg] of Object.entries(averages)) {
        const metaKey = `${sem}::${subj}`;
        const meta = subjectTooltipMeta[metaKey] || {};
        const label = activeSems.length > 1 ? `${subj} (${sem.replace('_', ' ')})` : subj;
        rows.push({
          name: subj,
          label,
          semester: sem,
          average: avg,
          student_count: meta.student_count,
          highest: meta.highest,
          lowest: meta.lowest,
        });
      }
    }
    return rows.sort((a, b) => b.average - a.average);
  }, [semesterSubjectData, subjectTooltipMeta, activeSems]);

  const prefetchSubjectMeta = useCallback(async (sem, subj) => {
    const key = `${sem}::${subj}`;
    if (subjectTooltipMeta[key]) return;
    try {
      const res = await authFetch(
        `/api/analytics/subject?branch=${branch}&semester=${sem}&subject=${encodeURIComponent(subj)}`
      );
      if (res.ok) {
        const data = await res.json();
        setSubjectTooltipMeta((prev) => ({ ...prev, [key]: data }));
      }
    } catch (err) {
      console.error(err);
    }
  }, [authFetch, branch, subjectTooltipMeta]);

  const handleSubjectClick = useCallback(async (entry) => {
    if (!entry?.semester || !entry?.name) return;
    const key = `${entry.semester}::${entry.name}`;
    if (selectedSubject === key) {
      setSelectedSubject(null);
      setSubjectDetail(null);
      return;
    }
    setSelectedSubject(key);
    setSubjectDetailLoading(true);
    try {
      const res = await authFetch(
        `/api/analytics/subject?branch=${branch}&semester=${entry.semester}&subject=${encodeURIComponent(entry.name)}`
      );
      if (res.ok) setSubjectDetail(await res.json());
    } catch (err) {
      console.error(err);
    }
    setSubjectDetailLoading(false);
  }, [authFetch, branch, selectedSubject]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 animate-fade-in">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading department analytics...</p>
        </div>
      </div>
    );
  }

  if (!deptData) return null;

  const semAttendanceData = SEMESTERS.map((sem) => ({
    name: sem.replace('_', ' '),
    attendance: deptData.sem_attendance[sem] || 0,
    academic: deptData.sem_academic[sem] || 0,
  }));

  const riskTotal = riskData?.total || 0;
  const riskChartData = riskData
    ? [
        { name: 'High Risk', value: riskData.high_risk.count, color: '#ef4444', total: riskTotal },
        { name: 'Medium Risk', value: riskData.medium_risk.count, color: '#f59e0b', total: riskTotal },
        { name: 'Satisfactory', value: riskData.satisfactory.count, color: '#10b981', total: riskTotal },
      ]
    : [];

  const displayStudents = filteredStudents;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-white mb-1">HOD Analytics Dashboard</h2>
        <p className="text-slate-400 text-sm">
          Department: <span className="text-brand-400 font-semibold">{branch}</span> • Interactive Cross-Semester Overview
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card group">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-400" />
            <p className="text-sm text-slate-400">Dept. Strength</p>
          </div>
          <p className="text-3xl font-bold text-white">{deptData.total_students}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-emerald-400" />
            <p className="text-sm text-slate-400">Avg Attendance</p>
          </div>
          <p className={`text-3xl font-bold ${deptData.average_attendance >= 75 ? 'text-emerald-400' : 'text-red-400'}`}>
            {deptData.average_attendance}%
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <p className="text-sm text-slate-400">At-Risk Students</p>
          </div>
          <p className="text-3xl font-bold text-red-400">{deptData.total_at_risk}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-brand-400" />
            <p className="text-sm text-slate-400">Health Score</p>
          </div>
          <p className={`text-3xl font-bold ${deptData.health_score >= 70 ? 'text-emerald-400' : deptData.health_score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
            {deptData.health_score}
          </p>
        </div>
      </div>

      <div className="glass-card p-4 flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-2 text-brand-400">
          <SlidersHorizontal className="w-4 h-4" />
          <span className="text-sm font-semibold">Filters</span>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Semester</label>
          <select
            className="input-field w-40 py-2 text-sm"
            value={selectedSemester}
            onChange={(e) => {
              setSelectedSemester(e.target.value);
              setSelectedSubject(null);
              setSubjectDetail(null);
            }}
          >
            <option value="All">All Semesters</option>
            {SEMESTERS.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-slate-500 mb-1">Attendance ≤ {attThreshold}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={attThreshold}
            onChange={(e) => setAttThreshold(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-surface-700 rounded-lg appearance-none cursor-pointer accent-brand-500 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              className="input-field pl-9 py-2 text-sm w-52"
              placeholder="Name or Roll No..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        {riskFilter && (
          <button
            className="btn-ghost text-xs py-2 flex items-center gap-1"
            onClick={() => setRiskFilter(null)}
          >
            <X className="w-3 h-3" /> Clear risk: {riskFilter}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 lg:col-span-2">
          <h4 className="text-md font-semibold text-white mb-1 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand-400" /> Subject Performance
          </h4>
          <p className="text-xs text-slate-500 mb-4">Click any bar to view top &amp; lowest scorers for that subject</p>
          {subjectChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={subjectChartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, 100]} />
                <Tooltip content={<SubjectTooltip />} />
                <Bar
                  dataKey="average"
                  name="Avg Score"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                  cursor="pointer"
                  onClick={(data) => handleSubjectClick(data?.payload || data)}
                  onMouseEnter={(data) => {
                    const entry = data?.payload || data;
                    if (entry?.semester && entry?.name) prefetchSubjectMeta(entry.semester, entry.name);
                  }}
                >
                  {subjectChartData.map((entry) => {
                    const key = `${entry.semester}::${entry.name}`;
                    return (
                      <Cell
                        key={key}
                        fill={selectedSubject === key ? '#a78bfa' : '#6366f1'}
                        opacity={selectedSubject && selectedSubject !== key ? 0.35 : 1}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-16 text-center text-slate-500">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No subject data for selected semester(s)</p>
            </div>
          )}
        </div>

        <div className="glass-card p-6">
          <h4 className="text-md font-semibold text-white mb-4">Student Risk Matrix</h4>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={riskChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                onClick={(entry) => setRiskFilter(riskFilter === entry.name ? null : entry.name)}
                cursor="pointer"
              >
                {riskChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    opacity={riskFilter && riskFilter !== entry.name ? 0.3 : 1}
                    stroke="transparent"
                    className="transition-opacity duration-300"
                  />
                ))}
              </Pie>
              <Tooltip content={<RiskTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-3 mt-2 flex-wrap">
            {riskChartData.map((d) => (
              <button
                key={d.name}
                className={`flex items-center gap-1.5 text-xs transition-all duration-300 px-2 py-1 rounded-lg ${
                  riskFilter === d.name ? 'bg-white/10 ring-1 ring-white/20' : riskFilter && riskFilter !== d.name ? 'opacity-40' : ''
                }`}
                onClick={() => setRiskFilter(riskFilter === d.name ? null : d.name)}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-slate-400">{d.name}: <strong className="text-white">{d.value}</strong></span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedSubject && (
        <div className="glass-card p-6 animate-slide-up border-l-4 border-brand-500">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Subject Drill-Down: {subjectDetail?.subject || selectedSubject.split('::')[1]}
              <span className="badge-risk-low text-[10px]">{subjectDetail?.semester?.replace('_', ' ') || ''}</span>
            </h4>
            <button
              onClick={() => { setSelectedSubject(null); setSubjectDetail(null); }}
              className="p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {subjectDetailLoading ? (
            <div className="py-8 text-center">
              <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto" />
            </div>
          ) : subjectDetail ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-xs text-slate-500">Students</p>
                  <p className="text-xl font-bold text-white">{subjectDetail.student_count}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-xs text-slate-500">Class Average</p>
                  <p className="text-xl font-bold text-brand-400">{subjectDetail.average}%</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-xs text-slate-500">Highest Score</p>
                  <p className="text-xl font-bold text-emerald-400">{subjectDetail.highest}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-xs text-slate-500">Lowest Score</p>
                  <p className="text-xl font-bold text-red-400">{subjectDetail.lowest}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" /> Top Scorers
                  </h5>
                  <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white/[0.03]">
                          <th className="p-2 text-left text-slate-400 font-medium">Roll No</th>
                          <th className="p-2 text-left text-slate-400 font-medium">Name</th>
                          <th className="p-2 text-left text-slate-400 font-medium">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(subjectDetail.top_scorers || []).map((s) => (
                          <tr key={s.roll_no} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                            <td className="p-2 font-mono text-xs text-slate-300">{s.roll_no}</td>
                            <td className="p-2 text-white">{s.name}</td>
                            <td className="p-2"><span className="badge-risk-low">{s.score}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" /> Lowest Scorers
                  </h5>
                  <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white/[0.03]">
                          <th className="p-2 text-left text-slate-400 font-medium">Roll No</th>
                          <th className="p-2 text-left text-slate-400 font-medium">Name</th>
                          <th className="p-2 text-left text-slate-400 font-medium">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(subjectDetail.low_scorers || []).map((s) => (
                          <tr key={s.roll_no} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                            <td className="p-2 font-mono text-xs text-slate-300">{s.roll_no}</td>
                            <td className="p-2 text-white">{s.name}</td>
                            <td className="p-2"><span className="badge-risk-high">{s.score}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <div className="glass-card p-6">
        <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-400" /> Semester-wise Performance
        </h4>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={semAttendanceData} barGap={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip content={<SemTooltip />} />
            <Bar dataKey="attendance" fill="#6366f1" name="Attendance %" radius={[6, 6, 0, 0]} />
            <Bar dataKey="academic" fill="#8b5cf6" name="Avg Marks" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card p-6">
        <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2 flex-wrap">
          <AlertTriangle className="w-4 h-4 text-red-400" /> Student List
          <span className="badge-risk-high ml-2">{displayStudents.length} found</span>
          {riskFilter && <span className="badge-risk-medium ml-1">Filtered: {riskFilter}</span>}
        </h4>

        {displayStudents.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/[0.03]">
                  <th className="p-3 text-left text-slate-400 font-medium">Roll No</th>
                  <th className="p-3 text-left text-slate-400 font-medium">Name</th>
                  <th className="p-3 text-left text-slate-400 font-medium">Section</th>
                  <th className="p-3 text-left text-slate-400 font-medium">Semester</th>
                  <th className="p-3 text-left text-slate-400 font-medium">Attendance</th>
                  <th className="p-3 text-left text-slate-400 font-medium">Avg Marks</th>
                  <th className="p-3 text-left text-slate-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {displayStudents.slice(0, 50).map((s) => {
                  const category = getRiskCategory(s);
                  return (
                    <tr key={`${s.roll_no}-${s.semester}`} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="p-3 font-mono text-xs text-slate-300">{s.roll_no}</td>
                      <td className="p-3 text-white">{s.name}</td>
                      <td className="p-3 text-slate-400">{s.section}</td>
                      <td className="p-3 text-slate-400">{s.semester?.replace('_', ' ')}</td>
                      <td className="p-3">
                        <span className={s.attendance < 75 ? 'text-red-400 font-semibold' : 'text-emerald-400'}>{s.attendance}%</span>
                      </td>
                      <td className="p-3">
                        <span className={s.average_marks < 40 ? 'text-red-400 font-semibold' : 'text-emerald-400'}>{s.average_marks}</span>
                      </td>
                      <td className="p-3">
                        {category === 'High Risk' ? <span className="badge-risk-high">High Risk</span>
                          : category === 'Medium Risk' ? <span className="badge-risk-medium">Medium</span>
                          : <span className="badge-risk-low">OK</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No students match the current filters</p>
          </div>
        )}
      </div>

      <InteractiveDataExplorer />
    </div>
  );
}

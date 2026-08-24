import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Building2, Users, TrendingUp, AlertTriangle, Award, Activity,
  X, Eye, FileSpreadsheet, Printer, Wallet, BookOpen
} from 'lucide-react';
import InteractiveDataExplorer from './InteractiveDataExplorer';

const BRANCHES = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'];
const SEMESTERS = ['Sem_1', 'Sem_3', 'Sem_4', 'Sem_5'];

const RISK_CELL_COLORS = {
  high: 'bg-red-500/30 border-red-500/40 text-red-300 hover:bg-red-500/40',
  medium: 'bg-amber-500/20 border-amber-500/30 text-amber-300 hover:bg-amber-500/30',
  low: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 !rounded-lg text-xs border border-white/10">
        <p className="text-white font-semibold mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

const exportStudentsCSV = (students, title) => {
  const headers = ['Roll No', 'Name', 'Section', 'Attendance', 'Avg Marks'];
  const rows = students.map((s) => [
    s.roll_no,
    `"${(s.name || '').replace(/"/g, '""')}"`,
    s.section || 'N/A',
    s.attendance ?? '',
    s.average_marks ?? '',
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/[^a-z0-9]/gi, '_')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const exportStudentsPDF = (students, title) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  const rows = students.map(
    (s) => `<tr>
      <td>${s.roll_no}</td>
      <td>${s.name}</td>
      <td>${s.section || 'N/A'}</td>
      <td>${s.attendance}%</td>
      <td>${s.average_marks}</td>
    </tr>`
  ).join('');
  printWindow.document.write(`<!DOCTYPE html>
    <html><head><title>${title}</title>
    <style>
      body { font-family: Inter, sans-serif; padding: 24px; color: #111; }
      h1 { font-size: 18px; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
      th { background: #f1f5f9; }
    </style></head><body>
    <h1>${title}</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
    <table>
      <thead><tr><th>Roll No</th><th>Name</th><th>Section</th><th>Attendance</th><th>Avg Marks</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    </body></html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

export default function PrincipalDashboard() {
  const { authFetch } = useAuth();
  const [collegeData, setCollegeData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState('attendance'); // 'attendance' | 'academic' | 'fee'

  // Drill-down state
  const [drillBranch, setDrillBranch] = useState(null);
  const [drillData, setDrillData] = useState(null);
  const [drillLoading, setDrillLoading] = useState(false);

  // Heatmap modal
  const [heatmapData, setHeatmapData] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStudents, setModalStudents] = useState([]);
  const [modalTitle, setModalTitle] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [collegeRes, riskRes] = await Promise.all([
          authFetch('/api/analytics/principal'),
          authFetch('/api/analytics/risk-distribution'),
        ]);
        if (collegeRes.ok) setCollegeData(await collegeRes.json());
        if (riskRes.ok) setRiskData(await riskRes.json());

        // Build heatmap from at-risk counts per branch/semester
        const hmap = {};
        for (const branch of BRANCHES) {
          hmap[branch] = {};
          for (const sem of SEMESTERS) {
            const classRes = await authFetch(`/api/analytics/faculty?branch=${branch}&semester=${sem}`);
            if (classRes.ok) {
              const classData = await classRes.json();
              hmap[branch][sem] = classData.at_risk_students.length;
            } else {
              hmap[branch][sem] = 0;
            }
          }
        }
        setHeatmapData(hmap);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    load();
  }, []);

  // Handle drill-down from clicking a branch bar
  const handleBranchDrill = async (branchName) => {
    if (drillBranch === branchName) {
      setDrillBranch(null);
      setDrillData(null);
      return;
    }
    setDrillBranch(branchName);
    setDrillLoading(true);
    try {
      const res = await authFetch(`/api/analytics/hod?branch=${branchName}`);
      if (res.ok) setDrillData(await res.json());
    } catch (err) { console.error(err); }
    setDrillLoading(false);
  };

  // Handle heatmap cell click → open modal
  const handleHeatmapClick = async (branch, sem) => {
    setModalTitle(`${branch} / ${sem.replace('_', ' ')} — At-Risk Students`);
    setModalOpen(true);
    try {
      const res = await authFetch(`/api/analytics/faculty?branch=${branch}&semester=${sem}`);
      if (res.ok) {
        const data = await res.json();
        setModalStudents(data.at_risk_students || []);
      }
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 animate-fade-in">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading college-wide analytics...</p>
        </div>
      </div>
    );
  }

  if (!collegeData) return null;

  const branchChartData = (collegeData.branch_performance || []).map((bp) => ({
    name: bp.branch,
    attendance: bp.attendance,
    academic: bp.academic,
    fee: bp.fee_pending ?? 0,
    fee_rate: bp.fee_pending_rate ?? 0,
    health: bp.health_score,
    strength: bp.strength,
  }));

  const metricConfig = {
    attendance: {
      chartKey: 'attendance',
      chartLabel: 'Attendance %',
      chartColor: '#6366f1',
      statCards: [
        { icon: Users, label: 'Total Students', value: collegeData.total_students, color: 'text-white' },
        { icon: Award, label: 'Top Department', value: collegeData.top_performing_branch, color: 'gradient-text', isText: true },
        { icon: Activity, label: 'College Attendance', value: `${collegeData.average_attendance}%`, color: collegeData.average_attendance >= 75 ? 'text-emerald-400' : 'text-red-400' },
        { icon: AlertTriangle, label: 'Total At-Risk', value: collegeData.total_at_risk, color: 'text-red-400' },
      ],
    },
    academic: {
      chartKey: 'academic',
      chartLabel: 'Avg Marks',
      chartColor: '#8b5cf6',
      statCards: [
        { icon: Users, label: 'Total Students', value: collegeData.total_students, color: 'text-white' },
        { icon: TrendingUp, label: 'Top by Marks', value: [...(collegeData.branch_performance || [])].sort((a, b) => b.academic - a.academic)[0]?.branch || 'N/A', color: 'gradient-text', isText: true },
        { icon: BookOpen, label: 'College Avg Marks', value: collegeData.average_marks ?? '—', color: 'text-brand-400' },
        { icon: AlertTriangle, label: 'Total At-Risk', value: collegeData.total_at_risk, color: 'text-red-400' },
      ],
    },
    fee: {
      chartKey: 'fee',
      chartLabel: 'Fee Pending',
      chartColor: '#f59e0b',
      statCards: [
        { icon: Users, label: 'Total Students', value: collegeData.total_students, color: 'text-white' },
        { icon: Wallet, label: 'Highest Pending', value: [...(collegeData.branch_performance || [])].sort((a, b) => (b.fee_pending ?? 0) - (a.fee_pending ?? 0))[0]?.branch || 'N/A', color: 'text-amber-400', isText: true },
        { icon: Wallet, label: 'Total Fee Pending', value: collegeData.total_fee_pending ?? 0, color: 'text-amber-400' },
        { icon: Activity, label: 'Pending Rate', value: `${collegeData.total_students ? Math.round(((collegeData.total_fee_pending ?? 0) / collegeData.total_students) * 100) : 0}%`, color: 'text-amber-300' },
      ],
    },
  };

  const currentMetric = metricConfig[activeMetric] || metricConfig.attendance;

  const riskChartData = riskData ? [
    { name: 'High Risk', value: riskData.high_risk.count, color: '#ef4444' },
    { name: 'Medium Risk', value: riskData.medium_risk.count, color: '#f59e0b' },
    { name: 'Satisfactory', value: riskData.satisfactory.count, color: '#10b981' },
  ] : [];

  const getCellColorClass = (count) => {
    if (count > 15) return RISK_CELL_COLORS.high;
    if (count >= 5) return RISK_CELL_COLORS.medium;
    return RISK_CELL_COLORS.low;
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-white mb-1">Principal Dashboard</h2>
        <p className="text-slate-400 text-sm">Institutional Overview • All Departments</p>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {currentMetric.statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="stat-card animate-slide-up">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-blue-400" />
                <p className="text-sm text-slate-400">{card.label}</p>
              </div>
              <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Metric Toggle */}
      <div className="flex gap-2 p-1.5 glass-card inline-flex rounded-xl">
        {[
          { key: 'attendance', label: 'Attendance' },
          { key: 'academic', label: 'Academic Marks' },
          { key: 'fee', label: 'Fee Pending' },
        ].map((m) => (
          <button key={m.key}
            className={activeMetric === m.key ? 'tab-btn-active' : 'tab-btn'}
            onClick={() => setActiveMetric(m.key)}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branch Comparison Bar Chart */}
        <div className="glass-card p-6 lg:col-span-2">
          <h4 className="text-md font-semibold text-white mb-1 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-400" /> Branch Comparison
          </h4>
          <p className="text-xs text-slate-500 mb-4">Click any bar to drill-down into that department</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={branchChartData} barGap={8} onClick={(data) => {
              if (data && data.activeLabel) handleBranchDrill(data.activeLabel);
            }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              {activeMetric === 'attendance' && (
                <>
                  <Bar dataKey="attendance" fill="#6366f1" name="Attendance %" radius={[6, 6, 0, 0]} cursor="pointer" />
                  <Bar dataKey="academic" fill="#8b5cf6" name="Avg Marks" radius={[6, 6, 0, 0]} cursor="pointer" opacity={0.5} />
                </>
              )}
              {activeMetric === 'academic' && (
                <>
                  <Bar dataKey="academic" fill="#8b5cf6" name="Avg Marks" radius={[6, 6, 0, 0]} cursor="pointer" />
                  <Bar dataKey="attendance" fill="#6366f1" name="Attendance %" radius={[6, 6, 0, 0]} cursor="pointer" opacity={0.5} />
                </>
              )}
              {activeMetric === 'fee' && (
                <Bar dataKey="fee" fill="#f59e0b" name="Fee Pending" radius={[6, 6, 0, 0]} cursor="pointer" />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Donut */}
        <div className="glass-card p-6">
          <h4 className="text-md font-semibold text-white mb-4">College Risk Distribution</h4>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={riskChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                {riskChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 mt-2">
            {riskChartData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs px-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-400">{d.name}</span>
                </div>
                <span className="text-white font-semibold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drill-Down Panel */}
      {drillBranch && (
        <div className="glass-card p-6 animate-slide-up border-l-4 border-brand-500">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-brand-400" /> Drill-Down: {drillBranch} Department
            </h4>
            <button onClick={() => { setDrillBranch(null); setDrillData(null); }} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          {drillLoading ? (
            <div className="py-8 text-center"><div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto" /></div>
          ) : drillData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-xs text-slate-500">Strength</p>
                  <p className="text-xl font-bold text-white">{drillData.total_students}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-xs text-slate-500">Avg Attendance</p>
                  <p className="text-xl font-bold text-emerald-400">{drillData.average_attendance}%</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-xs text-slate-500">Avg Marks</p>
                  <p className="text-xl font-bold text-brand-400">{drillData.average_marks}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-xs text-slate-500">Health Score</p>
                  <p className="text-xl font-bold text-amber-400">{drillData.health_score}</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={SEMESTERS.map((s) => ({
                  name: s.replace('_', ' '),
                  attendance: drillData.sem_attendance?.[s] || 0,
                  academic: drillData.sem_academic?.[s] || 0,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey={activeMetric === 'fee' ? 'attendance' : activeMetric} fill={currentMetric.chartColor} name={currentMetric.chartLabel} radius={[4, 4, 0, 0]} />
                  {activeMetric !== 'fee' && (
                    <Bar dataKey={activeMetric === 'attendance' ? 'academic' : 'attendance'} fill={activeMetric === 'attendance' ? '#8b5cf6' : '#6366f1'} name={activeMetric === 'attendance' ? 'Avg Marks' : 'Attendance %'} radius={[4, 4, 0, 0]} opacity={0.45} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </div>
      )}

      {/* Risk Heatmap */}
      <div className="glass-card p-6">
        <h4 className="text-md font-semibold text-white mb-1 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" /> Risk Heatmap
        </h4>
        <p className="text-xs text-slate-500 mb-4">Click any cell to view flagged students • Color: 🔴 &gt;15 • 🟡 5–15 • 🟢 &lt;5</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="p-3 text-left text-slate-400 font-medium">Branch</th>
                {SEMESTERS.map((sem) => (
                  <th key={sem} className="p-3 text-center text-slate-400 font-medium">{sem.replace('_', ' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BRANCHES.map((branch) => (
                <tr key={branch} className="border-t border-white/[0.04]">
                  <td className="p-3 text-white font-semibold">{branch}</td>
                  {SEMESTERS.map((sem) => {
                    const count = heatmapData[branch]?.[sem] || 0;
                    return (
                      <td key={sem} className="p-2 text-center">
                        <button
                          className={`w-full py-3 rounded-xl border font-bold text-lg transition-all duration-300 cursor-pointer ${getCellColorClass(count)}`}
                          onClick={() => handleHeatmapClick(branch, sem)}
                        >
                          {count}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setModalOpen(false)}>
          <div className="glass-card p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-slide-up border border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">{modalTitle}</h4>
              <div className="flex items-center gap-2">
                {modalStudents.length > 0 && (
                  <>
                    <button
                      onClick={() => exportStudentsCSV(modalStudents, modalTitle)}
                      className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                    </button>
                    <button
                      onClick={() => exportStudentsPDF(modalStudents, modalTitle)}
                      className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" /> PDF
                    </button>
                  </>
                )}
                <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {modalStudents.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/[0.03]">
                      <th className="p-3 text-left text-slate-400 font-medium">Roll No</th>
                      <th className="p-3 text-left text-slate-400 font-medium">Name</th>
                      <th className="p-3 text-left text-slate-400 font-medium">Attendance</th>
                      <th className="p-3 text-left text-slate-400 font-medium">Avg Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalStudents.map((s) => (
                      <tr key={s.roll_no} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 font-mono text-xs text-slate-300">{s.roll_no}</td>
                        <td className="p-3 text-white">{s.name}</td>
                        <td className="p-3"><span className="badge-risk-high">{s.attendance}%</span></td>
                        <td className="p-3"><span className="badge-risk-high">{s.average_marks}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p>No at-risk students found in this class</p>
              </div>
            )}
          </div>
        </div>
      )}
      <InteractiveDataExplorer />
    </div>
  );
}

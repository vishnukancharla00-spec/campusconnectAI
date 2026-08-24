import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  UserPlus, ClipboardCheck, PenLine, BarChart3, ChevronRight,
  CheckCircle2, AlertTriangle, Search, Users, Calendar, BookOpen
} from 'lucide-react';
import InteractiveDataExplorer from './InteractiveDataExplorer';

const SEMESTERS = ['Sem_1', 'Sem_3', 'Sem_4', 'Sem_5'];
const SECTIONS = ['A', 'B'];
const MONTHS = ['July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April'];

function getSubjectCols(sem) {
  if (sem === 'Sem_1') return ['Sub_1', 'Sub_2', 'Sub_3', 'Sub_4', 'Sub_5', 'Sub_6', 'Sub_7'];
  if (sem === 'Sem_3') return ['301', '302', '303', '304', '305'];
  if (sem === 'Sem_4') return ['401', '402', '403', '404', '405'];
  if (sem === 'Sem_5') return ['501', '502', '503', '504', '505'];
  return [];
}

export default function FacultyDashboard() {
  const { user, authFetch } = useAuth();
  const branch = user?.branch || 'CSE';
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { label: 'Add Student', icon: UserPlus },
    { label: 'Attendance', icon: ClipboardCheck },
    { label: 'Marks Entry', icon: PenLine },
    { label: 'Quick Summary', icon: BarChart3 },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Faculty Dashboard</h2>
        <p className="text-slate-400 text-sm">Department: <span className="text-brand-400 font-semibold">{branch}</span></p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-2 mb-6 p-1.5 glass-card inline-flex rounded-xl">
        {tabs.map((tab, idx) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.label}
              className={idx === activeTab ? 'tab-btn-active flex items-center gap-2' : 'tab-btn flex items-center gap-2'}
              onClick={() => setActiveTab(idx)}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 0 && <AddStudentTab branch={branch} authFetch={authFetch} />}
      {activeTab === 1 && <AttendanceTab branch={branch} authFetch={authFetch} />}
      {activeTab === 2 && <MarksEntryTab branch={branch} authFetch={authFetch} />}
      {activeTab === 3 && <QuickSummaryTab branch={branch} authFetch={authFetch} />}

      <div className="mt-8">
        <InteractiveDataExplorer defaultExpanded={false} />
      </div>
    </div>
  );
}

/* ─── Tab 1: Add Student ─── */
function AddStudentTab({ branch, authFetch }) {
  const [form, setForm] = useState({ roll_no: '', name: '', semester: 'Sem_1', section: 'A', email: '', phone: '' });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await authFetch('/api/faculty/add-student', {
        method: 'POST',
        body: JSON.stringify({
          roll_no: form.roll_no,
          name: form.name,
          branch,
          semester: form.semester,
          section: form.section,
          email: form.email,
          phone: form.phone,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'success', text: data.message });
        setForm({ roll_no: '', name: '', semester: 'Sem_1', section: 'A', email: '', phone: '' });
      } else {
        setMsg({ type: 'error', text: data.detail || 'Failed to add student' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 max-w-2xl animate-slide-up">
      <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
        <UserPlus className="w-5 h-5 text-brand-400" /> Register New Student
      </h3>

      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-sm flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Roll No</label>
          <input className="input-field" value={form.roll_no} onChange={(e) => setForm({ ...form, roll_no: e.target.value })} placeholder="e.g. CSE101" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Student Name</label>
          <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full Name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Branch</label>
          <input className="input-field opacity-60 cursor-not-allowed" value={branch} disabled />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Semester</label>
          <select className="input-field" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
            {SEMESTERS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Section</label>
          <select className="input-field" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>
            {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
          <input className="input-field" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="student@campus.edu" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-400 mb-1">Phone</label>
          <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 XXXXXXXXXX" />
        </div>
      </div>

      <button className="btn-primary mt-6 flex items-center gap-2" onClick={handleSubmit} disabled={loading}>
        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
        Add Student
      </button>
    </div>
  );
}

/* ─── Tab 2: Attendance Entry ─── */
function AttendanceTab({ branch, authFetch }) {
  const [semester, setSemester] = useState('Sem_1');
  const [month, setMonth] = useState('July');
  const [workingDays, setWorkingDays] = useState(22);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const res = await authFetch(`/api/analytics/faculty?branch=${branch}&semester=${semester}`);
        if (res.ok) {
          const data = await res.json();
          // We need to get student list from the analytics data or use a filter query
          const filterRes = await authFetch('/api/analytics/filter', {
            method: 'POST',
            body: JSON.stringify({ branch, semester, attendance_threshold: 100, marks_threshold: 100 }),
          });
          if (filterRes.ok) {
            const filterData = await filterRes.json();
            setStudents(filterData.students || []);
            const initAtt = {};
            (filterData.students || []).forEach((s) => { initAtt[s.roll_no] = ''; });
            setAttendance(initAtt);
          }
        }
      } catch (err) { console.error(err); }
    };
    loadStudents();
  }, [semester, branch]);

  const handleSubmit = async () => {
    setLoading(true);
    setMsg(null);
    const records = Object.entries(attendance)
      .filter(([_, v]) => v !== '')
      .map(([roll_no, days]) => ({ roll_no, days_attended: parseInt(days) || 0 }));

    try {
      const res = await authFetch('/api/faculty/mark-attendance', {
        method: 'POST',
        body: JSON.stringify({ branch, semester, month, working_days: parseInt(workingDays), records }),
      });
      const data = await res.json();
      if (res.ok) setMsg({ type: 'success', text: data.message });
      else setMsg({ type: 'error', text: data.detail || 'Failed' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 animate-slide-up">
      <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
        <ClipboardCheck className="w-5 h-5 text-brand-400" /> Monthly Attendance Entry
      </h3>

      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-sm flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      <div className="flex gap-4 mb-6 flex-wrap">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Semester</label>
          <select className="input-field w-40" value={semester} onChange={(e) => setSemester(e.target.value)}>
            {SEMESTERS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Month</label>
          <select className="input-field w-40" value={month} onChange={(e) => setMonth(e.target.value)}>
            {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Working Days</label>
          <input className="input-field w-32" type="number" value={workingDays} onChange={(e) => setWorkingDays(e.target.value)} />
        </div>
      </div>

      {students.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.03]">
                <th className="text-left p-3 text-slate-400 font-medium">Roll No</th>
                <th className="text-left p-3 text-slate-400 font-medium">Name</th>
                <th className="text-left p-3 text-slate-400 font-medium">Days Attended</th>
                <th className="text-left p-3 text-slate-400 font-medium">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const days = parseInt(attendance[s.roll_no]) || 0;
                const pct = workingDays > 0 ? ((days / workingDays) * 100).toFixed(1) : 0;
                return (
                  <tr key={s.roll_no} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 text-slate-300 font-mono text-xs">{s.roll_no}</td>
                    <td className="p-3 text-white">{s.name}</td>
                    <td className="p-3">
                      <input
                        className="input-field w-24 py-2 text-center"
                        type="number"
                        min="0"
                        max={workingDays}
                        value={attendance[s.roll_no] || ''}
                        onChange={(e) => setAttendance({ ...attendance, [s.roll_no]: e.target.value })}
                      />
                    </td>
                    <td className="p-3">
                      <span className={`font-semibold ${pct < 75 ? 'text-red-400' : pct < 85 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {attendance[s.roll_no] !== '' ? `${pct}%` : '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {students.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No students found for {branch} / {semester.replace('_', ' ')}</p>
        </div>
      )}

      <button className="btn-primary mt-6 flex items-center gap-2" onClick={handleSubmit} disabled={loading || students.length === 0}>
        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
        Submit Attendance
      </button>
    </div>
  );
}

/* ─── Tab 3: Marks Entry ─── */
function MarksEntryTab({ branch, authFetch }) {
  const [semester, setSemester] = useState('Sem_1');
  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const subjectCols = getSubjectCols(semester);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const res = await authFetch('/api/analytics/filter', {
          method: 'POST',
          body: JSON.stringify({ branch, semester, attendance_threshold: 100, marks_threshold: 100 }),
        });
        if (res.ok) {
          const data = await res.json();
          setStudents(data.students || []);
          const initMarks = {};
          (data.students || []).forEach((s) => {
            initMarks[s.roll_no] = {};
            subjectCols.forEach((col) => { initMarks[s.roll_no][col] = ''; });
          });
          setMarksData(initMarks);
        }
      } catch (err) { console.error(err); }
    };
    loadStudents();
  }, [semester, branch]);

  const handleSubmit = async () => {
    setLoading(true);
    setMsg(null);
    const records = students
      .filter((s) => marksData[s.roll_no] && Object.values(marksData[s.roll_no]).some((v) => v !== ''))
      .map((s) => {
        const marks = {};
        subjectCols.forEach((col) => {
          marks[col] = parseFloat(marksData[s.roll_no]?.[col]) || 0;
        });
        return { roll_no: s.roll_no, student_name: s.name, marks };
      });

    try {
      const res = await authFetch('/api/faculty/upload-marks', {
        method: 'POST',
        body: JSON.stringify({ branch, semester, records }),
      });
      const data = await res.json();
      if (res.ok) setMsg({ type: 'success', text: data.message });
      else setMsg({ type: 'error', text: data.detail || 'Failed' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const getRowAvg = (rollNo) => {
    const vals = subjectCols.map((c) => parseFloat(marksData[rollNo]?.[c]) || 0);
    const filled = vals.filter((v) => v > 0);
    if (filled.length === 0) return '—';
    return (filled.reduce((a, b) => a + b, 0) / filled.length).toFixed(1);
  };

  return (
    <div className="glass-card p-6 animate-slide-up">
      <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
        <PenLine className="w-5 h-5 text-brand-400" /> Mid-Term Marks Entry
      </h3>

      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-sm flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-400 mb-1">Semester</label>
        <select className="input-field w-40" value={semester} onChange={(e) => setSemester(e.target.value)}>
          {SEMESTERS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {students.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.03]">
                <th className="p-3 text-left text-slate-400 font-medium sticky left-0 bg-surface-800">Roll No</th>
                <th className="p-3 text-left text-slate-400 font-medium">Name</th>
                {subjectCols.map((col) => (
                  <th key={col} className="p-3 text-center text-slate-400 font-medium min-w-[80px]">{col}</th>
                ))}
                <th className="p-3 text-center text-brand-400 font-semibold">Avg</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.roll_no} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="p-3 text-slate-300 font-mono text-xs sticky left-0 bg-surface-800/90">{s.roll_no}</td>
                  <td className="p-3 text-white whitespace-nowrap">{s.name}</td>
                  {subjectCols.map((col) => (
                    <td key={col} className="p-2">
                      <input
                        className="input-field w-20 py-2 text-center text-xs"
                        type="number"
                        min="0"
                        max="100"
                        value={marksData[s.roll_no]?.[col] || ''}
                        onChange={(e) => {
                          setMarksData({
                            ...marksData,
                            [s.roll_no]: { ...marksData[s.roll_no], [col]: e.target.value },
                          });
                        }}
                      />
                    </td>
                  ))}
                  <td className="p-3 text-center font-bold text-brand-300">{getRowAvg(s.roll_no)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button className="btn-primary mt-6 flex items-center gap-2" onClick={handleSubmit} disabled={loading || students.length === 0}>
        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <PenLine className="w-4 h-4" />}
        Upload Marks
      </button>
    </div>
  );
}

/* ─── Tab 4: Quick Summary ─── */
function QuickSummaryTab({ branch, authFetch }) {
  const [semester, setSemester] = useState('Sem_1');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await authFetch(`/api/analytics/faculty?branch=${branch}&semester=${semester}`);
        if (res.ok) setAnalytics(await res.json());
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    load();
  }, [semester, branch]);

  if (loading) {
    return (
      <div className="glass-card p-12 text-center animate-fade-in">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="animate-slide-up space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Semester</label>
          <select className="input-field w-40" value={semester} onChange={(e) => setSemester(e.target.value)}>
            {SEMESTERS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-sm text-slate-400">Total Students</p>
          <p className="text-3xl font-bold text-white">{analytics.total_students}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-slate-400">Avg Attendance</p>
          <p className={`text-3xl font-bold ${analytics.avg_attendance >= 75 ? 'text-emerald-400' : 'text-red-400'}`}>
            {analytics.avg_attendance}%
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-slate-400">Low Attendance</p>
          <p className="text-3xl font-bold text-amber-400">{analytics.low_attendance_students.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-slate-400">At-Risk Students</p>
          <p className="text-3xl font-bold text-red-400">{analytics.at_risk_students.length}</p>
        </div>
      </div>

      {/* Subject Averages */}
      {Object.keys(analytics.subject_averages).length > 0 && (
        <div className="glass-card p-6">
          <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand-400" /> Subject-wise Averages
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(analytics.subject_averages).map(([subj, avg]) => (
              <div key={subj} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-slate-500 mb-1">{subj}</p>
                <p className={`text-xl font-bold ${avg >= 50 ? 'text-emerald-400' : avg >= 35 ? 'text-amber-400' : 'text-red-400'}`}>
                  {avg}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Students */}
      {analytics.top_students.length > 0 && (
        <div className="glass-card p-6">
          <h4 className="text-md font-semibold text-white mb-4">🏆 Top 5 Performers</h4>
          <div className="space-y-2">
            {analytics.top_students.map((s, i) => (
              <div key={s.roll_no} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold 
                    ${i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-slate-400/20 text-slate-300' : 'bg-orange-500/20 text-orange-400'}`}>
                    #{i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.roll_no}</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-emerald-400">{s.average}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low Attendance Table */}
      {analytics.low_attendance_students.length > 0 && (
        <div className="glass-card p-6">
          <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" /> Students Below 75% Attendance
          </h4>
          <div className="overflow-x-auto rounded-xl border border-red-500/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-red-500/5">
                  <th className="p-3 text-left text-slate-400 font-medium">Roll No</th>
                  <th className="p-3 text-left text-slate-400 font-medium">Name</th>
                  <th className="p-3 text-left text-slate-400 font-medium">Section</th>
                  <th className="p-3 text-left text-slate-400 font-medium">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {analytics.low_attendance_students.map((s) => (
                  <tr key={s.roll_no} className="border-t border-white/[0.04] bg-red-500/[0.03] hover:bg-red-500/[0.06] transition-colors">
                    <td className="p-3 font-mono text-xs text-slate-300">{s.roll_no}</td>
                    <td className="p-3 text-white">{s.name}</td>
                    <td className="p-3 text-slate-400">{s.section}</td>
                    <td className="p-3"><span className="badge-risk-high">{s.attendance}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

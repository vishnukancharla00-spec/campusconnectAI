import os
import pandas as pd
from typing import Optional, List
from pydantic import BaseModel
from app.file_manager import get_file_path, BRANCHES, SEMESTERS, get_marks_headers
from app.analytics_engine import load_excel_safely

class FilterRequest(BaseModel):
    branch: str
    semester: str
    month: Optional[str] = None
    attendance_threshold: float = 100.0  # Show students below or equal to this threshold
    marks_threshold: float = 100.0       # Show students below or equal to this threshold
    search_query: Optional[str] = None

def filter_students_data(req: FilterRequest):
    # Load files
    students_path = get_file_path(req.branch, req.semester, "Students.xlsx")
    attendance_path = get_file_path(req.branch, req.semester, "Attendance.xlsx")
    marks_path = get_file_path(req.branch, req.semester, "Mid_Marks.xlsx")

    df_stud = load_excel_safely(students_path, ['Roll No', 'Student Name', 'Branch', 'Semester', 'Section', 'Email', 'Phone'])
    df_att = load_excel_safely(attendance_path, ['Roll No', 'Student Name', 'Month', 'Working Days', 'Days Attended', 'Attendance Percentage'])
    df_marks = load_excel_safely(marks_path, get_marks_headers(req.semester))

    if df_stud.empty:
        return {
            "students": [],
            "total_matches": 0,
            "avg_attendance": 0.0,
            "avg_marks": 0.0
        }

    # Standardize attendance percentage and average marks
    if not df_att.empty:
        df_att['Attendance Percentage'] = pd.to_numeric(df_att['Attendance Percentage'], errors='coerce').fillna(0.0)
        # If month is specified, filter by month
        if req.month:
            df_att = df_att[df_att['Month'].str.lower() == req.month.lower()]
    else:
        df_att = pd.DataFrame(columns=['Roll No', 'Attendance Percentage'])

    if not df_marks.empty:
        # Determine subject columns to recompute average if needed
        exclude_cols = ['Roll No', 'Student Name', 'Average']
        subj_cols = [c for c in df_marks.columns if c not in exclude_cols]
        for col in subj_cols:
            df_marks[col] = pd.to_numeric(df_marks[col], errors='coerce').fillna(0.0)
        df_marks['Average'] = df_marks[subj_cols].mean(axis=1).fillna(0.0).round(2)
    else:
        df_marks = pd.DataFrame(columns=['Roll No', 'Average'])

    # Merge everything
    merged = pd.merge(df_stud, df_att[['Roll No', 'Attendance Percentage']], on='Roll No', how='left')
    merged = pd.merge(merged, df_marks[['Roll No', 'Average']], on='Roll No', how='left')

    merged['Attendance Percentage'] = merged['Attendance Percentage'].fillna(100.0)  # default if no attendance entry
    merged['Average'] = merged['Average'].fillna(100.0)  # default if no marks entry

    # Apply search query filter (case-insensitive name or roll number)
    if req.search_query:
        q = req.search_query.strip().lower()
        merged = merged[
            merged['Student Name'].astype(str).str.lower().str.contains(q) |
            merged['Roll No'].astype(str).str.lower().str.contains(q)
        ]

    # Apply threshold filters: filter students whose attendance <= threshold AND marks <= threshold
    # Note: the prompt says "attendance_threshold (slider value 0-100), marks_threshold (slider value 0-100)"
    # We will filter for students BELOW the selected threshold (which is typical for a risk slider)
    merged = merged[
        (merged['Attendance Percentage'] <= req.attendance_threshold) &
        (merged['Average'] <= req.marks_threshold)
    ]

    # Format output
    student_list = []
    for _, row in merged.iterrows():
        student_list.append({
            "roll_no": row['Roll No'],
            "name": row['Student Name'],
            "section": row.get('Section', 'N/A'),
            "attendance": round(float(row['Attendance Percentage']), 2),
            "average_marks": round(float(row['Average']), 2),
            "email": row.get('Email', 'N/A'),
            "phone": row.get('Phone', 'N/A')
        })

    avg_att = float(merged['Attendance Percentage'].mean()) if not merged.empty else 0.0
    avg_m = float(merged['Average'].mean()) if not merged.empty else 0.0

    return {
        "students": student_list,
        "total_matches": len(student_list),
        "avg_attendance": round(avg_att, 2),
        "avg_marks": round(avg_m, 2)
    }

def get_risk_distribution_data(branch_opt: Optional[str] = None):
    branches_to_scan = [branch_opt] if branch_opt else BRANCHES
    
    total_count = 0
    high_risk_count = 0
    medium_risk_count = 0
    satisfactory_count = 0

    for branch in branches_to_scan:
        for sem in SEMESTERS:
            students_path = get_file_path(branch, sem, "Students.xlsx")
            attendance_path = get_file_path(branch, sem, "Attendance.xlsx")
            marks_path = get_file_path(branch, sem, "Mid_Marks.xlsx")

            df_stud = load_excel_safely(students_path, ['Roll No'])
            if df_stud.empty:
                continue

            df_att = load_excel_safely(attendance_path, ['Roll No', 'Attendance Percentage'])
            df_marks = load_excel_safely(marks_path, get_marks_headers(sem))

            if not df_att.empty:
                df_att['Attendance Percentage'] = pd.to_numeric(df_att['Attendance Percentage'], errors='coerce').fillna(0.0)
            else:
                df_att = pd.DataFrame(columns=['Roll No', 'Attendance Percentage'])

            if not df_marks.empty:
                exclude_cols = ['Roll No', 'Student Name', 'Average']
                subj_cols = [c for c in df_marks.columns if c not in exclude_cols]
                for col in subj_cols:
                    df_marks[col] = pd.to_numeric(df_marks[col], errors='coerce').fillna(0.0)
                df_marks['Average'] = df_marks[subj_cols].mean(axis=1).fillna(0.0).round(2)
            else:
                df_marks = pd.DataFrame(columns=['Roll No', 'Average'])

            merged = pd.merge(df_stud, df_att[['Roll No', 'Attendance Percentage']], on='Roll No', how='left')
            merged = pd.merge(merged, df_marks[['Roll No', 'Average']], on='Roll No', how='left')

            merged['Attendance Percentage'] = merged['Attendance Percentage'].fillna(100.0)
            merged['Average'] = merged['Average'].fillna(100.0)

            total_count += len(merged)

            # Categorize
            # High Risk: Attendance < 75% AND Average Marks < 40%
            high_mask = (merged['Attendance Percentage'] < 75.0) & (merged['Average'] < 40.0)
            # Medium Risk: (Attendance < 75% OR Average Marks < 40%) AND NOT High Risk
            medium_mask = ((merged['Attendance Percentage'] < 75.0) | (merged['Average'] < 40.0)) & ~high_mask

            high_risk_count += int(high_mask.sum())
            medium_risk_count += int(medium_mask.sum())
            satisfactory_count += int((~high_mask & ~medium_mask).sum())

    if total_count == 0:
        return {
            "high_risk": {"count": 0, "percentage": 0.0},
            "medium_risk": {"count": 0, "percentage": 0.0},
            "satisfactory": {"count": 0, "percentage": 0.0},
            "total": 0
        }

    return {
        "high_risk": {
            "count": high_risk_count,
            "percentage": round((high_risk_count / total_count) * 100, 2)
        },
        "medium_risk": {
            "count": medium_risk_count,
            "percentage": round((medium_risk_count / total_count) * 100, 2)
        },
        "satisfactory": {
            "count": satisfactory_count,
            "percentage": round((satisfactory_count / total_count) * 100, 2)
        },
        "total": total_count
    }


def _is_fee_pending(roll_no: str) -> bool:
    """Deterministic mock: ~30% of students have fee pending based on roll number."""
    s = str(roll_no).strip()
    if not s or not s[-1].isdigit():
        return False
    return int(s[-1]) in (0, 1, 2)


def get_fee_pending_stats(branch_opt: Optional[str] = None) -> dict:
    branches_to_scan = [branch_opt] if branch_opt else BRANCHES
    total_pending = 0
    total_students = 0
    branch_breakdown = {}

    for branch in branches_to_scan:
        branch_pending = 0
        branch_total = 0
        for sem in SEMESTERS:
            students_path = get_file_path(branch, sem, "Students.xlsx")
            df_stud = load_excel_safely(students_path, ['Roll No'])
            if df_stud.empty:
                continue
            for roll in df_stud['Roll No'].astype(str):
                branch_total += 1
                if _is_fee_pending(roll):
                    branch_pending += 1
        branch_breakdown[branch] = {
            "pending_count": branch_pending,
            "total_students": branch_total,
            "pending_rate": round((branch_pending / branch_total) * 100, 2) if branch_total else 0.0,
        }
        total_pending += branch_pending
        total_students += branch_total

    return {
        "total_pending": total_pending,
        "total_students": total_students,
        "pending_rate": round((total_pending / total_students) * 100, 2) if total_students else 0.0,
        "branch_breakdown": branch_breakdown,
    }


def get_subject_performance(branch: str, semester: str, subject: str) -> dict:
    marks_path = get_file_path(branch, semester, "Mid_Marks.xlsx")
    students_path = get_file_path(branch, semester, "Students.xlsx")
    headers = get_marks_headers(semester)

    df_marks = load_excel_safely(marks_path, headers)
    df_stud = load_excel_safely(students_path, ['Roll No', 'Student Name', 'Section'])

    if df_marks.empty or subject not in df_marks.columns:
        return {
            "subject": subject,
            "semester": semester,
            "student_count": 0,
            "average": 0.0,
            "highest": 0.0,
            "lowest": 0.0,
            "top_scorers": [],
            "low_scorers": [],
        }

    df_marks[subject] = pd.to_numeric(df_marks[subject], errors='coerce').fillna(0.0)
    merged = pd.merge(df_marks, df_stud, on='Roll No', how='left', suffixes=('', '_stud'))

    scores = merged[subject]
    student_count = len(scores)
    average = round(float(scores.mean()), 2) if student_count else 0.0
    highest = round(float(scores.max()), 2) if student_count else 0.0
    lowest = round(float(scores.min()), 2) if student_count else 0.0

    sorted_df = merged.sort_values(by=subject, ascending=False)
    top_scorers = []
    for _, row in sorted_df.head(5).iterrows():
        top_scorers.append({
            "roll_no": row['Roll No'],
            "name": row.get('Student Name', row.get('Student Name_stud', 'Unknown')),
            "section": row.get('Section', 'N/A'),
            "score": round(float(row[subject]), 2),
        })

    low_scorers = []
    for _, row in sorted_df.tail(5).iloc[::-1].iterrows():
        low_scorers.append({
            "roll_no": row['Roll No'],
            "name": row.get('Student Name', row.get('Student Name_stud', 'Unknown')),
            "section": row.get('Section', 'N/A'),
            "score": round(float(row[subject]), 2),
        })

    return {
        "subject": subject,
        "semester": semester,
        "student_count": student_count,
        "average": average,
        "highest": highest,
        "lowest": lowest,
        "top_scorers": top_scorers,
        "low_scorers": low_scorers,
    }


def get_explorer_data(branch: Optional[str] = None, semester: Optional[str] = None) -> dict:
    """Return all students with attendance/marks for the interactive data playground."""
    branches = [branch] if branch and branch != 'All' else BRANCHES
    sems = [semester] if semester and semester != 'All' else SEMESTERS

    all_students = []
    for b in branches:
        for sem in sems:
            result = filter_students_data(FilterRequest(
                branch=b,
                semester=sem,
                attendance_threshold=100.0,
                marks_threshold=100.0,
            ))
            for s in result.get('students', []):
                is_high = s['attendance'] < 75 and s['average_marks'] < 40
                is_med = s['attendance'] < 75 or s['average_marks'] < 40
                if is_high:
                    risk = 'High Risk'
                elif is_med:
                    risk = 'Medium Risk'
                else:
                    risk = 'Satisfactory'
                all_students.append({
                    **s,
                    'branch': b,
                    'semester': sem,
                    'risk': risk,
                    'fee_pending': _is_fee_pending(s['roll_no']),
                })

    if not all_students:
        return {
            'students': [],
            'total': 0,
            'avg_attendance': 0.0,
            'avg_marks': 0.0,
            'high_risk_count': 0,
            'fee_pending_count': 0,
        }

    avg_att = sum(s['attendance'] for s in all_students) / len(all_students)
    avg_marks = sum(s['average_marks'] for s in all_students) / len(all_students)
    high_risk = sum(1 for s in all_students if s['risk'] == 'High Risk')
    fee_pending = sum(1 for s in all_students if s['fee_pending'])

    return {
        'students': all_students,
        'total': len(all_students),
        'avg_attendance': round(avg_att, 2),
        'avg_marks': round(avg_marks, 2),
        'high_risk_count': high_risk,
        'fee_pending_count': fee_pending,
    }

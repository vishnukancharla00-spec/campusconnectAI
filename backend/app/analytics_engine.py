import os
import pandas as pd
import numpy as np
from typing import Dict, List, Any
from app.file_manager import get_file_path, BRANCHES, SEMESTERS, get_marks_headers

def load_excel_safely(file_path: str, default_cols: List[str]) -> pd.DataFrame:
    if not os.path.exists(file_path):
        return pd.DataFrame(columns=default_cols)
    try:
        return pd.read_excel(file_path)
    except Exception:
        return pd.DataFrame(columns=default_cols)


def _is_fee_pending(roll_no: str) -> bool:
    """Deterministic mock: ~30% of students have fee pending based on roll number."""
    s = str(roll_no).strip()
    if not s or not s[-1].isdigit():
        return False
    return int(s[-1]) in (0, 1, 2)

def get_class_analytics(branch: str, semester: str) -> Dict[str, Any]:
    # Paths
    students_path = get_file_path(branch, semester, "Students.xlsx")
    attendance_path = get_file_path(branch, semester, "Attendance.xlsx")
    marks_path = get_file_path(branch, semester, "Mid_Marks.xlsx")

    # Load DataFrames
    df_stud = load_excel_safely(students_path, ['Roll No', 'Student Name', 'Branch', 'Semester'])
    df_att = load_excel_safely(attendance_path, ['Roll No', 'Student Name', 'Attendance Percentage'])
    df_marks = load_excel_safely(marks_path, get_marks_headers(semester))

    total_students = len(df_stud)
    if total_students == 0:
        return {
            "total_students": 0,
            "avg_attendance": 0.0,
            "low_attendance_students": [],
            "subject_averages": {},
            "top_students": [],
            "at_risk_students": []
        }

    # Process Attendance
    avg_attendance = 0.0
    low_attendance_list = []
    attendance_map = {}
    if not df_att.empty:
        # Standardize attendance percentage as numeric
        df_att['Attendance Percentage'] = pd.to_numeric(df_att['Attendance Percentage'], errors='coerce').fillna(0.0)
        avg_attendance = float(df_att['Attendance Percentage'].mean())
        
        # Merge with students to ensure we have section, etc.
        df_att_merged = pd.merge(df_stud, df_att, on='Roll No', how='left', suffixes=('', '_att'))
        low_att_df = df_att_merged[df_att_merged['Attendance Percentage'] < 75.0]
        for _, row in low_att_df.iterrows():
            low_attendance_list.append({
                "roll_no": row['Roll No'],
                "name": row.get('Student Name', row.get('Student Name_att', 'Unknown')),
                "attendance": float(row['Attendance Percentage']),
                "section": row.get('Section', 'N/A')
            })
        for _, row in df_att.iterrows():
            attendance_map[row['Roll No']] = float(row['Attendance Percentage'])

    # Process Marks
    subject_averages = {}
    top_students = []
    at_risk_students = []
    
    if not df_marks.empty:
        # Determine subject columns (exclude Roll No, Student Name, Average)
        exclude_cols = ['Roll No', 'Student Name', 'Average']
        subject_cols = [col for col in df_marks.columns if col not in exclude_cols]
        
        # Coerce columns to numeric
        for col in subject_cols:
            df_marks[col] = pd.to_numeric(df_marks[col], errors='coerce').fillna(0.0)
            subject_averages[col] = round(float(df_marks[col].mean()), 2)
            
        # Re-calculate student average just in case
        df_marks['Average'] = df_marks[subject_cols].mean(axis=1)
        df_marks['Average'] = df_marks['Average'].fillna(0.0).round(2)
        
        # Merge marks with students
        df_marks_merged = pd.merge(df_stud, df_marks, on='Roll No', how='left', suffixes=('', '_marks'))
        
        # Top 5 students
        df_top = df_marks_merged.sort_values(by='Average', ascending=False).head(5)
        for _, row in df_top.iterrows():
            top_students.append({
                "roll_no": row['Roll No'],
                "name": row.get('Student Name', row.get('Student Name_marks', 'Unknown')),
                "average": float(row['Average'])
            })
            
        # At Risk (Attendance < 75% AND Average Marks < 40%)
        # Merge marks and attendance
        df_risk = pd.merge(df_marks_merged, df_att, on='Roll No', how='left', suffixes=('', '_att'))
        df_risk['Attendance Percentage'] = pd.to_numeric(df_risk['Attendance Percentage'], errors='coerce').fillna(0.0)
        df_risk['Average'] = pd.to_numeric(df_risk['Average'], errors='coerce').fillna(0.0)
        
        at_risk_df = df_risk[(df_risk['Attendance Percentage'] < 75.0) & (df_risk['Average'] < 40.0)]
        for _, row in at_risk_df.iterrows():
            at_risk_students.append({
                "roll_no": row['Roll No'],
                "name": row.get('Student Name', 'Unknown'),
                "attendance": float(row['Attendance Percentage']),
                "average_marks": float(row['Average']),
                "section": row.get('Section', 'N/A')
            })

    return {
        "total_students": total_students,
        "avg_attendance": round(avg_attendance, 2),
        "low_attendance_students": low_attendance_list,
        "subject_averages": subject_averages,
        "top_students": top_students,
        "at_risk_students": at_risk_students
    }

def get_department_analytics(branch: str) -> Dict[str, Any]:
    sem_data = {}
    total_dept_students = 0
    sem_attendance = {}
    sem_academic = {}
    total_at_risk = 0
    
    # Track overall average values
    all_attendance_vals = []
    all_marks_vals = []
    
    for sem in SEMESTERS:
        analytics = get_class_analytics(branch, sem)
        sem_data[sem] = analytics
        total_dept_students += analytics["total_students"]
        sem_attendance[sem] = analytics["avg_attendance"]
        
        # Calculate semester average mark
        marks_path = get_file_path(branch, sem, "Mid_Marks.xlsx")
        df_marks = load_excel_safely(marks_path, get_marks_headers(sem))
        if not df_marks.empty and 'Average' in df_marks.columns:
            df_marks['Average'] = pd.to_numeric(df_marks['Average'], errors='coerce').fillna(0.0)
            avg_marks = float(df_marks['Average'].mean())
        else:
            avg_marks = 0.0
        
        sem_academic[sem] = round(avg_marks, 2)
        total_at_risk += len(analytics["at_risk_students"])
        
        if analytics["total_students"] > 0:
            all_attendance_vals.append(analytics["avg_attendance"])
            if avg_marks > 0:
                all_marks_vals.append(avg_marks)
                
    # Health score logic: Average of overall attendance and overall marks average
    avg_dept_attendance = np.mean(all_attendance_vals) if all_attendance_vals else 0.0
    avg_dept_marks = np.mean(all_marks_vals) if all_marks_vals else 0.0
    
    # Scale both to 100
    # Health score is a weighted blend
    health_score = round((avg_dept_attendance * 0.6) + (avg_dept_marks * 0.4), 2)
    if health_score == 0.0:
        health_score = 100.0 # Default if empty database
        
    # Build a list of flagged students for department alerts
    all_alerts = []
    for sem in SEMESTERS:
        class_an = sem_data[sem]
        for s in class_an["at_risk_students"]:
            all_alerts.append({
                **s,
                "semester": sem,
                "reason": "Low Attendance & Low Marks (High Risk)"
            })
        # Add students with very low attendance (< 60%) to alerts too
        for s in class_an["low_attendance_students"]:
            if s["attendance"] < 60.0 and not any(a["roll_no"] == s["roll_no"] for a in all_alerts):
                all_alerts.append({
                    "roll_no": s["roll_no"],
                    "name": s["name"],
                    "attendance": s["attendance"],
                    "average_marks": 0.0,
                    "section": s["section"],
                    "semester": sem,
                    "reason": "Critical Low Attendance (<60%)"
                })

    return {
        "branch": branch,
        "total_students": total_dept_students,
        "average_attendance": round(avg_dept_attendance, 2),
        "average_marks": round(avg_dept_marks, 2),
        "sem_attendance": sem_attendance,
        "sem_academic": sem_academic,
        "health_score": health_score,
        "total_at_risk": total_at_risk,
        "alerts": all_alerts
    }

def get_college_analytics() -> Dict[str, Any]:
    branch_performance = []
    total_college_students = 0
    all_attendance_vals = []
    total_at_risk_college = 0
    
    for branch in BRANCHES:
        dept_an = get_department_analytics(branch)
        total_college_students += dept_an["total_students"]
        total_at_risk_college += dept_an["total_at_risk"]
        
        if dept_an["total_students"] > 0:
            all_attendance_vals.append(dept_an["average_attendance"])
            
        branch_performance.append({
            "branch": branch,
            "strength": dept_an["total_students"],
            "attendance": dept_an["average_attendance"],
            "academic": dept_an["average_marks"],
            "health_score": dept_an["health_score"]
        })
        
    college_avg_attendance = np.mean(all_attendance_vals) if all_attendance_vals else 0.0
    
    # Sort branches by academic rank (or health score)
    ranked_branches = sorted(branch_performance, key=lambda x: x["health_score"], reverse=True)
    top_performing_branch = ranked_branches[0]["branch"] if ranked_branches else "N/A"
    
    all_marks_vals = []
    total_fee_pending = 0
    for branch in BRANCHES:
        dept_an = get_department_analytics(branch)
        if dept_an["average_marks"] > 0:
            all_marks_vals.append(dept_an["average_marks"])
        for sem in SEMESTERS:
            students_path = get_file_path(branch, sem, "Students.xlsx")
            df_stud = load_excel_safely(students_path, ['Roll No'])
            for roll in df_stud['Roll No'].astype(str):
                if _is_fee_pending(roll):
                    total_fee_pending += 1

    college_avg_marks = np.mean(all_marks_vals) if all_marks_vals else 0.0

    for bp in branch_performance:
        branch = bp["branch"]
        pending = 0
        for sem in SEMESTERS:
            students_path = get_file_path(branch, sem, "Students.xlsx")
            df_stud = load_excel_safely(students_path, ['Roll No'])
            pending += sum(1 for roll in df_stud['Roll No'].astype(str) if _is_fee_pending(roll))
        bp["fee_pending"] = pending
        bp["fee_pending_rate"] = round((pending / bp["strength"]) * 100, 2) if bp["strength"] else 0.0

    return {
        "total_students": total_college_students,
        "average_attendance": round(college_avg_attendance, 2),
        "average_marks": round(college_avg_marks, 2),
        "total_at_risk": total_at_risk_college,
        "total_fee_pending": total_fee_pending,
        "top_performing_branch": top_performing_branch,
        "branch_performance": branch_performance
    }

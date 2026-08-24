import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import pandas as pd

from app.file_manager import initialize_folders_and_files, get_file_path, get_marks_headers
from app.auth import (
    USERS_DB, create_access_token, get_current_user, verify_role, check_branch_access, User
)
from app.analytics_engine import (
    get_class_analytics, get_department_analytics, get_college_analytics, load_excel_safely
)
from app.interactive_analytics import (
    FilterRequest, filter_students_data, get_risk_distribution_data,
    get_subject_performance, get_fee_pending_stats, get_explorer_data
)

# Initialize folders and files on module import
initialize_folders_and_files()

app = FastAPI(title="CampusConnect Analytics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication Schema
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    branch: Optional[str] = None
    username: str

# Data Entry Schemas
class StudentCreate(BaseModel):
    roll_no: str
    name: str
    branch: str
    semester: str
    section: str
    email: str
    phone: str

class AttendanceRecord(BaseModel):
    roll_no: str
    days_attended: int

class AttendanceSubmission(BaseModel):
    branch: str
    semester: str
    month: str
    working_days: int
    records: List[AttendanceRecord]

class StudentMarks(BaseModel):
    roll_no: str
    student_name: str
    marks: Dict[str, float]  # E.g., {"Sub_1": 85.0, "301": 70.0}

class MarksSubmission(BaseModel):
    branch: str
    semester: str
    records: List[StudentMarks]


# --- Endpoints ---

@app.post("/api/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    user = USERS_DB.get(payload.username)
    if not user or user["password"] != payload.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    token_data = {
        "sub": user["username"],
        "role": user["role"],
        "branch": user["branch"]
    }
    token = create_access_token(token_data)
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user["role"],
        "branch": user["branch"],
        "username": user["username"]
    }

@app.get("/api/auth/me", response_model=User)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# Faculty Route: Add Student
@app.post("/api/faculty/add-student")
def add_student(student: StudentCreate, current_user: User = Depends(verify_role(["FACULTY"]))):
    # Enforce Faculty Branch scope
    check_branch_access(current_user, student.branch)
    
    file_path = get_file_path(student.branch, student.semester, "Students.xlsx")
    
    # Read existing
    df = load_excel_safely(file_path, ['Roll No', 'Student Name', 'Branch', 'Semester', 'Section', 'Email', 'Phone'])
    
    if student.roll_no in df['Roll No'].astype(str).values:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Student with Roll No {student.roll_no} already exists in this class."
        )
        
    new_row = pd.DataFrame([{
        'Roll No': student.roll_no,
        'Student Name': student.name,
        'Branch': student.branch,
        'Semester': student.semester,
        'Section': student.section,
        'Email': student.email,
        'Phone': student.phone
    }])
    
    df = pd.concat([df, new_row], ignore_index=True)
    df.to_excel(file_path, index=False)
    
    return {"message": f"Student {student.name} successfully registered."}


# Faculty Route: Mark Attendance
@app.post("/api/faculty/mark-attendance")
def mark_attendance(sub: AttendanceSubmission, current_user: User = Depends(verify_role(["FACULTY"]))):
    check_branch_access(current_user, sub.branch)
    
    file_path = get_file_path(sub.branch, sub.semester, "Attendance.xlsx")
    df_att = load_excel_safely(file_path, ['Roll No', 'Student Name', 'Month', 'Working Days', 'Days Attended', 'Attendance Percentage'])
    
    # Read Students file to fetch student names
    students_file = get_file_path(sub.branch, sub.semester, "Students.xlsx")
    df_stud = load_excel_safely(students_file, ['Roll No', 'Student Name'])
    student_names = dict(zip(df_stud['Roll No'].astype(str), df_stud['Student Name']))

    for rec in sub.records:
        percentage = round((rec.days_attended / sub.working_days) * 100, 2) if sub.working_days > 0 else 0.0
        name = student_names.get(str(rec.roll_no), "Unknown Student")
        
        # Check if record for this student and this month already exists
        mask = (df_att['Roll No'].astype(str) == str(rec.roll_no)) & (df_att['Month'].str.lower() == sub.month.lower())
        
        if mask.any():
            # Update existing
            idx = df_att[mask].index[0]
            df_att.at[idx, 'Working Days'] = sub.working_days
            df_att.at[idx, 'Days Attended'] = rec.days_attended
            df_att.at[idx, 'Attendance Percentage'] = percentage
            df_att.at[idx, 'Student Name'] = name
        else:
            # Append new row
            new_row = pd.DataFrame([{
                'Roll No': rec.roll_no,
                'Student Name': name,
                'Month': sub.month,
                'Working Days': sub.working_days,
                'Days Attended': rec.days_attended,
                'Attendance Percentage': percentage
            }])
            df_att = pd.concat([df_att, new_row], ignore_index=True)
            
    df_att.to_excel(file_path, index=False)
    return {"message": "Attendance successfully uploaded/updated."}


# Faculty Route: Upload Marks
@app.post("/api/faculty/upload-marks")
def upload_marks(sub: MarksSubmission, current_user: User = Depends(verify_role(["FACULTY"]))):
    check_branch_access(current_user, sub.branch)
    
    file_path = get_file_path(sub.branch, sub.semester, "Mid_Marks.xlsx")
    headers = get_marks_headers(sub.semester)
    df_marks = load_excel_safely(file_path, headers)
    
    for rec in sub.records:
        # Calculate row average
        marks_vals = list(rec.marks.values())
        row_avg = round(sum(marks_vals) / len(marks_vals), 2) if marks_vals else 0.0
        
        # Build the update/append data row
        row_dict = {
            'Roll No': rec.roll_no,
            'Student Name': rec.student_name,
            'Average': row_avg
        }
        for sub_col, score in rec.marks.items():
            if sub_col in headers:
                row_dict[sub_col] = score
                
        # Fill missing subject headers with 0.0 if not supplied
        for h in headers:
            if h not in row_dict:
                row_dict[h] = 0.0
                
        mask = df_marks['Roll No'].astype(str) == str(rec.roll_no)
        if mask.any():
            # Update row
            idx = df_marks[mask].index[0]
            for col, val in row_dict.items():
                df_marks.at[idx, col] = val
        else:
            # Append row
            new_row = pd.DataFrame([row_dict])
            df_marks = pd.concat([df_marks, new_row], ignore_index=True)
            
    df_marks.to_excel(file_path, index=False)
    return {"message": "Mid marks successfully uploaded/updated."}


# Faculty Analytics
@app.get("/api/analytics/faculty")
def faculty_analytics(branch: str, semester: str, current_user: User = Depends(verify_role(["FACULTY", "HOD", "PRINCIPAL"]))):
    check_branch_access(current_user, branch)
    return get_class_analytics(branch, semester)


# HOD Analytics
@app.get("/api/analytics/hod")
def hod_analytics(branch: str, current_user: User = Depends(verify_role(["HOD", "PRINCIPAL"]))):
    check_branch_access(current_user, branch)
    return get_department_analytics(branch)


# Principal Analytics
@app.get("/api/analytics/principal")
def principal_analytics(current_user: User = Depends(verify_role(["PRINCIPAL"]))):
    return get_college_analytics()


# Real-time Interactive Filter
@app.post("/api/analytics/filter")
def filter_analytics(req: FilterRequest, current_user: User = Depends(verify_role(["FACULTY", "HOD", "PRINCIPAL"]))):
    check_branch_access(current_user, req.branch)
    return filter_students_data(req)


# Risk Distribution
@app.get("/api/analytics/risk-distribution")
def risk_distribution(branch: Optional[str] = None, current_user: User = Depends(verify_role(["FACULTY", "HOD", "PRINCIPAL"]))):
    if branch:
        check_branch_access(current_user, branch)
    else:
        # If they don't supply branch, but are FACULTY or HOD, enforce their branch
        if current_user.role in ["FACULTY", "HOD"]:
            branch = current_user.branch
            
    return get_risk_distribution_data(branch)


# Subject Performance (top/low scorers for interactive HOD chart)
@app.get("/api/analytics/subject")
def subject_analytics(
    branch: str,
    semester: str,
    subject: str,
    current_user: User = Depends(verify_role(["FACULTY", "HOD", "PRINCIPAL"]))
):
    check_branch_access(current_user, branch)
    return get_subject_performance(branch, semester, subject)


# Fee Pending Stats
@app.get("/api/analytics/fee-pending")
def fee_pending_analytics(
    branch: Optional[str] = None,
    current_user: User = Depends(verify_role(["HOD", "PRINCIPAL"]))
):
    if branch:
        check_branch_access(current_user, branch)
    elif current_user.role == "HOD":
        branch = current_user.branch
    return get_fee_pending_stats(branch)


# Interactive Data Explorer
@app.get("/api/analytics/explore")
def explore_analytics(
    branch: Optional[str] = None,
    semester: Optional[str] = None,
    current_user: User = Depends(verify_role(["FACULTY", "HOD", "PRINCIPAL"]))
):
    if current_user.role in ["FACULTY", "HOD"]:
        branch = current_user.branch
    elif branch and branch != "All":
        check_branch_access(current_user, branch)
    return get_explorer_data(branch, semester)

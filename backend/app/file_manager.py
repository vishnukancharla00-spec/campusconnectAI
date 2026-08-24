import os
import pandas as pd

# Define paths and configurations
DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Data"))
BRANCHES = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL']
SEMESTERS = ['Sem_1', 'Sem_3', 'Sem_4', 'Sem_5']

STUDENT_HEADERS = ['Roll No', 'Student Name', 'Branch', 'Semester', 'Section', 'Email', 'Phone']
ATTENDANCE_HEADERS = ['Roll No', 'Student Name', 'Month', 'Working Days', 'Days Attended', 'Attendance Percentage']

def get_marks_headers(sem: str):
    if sem == 'Sem_1':
        return ['Roll No', 'Student Name', 'Sub_1', 'Sub_2', 'Sub_3', 'Sub_4', 'Sub_5', 'Sub_6', 'Sub_7', 'Average']
    elif sem == 'Sem_3':
        return ['Roll No', 'Student Name', '301', '302', '303', '304', '305', 'Average']
    elif sem == 'Sem_4':
        return ['Roll No', 'Student Name', '401', '402', '403', '404', '405', 'Average']
    elif sem == 'Sem_5':
        return ['Roll No', 'Student Name', '501', '502', '503', '504', '505', 'Average']
    else:
        raise ValueError(f"Unsupported semester: {sem}")

def initialize_folders_and_files():
    for branch in BRANCHES:
        for sem in SEMESTERS:
            folder_path = os.path.join(DATA_DIR, branch, f"Semester_{sem}")
            os.makedirs(folder_path, exist_ok=True)
            
            # Initialize Students.xlsx
            student_file = os.path.join(folder_path, "Students.xlsx")
            if not os.path.exists(student_file):
                df = pd.DataFrame(columns=STUDENT_HEADERS)
                df.to_excel(student_file, index=False)
                
            # Initialize Attendance.xlsx
            attendance_file = os.path.join(folder_path, "Attendance.xlsx")
            if not os.path.exists(attendance_file):
                df = pd.DataFrame(columns=ATTENDANCE_HEADERS)
                df.to_excel(attendance_file, index=False)
                
            # Initialize Mid_Marks.xlsx
            marks_file = os.path.join(folder_path, "Mid_Marks.xlsx")
            if not os.path.exists(marks_file):
                df = pd.DataFrame(columns=get_marks_headers(sem))
                df.to_excel(marks_file, index=False)

def get_file_path(branch: str, sem: str, filename: str) -> str:
    # Standardize sem format if needed
    if not sem.startswith("Semester_"):
        sem_folder = f"Semester_{sem}"
    else:
        sem_folder = sem
    return os.path.join(DATA_DIR, branch, sem_folder, filename)

if __name__ == "__main__":
    initialize_folders_and_files()
    print("Folders and Excel files initialized successfully.")

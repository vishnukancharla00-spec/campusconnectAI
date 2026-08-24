import os
import pandas as pd
import random
from app.file_manager import BRANCHES, SEMESTERS, get_file_path, get_marks_headers, initialize_folders_and_files

def generate_data():
    initialize_folders_and_files()
    
    first_names = ["Arjun", "Aditya", "Rohan", "Siddharth", "Neha", "Priya", "Ananya", "Rahul", "Karan", "Sneha", "Tanvi", "Vikram", "Amit", "Pooja", "Divya", "Kunal", "Meera", "Varun", "Riya", "Yash"]
    last_names = ["Sharma", "Verma", "Gupta", "Reddy", "Nair", "Joshi", "Patel", "Rao", "Kumar", "Choudhury", "Mehta", "Mishra", "Singh", "Das", "Sen"]
    
    sections = ['A', 'B']
    months = ['July', 'August', 'September']
    
    for branch in BRANCHES:
        for sem in SEMESTERS:
            # Let's create 15 students per class
            students = []
            attendance_records = []
            marks_records = []
            
            headers_marks = get_marks_headers(sem)
            subject_cols = [c for c in headers_marks if c not in ['Roll No', 'Student Name', 'Average']]
            
            for i in range(1, 16):
                roll_no = f"{branch}{sem[-1]}0{i:02d}"
                name = f"{random.choice(first_names)} {random.choice(last_names)}"
                sec = random.choice(sections)
                email = f"{name.lower().replace(' ', '.')}@campusconnect.edu"
                phone = f"+91{random.randint(7000000000, 9999999999)}"
                
                students.append({
                    'Roll No': roll_no,
                    'Student Name': name,
                    'Branch': branch,
                    'Semester': sem,
                    'Section': sec,
                    'Email': email,
                    'Phone': phone
                })
                
                # Make student #3 and #8 high risk (low attendance, low marks)
                # Make student #5 medium risk (low attendance, high marks or vice-versa)
                is_high_risk = (i in [3, 8])
                is_med_risk = (i in [5])
                
                # Generate Attendance (July, August, September)
                for month in months:
                    working_days = 22
                    if is_high_risk:
                        days_attended = random.randint(10, 14) # attendance < 65%
                    elif is_med_risk:
                        days_attended = random.randint(11, 15) # attendance < 70%
                    else:
                        days_attended = random.randint(18, 22) # attendance > 80%
                        
                    percentage = round((days_attended / working_days) * 100, 2)
                    
                    attendance_records.append({
                        'Roll No': roll_no,
                        'Student Name': name,
                        'Month': month,
                        'Working Days': working_days,
                        'Days Attended': days_attended,
                        'Attendance Percentage': percentage
                    })
                    
                # Generate Marks
                marks_row = {
                    'Roll No': roll_no,
                    'Student Name': name
                }
                
                total_m = 0
                for sub in subject_cols:
                    if is_high_risk:
                        score = random.randint(25, 45) # low marks
                    elif is_med_risk:
                        score = random.randint(75, 95) # high marks
                    else:
                        score = random.randint(50, 98)
                    marks_row[sub] = score
                    total_m += score
                    
                marks_row['Average'] = round(total_m / len(subject_cols), 2)
                marks_records.append(marks_row)
                
            # Write to files
            df_stud = pd.DataFrame(students)
            df_stud.to_excel(get_file_path(branch, sem, "Students.xlsx"), index=False)
            
            df_att = pd.DataFrame(attendance_records)
            df_att.to_excel(get_file_path(branch, sem, "Attendance.xlsx"), index=False)
            
            df_marks = pd.DataFrame(marks_records)
            df_marks.to_excel(get_file_path(branch, sem, "Mid_Marks.xlsx"), index=False)
            
    print("Mock data generated successfully for all branches and semesters.")

if __name__ == "__main__":
    generate_data()

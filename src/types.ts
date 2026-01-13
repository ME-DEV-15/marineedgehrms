export interface SalaryPayout {
  id?: string;
  date: string;
  amount: number;
  type?: string; // e.g., 'Salary'
  status?: string; // e.g., 'Paid'
  note?: string;
}

export interface DocumentRecord {
  type: string; // e.g., 'Aadhar Card'
  status: string; // e.g., 'Verified' | 'Uploaded'
  lastUpdated: string; // ISO date
  fileName?: string;
  data?: string; // base64 or url
  driveUrl?: string; // Google Drive share link (preferred for large docs)
}

export interface DepartmentAssignment {
  department: string;
  annualSalary: number;
  startDate?: string;
  endDate?: string;
}

export interface Employee {
  id?: string;
  name: string;
  role: string;
  department?: string;
  annualSalary?: number;
  departmentAssignments?: DepartmentAssignment[];
  startDate?: string;
  status?: 'Active' | 'Terminated' | string;
  documents?: DocumentRecord[];
  payouts?: SalaryPayout[];
  email?: string;
  phone?: string;
  upiId?: string;
  dob?: string;
  terminationDate?: string;
}

export interface EmployeeDocument extends Employee {
  uid: string;
}

export interface Expense {
  id?: string;
  description?: string;
  amount: number;
  category: string;
  date: string;
  department?: string;
}

export interface Budget {
  id?: string;
  department: string;
  amount: number; // monthly allocation in INR
}

export interface Department {
  id?: string;
  name: string;
  budget?: number;
}

export interface DepartmentDoc extends Department {
  employees: string[];
}

export interface AIAnalysisResult {
  summary: string;
  recommendations: string[];
  riskLevel?: 'Low' | 'Medium' | 'High' | string;
  risks?: string[];
}


export type Department = string;

// Helper interface for DB
export interface DepartmentDoc {
    id: string;
    name: string;
    budget: number;
}

export interface EmployeeDocument {
  type: 'Aadhar Card' | 'PAN Card' | 'Bank Details' | 'Photo' | 'Employment Form' | 'Other';
  status: 'Pending' | 'Uploaded' | 'Verified';
  lastUpdated: string;
  fileName?: string;
  data?: string;
}

export interface SalaryPayout {
  id: string;
  date: string;
  amount: number;
  type: 'Salary' | 'Bonus' | 'Reimbursement';
  status: 'Paid' | 'Processing';
  reference?: string;
}

export interface DepartmentAssignment {
  department: string;
  annualSalary: number; // The portion of annual salary allocated to this department
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: Department; // Primary department (for listing display)
  annualSalary: number; // Total Annual Salary (Sum of assignments)
  departmentAssignments: DepartmentAssignment[]; // Breakdown
  startDate: string;
  status: 'Active' | 'Terminated';
  terminationDate?: string;
  documents: EmployeeDocument[];
  payouts: SalaryPayout[];
  email?: string;
  phone?: string;
  upiId?: string;
  dob?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number; // In INR
  department: Department;
  date: string;
  category: 'Software' | 'Equipment' | 'Travel' | 'Events' | 'Miscellaneous' | 'Contractor' | 'Salary';
}

export interface Budget {
  department: Department;
  amount: number; // In INR
}

export interface AIAnalysisResult {
  summary: string;
  recommendations: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
}

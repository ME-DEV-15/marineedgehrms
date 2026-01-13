
import { Employee, Expense, Budget } from './types';

export const INITIAL_DEPARTMENTS: string[] = [
  'Academics',
  'Sales',
  'Content',
  'Editing',
  'Designing',
  'Softwares',
  'Creators',
  'Tech',
  'Marketing & Social Media'
];

// INR Budgets (Monthly)
export const INITIAL_BUDGETS: Budget[] = INITIAL_DEPARTMENTS.map(dept => ({
  department: dept,
  amount: 2500000 // ₹25 Lakhs per department default
}));

const DEFAULT_DOCUMENTS = [
  { type: 'Aadhar Card', status: 'Verified', lastUpdated: '2023-01-10' },
  { type: 'PAN Card', status: 'Verified', lastUpdated: '2023-01-10' },
  { type: 'Bank Details', status: 'Uploaded', lastUpdated: '2023-01-12' },
  { type: 'Photo', status: 'Uploaded', lastUpdated: '2023-01-10' },
  { type: 'Employment Form', status: 'Verified', lastUpdated: '2023-01-15' },
] as const;

// Helper to create assignment easily
const mkAssign = (dept: string, salary: number) => [{ department: dept, annualSalary: salary }];

export const MOCK_EMPLOYEES: Employee[] = [
  { 
    id: '1', name: 'Arjun Sharma', role: 'Head of Academics', department: 'Academics', annualSalary: 2400000, 
    departmentAssignments: mkAssign('Academics', 2400000),
    startDate: '2022-01-15', status: 'Active',
    documents: JSON.parse(JSON.stringify(DEFAULT_DOCUMENTS)),
    payouts: [{ id: 'p1', date: '2025-09-30', amount: 200000, type: 'Salary', status: 'Paid' }]
  },
  { 
    id: '2', name: 'Priya Verma', role: 'Sales Lead', department: 'Sales', annualSalary: 1800000, 
    departmentAssignments: mkAssign('Sales', 1800000),
    startDate: '2023-03-01', status: 'Active',
    documents: JSON.parse(JSON.stringify(DEFAULT_DOCUMENTS)),
    payouts: [{ id: 'p2', date: '2025-09-30', amount: 150000, type: 'Salary', status: 'Paid' }]
  },
  { 
    id: '3', name: 'Rohan Gupta', role: 'Senior Editor', department: 'Editing', annualSalary: 1200000, 
    departmentAssignments: mkAssign('Editing', 1200000),
    startDate: '2021-11-20', status: 'Active',
    documents: JSON.parse(JSON.stringify(DEFAULT_DOCUMENTS)),
    payouts: [{ id: 'p3', date: '2025-09-30', amount: 100000, type: 'Salary', status: 'Paid' }]
  },
  { 
    id: '4', name: 'Ananya Singh', role: 'Lead Designer', department: 'Designing', annualSalary: 1500000, 
    departmentAssignments: mkAssign('Designing', 1500000),
    startDate: '2022-06-10', status: 'Active',
    documents: JSON.parse(JSON.stringify(DEFAULT_DOCUMENTS)),
    payouts: [{ id: 'p4', date: '2025-09-30', amount: 125000, type: 'Salary', status: 'Paid' }]
  },
  { 
    id: '5', name: 'Vikram Malhotra', role: 'Software Engineer', department: 'Softwares', annualSalary: 2000000, 
    departmentAssignments: mkAssign('Softwares', 2000000),
    startDate: '2023-01-05', status: 'Active',
    documents: JSON.parse(JSON.stringify(DEFAULT_DOCUMENTS)),
    payouts: [{ id: 'p5', date: '2025-09-30', amount: 166666, type: 'Salary', status: 'Paid' }]
  },
  { 
    id: '6', name: 'Sneha Patel', role: 'Content Creator', department: 'Creators', annualSalary: 900000, 
    departmentAssignments: mkAssign('Creators', 900000),
    startDate: '2023-07-22', status: 'Active',
    documents: JSON.parse(JSON.stringify(DEFAULT_DOCUMENTS)),
    payouts: [{ id: 'p6', date: '2025-09-30', amount: 75000, type: 'Salary', status: 'Paid' }]
  },
  { 
    id: '7', name: 'Karan Mehra', role: 'CTO', department: 'Tech', annualSalary: 4500000, 
    departmentAssignments: mkAssign('Tech', 4500000),
    startDate: '2020-05-15', status: 'Active',
    documents: JSON.parse(JSON.stringify(DEFAULT_DOCUMENTS)),
    payouts: [{ id: 'p7', date: '2025-09-30', amount: 375000, type: 'Salary', status: 'Paid' }]
  },
  { 
    id: '8', name: 'Meera Iyer', role: 'Marketing Manager', department: 'Marketing & Social Media', annualSalary: 1600000, 
    departmentAssignments: mkAssign('Marketing & Social Media', 1600000),
    startDate: '2021-02-14', status: 'Active',
    documents: JSON.parse(JSON.stringify(DEFAULT_DOCUMENTS)),
    payouts: [{ id: 'p8', date: '2025-09-30', amount: 133333, type: 'Salary', status: 'Paid' }]
  },
  { 
    id: '9', name: 'Rahul Nair', role: 'Content Strategist', department: 'Content', annualSalary: 1400000, 
    departmentAssignments: mkAssign('Content', 1400000),
    startDate: '2022-09-01', status: 'Active',
    documents: JSON.parse(JSON.stringify(DEFAULT_DOCUMENTS)),
    payouts: [{ id: 'p9', date: '2025-09-30', amount: 116666, type: 'Salary', status: 'Paid' }]
  },
];

export const MOCK_EXPENSES: Expense[] = [
  { id: '101', description: 'AWS Cloud Hosting', amount: 85000, department: 'Tech', date: '2025-10-01', category: 'Software' },
  { id: '102', description: 'Diwali Marketing Campaign', amount: 500000, department: 'Marketing & Social Media', date: '2025-10-03', category: 'Events' },
  { id: '103', description: 'New MacBook Pros (x3)', amount: 650000, department: 'Designing', date: '2025-10-05', category: 'Equipment' },
  { id: '104', description: 'Sales Team Offsite - Goa', amount: 250000, department: 'Sales', date: '2025-10-07', category: 'Travel' },
  { id: '105', description: 'Research Journals', amount: 15000, department: 'Academics', date: '2025-10-10', category: 'Software' },
  { id: '106', description: 'Freelance Writers', amount: 45000, department: 'Content', date: '2025-10-12', category: 'Contractor' },
  { id: '107', description: 'Adobe Creative Cloud', amount: 85000, department: 'Editing', date: '2025-10-15', category: 'Software' },
  { id: '108', description: 'Jira Enterprise License', amount: 120000, department: 'Softwares', date: '2025-10-16', category: 'Software' },
  { id: '109', description: 'Creator Collabs', amount: 150000, department: 'Creators', date: '2025-10-18', category: 'Events' },
];

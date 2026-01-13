
import { db } from './firebaseConfig';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { Employee, Expense, Budget } from '../types';
import { MOCK_EMPLOYEES, MOCK_EXPENSES, INITIAL_BUDGETS } from '../constants';

// Collection Names
const COLL_EMPLOYEES = 'employees';
const COLL_EXPENSES = 'expenses';
const COLL_DEPARTMENTS = 'departments';

export const dbService = {

  // --- Generic Helpers ---
  isConfigured: () => !!db,

  // --- Initial Seeding ---
  seedData: async () => {
    if (!db) return;
    try {
      // Check if data exists
      const snap = await getDocs(collection(db, COLL_DEPARTMENTS));
      if (!snap.empty) {
        console.log("Database already has data. Skipping seed.");
        return;
      }

      console.log("Seeding initial data...");

      // Seed Departments & Budgets
      for (const b of INITIAL_BUDGETS) {
        await addDoc(collection(db, COLL_DEPARTMENTS), {
          name: b.department,
          budget: b.amount
        });
      }

      // Seed Employees
      for (const emp of MOCK_EMPLOYEES) {
        const { id, ...empData } = emp; // Let firestore generate IDs
        await addDoc(collection(db, COLL_EMPLOYEES), empData);
      }

      // Seed Expenses
      for (const exp of MOCK_EXPENSES) {
        const { id, ...expData } = exp;
        await addDoc(collection(db, COLL_EXPENSES), expData);
      }

      console.log("Seeding complete!");
      return true;
    } catch (e) {
      console.error("Seeding failed", e);
    }
  },

  // --- Departments ---
  getDepartments: async () => {
    if (!db) return [];
    const snap = await getDocs(collection(db, COLL_DEPARTMENTS));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  },

  addDepartment: async (name: string, budget: number) => {
    if (!db) return;
    return await addDoc(collection(db, COLL_DEPARTMENTS), { name, budget });
  },

  updateDepartment: async (id: string, data: any) => {
    if (!db) return;
    await updateDoc(doc(db, COLL_DEPARTMENTS, id), data);
  },

  deleteDepartment: async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, COLL_DEPARTMENTS, id));
  },

  // --- Employees ---
  getEmployees: async () => {
    if (!db) return [];
    const snap = await getDocs(collection(db, COLL_EMPLOYEES));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Employee));
  },

  addEmployee: async (employee: Omit<Employee, 'id'>) => {
    if (!db) return 'temp-id';
    const ref = await addDoc(collection(db, COLL_EMPLOYEES), employee);
    return ref.id;
  },

  updateEmployee: async (id: string, data: Partial<Employee>) => {
    if (!db) return;
    await updateDoc(doc(db, COLL_EMPLOYEES, id), data);
  },

  deleteEmployee: async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, COLL_EMPLOYEES, id));
  },

  // --- Expenses ---
  getExpenses: async () => {
    if (!db) return [];
    const q = query(collection(db, COLL_EXPENSES));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense));
  },

  addExpense: async (expense: Omit<Expense, 'id'>) => {
    if (!db) return 'temp-id';
    const ref = await addDoc(collection(db, COLL_EXPENSES), expense);
    return ref.id;
  },

  deleteExpense: async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, COLL_EXPENSES, id));
  }
};

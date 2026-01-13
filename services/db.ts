import { db } from "./firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore";
import { Employee, Expense, DepartmentDoc } from "../src/types";
import {
  MOCK_EMPLOYEES,
  MOCK_EXPENSES,
  INITIAL_BUDGETS
} from "../constants";

const COLL_EMPLOYEES = "employees";
const COLL_EXPENSES = "expenses";
const COLL_DEPARTMENTS = "departments";

export const dbService = {
  isConfigured: () => !!db,

  // -------- SEEDING (Production Safe) --------
  // CRITICAL: Only seed if ALL collections are completely empty
  // This prevents accidental data loss on redeployments or app updates
  seedData: async () => {
    if (!db) return;

    const [deptsSnap, empsSnap, expsSnap] = await Promise.all([
      getDocs(collection(db, COLL_DEPARTMENTS)),
      getDocs(collection(db, COLL_EMPLOYEES)),
      getDocs(collection(db, COLL_EXPENSES))
    ]);

    const isEmpty = deptsSnap.empty && empsSnap.empty && expsSnap.empty;

    // Only proceed with seeding if absolutely everything is empty
    if (!isEmpty) {
      console.warn(
        "[DB] Existing data detected. Skipping seed to prevent data loss. Depts:",
        !deptsSnap.empty,
        "| Emps:",
        !empsSnap.empty,
        "| Exps:",
        !expsSnap.empty
      );
      return;
    }

    console.log("[DB] Database is empty. Seeding with initial data...");

    // Safe to seed now
    for (const b of INITIAL_BUDGETS) {
      // eslint-disable-next-line no-await-in-loop
      await addDoc(collection(db, COLL_DEPARTMENTS), {
        name: b.department,
        budget: b.amount
      });
    }

    for (const emp of MOCK_EMPLOYEES) {
      const { id, ...raw } = emp;

      // eslint-disable-next-line no-await-in-loop
      await addDoc(collection(db, COLL_EMPLOYEES), {
        ...raw,
        payouts: raw.payouts || [],
        departmentAssignments:
          raw.departmentAssignments ||
          [{ department: raw.department, annualSalary: raw.annualSalary }]
      });
    }

    for (const exp of MOCK_EXPENSES) {
      const { id, ...raw } = exp;
      // eslint-disable-next-line no-await-in-loop
      await addDoc(collection(db, COLL_EXPENSES), raw);
    }
  },

  // ---------------- DEPARTMENTS ----------------
  getDepartments: async (): Promise<DepartmentDoc[]> => {
    if (!db) return [];
    const snap = await getDocs(collection(db, COLL_DEPARTMENTS));
    return snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<DepartmentDoc, "id">)
    }));
  },

  addDepartment: async (name: string, budget: number) => {
    if (!db) return;
    return await addDoc(collection(db, COLL_DEPARTMENTS), { name, budget });
  },

  updateDepartment: async (id: string, data: Partial<DepartmentDoc>) => {
    if (!db) return;
    await updateDoc(doc(db, COLL_DEPARTMENTS, id), data);
  },

  deleteDepartment: async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, COLL_DEPARTMENTS, id));
  },

  // ---------------- EMPLOYEES ----------------
  getEmployees: async (): Promise<Employee[]> => {
    if (!db) return [];
    const snap = await getDocs(collection(db, COLL_EMPLOYEES));
    return snap.docs.map(d => {
      const data = d.data() as Omit<Employee, "id">;

      return {
        id: d.id,
        ...data,
        payouts: data.payouts || [],
        departmentAssignments:
          data.departmentAssignments ||
          [{ department: data.department, annualSalary: data.annualSalary }]
      };
    });
  },

  addEmployee: async (employee: Omit<Employee, "id">) => {
    if (!db) return "temp-id";

    const cleanEmployee = {
      ...employee,
      payouts: employee.payouts || [],
      departmentAssignments:
        employee.departmentAssignments ||
        [{ department: employee.department, annualSalary: employee.annualSalary }]
    };

    const ref = await addDoc(collection(db, COLL_EMPLOYEES), cleanEmployee);
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

  // ---------------- EXPENSES ----------------
  getExpenses: async (): Promise<Expense[]> => {
    if (!db) return [];
    const snap = await getDocs(collection(db, COLL_EXPENSES));
    return snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<Expense, "id">)
    }));
  },

  addExpense: async (expense: Omit<Expense, "id">) => {
    if (!db) return "temp-id";
    const ref = await addDoc(collection(db, COLL_EXPENSES), expense);
    return ref.id;
  },

  deleteExpense: async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, COLL_EXPENSES, id));
  }
};
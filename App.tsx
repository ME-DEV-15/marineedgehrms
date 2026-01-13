import React, { useState, useEffect, useRef } from "react";
import {
  MOCK_EMPLOYEES,
  MOCK_EXPENSES,
  INITIAL_BUDGETS,
  INITIAL_DEPARTMENTS
} from "./constants";
import { Employee, Expense, Budget, SalaryPayout, DepartmentDoc } from "./types";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import DepartmentView from "./components/DepartmentView";
import EmployeeList from "./components/EmployeeList";
import EmployeeProfile from "./components/EmployeeProfile";
import SalaryProcessing from "./components/SalaryProcessing";
import Settings from "./components/Settings";
import ExpensesOverview from "./components/ExpensesOverview";
import Login from "./components/Login";
import { dbService } from "./services/db";
import { auth } from "./services/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";

const LOCAL_STORAGE_KEY = "MARINE_EDGE_DB_V1";
const VERSION_KEY = "MARINE_EDGE_VERSION";
const CURRENT_VERSION = "1.0.0";

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeView, setActiveView] = useState("dashboard");
  const [previousView, setPreviousView] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocalMode, setIsLocalMode] = useState(false);

  const [departmentsDocs, setDepartmentsDocs] = useState<DepartmentDoc[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const isLoaded = useRef(false);

  const departments = departmentsDocs.map(d => d.name);
  const budgets: Budget[] = departmentsDocs.map(d => ({
    department: d.name,
    amount: d.budget
  }));

  // 🔐 Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // Load data
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        if (dbService.isConfigured()) {
          // Only seed on first load (production: when DB is empty)
          await dbService.seedData();
          const [d, e, x] = await Promise.all([
            dbService.getDepartments(),
            dbService.getEmployees(),
            dbService.getExpenses()
          ]);
          setDepartmentsDocs(d);
          setEmployees(e);
          setExpenses(x);
          setIsLocalMode(false);
        } else {
          loadLocal();
        }
      } catch {
        loadLocal();
      }
      isLoaded.current = true;
      setIsLoading(false);
    };
    init();
  }, []);

  const loadLocal = () => {
    setIsLocalMode(true);
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const d = JSON.parse(stored);
      setDepartmentsDocs(d.departmentsDocs || createMockDepts());
      setEmployees(d.employees || MOCK_EMPLOYEES);
      setExpenses(d.expenses || MOCK_EXPENSES);
    } else {
      setDepartmentsDocs(createMockDepts());
      setEmployees(MOCK_EMPLOYEES);
      setExpenses(MOCK_EXPENSES);
    }
  };

  const createMockDepts = () =>
    INITIAL_DEPARTMENTS.map((d, i) => ({
      id: `dept-${i}`,
      name: d,
      budget: INITIAL_BUDGETS.find(b => b.department === d)?.amount || 2500000
    }));

  useEffect(() => {
    if (isLocalMode && isLoaded.current) {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({ departmentsDocs, employees, expenses })
      );
    }
  }, [departmentsDocs, employees, expenses, isLocalMode]);

  // ===== CORE BUSINESS LOGIC =====

  const handleAddEmployee = async (data: { name: string; department: string; monthlySalary: number }) => {
    const annualSalary = data.monthlySalary * 12;

    const emp: Employee = {
      id: Date.now().toString(),
      name: data.name,
      department: data.department,
      annualSalary,
      departmentAssignments: [{ department: data.department, annualSalary }],
      payouts: [],
      status: "Active"
    };

    setEmployees(prev => [...prev, emp]);

    if (!isLocalMode) {
      const realId = await dbService.addEmployee(emp);
      setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, id: realId } : e));
    }
  };

  const handleUpdateEmployee = async (id: string, data: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
    if (!isLocalMode) await dbService.updateEmployee(id, data);
  };

  const handleDeleteEmployee = async (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
    if (!isLocalMode) await dbService.deleteEmployee(id);
  };

  const handleTerminateEmployee = async (id: string, date: string) => {
    await handleUpdateEmployee(id, {
      status: "Terminated",
      terminationDate: date
    } as any);
  };

  const handleAddExpense = async (exp: Omit<Expense, "id">) => {
    const tempId = Date.now().toString();
    setExpenses(prev => [...prev, { ...exp, id: tempId }]);
    if (!isLocalMode) {
      const realId = await dbService.addExpense(exp);
      setExpenses(prev => prev.map(e => e.id === tempId ? { ...e, id: realId } : e));
    }
  };

  const handleDeleteExpenses = async (ids: string[]) => {
    setExpenses(prev => prev.filter(e => !ids.includes(e.id)));
    if (!isLocalMode) {
      for (const id of ids) {
        // best-effort deletes
        // eslint-disable-next-line no-await-in-loop
        await dbService.deleteExpense(id);
      }
    }
  };

  const handleProcessBulkPayment = async (
    payments: { employeeId: string; amount: number }[],
    date: string,
    type: SalaryPayout["type"]
  ) => {
    // Process sequentially to avoid state races / duplicate expense IDs
    for (const p of payments) {
      // eslint-disable-next-line no-await-in-loop
      await handleRecordPayment(p.employeeId, p.amount, type, date);
    }
  };

  // ===== SETTINGS (Departments + Budgets) =====
  const handleAddDepartment = async (name: string, budget: number) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (departmentsDocs.some(d => d.name.toLowerCase() === trimmed.toLowerCase())) return;

    const tempId = `dept-${Date.now()}`;
    const newDoc: DepartmentDoc = { id: tempId, name: trimmed, budget };
    setDepartmentsDocs(prev => [...prev, newDoc]);

    if (!isLocalMode) {
      const ref = await dbService.addDepartment(trimmed, budget);
      if (ref?.id) {
        setDepartmentsDocs(prev => prev.map(d => (d.id === tempId ? { ...d, id: ref.id } : d)));
      }
    }
  };

  const handleUpdateDepartment = async (oldName: string, newName: string, budget: number) => {
    const trimmed = newName.trim();
    const dept = departmentsDocs.find(d => d.name === oldName);
    if (!dept) return;
    if (!trimmed) return;

    // prevent duplicates when renaming
    if (
      oldName.toLowerCase() !== trimmed.toLowerCase() &&
      departmentsDocs.some(d => d.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      return;
    }

    setDepartmentsDocs(prev =>
      prev.map(d => (d.id === dept.id ? { ...d, name: trimmed, budget } : d))
    );

    // Update employee department references if renamed
    if (oldName !== trimmed) {
      setEmployees(prev =>
        prev.map(e => {
          const updatedAssignments = (e.departmentAssignments || []).map(a =>
            a.department === oldName ? { ...a, department: trimmed } : a
          );

          const primaryDept = e.department === oldName ? trimmed : e.department;
          return {
            ...e,
            department: primaryDept,
            departmentAssignments: updatedAssignments
          };
        })
      );
    }

    if (!isLocalMode) {
      await dbService.updateDepartment(dept.id, { name: trimmed, budget });
    }
  };

  const handleDeleteDepartment = async (name: string) => {
    const dept = departmentsDocs.find(d => d.name === name);
    if (!dept) return;
    // Safety: do not delete if any active employee still references it
    const inUse = employees.some(
      e => e.status === "Active" &&
      (e.department === name || (e.departmentAssignments || []).some(a => a.department === name))
    );
    if (inUse) return;

    setDepartmentsDocs(prev => prev.filter(d => d.id !== dept.id));
    if (!isLocalMode) await dbService.deleteDepartment(dept.id);
  };

  const handleRecordPayment = async (employeeId: string, amount: number, type: SalaryPayout["type"], date: string) => {
    const payout: SalaryPayout = {
      id: Date.now().toString(),
      date,
      amount,
      type,
      status: "Paid"
    };

    setEmployees(prev =>
      prev.map(e => e.id === employeeId ? { ...e, payouts: [...e.payouts, payout] } : e)
    );

    const emp = employees.find(e => e.id === employeeId);
    if (emp) {
      await handleAddExpense({
        description: `${type} - ${emp.name}`,
        amount,
        department: emp.department,
        date,
        category: "Salary"
      });
    }
  };

  // 🔐 Gate
  if (authLoading) return <div className="h-screen flex items-center justify-center">Checking session…</div>;
  if (!user) return <Login />;

  return (
    <Layout activeView={activeView} setActiveView={setActiveView} departments={departments} onLogout={() => signOut(auth)}>
      {activeView === "employees" && (
        <EmployeeList
          employees={employees}
          departments={departments}
          onSelectEmployee={(id) => {
            setSelectedEmployeeId(id);
            setPreviousView(activeView);
            setActiveView("employeeProfile");
          }}
          onAddEmployee={handleAddEmployee as any}
          onUpdateEmployee={handleUpdateEmployee}
          onTerminateEmployee={handleTerminateEmployee}
          onDeleteEmployee={handleDeleteEmployee}
        />
      )}
      {activeView === "dashboard" && <Dashboard employees={employees} expenses={expenses} budgets={budgets} />}
      {activeView.startsWith("dept-") && (
        <DepartmentView
          department={activeView.replace("dept-", "")}
          employees={employees}
          expenses={expenses}
          budget={budgets.find(b => b.department === activeView.replace("dept-", "")) || { department: "", amount: 0 }}
          onAddExpense={handleAddExpense}
          onSelectEmployee={(id) => {
            setSelectedEmployeeId(id);
            setPreviousView(activeView);
            setActiveView("employeeProfile");
          }}
          onDeleteExpenses={handleDeleteExpenses}
        />
      )}
      {activeView === "expenses" && (
        <ExpensesOverview
          expenses={expenses}
          departments={departments}
          onDeleteExpenses={handleDeleteExpenses}
        />
      )}
      {activeView === "payroll" && (
        <SalaryProcessing
          employees={employees}
          onProcessBulkPayment={handleProcessBulkPayment}
        />
      )}
      {activeView === "settings" && (
        <Settings
          departments={departments}
          budgets={budgets}
          employees={employees}
          onAddDepartment={handleAddDepartment}
          onUpdateDepartment={handleUpdateDepartment}
          onDeleteDepartment={handleDeleteDepartment}
        />
      )}

      {activeView === "employeeProfile" && selectedEmployeeId && (
        <EmployeeProfile
          employee={{
            ...(employees.find(e => e.id === selectedEmployeeId) as Employee),
            documents: (employees.find(e => e.id === selectedEmployeeId) as Employee)?.documents || [],
            payouts: (employees.find(e => e.id === selectedEmployeeId) as Employee)?.payouts || [],
            departmentAssignments: (employees.find(e => e.id === selectedEmployeeId) as Employee)?.departmentAssignments || []
          }}
          onBack={() => {
            setActiveView(previousView || "employees");
            setSelectedEmployeeId(null);
          }}
          onRecordPayment={handleRecordPayment}
          onTerminate={handleTerminateEmployee}
        />
      )}
    </Layout>
  );
};

export default App;

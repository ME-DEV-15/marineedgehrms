
import React, { useMemo, useState, useEffect } from 'react';
import { Department, Employee, Expense, Budget, AIAnalysisResult } from '../types';
import { 
  Plus, 
  Sparkles,
  AlertCircle,
  Filter,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle
} from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
} from 'recharts';
import { analyzeFinances } from '../services/geminiService';

interface DepartmentViewProps {
  department: Department;
  employees: Employee[];
  expenses: Expense[];
  budget: Budget;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onSelectEmployee: (id: string) => void;
  onDeleteExpenses: (ids: string[]) => void;
}

const DepartmentView: React.FC<DepartmentViewProps> = ({ 
  department, 
  employees, 
  expenses, 
  budget,
  onAddExpense,
  onSelectEmployee,
  onDeleteExpenses
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'expenses'>('overview');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: 'Miscellaneous' as Expense['category'],
    date: new Date().toISOString().split('T')[0]
  });

  // Filter State - Default to Current Month
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear() < 2025 ? 2025 : new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString());

  // Selection State for Deletion
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<Set<string>>(new Set());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // AI State
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Constants
  const months = [
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' },
  ];

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2025;
    const yearList = [];
    for (let i = startYear; i <= Math.max(currentYear + 1, startYear + 2); i++) {
        yearList.push(i);
    }
    return yearList;
  }, []);

  // Filtered Data Calculation
  const { filteredExpenses, deptEmployees, kpiData, chartData, viewLabel } = useMemo(() => {
     // 1. Filter Employees by Department Assignment (Check assignment array)
     // Also find their specific salary for THIS department
     const deptEmployees = employees.filter(e => {
         const isActive = e.status === 'Active';
         const isInDept = e.department === department || (e.departmentAssignments && e.departmentAssignments.some(da => da.department === department));
         return isActive && isInDept;
     }).map(e => {
         // Calculate specific allocated salary for this dept
         const assignment = e.departmentAssignments?.find(da => da.department === department);
         const allocatedAnnual = assignment ? assignment.annualSalary : (e.department === department ? e.annualSalary : 0);
         return { ...e, allocatedAnnual };
     });

     // 2. Filter Expenses by Department AND Time Range
     const filteredExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        const matchDept = exp.department === department;
        const matchYear = expDate.getFullYear() === selectedYear;
        const matchMonth = selectedMonth === 'all' ? true : expDate.getMonth().toString() === selectedMonth;
        return matchDept && matchYear && matchMonth;
     }).sort((a,b) => {
        // Sort Date Descending
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        // Tie Breaker ID
        return b.id.localeCompare(a.id);
     });

     // 3. KPI Calculations based on SELECTION
     const isYearly = selectedMonth === 'all';
     const multiplier = isYearly ? 12 : 1;
     
     // Calculate Payroll Cost (Actuals from expenses)
     const currentPayrollCost = filteredExpenses
        .filter(e => e.category === 'Salary')
        .reduce((acc, e) => acc + e.amount, 0);

     // Calculate Operational Cost
     const currentOperationalCost = filteredExpenses
        .filter(e => e.category !== 'Salary')
        .reduce((acc, e) => acc + e.amount, 0);

     const currentTotalSpend = currentPayrollCost + currentOperationalCost;
     const currentBudget = budget.amount * multiplier;
     const currentRemaining = currentBudget - currentTotalSpend;
     const currentUtilization = currentBudget > 0 ? (currentTotalSpend / currentBudget) * 100 : 0;

     // 4. Chart Data
     const chartData = months.map((m, index) => {
        const monthOps = expenses
            .filter(e => 
                e.department === department && 
                new Date(e.date).getFullYear() === selectedYear && 
                new Date(e.date).getMonth() === index &&
                e.category !== 'Salary'
            )
            .reduce((acc, e) => acc + e.amount, 0);

        const monthPayroll = expenses
            .filter(e => 
                e.department === department && 
                new Date(e.date).getFullYear() === selectedYear && 
                new Date(e.date).getMonth() === index &&
                e.category === 'Salary'
            )
            .reduce((acc, e) => acc + e.amount, 0);

        return {
            name: m.label.substring(0, 3),
            payroll: Math.round(monthPayroll),
            expenses: Math.round(monthOps),
            total: Math.round(monthPayroll + monthOps)
        };
     });

     let label = `${selectedYear}`;
     if (!isYearly) {
         label = `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`;
     }

     return {
         filteredExpenses,
         deptEmployees,
         kpiData: {
             totalSpend: currentTotalSpend,
             payroll: currentPayrollCost,
             remaining: currentRemaining,
             budget: currentBudget,
             utilization: currentUtilization
         },
         chartData,
         viewLabel: label
     };

  }, [department, employees, expenses, budget, selectedYear, selectedMonth, months, years]);

  // Reset selection when filters change
  useEffect(() => {
    setSelectedExpenseIds(new Set());
  }, [selectedYear, selectedMonth, department]);

  const handleToggleSelectAll = () => {
      if (selectedExpenseIds.size === filteredExpenses.length && filteredExpenses.length > 0) {
          setSelectedExpenseIds(new Set());
      } else {
          setSelectedExpenseIds(new Set(filteredExpenses.map(e => e.id)));
      }
  };

  const handleToggleSelectId = (id: string) => {
      const newSet = new Set(selectedExpenseIds);
      if (newSet.has(id)) {
          newSet.delete(id);
      } else {
          newSet.add(id);
      }
      setSelectedExpenseIds(newSet);
  };

  const handleDeleteSubmit = () => {
      onDeleteExpenses(Array.from(selectedExpenseIds));
      setSelectedExpenseIds(new Set());
      setIsDeleteModalOpen(false);
  };

  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(value);
  };

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeFinances(employees.filter(e => e.department === department), filteredExpenses, [budget], `Department: ${department}. Period: ${viewLabel}`);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    onAddExpense({
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      department: department,
      category: newExpense.category,
      date: newExpense.date
    });
    setIsExpenseModalOpen(false);
    setNewExpense({ description: '', amount: '', category: 'Miscellaneous', date: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{department} Department</h2>
          <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
             <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">{deptEmployees.length} Active Employees (Allocated)</span>
             <span>•</span>
             <span>Viewing Data for: <strong className="text-blue-700">{viewLabel}</strong></span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
             {/* Filters */}
             <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm mr-2">
                <div className="px-2 text-slate-400">
                    <Filter size={16} />
                </div>
                <select 
                    className="bg-white text-sm font-medium text-slate-700 focus:outline-none cursor-pointer py-1"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <div className="w-px h-4 bg-slate-200 mx-1"></div>
                <select 
                    className="bg-white text-sm font-medium text-slate-700 focus:outline-none cursor-pointer py-1 pr-2"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                >
                    <option value="all">All Months</option>
                    {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
            </div>

            <button 
                onClick={handleAIAnalysis}
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-4 py-2 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg font-medium transition-colors"
            >
                {isAnalyzing ? <span className="animate-pulse">Analyzing...</span> : <><Sparkles size={18} /> Analyze</>}
            </button>
            <button 
                onClick={() => setIsExpenseModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white hover:bg-blue-800 rounded-lg font-medium transition-colors shadow-sm"
            >
                <Plus size={18} /> Add Expense
            </button>
        </div>
      </div>

       {/* AI Result Card */}
       {analysis && (
        <div className="bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start">
                <div className="flex gap-3">
                    <Sparkles className="text-blue-600 mt-1" size={20} />
                    <div>
                        <h4 className="font-semibold text-blue-900">Department Analysis</h4>
                        <p className="text-sm text-slate-600 mt-1 max-w-3xl">{analysis.summary}</p>
                    </div>
                </div>
                <button onClick={() => setAnalysis(null)} className="text-slate-400 hover:text-slate-600"><AlertCircle size={16} /></button>
            </div>
             <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg border border-blue-50">
                    <h5 className="text-xs font-bold text-slate-500 uppercase">Recommendations</h5>
                    <ul className="mt-2 space-y-1">
                        {analysis.recommendations.map((r, i) => <li key={i} className="text-sm text-slate-700 list-disc list-inside">{r}</li>)}
                    </ul>
                </div>
            </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-sm font-medium">{selectedMonth === 'all' ? 'Annual' : 'Monthly'} Budget</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatINR(kpiData.budget)}</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-sm font-medium">Total Spend (Actuals)</p>
            <h3 className={`text-2xl font-bold mt-1 ${kpiData.utilization > 100 ? 'text-red-600' : 'text-slate-800'}`}>{formatINR(kpiData.totalSpend)}</h3>
            <p className={`text-xs mt-1 ${kpiData.utilization > 100 ? 'text-red-500' : 'text-slate-400'}`}>{kpiData.utilization.toFixed(1)}% utilized</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-sm font-medium">Payroll Paid</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatINR(kpiData.payroll)}</h3>
            <p className="text-xs text-slate-400 mt-1">{(kpiData.totalSpend > 0 ? (kpiData.payroll/kpiData.totalSpend*100) : 0).toFixed(0)}% of spend</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-sm font-medium">Remaining</p>
            <h3 className={`text-2xl font-bold mt-1 ${kpiData.remaining < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatINR(kpiData.remaining)}</h3>
        </div>
      </div>

      {/* Chart: Annual Trend */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-6">Expenditure Trend ({selectedYear})</h3>
        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                        tickFormatter={(value) => `₹${value/1000}k`}
                    />
                    <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [`${formatINR(value)}`, '']}
                    />
                    <Bar dataKey="payroll" stackId="a" fill="#3b82f6" name="Payroll" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="expenses" stackId="a" fill="#93c5fd" name="Expenses" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex justify-between items-end">
        <div className="flex gap-6">
            <button onClick={() => setActiveTab('overview')} className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Overview</button>
            <button onClick={() => setActiveTab('employees')} className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'employees' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Employees</button>
            <button onClick={() => setActiveTab('expenses')} className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'expenses' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Expenses ({filteredExpenses.length})</button>
        </div>
        
        {/* Bulk Delete Trigger for Expenses Tab */}
        {activeTab === 'expenses' && selectedExpenseIds.size > 0 && (
            <button 
                onClick={() => setIsDeleteModalOpen(true)}
                className="mb-2 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-red-700 shadow-sm animate-in fade-in"
            >
                <Trash2 size={14} /> Delete Selected ({selectedExpenseIds.size})
            </button>
        )}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
        {activeTab === 'overview' && (
            <div className="p-6">
                <h3 className="font-semibold text-slate-800 mb-4">Expense Category Breakdown ({viewLabel})</h3>
                {filteredExpenses.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">No expenses recorded for this period.</div>
                ) : (
                    <div className="space-y-4">
                        {['Software', 'Equipment', 'Travel', 'Events', 'Miscellaneous', 'Contractor', 'Salary'].map(cat => {
                            const catTotal = filteredExpenses.filter(e => e.category === cat).reduce((a, b) => a + b.amount, 0);
                            if(catTotal === 0) return null;
                            const percent = (catTotal / kpiData.totalSpend) * 100; // % of Total Spend
                            
                            // Different color for Salary in breakdown
                            const barColor = cat === 'Salary' ? 'bg-blue-600' : 'bg-sky-400';
                            
                            return (
                                <div key={cat}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-600 font-medium">{cat}</span>
                                        <div>
                                            <span className="text-slate-800 font-bold mr-2">{formatINR(catTotal)}</span>
                                            <span className="text-xs text-slate-400">({percent.toFixed(1)}%)</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className={`${barColor} h-2 rounded-full`} style={{ width: `${percent}%` }}></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        )}

        {activeTab === 'employees' && (
             <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                 <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                     <tr>
                         <th className="px-6 py-4">Name</th>
                         <th className="px-6 py-4">Role</th>
                         <th className="px-6 py-4">Start Date</th>
                         <th className="px-6 py-4 text-right">Allocated Monthly Cost</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                     {deptEmployees.map(emp => (
                         <tr key={emp.id} className="hover:bg-slate-50 transition-colors group">
                             <td className="px-6 py-4 font-medium text-slate-800">
                                <button 
                                  onClick={() => onSelectEmployee(emp.id)}
                                  className="hover:text-blue-700 hover:underline text-left"
                                >
                                  {emp.name}
                                </button>
                             </td>
                             <td className="px-6 py-4 text-slate-600">{emp.role}</td>
                             <td className="px-6 py-4 text-slate-500 text-sm">{emp.startDate}</td>
                             <td className="px-6 py-4 text-slate-800 font-medium text-right">
                                {formatINR(emp.allocatedAnnual/12)}
                                <span className="text-xs text-slate-400 block font-normal">
                                    {(emp.allocatedAnnual / emp.annualSalary * 100).toFixed(0)}% of total salary
                                </span>
                             </td>
                         </tr>
                     ))}
                     {deptEmployees.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                                No active employees assigned to this department.
                            </td>
                        </tr>
                     )}
                 </tbody>
             </table>
         </div>
        )}

        {activeTab === 'expenses' && (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4 w-12 text-center">
                                <button onClick={handleToggleSelectAll} className="text-slate-400 hover:text-blue-600">
                                    {selectedExpenseIds.size > 0 && selectedExpenseIds.size === filteredExpenses.length ? 
                                        <CheckSquare size={18} className="text-blue-600" /> : 
                                        <Square size={18} />
                                    }
                                </button>
                            </th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Description</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredExpenses.map(exp => {
                            const isSelected = selectedExpenseIds.has(exp.id);
                            return (
                                <tr 
                                    key={exp.id} 
                                    className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}
                                >
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => handleToggleSelectId(exp.id)} className="text-slate-400 hover:text-blue-600">
                                            {isSelected ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">{exp.date}</td>
                                    <td className="px-6 py-4 font-medium text-slate-800">{exp.description}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${exp.category === 'Salary' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}`}>
                                            {exp.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-800 font-medium text-right">{formatINR(exp.amount)}</td>
                                </tr>
                            );
                        })}
                        {filteredExpenses.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                    No records found for {viewLabel}.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800">Log New Expense</h3>
                    <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
                </div>
                <form onSubmit={handleSubmitExpense} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <input 
                            required 
                            type="text" 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-black placeholder-slate-400"
                            placeholder="e.g. Q3 Software License"
                            value={newExpense.description}
                            onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Amount (INR)</label>
                            <input 
                                required 
                                type="number" 
                                min="0" 
                                step="1"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black"
                                value={newExpense.amount}
                                onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                            <input 
                                required 
                                type="date" 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black"
                                value={newExpense.date}
                                onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                        <select 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black"
                            value={newExpense.category}
                            onChange={(e) => setNewExpense({...newExpense, category: e.target.value as any})}
                        >
                            {['Software', 'Equipment', 'Travel', 'Events', 'Miscellaneous', 'Contractor'].map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium bg-white">Cancel</button>
                        <button type="submit" className="flex-1 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 font-medium shadow-sm">Save Expense</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 border-t-4 border-red-600">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center rounded-t-xl">
                    <h3 className="font-bold text-lg text-red-600 flex items-center gap-2"><AlertTriangle size={20} /> Confirm Deletion</h3>
                    <button onClick={() => setIsDeleteModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-slate-600 text-sm">
                        Are you sure you want to permanently delete <strong>{selectedExpenseIds.size} expense(s)</strong>?
                    </p>
                    <p className="text-red-600 text-sm font-semibold bg-red-50 p-3 rounded-lg border border-red-100">
                        This action cannot be undone.
                    </p>
                    
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium bg-white">Cancel</button>
                        <button onClick={handleDeleteSubmit} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm">Delete</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentView;

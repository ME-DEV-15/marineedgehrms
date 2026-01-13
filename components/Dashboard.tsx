
import React, { useMemo, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { TrendingUp, Users, AlertCircle, Sparkles, IndianRupee, Filter, Calendar } from 'lucide-react';
import { Employee, Expense, Budget, AIAnalysisResult } from '../types';
import { analyzeFinances } from '../services/geminiService';

interface DashboardProps {
  employees: Employee[];
  expenses: Expense[];
  budgets: Budget[];
}

const COLORS = ['#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#1e40af', '#1d4ed8', '#1e3a8a', '#172554'];

const Dashboard: React.FC<DashboardProps> = ({ employees, expenses, budgets }) => {
  const [analysis, setAnalysis] = React.useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  
  // Filter State - Default to Current Month
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear() < 2025 ? 2025 : new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString());

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2025;
    const yearList = [];
    for (let i = startYear; i <= Math.max(currentYear + 1, startYear + 2); i++) {
      yearList.push(i);
    }
    return yearList;
  }, []);

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

  // Helper for INR
  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(value);
  };

  // Filter Data & Calculate
  const { 
    totalSpend, 
    totalBudget, 
    remainingBudget, 
    spendPercentage, 
    activeEmployeeCount, 
    deptData,
    viewLabel
  } = useMemo(() => {
    const isYearlyView = selectedMonth === 'all';
    
    // Multipliers based on view
    const budgetMultiplier = isYearlyView ? 12 : 1;

    // 1. Filter Expenses
    const filteredExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      const expYear = expDate.getFullYear();
      const expMonth = expDate.getMonth(); // 0-11
      
      const yearMatch = expYear === selectedYear;
      const monthMatch = isYearlyView ? true : expMonth.toString() === selectedMonth;
      
      return yearMatch && monthMatch;
    });

    // 2. Active Employees (Filter out Terminated for Headcount)
    const activeEmployees = employees.filter(emp => emp.status === 'Active');

    // 3. Totals
    // Calculate ACTUAL spend for both Operations and Salary from Expenses array
    const totalSpendCalculated = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);
    
    const totalBudgetCalculated = budgets.reduce((acc, b) => acc + (b.amount * budgetMultiplier), 0);
    const remaining = totalBudgetCalculated - totalSpendCalculated;
    const percentage = totalBudgetCalculated > 0 ? (totalSpendCalculated / totalBudgetCalculated) * 100 : 0;

    // 4. Department Data for Charts
    const departmentData = budgets.map(budget => {
      const deptExp = filteredExpenses.filter(e => e.department === budget.department);
      
      const salaryCost = deptExp.filter(e => e.category === 'Salary').reduce((acc, e) => acc + e.amount, 0);
      const expenseCost = deptExp.filter(e => e.category !== 'Salary').reduce((acc, e) => acc + e.amount, 0);
      const totalDeptSpend = salaryCost + expenseCost;

      return {
        name: budget.department,
        salary: Math.round(salaryCost),
        expenses: Math.round(expenseCost),
        total: Math.round(totalDeptSpend),
        budget: budget.amount * budgetMultiplier
      };
    }).sort((a, b) => b.total - a.total);

    // Label
    let label = `${selectedYear}`;
    if (!isYearlyView) {
        label = `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`;
    }

    return {
      totalSpend: totalSpendCalculated,
      totalBudget: totalBudgetCalculated,
      remainingBudget: remaining,
      spendPercentage: percentage,
      activeEmployeeCount: activeEmployees.length,
      deptData: departmentData,
      viewLabel: label
    };
  }, [employees, expenses, budgets, selectedYear, selectedMonth, years]);


  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeFinances(employees, expenses, budgets, `Dashboard View: ${viewLabel}. Analysis for ${selectedMonth === 'all' ? 'Yearly' : 'Monthly'} performance.`);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Executive Dashboard</h1>
          <p className="text-slate-500">Financial overview for <span className="font-semibold text-blue-700">{viewLabel}</span></p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
            {/* Filters */}
            <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
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
                className="flex items-center gap-2 bg-gradient-to-r from-blue-700 to-indigo-700 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
            >
            {isAnalyzing ? (
                <span className="animate-pulse">Analyzing...</span>
            ) : (
                <>
                <Sparkles size={18} />
                <span>AI Insight</span>
                </>
            )}
            </button>
        </div>
      </div>

      {/* AI Result Card */}
      {analysis && (
        <div className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 rounded-full text-blue-600">
              <Sparkles size={24} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-blue-900">AI Financial Assessment</h3>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  analysis.riskLevel === 'High' ? 'bg-red-100 text-red-700' :
                  analysis.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>Risk: {analysis.riskLevel}</span>
              </div>
              <p className="text-slate-700 mb-4 text-sm leading-relaxed">{analysis.summary}</p>
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Recommendations</h4>
                <ul className="space-y-2">
                  {analysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-1.5 w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button onClick={() => setAnalysis(null)} className="text-slate-400 hover:text-slate-600"><AlertCircle size={16} /></button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total {selectedMonth === 'all' ? 'Yearly' : 'Monthly'} Spend</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1">{formatINR(totalSpend)}</h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <IndianRupee size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs">
            <span className="text-slate-400">vs {formatINR(totalBudget)} budget</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Budget Utilization</p>
              <h3 className={`text-xl font-bold mt-1 ${spendPercentage > 100 ? 'text-red-500' : 'text-slate-800'}`}>
                {spendPercentage.toFixed(1)}%
              </h3>
            </div>
            <div className={`p-2 rounded-lg ${spendPercentage > 90 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
            <div 
              className={`h-full rounded-full ${spendPercentage > 100 ? 'bg-red-500' : 'bg-emerald-500'}`} 
              style={{ width: `${Math.min(spendPercentage, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Headcount</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1">{activeEmployeeCount}</h3>
            </div>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-purple-600 font-medium">
             Active Employees
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Remaining Budget</p>
              <h3 className={`text-xl font-bold mt-1 ${remainingBudget < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {formatINR(remainingBudget)}
              </h3>
            </div>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400">
            {selectedMonth === 'all' ? `Available for ${selectedYear}` : `Available for ${months.find(m => m.value === selectedMonth)?.label}`}
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-6">Spend by Department ({selectedMonth === 'all' ? 'Yearly' : 'Monthly'})</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11 }} 
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  tickFormatter={(value) => `₹${value/100000}L`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${formatINR(value)}`, '']}
                />
                <Bar dataKey="salary" stackId="a" fill="#3b82f6" name="Payroll" radius={[0, 0, 4, 4]} />
                <Bar dataKey="expenses" stackId="a" fill="#93c5fd" name="Expenses" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-6">Cost Distribution</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deptData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="total"
                >
                  {deptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${formatINR(value)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 max-h-48 overflow-y-auto">
            {deptData.map((entry, index) => (
              <div key={entry.name} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-slate-600">{entry.name}</span>
                </div>
                <span className="font-medium text-slate-800">₹{(entry.total/100000).toFixed(1)}L</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

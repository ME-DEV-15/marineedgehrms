
import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import { 
    Filter, 
    Search, 
    Trash2, 
    CheckSquare, 
    Square, 
    IndianRupee, 
    Calendar,
    Briefcase
} from 'lucide-react';

interface ExpensesOverviewProps {
    expenses: Expense[];
    departments: string[];
    onDeleteExpenses: (ids: string[]) => void;
}

const ExpensesOverview: React.FC<ExpensesOverviewProps> = ({ expenses, departments, onDeleteExpenses }) => {
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear() < 2025 ? 2025 : new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const [selectedDept, setSelectedDept] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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

    const categories = ['Software', 'Equipment', 'Travel', 'Events', 'Miscellaneous', 'Contractor', 'Salary'];

    // Filtering
    const filteredExpenses = useMemo(() => {
        return expenses.filter(exp => {
            const expDate = new Date(exp.date);
            const matchesYear = expDate.getFullYear() === selectedYear;
            const matchesMonth = selectedMonth === 'all' || expDate.getMonth().toString() === selectedMonth;
            const matchesDept = selectedDept === 'all' || exp.department === selectedDept;
            const matchesCategory = selectedCategory === 'all' || exp.category === selectedCategory;
            const matchesSearch = searchTerm === '' || 
                                  exp.description.toLowerCase().includes(searchTerm.toLowerCase());
            
            return matchesYear && matchesMonth && matchesDept && matchesCategory && matchesSearch;
        }).sort((a, b) => {
            // Sort by Date Descending
            const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
            if (dateDiff !== 0) return dateDiff;
            // Tie-breaker: ID descending (Creation order for local/timestamp based IDs)
            return b.id.localeCompare(a.id);
        });
    }, [expenses, selectedYear, selectedMonth, selectedDept, selectedCategory, searchTerm]);

    const formatINR = (value: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(value);
    };

    // Selection Handlers
    const toggleSelectAll = () => {
        if (selectedIds.size === filteredExpenses.length && filteredExpenses.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredExpenses.map(e => e.id)));
        }
    };

    const toggleSelectId = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleDelete = () => {
        onDeleteExpenses(Array.from(selectedIds));
        setSelectedIds(new Set());
        setIsDeleteModalOpen(false);
    };

    // Stats
    const totalAmount = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Expenses Overview</h2>
                    <p className="text-slate-500">Track and manage organizational spending.</p>
                </div>
                <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                    <div className="text-right">
                        <p className="text-xs text-slate-400 font-bold uppercase">Total Spend</p>
                        <p className="text-lg font-bold text-slate-800">{formatINR(totalAmount)}</p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-md text-blue-600">
                        <IndianRupee size={20} />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search description..." 
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select 
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 appearance-none"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>

                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select 
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 appearance-none"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                        <option value="all">All Months</option>
                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                </div>

                <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select 
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 appearance-none"
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                    >
                        <option value="all">All Departments</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>

                 <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select 
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 appearance-none"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="all">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-1">
                    <span className="text-sm text-blue-800 font-medium ml-2">{selectedIds.size} expense(s) selected</span>
                    <button 
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                        <Trash2 size={16} /> Delete Selected
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 w-12 text-center">
                                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-blue-600">
                                        {selectedIds.size > 0 && selectedIds.size === filteredExpenses.length ? 
                                            <CheckSquare size={18} className="text-blue-600" /> : 
                                            <Square size={18} />
                                        }
                                    </button>
                                </th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4">Department</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredExpenses.length > 0 ? filteredExpenses.map(exp => {
                                const isSelected = selectedIds.has(exp.id);
                                return (
                                    <tr 
                                        key={exp.id} 
                                        className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}
                                    >
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => toggleSelectId(exp.id)} className="text-slate-400 hover:text-blue-600">
                                                {isSelected ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">{exp.date}</td>
                                        <td className="px-6 py-4 font-medium text-slate-800">{exp.description}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-block bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200 text-slate-600">
                                                {exp.department}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${exp.category === 'Salary' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}`}>
                                                {exp.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-800 font-medium text-right">{formatINR(exp.amount)}</td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        No expenses found matching filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 border-t-4 border-red-600">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center rounded-t-xl">
                            <h3 className="font-bold text-lg text-red-600 flex items-center gap-2"><Trash2 size={20} /> Confirm Deletion</h3>
                            <button onClick={() => setIsDeleteModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-slate-600 text-sm">
                                Are you sure you want to permanently delete <strong>{selectedIds.size} expense(s)</strong>?
                            </p>
                            <p className="text-red-600 text-sm font-semibold bg-red-50 p-3 rounded-lg border border-red-100">
                                This action cannot be undone.
                            </p>
                            
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium bg-white">Cancel</button>
                                <button onClick={handleDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpensesOverview;


import React, { useState } from 'react';
import { Budget, Department, Employee } from '../types';
import { 
    Plus, 
    Trash2, 
    Edit2, 
    Save, 
    X, 
    IndianRupee, 
    AlertTriangle,
    Building2 
} from 'lucide-react';

interface SettingsProps {
    departments: string[];
    budgets: Budget[];
    employees: Employee[];
    onAddDepartment: (name: string, budget: number) => void;
    onUpdateDepartment: (oldName: string, newName: string, budget: number) => void;
    onDeleteDepartment: (name: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
    departments, 
    budgets, 
    employees,
    onAddDepartment, 
    onUpdateDepartment, 
    onDeleteDepartment 
}) => {
    const [isAddMode, setIsAddMode] = useState(false);
    const [newDeptName, setNewDeptName] = useState('');
    const [newDeptBudget, setNewDeptBudget] = useState('');
    
    // Edit Mode State
    const [editingDept, setEditingDept] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editBudget, setEditBudget] = useState('');

    const formatINR = (value: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(value);
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newDeptName && newDeptBudget) {
            onAddDepartment(newDeptName, parseFloat(newDeptBudget));
            setNewDeptName('');
            setNewDeptBudget('');
            setIsAddMode(false);
        }
    };

    const startEdit = (dept: string) => {
        const budget = budgets.find(b => b.department === dept)?.amount || 0;
        setEditingDept(dept);
        setEditName(dept);
        setEditBudget(budget.toString());
    };

    const handleUpdateSubmit = (oldName: string) => {
        if (editName && editBudget) {
            onUpdateDepartment(oldName, editName, parseFloat(editBudget));
            setEditingDept(null);
        }
    };

    const getEmployeeCount = (dept: string) => {
        return employees.filter(e => e.department === dept).length;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">System Settings</h2>
                    <p className="text-slate-500">Manage departments and budgets.</p>
                </div>
                <button 
                    onClick={() => setIsAddMode(true)}
                    className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors shadow-sm"
                >
                    <Plus size={18} /> Add New Department
                </button>
            </div>

            {isAddMode && (
                <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-md animate-in fade-in slide-in-from-top-2">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Building2 size={20} className="text-blue-600" />
                        Create New Department
                    </h3>
                    <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Department Name</label>
                            <input 
                                type="text" 
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                                placeholder="e.g. Research"
                                value={newDeptName}
                                onChange={(e) => setNewDeptName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Budget (INR)</label>
                            <input 
                                type="number" 
                                required
                                min="0"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                                placeholder="2500000"
                                value={newDeptBudget}
                                onChange={(e) => setNewDeptBudget(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium">Create</button>
                            <button type="button" onClick={() => setIsAddMode(false)} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 bg-white">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-lg text-slate-800">Departments & Budgets</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Department Name</th>
                                <th className="px-6 py-4 text-right">Monthly Budget</th>
                                <th className="px-6 py-4 text-center">Employees</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {departments.map(dept => {
                                const isEditing = editingDept === dept;
                                const budget = budgets.find(b => b.department === dept)?.amount || 0;
                                const empCount = getEmployeeCount(dept);

                                return (
                                    <tr key={dept} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-800">
                                            {isEditing ? (
                                                <input 
                                                    type="text" 
                                                    className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-900"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                />
                                            ) : dept}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-600">
                                            {isEditing ? (
                                                <input 
                                                    type="number" 
                                                    className="w-32 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-right ml-auto block bg-white text-slate-900"
                                                    value={editBudget}
                                                    onChange={(e) => setEditBudget(e.target.value)}
                                                />
                                            ) : formatINR(budget)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${empCount > 0 ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>
                                                {empCount} Active
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {isEditing ? (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleUpdateSubmit(dept)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"><Save size={18} /></button>
                                                    <button onClick={() => setEditingDept(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded"><X size={18} /></button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => startEdit(dept)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit Budget/Name">
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => onDeleteDepartment(dept)} 
                                                        className={`p-1.5 rounded transition-colors ${empCount > 0 ? 'text-slate-300 cursor-not-allowed' : 'text-red-500 hover:bg-red-50'}`}
                                                        disabled={empCount > 0}
                                                        title={empCount > 0 ? "Cannot delete department with active employees" : "Delete Department"}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg flex items-start gap-3">
                <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-yellow-800">
                    <p className="font-semibold">Note on Deletion</p>
                    <p>You cannot delete a department that has active employees assigned to it. Please reassign or remove employees first.</p>
                </div>
            </div>
        </div>
    );
};

export default Settings;


import React, { useState, useEffect } from 'react';
import { Employee, Department, EmployeeDocument, DepartmentAssignment } from '../types';
import { Search, UserPlus, Filter, ChevronRight, Upload, X, FileText, Check, Users, UserX, UserCheck, Square, CheckSquare, Trash2, AlertTriangle, Edit, Plus, Minus } from 'lucide-react';

interface EmployeeListProps {
  employees: Employee[];
  departments: string[];
  onSelectEmployee: (id: string) => void;
  onAddEmployee: (emp: Omit<Employee, 'id' | 'payouts'>) => void;
  onUpdateEmployee: (id: string, emp: Partial<Employee>) => void;
  onTerminateEmployee: (id: string, date: string) => void;
  onDeleteEmployee: (id: string) => void;
}

const EmployeeList: React.FC<EmployeeListProps> = ({ employees, departments, onSelectEmployee, onAddEmployee, onUpdateEmployee, onTerminateEmployee, onDeleteEmployee }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'Active' | 'Terminated'>('Active');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Bulk Actions State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkTerminateModalOpen, setIsBulkTerminateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bulkTerminationDate, setBulkTerminationDate] = useState(new Date().toISOString().split('T')[0]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    startDate: new Date().toISOString().split('T')[0],
    email: '',
    phone: '',
    upiId: '',
    dob: '',
    // Dynamic Department Allocations
    allocations: [{ department: '', monthlySalary: '' }] as { department: string, monthlySalary: string }[]
  });

  // File Upload State
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    aadhar: null,
    pan: null,
    bank: null,
    agreement: null,
    photo: null
  });

    // Optional Drive links per document type
    const [driveLinks, setDriveLinks] = useState<{ [key: string]: string }>({
        aadhar: '',
        pan: '',
        bank: '',
        agreement: '',
        photo: ''
    });

  // Initialize form with first department by default
  useEffect(() => {
    if (!isEditMode && formData.allocations[0].department === '' && departments.length > 0) {
        setFormData(prev => ({ ...prev, allocations: [{ department: departments[0], monthlySalary: '' }]}));
    }
  }, [departments, isEditMode]);

  // Clear selection when view mode changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [viewMode, filterDept, searchTerm]);

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === 'All' || 
                        emp.department === filterDept || 
                        (emp.departmentAssignments && emp.departmentAssignments.some(da => da.department === filterDept));
    const matchesStatus = emp.status === viewMode;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [type]: e.target.files![0] }));
    }
  };

  // --- Modal & Edit Logic ---

  const openAddModal = () => {
      setIsEditMode(false);
      setEditingId(null);
      setFormData({
        name: '', role: '', startDate: new Date().toISOString().split('T')[0],
        email: '', phone: '', upiId: '', dob: '',
        allocations: [{ department: departments[0] || '', monthlySalary: '' }]
      });
      setFiles({ aadhar: null, pan: null, bank: null, agreement: null, photo: null });
    setDriveLinks({ aadhar: '', pan: '', bank: '', agreement: '', photo: '' });
      setIsModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, emp: Employee) => {
      e.stopPropagation();
      setIsEditMode(true);
      setEditingId(emp.id);
      
      const allocations = emp.departmentAssignments.length > 0 
        ? emp.departmentAssignments.map(a => ({ department: a.department, monthlySalary: Math.round(a.annualSalary / 12).toString() }))
        : [{ department: emp.department, monthlySalary: Math.round(emp.annualSalary / 12).toString() }];

      setFormData({
        name: emp.name,
        role: emp.role,
        startDate: emp.startDate,
        email: emp.email || '',
        phone: emp.phone || '',
        upiId: emp.upiId || '',
        dob: emp.dob || '',
        allocations
      });
      // Not loading files for edit mode simplicity in this version, only data
      setFiles({ aadhar: null, pan: null, bank: null, agreement: null, photo: null });
            // Prefill drive links from existing docs, matched by type
            const existing = emp.documents || [];
            const byType = (t: string) => existing.find(d => d.type === t)?.driveUrl || '';
            setDriveLinks({
                aadhar: byType('Aadhar Card'),
                pan: byType('PAN Card'),
                bank: byType('Bank Details'),
                agreement: byType('Employment Form'),
                photo: byType('Photo')
            });
      setIsModalOpen(true);
  };

  // --- Dynamic Form Handlers ---
  const handleAllocationChange = (index: number, field: 'department' | 'monthlySalary', value: string) => {
      const newAllocations = [...formData.allocations];
      newAllocations[index] = { ...newAllocations[index], [field]: value };
      setFormData({ ...formData, allocations: newAllocations });
  };

  const addAllocationRow = () => {
      setFormData(prev => ({
          ...prev,
          allocations: [...prev.allocations, { department: departments[0] || '', monthlySalary: '' }]
      }));
  };

  const removeAllocationRow = (index: number) => {
      if (formData.allocations.length > 1) {
        setFormData(prev => ({
            ...prev,
            allocations: prev.allocations.filter((_, i) => i !== index)
        }));
      }
  };

  const calculateTotalMonthly = () => {
      return formData.allocations.reduce((acc, curr) => acc + (parseFloat(curr.monthlySalary) || 0), 0);
  };

  // --- Submission ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.role || !formData.startDate) {
      alert('Please fill in all required fields (Name, Role, Joining Date).');
      return;
    }
    
    if (formData.allocations.some(a => !a.department || !a.monthlySalary)) {
      alert('Please fill in all department and salary fields.');
      return;
    }

    try {
      // Handle Docs
      const docs: EmployeeDocument[] = [];
      const fileEntries = [
        { file: files.aadhar, type: 'Aadhar Card' },
        { file: files.pan, type: 'PAN Card' },
        { file: files.bank, type: 'Bank Details' },
        { file: files.agreement, type: 'Employment Form' },
        { file: files.photo, type: 'Photo' }
      ];

      for (const entry of fileEntries) {
        if (entry.file) {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(entry.file!);
          });
          
          docs.push({
            type: entry.type as any,
            status: 'Uploaded',
            lastUpdated: new Date().toISOString().split('T')[0],
            fileName: entry.file.name,
            data: base64
          });
        }
      }

      // Add Drive links (one per document type) even if no file selected
      const linkEntries = [
        { key: 'aadhar', type: 'Aadhar Card' },
        { key: 'pan', type: 'PAN Card' },
        { key: 'bank', type: 'Bank Details' },
        { key: 'agreement', type: 'Employment Form' },
        { key: 'photo', type: 'Photo' }
      ] as const;

      for (const entry of linkEntries) {
        const url = (driveLinks[entry.key] || '').trim();
        if (!url) continue;

        // Avoid duplicates: if a file doc already exists for this type, attach the link to it
        const existing = docs.find(d => d.type === entry.type);
        if (existing) {
          (existing as any).driveUrl = url;
        } else {
          docs.push({
            type: entry.type,
            status: 'Uploaded',
            lastUpdated: new Date().toISOString().split('T')[0],
            driveUrl: url
          } as any);
        }
      }

      // Process Departments & Salary
      const departmentAssignments: DepartmentAssignment[] = formData.allocations
        .filter(a => a.department && a.monthlySalary)
        .map(a => ({
          department: a.department,
          annualSalary: (parseFloat(a.monthlySalary) || 0) * 12
        }));

      const totalAnnualSalary = departmentAssignments.reduce((acc, a) => acc + a.annualSalary, 0);
      const primaryDepartment = departmentAssignments.length > 0 ? departmentAssignments[0].department : departments[0];

      const empData = {
        name: formData.name.trim(),
        role: formData.role.trim(),
        department: primaryDepartment,
        departmentAssignments,
        annualSalary: totalAnnualSalary,
        startDate: formData.startDate,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        upiId: formData.upiId.trim(),
        dob: formData.dob,
      };

      if (isEditMode && editingId) {
        // Update
        const existingDocs = employees.find(e => e.id === editingId)?.documents || [];
        onUpdateEmployee(editingId, {
          ...empData,
          documents: [...existingDocs, ...docs]
        });
      } else {
        // Add
        onAddEmployee({
          ...empData,
          status: 'Active',
          documents: docs
        });
      }
      
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error submitting employee form:', err);
      alert('Failed to save employee. Please try again.');
    }
  };

  // --- Bulk Actions Handlers ---
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredEmployees.length && filteredEmployees.length > 0) {
        setSelectedIds(new Set());
    } else {
        setSelectedIds(new Set(filteredEmployees.map(e => e.id)));
    }
  };

  const toggleSelectId = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) {
          newSet.delete(id);
      } else {
          newSet.add(id);
      }
      setSelectedIds(newSet);
  };

  const handleBulkTerminateSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      selectedIds.forEach(id => {
          onTerminateEmployee(id, bulkTerminationDate);
      });
      setSelectedIds(new Set());
      setIsBulkTerminateModalOpen(false);
  };

  const handleBulkDeleteSubmit = () => {
      selectedIds.forEach(id => {
          onDeleteEmployee(id);
      });
      setSelectedIds(new Set());
      setIsDeleteModalOpen(false);
  };

  const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 outline-none bg-white text-black placeholder-slate-400";

  return (
    <div className="space-y-6">
       <div className="flex flex-col lg:flex-row justify-between items-end lg:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">Employee Directory</h2>
            <p className="text-slate-500">Manage your workforce and view profiles.</p>
        </div>
        <div className="flex gap-3">
             {selectedIds.size > 0 && viewMode === 'Active' && (
                <button 
                    onClick={() => setIsBulkTerminateModalOpen(true)}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm animate-in fade-in"
                >
                    <Trash2 size={18} /> Terminate ({selectedIds.size})
                </button>
             )}
             {selectedIds.size > 0 && viewMode === 'Terminated' && (
                <button 
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm animate-in fade-in"
                >
                    <Trash2 size={18} /> Permanently Delete ({selectedIds.size})
                </button>
             )}
             <div className="bg-slate-100 p-1 rounded-lg flex border border-slate-200">
                <button 
                    onClick={() => setViewMode('Active')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'Active' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <UserCheck size={16} /> Active
                </button>
                <button 
                    onClick={() => setViewMode('Terminated')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'Terminated' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <UserX size={16} /> Previous
                </button>
             </div>
            <button 
                onClick={openAddModal}
                className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors shadow-sm"
            >
                <UserPlus size={18} /> Add Employee
            </button>
        </div>
       </div>

       {/* Filters */}
       <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder={`Search ${viewMode.toLowerCase()} employees...`}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="w-full md:w-64 relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 appearance-none"
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                >
                    <option value="All">All Departments</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
       </div>

       {/* List */}
       <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 w-12 text-center">
                                <button onClick={toggleSelectAll} className="text-slate-400 hover:text-blue-600">
                                    {selectedIds.size > 0 && selectedIds.size === filteredEmployees.length ? 
                                        <CheckSquare size={18} className="text-blue-600" /> : 
                                        <Square size={18} />
                                    }
                                </button>
                            </th>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Department(s)</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4 text-right">Total Monthly</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                            <th className="px-6 py-4 text-center">Profile</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredEmployees.length > 0 ? filteredEmployees.map(emp => {
                            const isSelected = selectedIds.has(emp.id);
                            // Determine departments list
                            const depts = emp.departmentAssignments && emp.departmentAssignments.length > 0
                                ? emp.departmentAssignments.map(d => d.department).join(', ')
                                : emp.department;

                            return (
                                <tr 
                                    key={emp.id} 
                                    className={`hover:bg-slate-50 transition-colors cursor-pointer group ${isSelected ? 'bg-blue-50/50' : ''}`}
                                    onClick={() => onSelectEmployee(emp.id)}
                                >
                                    <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                        <button onClick={(e) => toggleSelectId(emp.id, e)} className="text-slate-400 hover:text-blue-600">
                                            {isSelected ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${viewMode === 'Active' ? 'bg-blue-100 text-blue-600 group-hover:bg-blue-200' : 'bg-slate-100 text-slate-500'}`}>
                                                {emp.name.charAt(0)}
                                            </div>
                                            <div>
                                                <span className="font-medium text-slate-800 group-hover:text-blue-700 transition-colors block">
                                                    {emp.name}
                                                </span>
                                                {emp.email && <span className="text-xs text-slate-400 block">{emp.email}</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        <span className="inline-block bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200 max-w-[200px] truncate">
                                            {depts}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 text-sm">{emp.role}</td>
                                    <td className="px-6 py-4 text-right font-medium text-slate-800 text-sm">{formatINR(emp.annualSalary / 12)}</td>
                                    <td className="px-6 py-4 text-center">
                                        {viewMode === 'Active' && (
                                            <button 
                                                onClick={(e) => openEditModal(e, emp)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="Edit Details"
                                            >
                                                <Edit size={16} />
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center text-slate-300 group-hover:text-blue-600 transition-colors">
                                            <ChevronRight size={18} />
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                    No {viewMode.toLowerCase()} employees found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
       </div>

       {/* Bulk Terminate & Delete Modals (Same as before) */}
       {isBulkTerminateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 border-t-4 border-red-500">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center rounded-t-xl">
                    <h3 className="font-bold text-lg text-red-600 flex items-center gap-2"><AlertTriangle size={20} /> Bulk Termination</h3>
                    <button onClick={() => setIsBulkTerminateModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
                </div>
                <form onSubmit={handleBulkTerminateSubmit} className="p-6 space-y-4">
                    <p className="text-slate-600 text-sm">
                        You are about to terminate <strong>{selectedIds.size} employees</strong>. 
                        This action will move them to the "Previous Employees" list.
                    </p>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Termination Date</label>
                        <input 
                            required 
                            type="date" 
                            className={inputClass}
                            value={bulkTerminationDate}
                            onChange={(e) => setBulkTerminationDate(e.target.value)}
                        />
                    </div>
                    
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsBulkTerminateModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium bg-white">Cancel</button>
                        <button type="submit" className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm">Confirm All</button>
                    </div>
                </form>
            </div>
        </div>
       )}

       {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 border-t-4 border-red-600">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center rounded-t-xl">
                    <h3 className="font-bold text-lg text-red-600 flex items-center gap-2"><AlertTriangle size={20} /> Permanently Delete</h3>
                    <button onClick={() => setIsDeleteModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-slate-600 text-sm">
                        Are you sure you want to <strong>permanently delete</strong> {selectedIds.size} employees?
                    </p>
                    <p className="text-red-600 text-sm font-semibold bg-red-50 p-3 rounded-lg border border-red-100">
                        This action cannot be undone. All data associated with these employees will be removed from the directory.
                    </p>
                    
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium bg-white">Cancel</button>
                        <button onClick={handleBulkDeleteSubmit} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm">Delete Forever</button>
                    </div>
                </div>
            </div>
        </div>
       )}

       {/* Add/Edit Employee Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center rounded-t-xl shrink-0">
                    <h3 className="font-bold text-lg text-slate-800">{isEditMode ? 'Edit Employee Details' : 'Add New Employee'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Personal & Professional Info */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                                <input required type="text" className={inputClass}
                                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
                                <input required type="text" className={inputClass} 
                                    value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                                <input type="date" className={inputClass}
                                    value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input type="email" className={inputClass}
                                    value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                <input type="tel" className={inputClass}
                                    value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Joining Date *</label>
                                <input required type="date" className={inputClass}
                                    value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">UPI ID</label>
                                <input type="text" placeholder="e.g. name@okhdfcbank" className={inputClass}
                                    value={formData.upiId} onChange={(e) => setFormData({...formData, upiId: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    {/* Financial - Multiple Departments */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Department Allocation & Salary</h4>
                            <button type="button" onClick={addAllocationRow} className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium">
                                <Plus size={14} /> Add Department
                            </button>
                        </div>
                        
                        <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                             {formData.allocations.map((alloc, index) => (
                                 <div key={index} className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Department</label>
                                        <select 
                                            className={inputClass}
                                            value={alloc.department}
                                            onChange={(e) => handleAllocationChange(index, 'department', e.target.value)}
                                            required
                                        >
                                            <option value="">Select Dept</option>
                                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Monthly Salary (INR)</label>
                                        <input 
                                            type="number"
                                            min="0"
                                            className={inputClass}
                                            value={alloc.monthlySalary}
                                            onChange={(e) => handleAllocationChange(index, 'monthlySalary', e.target.value)}
                                            required
                                            placeholder="0"
                                        />
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => removeAllocationRow(index)}
                                        className={`mb-[5px] p-2 rounded text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors ${formData.allocations.length === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={formData.allocations.length === 1}
                                    >
                                        <Minus size={18} />
                                    </button>
                                 </div>
                             ))}
                             
                             <div className="pt-2 border-t border-slate-200 mt-2 flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-600">Total Monthly Salary:</span>
                                <span className="text-sm font-bold text-slate-900">{formatINR(calculateTotalMonthly())}</span>
                             </div>
                             <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-600">Total Annual CTC:</span>
                                <span className="text-sm font-bold text-emerald-600">{formatINR(calculateTotalMonthly() * 12)}</span>
                             </div>
                        </div>
                    </div>

                    {/* Documents */}
                    {!isEditMode && (
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Documents</h4>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { id: 'photo', label: 'Employee Photo' },
                                    { id: 'aadhar', label: 'Aadhar Card' },
                                    { id: 'pan', label: 'PAN Card' },
                                    { id: 'bank', label: 'Bank Passbook' },
                                    { id: 'agreement', label: 'Employment Agreement' }
                                ].map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <FileText size={20} className="text-slate-400" />
                                            <span className="text-sm font-medium text-slate-700">{doc.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {files[doc.id] && <span className="text-xs text-emerald-600 flex items-center gap-1"><Check size={12}/> {files[doc.id]?.name}</span>}
                                            <input
                                                type="url"
                                                placeholder="Drive link (optional)"
                                                value={driveLinks[doc.id] || ''}
                                                onChange={(e) => setDriveLinks(prev => ({ ...prev, [doc.id]: e.target.value }))}
                                                className="hidden sm:block w-64 px-3 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                            <label className="cursor-pointer bg-white border border-slate-300 text-slate-600 px-3 py-1 rounded text-xs font-medium hover:bg-slate-100 transition-colors">
                                                Upload
                                                <input type="file" className="hidden" onChange={(e) => handleFileChange(e, doc.id)} />
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Mobile-only Drive links */}
                            <div className="sm:hidden grid grid-cols-1 gap-2">
                                {[
                                    { id: 'photo', label: 'Employee Photo' },
                                    { id: 'aadhar', label: 'Aadhar Card' },
                                    { id: 'pan', label: 'PAN Card' },
                                    { id: 'bank', label: 'Bank Passbook' },
                                    { id: 'agreement', label: 'Employment Agreement' }
                                ].map((doc) => (
                                    <div key={doc.id}>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">{doc.label} Drive Link (optional)</label>
                                        <input
                                            type="url"
                                            placeholder="https://drive.google.com/..."
                                            value={driveLinks[doc.id] || ''}
                                            onChange={(e) => setDriveLinks(prev => ({ ...prev, [doc.id]: e.target.value }))}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 placeholder-slate-400"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </form>

                <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium transition-colors bg-white">Cancel</button>
                    <button onClick={handleSubmit} type="button" className="flex-1 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 font-medium shadow-sm transition-colors">
                        {isEditMode ? 'Update Employee' : 'Save Employee'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;

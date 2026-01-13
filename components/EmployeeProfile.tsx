
import React, { useState } from 'react';
import { Employee, SalaryPayout, Expense } from '../types';
import { 
  ArrowLeft, 
  Calendar, 
  Briefcase, 
  IndianRupee, 
  FileText, 
  CheckCircle, 
  Clock, 
  Shield, 
  Upload, 
  Plus,
  Trash2,
  AlertTriangle,
  UserX,
  PieChart
} from 'lucide-react';

interface EmployeeProfileProps {
  employee: Employee;
  onBack: () => void;
  onRecordPayment: (employeeId: string, amount: number, type: SalaryPayout['type'], date: string) => void;
  onTerminate: (employeeId: string, date: string) => void;
}

const EmployeeProfile: React.FC<EmployeeProfileProps> = ({ employee, onBack, onRecordPayment, onTerminate }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'documents' | 'history'>('info');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    type: 'Salary' as SalaryPayout['type'],
    date: new Date().toISOString().split('T')[0]
  });
  const [terminationDate, setTerminationDate] = useState(new Date().toISOString().split('T')[0]);

  const calculateExperience = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    return `${years} years, ${months} months`;
  };

  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(value);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRecordPayment(employee.id, parseFloat(paymentForm.amount), paymentForm.type, paymentForm.date);
    setIsPaymentModalOpen(false);
    setPaymentForm({ amount: '', type: 'Salary', date: new Date().toISOString().split('T')[0] });
  };

  const handleTerminateSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onTerminate(employee.id, terminationDate);
      setIsTerminateModalOpen(false);
  };

  const handleViewDocument = (doc: any) => {
      if (doc.driveUrl) {
          window.open(doc.driveUrl, '_blank', 'noopener,noreferrer');
          return;
      }
      if (doc.data) {
          const win = window.open();
          if (win) {
              win.document.write(`<iframe src="${doc.data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
          }
      } else {
          alert("Document preview not available. File might have been uploaded before security update.");
      }
  };

  const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black";

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft size={18} /> Back to Directory
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex gap-4 items-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${employee.status === 'Terminated' ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'}`}>
                {employee.name.charAt(0)}
            </div>
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-slate-900">{employee.name}</h1>
                    {employee.status === 'Terminated' ? (
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <UserX size={14} /> Terminated
                        </span>
                    ) : (
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <CheckCircle size={14} /> Active
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><Briefcase size={14} /> {employee.role}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span>{employee.department}</span>
                </div>
            </div>
        </div>
        <div className="flex gap-3">
            {employee.status === 'Active' && (
                <>
                    <button 
                        onClick={() => setIsTerminateModalOpen(true)}
                        className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 font-medium"
                    >
                        <Trash2 size={18} /> Terminate
                    </button>
                    <button 
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-2 shadow-sm font-medium"
                    >
                        <IndianRupee size={18} /> Record Payment
                    </button>
                </>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar Info */}
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Employment Details</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-semibold">Joined Marine Edge</label>
                        <div className="flex items-center gap-2 mt-1">
                            <Calendar size={16} className="text-blue-500" />
                            <span className="text-slate-700 font-medium">{employee.startDate}</span>
                        </div>
                    </div>
                    {employee.status === 'Terminated' && (
                        <div>
                            <label className="text-xs text-slate-400 uppercase font-semibold">Terminated On</label>
                            <div className="flex items-center gap-2 mt-1">
                                <UserX size={16} className="text-red-500" />
                                <span className="text-red-700 font-medium">{employee.terminationDate}</span>
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-semibold">Experience @ ME</label>
                        <div className="flex items-center gap-2 mt-1">
                            <Clock size={16} className="text-blue-500" />
                            <span className="text-slate-700 font-medium">{calculateExperience(employee.startDate, employee.terminationDate)}</span>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-semibold">Total Annual CTC</label>
                        <div className="flex items-center gap-2 mt-1">
                            <IndianRupee size={16} className="text-emerald-500" />
                            <span className="text-slate-700 font-medium text-lg">{formatINR(employee.annualSalary)}</span>
                        </div>
                    </div>
                </div>
            </div>

             {/* Department Allocations Card */}
             {employee.departmentAssignments && employee.departmentAssignments.length > 0 && (
                 <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                        <PieChart size={16} /> Department Allocation
                    </h3>
                    <div className="space-y-3">
                        {employee.departmentAssignments.map((assign, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="text-slate-600 font-medium">{assign.department}</span>
                                <div className="text-right">
                                    <span className="block text-slate-800 font-bold">{formatINR(assign.annualSalary)}</span>
                                    <span className="text-xs text-slate-400">
                                        {(assign.annualSalary / employee.annualSalary * 100).toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
             )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Contact</h3>
                <div className="space-y-3">
                    <div className="text-sm">
                        <span className="block text-slate-400 text-xs uppercase">Email</span>
                        <span className="text-slate-700">{employee.email || `${employee.name.toLowerCase().replace(' ', '.')}@marineedge.com`}</span>
                    </div>
                    <div className="text-sm">
                         <span className="block text-slate-400 text-xs uppercase">Phone</span>
                        <span className="text-slate-700">{employee.phone || '+91 98765 43210'}</span>
                    </div>
                    {employee.upiId && (
                        <div className="text-sm">
                            <span className="block text-slate-400 text-xs uppercase">UPI ID</span>
                            <span className="text-slate-700">{employee.upiId}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Main Content Tabs */}
        <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[500px]">
                <div className="flex border-b border-slate-100">
                    <button 
                        onClick={() => setActiveTab('info')}
                        className={`flex-1 py-4 text-sm font-medium text-center transition-colors border-b-2 ${activeTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                    >
                        Overview
                    </button>
                    <button 
                        onClick={() => setActiveTab('documents')}
                        className={`flex-1 py-4 text-sm font-medium text-center transition-colors border-b-2 ${activeTab === 'documents' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                    >
                        Documents ({employee.documents.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-4 text-sm font-medium text-center transition-colors border-b-2 ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                    >
                        Payment History
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'info' && (
                        <div className="text-center py-10 text-slate-500">
                            <Shield size={48} className="mx-auto text-slate-200 mb-4" />
                            <p>Employee confidential data is secure.</p>
                            <p className="text-sm mt-2">Select "Documents" to view KYC details or "Payment History" for salary records.</p>
                        </div>
                    )}

                    {activeTab === 'documents' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {employee.documents.map((doc, idx) => (
                                <div key={idx} className="border border-slate-200 rounded-lg p-4 hover:border-blue-200 transition-colors group">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-3">
                                            <div className="p-2 bg-slate-100 rounded text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-slate-800">{doc.type}</h4>
                                                <p className="text-xs text-slate-500 mt-1">Updated: {doc.lastUpdated}</p>
                                                {doc.fileName && <p className="text-xs text-blue-600 mt-1 truncate max-w-[150px]">{doc.fileName}</p>}
                                            </div>
                                        </div>
                                        {doc.status === 'Verified' ? (
                                            <span className="text-emerald-500"><CheckCircle size={16} /></span>
                                        ) : (
                                            <span className="text-amber-500"><Clock size={16} /></span>
                                        )}
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <button onClick={() => handleViewDocument(doc)} className="text-xs font-medium text-blue-600 hover:underline">View</button>
                                        {doc.driveUrl && (
                                            <button
                                                onClick={() => window.open(doc.driveUrl, '_blank', 'noopener,noreferrer')}
                                                className="text-xs font-medium text-emerald-700 hover:underline"
                                            >
                                                Open Drive
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <button className="border border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
                                <Upload size={24} className="mb-2" />
                                <span className="text-sm font-medium">Upload New Document</span>
                            </button>
                        </div>
                    )}

                    {activeTab === 'history' && (
                         <div className="space-y-4">
                            {employee.payouts.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">No payment history available.</div>
                            ) : (
                                <div className="overflow-hidden rounded-lg border border-slate-200">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-slate-500 font-medium">
                                            <tr>
                                                <th className="px-4 py-3">Date</th>
                                                <th className="px-4 py-3">Type</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {/* Sort by date descending so newest is first, ID as tie-breaker for same day */}
                                            {employee.payouts.slice().sort((a,b) => {
                                                const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
                                                if (dateDiff !== 0) return dateDiff;
                                                return b.id.localeCompare(a.id);
                                            }).map((payout) => (
                                                <tr key={payout.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3 text-slate-600">{payout.date}</td>
                                                    <td className="px-4 py-3 font-medium text-slate-800">{payout.type}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                                                            {payout.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium text-slate-800">{formatINR(payout.amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                         </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center rounded-t-xl">
                    <h3 className="font-bold text-lg text-slate-800">Record Salary Payment</h3>
                    <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
                </div>
                <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                        Recording payment for <strong>{employee.name}</strong>. This will be added to organization expenses.
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Payment Type</label>
                        <select 
                            className={inputClass}
                            value={paymentForm.type}
                            onChange={(e) => setPaymentForm({...paymentForm, type: e.target.value as any})}
                        >
                            <option value="Salary">Salary</option>
                            <option value="Bonus">Bonus</option>
                            <option value="Reimbursement">Reimbursement</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Amount (INR)</label>
                            <input 
                                required 
                                type="number" 
                                min="0" 
                                className={inputClass}
                                value={paymentForm.amount}
                                onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                            <input 
                                required 
                                type="date" 
                                className={inputClass}
                                value={paymentForm.date}
                                onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})}
                            />
                        </div>
                    </div>
                    
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium bg-white">Cancel</button>
                        <button type="submit" className="flex-1 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 font-medium shadow-sm">Record Payment</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Terminate Modal */}
      {isTerminateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 border-t-4 border-red-500">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center rounded-t-xl">
                    <h3 className="font-bold text-lg text-red-600 flex items-center gap-2"><AlertTriangle size={20} /> Terminate Employee</h3>
                    <button onClick={() => setIsTerminateModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
                </div>
                <form onSubmit={handleTerminateSubmit} className="p-6 space-y-4">
                    <p className="text-slate-600 text-sm">
                        Are you sure you want to terminate <strong>{employee.name}</strong>? 
                        This action will move them to the "Previous Employees" list and disable future payroll entries.
                    </p>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Termination Date</label>
                        <input 
                            required 
                            type="date" 
                            className={inputClass}
                            value={terminationDate}
                            onChange={(e) => setTerminationDate(e.target.value)}
                        />
                    </div>
                    
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsTerminateModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium bg-white">Cancel</button>
                        <button type="submit" className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm">Confirm Termination</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeProfile;

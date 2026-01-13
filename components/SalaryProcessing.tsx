
import React, { useState, useEffect } from 'react';
import { Employee, SalaryPayout } from '../types';
import { IndianRupee, CheckSquare, Square, Calendar, Banknote } from 'lucide-react';

interface SalaryProcessingProps {
  employees: Employee[];
  onProcessBulkPayment: (payments: { employeeId: string, amount: number }[], date: string, type: SalaryPayout['type']) => void;
}

const SalaryProcessing: React.FC<SalaryProcessingProps> = ({ employees, onProcessBulkPayment }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentType, setPaymentType] = useState<SalaryPayout['type']>('Salary');
  
  // Only active employees should appear in payroll
  const activeEmployees = employees.filter(e => e.status === 'Active');
  
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set(activeEmployees.map(e => e.id)));
  const [payoutAmounts, setPayoutAmounts] = useState<{ [key: string]: number }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Initialize payout amounts with monthly salary for active employees
  useEffect(() => {
    const initialAmounts: { [key: string]: number } = {};
    activeEmployees.forEach(emp => {
      initialAmounts[emp.id] = Math.round(emp.annualSalary / 12);
    });
    setPayoutAmounts(initialAmounts);
  }, [employees]);

  const handleToggleAll = () => {
    if (selectedEmployees.size === activeEmployees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(activeEmployees.map(e => e.id)));
    }
  };

  const handleToggleEmployee = (id: string) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEmployees(newSelected);
  };

  const handleAmountChange = (id: string, amount: string) => {
    setPayoutAmounts(prev => ({
      ...prev,
      [id]: parseFloat(amount) || 0
    }));
  };

  const calculateTotal = () => {
    let total = 0;
    selectedEmployees.forEach(id => {
      total += payoutAmounts[id] || 0;
    });
    return total;
  };

  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(value);
  };

  const handleSubmit = () => {
    setIsProcessing(true);
    const payments = Array.from(selectedEmployees).map(id => ({
      employeeId: id,
      amount: payoutAmounts[id]
    }));

    // Simulate delay for UX
    setTimeout(() => {
      onProcessBulkPayment(payments, selectedDate, paymentType);
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Run Payroll</h2>
          <p className="text-slate-500">Record salary or bonus payments for active employees.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Payment Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Payment Type</label>
            <div className="relative">
              <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as any)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black"
              >
                <option value="Salary">Monthly Salary</option>
                <option value="Bonus">Bonus / Performance</option>
                <option value="Reimbursement">Reimbursement</option>
              </select>
            </div>
          </div>
          <div className="flex items-end">
             <div className="w-full p-3 bg-blue-50 border border-blue-100 rounded-lg flex justify-between items-center">
                <span className="text-sm font-medium text-blue-800">Total Payout</span>
                <span className="text-xl font-bold text-blue-900">{formatINR(calculateTotal())}</span>
             </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden border border-slate-200 rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 w-12">
                    <button onClick={handleToggleAll} className="text-slate-400 hover:text-slate-600">
                      {selectedEmployees.size === activeEmployees.length && activeEmployees.length > 0 ? <CheckSquare size={20} className="text-blue-600" /> : <Square size={20} />}
                    </button>
                  </th>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4 text-right">Base Monthly</th>
                  <th className="px-6 py-4 text-right w-40">Payout Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeEmployees.length > 0 ? activeEmployees.map(emp => {
                  const isSelected = selectedEmployees.has(emp.id);
                  return (
                    <tr key={emp.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50/30' : ''}`}>
                      <td className="px-6 py-4">
                         <button onClick={() => handleToggleEmployee(emp.id)} className="text-slate-400 hover:text-slate-600">
                            {isSelected ? <CheckSquare size={20} className="text-blue-600" /> : <Square size={20} />}
                         </button>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">{emp.name}</td>
                      <td className="px-6 py-4 text-slate-600 text-sm">{emp.role}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600 border border-slate-200">
                          {emp.department}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500 text-sm">
                        {formatINR(emp.annualSalary / 12)}
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          type="number"
                          disabled={!isSelected}
                          value={payoutAmounts[emp.id] || ''}
                          onChange={(e) => handleAmountChange(emp.id, e.target.value)}
                          className={`w-full px-3 py-1.5 border rounded text-right focus:ring-2 focus:ring-blue-500 outline-none ${isSelected ? 'bg-white border-blue-300 text-blue-900 font-medium' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                        />
                      </td>
                    </tr>
                  );
                }) : (
                    <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                            No active employees found to process payroll.
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Action */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button 
            onClick={handleSubmit}
            disabled={isProcessing || selectedEmployees.size === 0}
            className={`px-8 py-3 rounded-lg font-bold text-white shadow-md transition-all flex items-center gap-2 ${isProcessing || selectedEmployees.size === 0 ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-blue-700 to-indigo-700 hover:shadow-lg hover:-translate-y-0.5'}`}
          >
            {isProcessing ? 'Processing...' : `Record ${paymentType} for ${selectedEmployees.size} Employees`}
          </button>
        </div>
      </div>
      
      {/* Success Notification */}
      {isSuccess && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-lg shadow-xl animate-bounce flex items-center gap-3 z-50">
            <CheckSquare size={24} />
            <div>
                <h4 className="font-bold">Payroll Recorded!</h4>
                <p className="text-sm text-emerald-100">Expenses and employee records updated.</p>
            </div>
        </div>
      )}
    </div>
  );
};

export default SalaryProcessing;

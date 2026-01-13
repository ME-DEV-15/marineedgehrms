
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  Briefcase, 
  PieChart, 
  Menu,
  X,
  Settings,
  Ship,
  Banknote,
  LogOut
} from 'lucide-react';
import { Department } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  setActiveView: (view: string) => void;
  departments: string[];
  onLogout?: () => void;
}

interface NavItemProps {
  id: string;
  icon: any;
  label: string;
  isSubItem?: boolean;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ id, icon: Icon, label, isSubItem = false, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
      isActive 
        ? 'bg-blue-900 text-white border-r-4 border-blue-400' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-blue-900'
    } ${isSubItem ? 'pl-11' : ''}`}
  >
    <Icon size={18} />
    <span>{label}</span>
  </button>
);

const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView, departments, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {!isSidebarOpen && (
        <div className="absolute top-4 left-4 z-50 md:hidden">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white rounded-md shadow-md text-slate-600">
            <Menu size={20} />
          </button>
        </div>
      )}

      {/* Sidebar */}
      <div 
        className={`${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed md:relative z-40 w-64 h-full bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out flex flex-col`}
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-950 text-white shadow-md z-10">
          <div className="flex flex-col w-full">
            <div className="flex items-center gap-2 mb-1">
                 {/* CSS Logo Approximation of ME with Ship */}
                <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-b from-blue-700 to-blue-900 rounded-lg shadow-inner border border-blue-600 shrink-0">
                    <span className="font-black text-xl text-white tracking-tighter" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>ME</span>
                    <Ship className="absolute -bottom-1 -right-1 text-blue-300 opacity-90 drop-shadow-md" size={16} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col justify-center">
                    <span className="text-xl font-black tracking-wide leading-none text-white" style={{ fontFamily: "'Inter', sans-serif" }}>MARINE EDGE</span>
                </div>
            </div>
            <span className="text-sm text-blue-200 font-script tracking-wide self-center -mr-2">An ocean of opportunities</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 absolute right-4 top-6">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <div className="mb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Overview</div>
          <NavItem 
            id="dashboard" 
            icon={LayoutDashboard} 
            label="Dashboard" 
            isActive={activeView === 'dashboard'}
            onClick={() => setActiveView('dashboard')}
          />
          <NavItem 
            id="employees" 
            icon={Users} 
            label="All Employees" 
            isActive={activeView === 'employees' || activeView.startsWith('employee-profile')}
            onClick={() => setActiveView('employees')}
          />
          <NavItem 
            id="payroll" 
            icon={Banknote} 
            label="Run Payroll" 
            isActive={activeView === 'payroll'}
            onClick={() => setActiveView('payroll')}
          />
          <NavItem 
            id="expenses" 
            icon={PieChart} 
            label="All Expenses" 
            isActive={activeView === 'expenses'}
            onClick={() => setActiveView('expenses')}
          />

          <div className="mt-6 mb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Departments</div>
          {departments.map((dept) => (
             <NavItem 
                key={dept} 
                id={`dept-${dept}`} 
                icon={Briefcase} 
                label={dept} 
                isSubItem 
                isActive={activeView === `dept-${dept}`}
                onClick={() => setActiveView(`dept-${dept}`)}
             />
          ))}
          
          <div className="mt-6 mb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">System</div>
          <NavItem 
            id="settings" 
            icon={Settings} 
            label="Settings" 
            isActive={activeView === 'settings'}
            onClick={() => setActiveView('settings')}
          />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 font-bold text-xs">HR</div>
                <div>
                    <p className="text-xs font-medium text-blue-900">Marine Edge Admin</p>
                    <p className="text-[10px] text-blue-600">Logged in</p>
                </div>
             </div>
             <button onClick={onLogout} className="text-slate-400 hover:text-red-500" title="Sign Out">
                 <LogOut size={16} />
             </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <div className="max-w-7xl mx-auto p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

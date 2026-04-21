"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FlaskConical, 
  Settings, 
  LogOut,
  Search,
  Bell,
  PlusCircle,
  ClipboardList,
  FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SidebarItem = ({ icon: Icon, label, to, active }: { icon: any, label: string, to: string, active: boolean }) => (
  <Link 
    to={to} 
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
      active 
        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" 
        : "text-blue-300/60 hover:bg-blue-900/30 hover:text-blue-100"
    )}
  >
    <Icon className={cn(
      "w-5 h-5 transition-transform duration-500",
      active ? "scale-110" : "group-hover:scale-110 group-hover:rotate-3"
    )} />
    <span className="text-sm font-medium tracking-wide">{label}</span>
  </Link>
);

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#020817] flex text-blue-50">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-blue-950/20 backdrop-blur-xl flex flex-col p-6 fixed h-full z-20">
        <div className="mb-10 px-2">
          <div className="relative inline-block">
            <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
            <img src="/src/assets/logo.png" alt="Logo" className="relative w-32 h-auto" />
          </div>
        </div>

        <nav className="flex-grow space-y-1.5">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Painel Geral" 
            to="/dashboard" 
            active={location.pathname === '/dashboard'} 
          />
          <SidebarItem 
            icon={PlusCircle} 
            label="Novo Atendimento" 
            to="/novo-atendimento" 
            active={location.pathname === '/novo-atendimento'} 
          />
          <SidebarItem 
            icon={ClipboardList} 
            label="Rotina Diária" 
            to="/rotina" 
            active={location.pathname === '/rotina'} 
          />
          <SidebarItem 
            icon={FileCheck} 
            label="Resultados" 
            to="/resultados" 
            active={location.pathname === '/resultados'} 
          />
          <div className="h-[1px] bg-white/5 my-4 mx-2"></div>
          <SidebarItem 
            icon={Users} 
            label="Pacientes" 
            to="/pacientes" 
            active={location.pathname === '/pacientes'} 
          />
          <SidebarItem 
            icon={Settings} 
            label="Configurações" 
            to="/config" 
            active={location.pathname === '/config'} 
          />
        </nav>

        <div className="pt-6 border-t border-white/5">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all group">
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Sair do Sistema</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow ml-64 flex flex-col">
        {/* Topbar */}
        <header className="h-20 border-b border-white/5 bg-blue-950/10 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4 bg-blue-900/20 border border-white/5 px-4 py-2 rounded-2xl w-96 group focus-within:border-blue-500/50 transition-all">
            <Search className="w-4 h-4 text-blue-300/40 group-focus-within:text-blue-400" />
            <input 
              type="text" 
              placeholder="Pesquisar no sistema..." 
              className="bg-transparent border-none outline-none text-sm text-white placeholder:text-blue-300/30 w-full"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-blue-300/60 hover:text-blue-100 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#020817]"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-white/5">
              <div className="text-right">
                <p className="text-xs font-bold text-white">Matheus Souza</p>
                <p className="text-[10px] text-blue-300/40 uppercase tracking-tighter">Administrador</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 border-2 border-white/10 flex items-center justify-center font-bold text-white shadow-lg">
                MS
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 bg-[#030a1c]/50 flex-grow">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
"use client";

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  PlusCircle, 
  ClipboardList, 
  FileCheck, 
  Settings, 
  LogOut,
  Search,
  ChevronLeft,
  Menu,
  Printer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const SidebarItem = ({ icon: Icon, label, to, active, collapsed }: { icon: any, label: string, to: string, active: boolean, collapsed: boolean }) => (
  <Link 
    to={to} 
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative",
      active 
        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" 
        : "text-blue-300/60 hover:bg-blue-900/30 hover:text-blue-100",
      collapsed && "justify-center px-0"
    )}
  >
    <Icon className={cn(
      "w-5 h-5 transition-transform duration-500 shrink-0",
      active ? "scale-110" : "group-hover:scale-110 group-hover:rotate-3"
    )} />
    {!collapsed && <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">{label}</span>}
    
    {collapsed && (
      <div className="absolute left-full ml-4 px-3 py-2 bg-blue-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl border border-white/10">
        {label}
      </div>
    )}
  </Link>
);

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#020817] flex text-blue-50">
      {/* Sidebar */}
      <aside className={cn(
        "border-r border-white/5 bg-blue-950/20 backdrop-blur-xl flex flex-col fixed h-full z-20 transition-all duration-500 ease-in-out",
        isCollapsed ? "w-20 p-4" : "w-64 p-6"
      )}>
        <div className="mb-10 flex items-center justify-between">
          {!isCollapsed && (
            <div className="relative inline-block">
              <div className="absolute -inset-6 bg-blue-500/20 rounded-full blur-2xl animate-pulse"></div>
              <img src="/logo.png" alt="Logo" className="relative w-32 h-auto" />
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-blue-400 hover:bg-blue-500/10 rounded-xl ml-auto"
          >
            {isCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </Button>
        </div>

        <nav className="flex-grow space-y-1">
          <SidebarItem icon={LayoutDashboard} label="Painel Geral" to="/dashboard" active={location.pathname === '/dashboard'} collapsed={isCollapsed} />
          <SidebarItem icon={Users} label="Pacientes" to="/pacientes" active={location.pathname === '/pacientes'} collapsed={isCollapsed} />
          <SidebarItem icon={PlusCircle} label="Novo Atendimento" to="/novo-atendimento" active={location.pathname === '/novo-atendimento'} collapsed={isCollapsed} />
          <SidebarItem icon={ClipboardList} label="Rotina Diária" to="/rotina" active={location.pathname === '/rotina'} collapsed={isCollapsed} />
          <SidebarItem icon={FileCheck} label="Resultados" to="/resultados" active={location.pathname === '/resultados'} collapsed={isCollapsed} />
          <SidebarItem icon={Printer} label="Impressão" to="/impressao" active={location.pathname === '/impressao'} collapsed={isCollapsed} />
          <div className={cn("h-[1px] bg-white/5 my-4 mx-2", isCollapsed && "mx-0")}></div>
          <SidebarItem icon={Settings} label="Configurações" to="/config" active={location.pathname.startsWith('/config')} collapsed={isCollapsed} />
        </nav>

        <div className={cn("pt-6 border-t border-white/5", isCollapsed && "px-0")}>
          <Link to="/" className={cn(
            "flex items-center gap-3 px-4 py-3 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all group",
            isCollapsed && "justify-center px-0"
          )}>
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform shrink-0" />
            {!isCollapsed && <span className="text-[10px] font-black uppercase">Sair</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-grow flex flex-col transition-all duration-500 ease-in-out",
        isCollapsed ? "ml-20" : "ml-64"
      )}>
        <header className="h-20 border-b border-white/5 bg-blue-950/10 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4 bg-blue-900/20 border border-white/5 px-4 py-2 rounded-2xl w-96 group focus-within:border-blue-500/50 transition-all">
            <Search className="w-4 h-4 text-blue-300/40 group-focus-within:text-blue-400" />
            <input type="text" placeholder="Pesquisar no sistema..." className="bg-transparent border-none outline-none text-xs text-white placeholder:text-blue-300/30 w-full" />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 pl-6 border-l border-white/5">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-white uppercase tracking-widest">Matheus Souza</p>
                <p className="text-[9px] text-blue-400 font-bold uppercase">Administrador</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-600 border-2 border-white/10 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/40">MS</div>
            </div>
          </div>
        </header>
        <div className="p-8 bg-[#030a1c]/50 flex-grow">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
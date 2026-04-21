"use client";

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Activity, Users, FlaskConical, Calendar, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

const StatCard = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) => (
  <div className="bg-blue-950/30 border border-white/5 p-6 rounded-[2rem] backdrop-blur-sm hover:border-blue-500/30 transition-all group">
    <div className={cn("p-3 rounded-2xl w-fit mb-4", color)}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <p className="text-blue-300/40 text-[10px] font-bold uppercase tracking-widest">{label}</p>
    <h3 className="text-3xl font-bold text-blue-50 mt-1">{value}</h3>
  </div>
);

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        <div>
          <h1 className="text-3xl font-bold text-blue-50 tracking-tight uppercase">Olá, Matheus!</h1>
          <p className="text-blue-300/50 text-sm mt-1 font-medium">Bem-vindo ao painel de controle do Lab Acajutiba.</p>
        </div>

        {/* Cards de Estatísticas Zerados */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={Users} label="Pacientes Hoje" value="0" color="bg-blue-600" />
          <StatCard icon={FlaskConical} label="Exames Pendentes" value="0" color="bg-amber-500" />
          <StatCard icon={Activity} label="Resultados Prontos" value="0" color="bg-emerald-500" />
          <StatCard icon={Calendar} label="Agendamentos" value="0" color="bg-purple-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Atividades Recentes Vazia */}
          <div className="lg:col-span-2 bg-blue-950/30 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-blue-100 mb-6 uppercase tracking-tight flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-400" />
              Atividades Recentes
            </h3>
            <div className="flex flex-col items-center justify-center py-12 opacity-20">
              <p className="font-bold uppercase tracking-widest text-xs">Nenhuma atividade registrada hoje</p>
            </div>
          </div>
          
          {/* Espaço para Avisos ou Status Futuro (Sem animação) */}
          <div className="bg-blue-950/30 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-blue-100 mb-6 uppercase tracking-tight">Avisos do Sistema</h3>
            <div className="flex flex-col items-center justify-center py-12 opacity-20">
              <Activity className="w-10 h-10 mb-4" />
              <p className="text-center text-xs font-bold uppercase tracking-widest">Sistema Operacional</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
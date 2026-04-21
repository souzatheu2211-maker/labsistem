"use client";

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Activity, Users, FlaskConical, Calendar } from 'lucide-react';
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
          <h1 className="text-3xl font-bold text-blue-50 tracking-tight">Olá, Matheus!</h1>
          <p className="text-blue-300/50 text-sm mt-1">Aqui está o resumo do laboratório hoje.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={Users} label="Pacientes Hoje" value="24" color="bg-blue-600" />
          <StatCard icon={FlaskConical} label="Exames Pendentes" value="12" color="bg-amber-500" />
          <StatCard icon={Activity} label="Resultados Prontos" value="08" color="bg-emerald-500" />
          <StatCard icon={Calendar} label="Agendamentos" value="15" color="bg-purple-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-blue-950/30 border border-white/5 rounded-[2.5rem] p-8">
            <h3 className="text-lg font-bold text-blue-100 mb-6">Atividades Recentes</h3>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 bg-blue-900/10 rounded-2xl border border-white/5">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className="text-sm text-blue-200">Novo paciente cadastrado: <span className="font-bold">João Silva</span></p>
                  <span className="ml-auto text-[10px] text-blue-300/30">Há 10 min</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-blue-950/30 border border-white/5 rounded-[2.5rem] p-8">
            <h3 className="text-lg font-bold text-blue-100 mb-6">Status do Sistema</h3>
            <div className="flex items-center justify-center h-40">
              <div className="relative">
                <div className="absolute -inset-8 bg-blue-500/10 rounded-full blur-2xl animate-pulse"></div>
                <div className="w-32 h-32 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin-slow flex items-center justify-center">
                  <span className="text-xl font-bold text-blue-400">98%</span>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-blue-300/40 mt-4">Capacidade de processamento</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
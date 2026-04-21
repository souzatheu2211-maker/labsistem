"use client";

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Settings, Users, FlaskConical, FileText, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const SettingsPage = () => {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
            <Settings className="w-6 h-6 text-blue-400" />
            Configurações do Sistema
          </h1>
          <p className="text-blue-300/50 text-sm mt-1 font-medium">Gerencie funcionários, exames e modelos de laudos</p>
        </div>

        <Tabs defaultValue="employees" className="w-full">
          <TabsList className="bg-blue-950/40 border border-white/5 p-1 rounded-2xl h-14 mb-8">
            <TabsTrigger value="employees" className="rounded-xl px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold uppercase text-[10px] tracking-widest gap-2">
              <Users className="w-4 h-4" /> Funcionários
            </TabsTrigger>
            <TabsTrigger value="exams" className="rounded-xl px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold uppercase text-[10px] tracking-widest gap-2">
              <FlaskConical className="w-4 h-4" /> Cadastro de Exames
            </TabsTrigger>
            <TabsTrigger value="pre-reports" className="rounded-xl px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold uppercase text-[10px] tracking-widest gap-2">
              <FileText className="w-4 h-4" /> Pré-Laudos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="animate-in fade-in slide-in-from-top duration-500">
            <div className="bg-blue-950/30 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">Gestão de Equipe</h3>
                <Button className="bg-blue-600 hover:bg-blue-500 rounded-xl gap-2 font-bold uppercase text-xs">
                  <Plus className="w-4 h-4" /> Novo Funcionário
                </Button>
              </div>
              <div className="text-center py-12 opacity-20">
                <p className="font-bold uppercase tracking-widest">Nenhum funcionário cadastrado</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="exams" className="animate-in fade-in slide-in-from-top duration-500">
            <div className="bg-blue-950/30 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">Catálogo de Exames</h3>
                <Button className="bg-blue-600 hover:bg-blue-500 rounded-xl gap-2 font-bold uppercase text-xs">
                  <Plus className="w-4 h-4" /> Novo Exame
                </Button>
              </div>
              <div className="text-center py-12 opacity-20">
                <p className="font-bold uppercase tracking-widest">Nenhum exame cadastrado</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pre-reports" className="animate-in fade-in slide-in-from-top duration-500">
            <div className="bg-blue-950/30 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">Modelos de Pré-Laudos</h3>
                <Button className="bg-blue-600 hover:bg-blue-500 rounded-xl gap-2 font-bold uppercase text-xs">
                  <Plus className="w-4 h-4" /> Novo Modelo
                </Button>
              </div>
              <div className="text-center py-12 opacity-20">
                <p className="font-bold uppercase tracking-widest">Nenhum modelo cadastrado</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
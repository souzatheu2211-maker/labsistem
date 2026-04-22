"use client";

import React from 'react';
import LoginForm from '@/components/LoginForm';
import { Microscope, FlaskConical, TestTube2, Dna, Activity } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#020817] relative overflow-hidden font-sans">
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[150px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-400/5 rounded-full blur-[150px]"></div>

      <main className="flex-grow flex items-center justify-center p-6">
        <div className="max-w-5xl w-full flex flex-col md:flex-row items-center justify-center gap-16 lg:gap-24">
          
          <div className="hidden md:block w-full max-w-sm relative animate-in fade-in slide-in-from-left duration-1000">
            <div className="absolute -top-6 -left-6 z-10 p-3 bg-blue-500/20 backdrop-blur-md rounded-2xl border border-white/10 animate-float">
              <Microscope className="w-6 h-6 text-blue-400" />
            </div>
            <div className="absolute top-1/2 -right-8 z-10 p-3 bg-blue-500/20 backdrop-blur-md rounded-2xl border border-white/10 animate-float-delayed">
              <FlaskConical className="w-6 h-6 text-blue-300" />
            </div>
            <div className="absolute -bottom-4 left-1/4 z-10 p-3 bg-blue-500/20 backdrop-blur-md rounded-2xl border border-white/10 animate-float-slow">
              <TestTube2 className="w-6 h-6 text-blue-400" />
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-blue-500/20 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
              <div className="relative aspect-square rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-blue-950/40 flex flex-col items-center justify-center p-12 text-center">
                <Activity className="w-24 h-24 text-blue-500 mb-6 animate-pulse" />
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Sistema de Gestão Laboratorial</h3>
                <p className="text-blue-300/40 text-xs mt-4 font-bold uppercase tracking-widest">Precisão em cada detalhe</p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-md flex flex-col items-center">
            <div className="relative mb-8 animate-in fade-in slide-in-from-top duration-700">
              <div className="absolute -inset-10 bg-blue-500/15 rounded-full blur-3xl animate-pulse"></div>
              <h1 className="relative text-4xl font-black text-blue-400 tracking-tighter drop-shadow-[0_0_20px_rgba(59,130,246,0.4)]">LAB ACAJUTIBA</h1>
            </div>

            <div className="text-center mb-10 animate-in fade-in slide-in-from-top duration-1000 delay-200">
              <h2 className="text-blue-50 text-xl md:text-2xl font-light tracking-[0.2em] uppercase italic opacity-90">
                Inovação & <span className="text-blue-400 font-normal">Precisão</span>
              </h2>
              <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent mx-auto mt-4"></div>
            </div>

            <LoginForm />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
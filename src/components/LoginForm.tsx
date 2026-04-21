"use client";

import React from 'react';
import { Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LoginForm = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm animate-in fade-in zoom-in duration-700">
      {/* Container do Formulário - Menor e Escuro */}
      <div className="w-full p-8 bg-blue-950/40 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/10">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <div className="relative group">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-blue-300/50 group-focus-within:text-blue-400 transition-colors" />
              <Input
                type="email"
                placeholder="nome@lab.com"
                className="bg-blue-900/20 border-blue-500/20 text-white placeholder:text-blue-300/30 h-12 pl-10 rounded-2xl focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="relative group">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-blue-300/50 group-focus-within:text-blue-400 transition-colors" />
              <Input
                type="password"
                placeholder="Senha"
                className="bg-blue-900/20 border-blue-500/20 text-white placeholder:text-blue-300/30 h-12 pl-10 rounded-2xl focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 group"
          >
            Entrar no Sistema
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>

          <div className="flex items-center justify-center gap-2 text-blue-300/40 text-[10px] uppercase tracking-widest pt-2">
            <ShieldCheck className="w-3 h-3" />
            <span>Acesso Restrito</span>
          </div>
        </form>
      </div>

      {/* Créditos Juntos do Login */}
      <div className="mt-6 text-center space-y-1 animate-in fade-in slide-in-from-bottom duration-1000 delay-300">
        <p className="text-blue-100/80 text-sm font-medium tracking-wide">
          Desenvolvido por <span className="text-blue-400">Matheus Souza</span>
        </p>
        <p className="text-blue-300/40 text-[11px] leading-relaxed">
          Técnico em Patologia Clínica • CRF-BA 805.994<br />
          © 2026 Lab Acajutiba • Todos os direitos reservados
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
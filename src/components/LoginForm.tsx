"use client";

import React from 'react';
import { Mail, Lock, ArrowRight, Beaker } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LoginForm = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Lógica de login viria aqui
  };

  return (
    <div className="w-full max-w-md p-8 bg-white/95 backdrop-blur-sm rounded-[2rem] shadow-2xl border border-white/20 animate-in fade-in slide-in-from-right duration-700">
      <div className="flex flex-col items-center mb-8">
        <div className="relative group">
          {/* Luz de fundo da logo */}
          <div className="absolute -inset-4 bg-blue-400/20 rounded-full blur-xl group-hover:bg-blue-400/30 transition-all duration-500 animate-pulse"></div>
          <img 
            src="/src/assets/logo.png" 
            alt="Lab Acajutiba Logo" 
            className="relative w-48 h-auto mb-4 drop-shadow-md"
          />
        </div>
        
        <p className="text-blue-900 font-medium text-center italic mt-2 animate-bounce">
          "Inovação e Precisão a serviço da sua saúde"
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-blue-900 font-semibold ml-1">E-mail</Label>
          <div className="relative group">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-blue-400 group-focus-within:text-blue-600 transition-colors" />
            <Input
              id="email"
              type="email"
              placeholder="nome@lab.com"
              className="pl-10 h-12 rounded-xl border-blue-100 focus:border-blue-500 focus:ring-blue-500 transition-all"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-blue-900 font-semibold ml-1">Senha</Label>
          <div className="relative group">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-blue-400 group-focus-within:text-blue-600 transition-colors" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="pl-10 h-12 rounded-xl border-blue-100 focus:border-blue-500 focus:ring-blue-500 transition-all"
              required
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-blue-200 transition-all flex items-center justify-center gap-2 group"
        >
          Acessar Sistema
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Button>

        <div className="flex items-center justify-center gap-2 text-blue-400 text-sm pt-2">
          <Beaker className="w-4 h-4 animate-spin-slow" />
          <span>Ambiente Seguro e Criptografado</span>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
"use client";

import React from 'react';
import LoginForm from '@/components/LoginForm';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#020817] relative overflow-hidden font-sans">
      {/* Efeitos de Luz de Fundo */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[150px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-400/5 rounded-full blur-[150px]"></div>

      <main className="flex-grow flex items-center justify-center p-6">
        {/* Reduzi o max-w e mudei para justify-center com gap para trazer a direita mais para perto do centro/esquerda */}
        <div className="max-w-5xl w-full flex flex-col md:flex-row items-center justify-center gap-16 lg:gap-24">
          
          {/* Lado Esquerdo: Imagem Ilustrativa */}
          <div className="hidden md:block w-full max-w-sm animate-in fade-in slide-in-from-left duration-1000">
            <div className="relative group">
              <div className="absolute -inset-1 bg-blue-500/20 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
              <div className="relative rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
                <img 
                  src="/src/assets/illustration.png" 
                  alt="Laboratório" 
                  className="w-full h-auto object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-700"
                />
              </div>
            </div>
          </div>

          {/* Lado Direito: Logo + Frase + Form */}
          <div className="w-full max-w-md flex flex-col items-center">
            
            {/* Logo - Aumentada para w-56 */}
            <div className="relative mb-8 animate-in fade-in slide-in-from-top duration-700">
              <div className="absolute -inset-10 bg-blue-500/15 rounded-full blur-3xl animate-pulse"></div>
              <img 
                src="/src/assets/logo.png" 
                alt="Lab Acajutiba" 
                className="relative w-56 h-auto drop-shadow-[0_0_20px_rgba(59,130,246,0.4)]"
              />
            </div>

            {/* Frase de Efeito */}
            <div className="text-center mb-10 animate-in fade-in slide-in-from-top duration-1000 delay-200">
              <h2 className="text-blue-50 text-xl md:text-2xl font-light tracking-[0.2em] uppercase italic opacity-90">
                Inovação & <span className="text-blue-400 font-normal">Precisão</span>
              </h2>
              <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent mx-auto mt-4"></div>
            </div>

            {/* Formulário e Créditos */}
            <LoginForm />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
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
        <div className="max-w-6xl w-full flex flex-col md:flex-row items-center justify-between gap-12">
          
          {/* Lado Esquerdo: Imagem Ilustrativa (Menor e Elegante) */}
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
            
            {/* Logo Separada em Cima */}
            <div className="relative mb-6 animate-in fade-in slide-in-from-top duration-700">
              <div className="absolute -inset-6 bg-blue-500/20 rounded-full blur-2xl animate-pulse"></div>
              <img 
                src="/src/assets/logo.png" 
                alt="Lab Acajutiba" 
                className="relative w-40 h-auto drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
              />
            </div>

            {/* Frase de Efeito com Letras Bonitas */}
            <div className="text-center mb-10 animate-in fade-in slide-in-from-top duration-1000 delay-200">
              <h2 className="text-blue-50 text-xl md:text-2xl font-light tracking-[0.15em] uppercase italic opacity-90">
                Inovação & <span className="text-blue-400 font-normal">Precisão</span>
              </h2>
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent mx-auto mt-3"></div>
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
"use client";

import React from 'react';
import LoginForm from '@/components/LoginForm';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#002B5B] relative overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px]"></div>

      <main className="flex-grow flex items-center justify-center p-4 md:p-8">
        <div className="max-w-6xl w-full flex flex-col md:flex-row items-center justify-center gap-12 md:gap-20">
          
          {/* Lado Esquerdo: Imagem Ilustrativa */}
          <div className="hidden md:block w-full max-w-md animate-in fade-in slide-in-from-left duration-1000">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10">
                <img 
                  src="/src/assets/illustration.png" 
                  alt="Laboratório" 
                  className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>

          {/* Lado Direito: Formulário */}
          <div className="w-full flex justify-center">
            <LoginForm />
          </div>
        </div>
      </main>

      {/* Rodapé com Créditos */}
      <footer className="w-full py-6 px-4 text-center text-blue-200/60 text-xs md:text-sm backdrop-blur-sm bg-black/5">
        <div className="max-w-4xl mx-auto space-y-1">
          <p className="font-medium">
            Desenvolvido por <span className="text-blue-100">Matheus Souza</span>
          </p>
          <p>
            Técnico em Patologia Clínica • CRF-BA 805.994
          </p>
          <p className="opacity-50">
            © 2026 Lab Acajutiba • Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
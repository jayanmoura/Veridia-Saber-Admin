import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface LegalPageLayoutProps {
  title: string;
  tag: string;
  updatedAt?: string;
  children: React.ReactNode;
}

export function LegalPageLayout({ title, tag, updatedAt, children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf6] text-stone-850">
      <Navbar />

      <main className="flex-grow py-16">
        <article className="max-w-3xl mx-auto px-6 text-left">
          {/* Tag Pequena Colorida */}
          <span className="inline-block px-3 py-1 rounded-full bg-[#5fcf6e]/15 text-[#4a7c5a] text-[10px] font-bold uppercase tracking-wider mb-4">
            {tag}
          </span>

          {/* Título Principal */}
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1a3a1f] mb-2 leading-tight">
            {title}
          </h1>

          {/* Data de Atualização */}
          {updatedAt && (
            <p className="text-sm text-[#7a9a7a] mb-6">
              {updatedAt}
            </p>
          )}

          {/* Divisor */}
          <div className="border-b border-[#dde8d5] mb-8"></div>

          {/* Conteúdo Prose Customizado */}
          <div className="space-y-6 text-[#4a5a44] leading-relaxed">
            {children}
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}

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
    <div className="min-h-screen flex flex-col bg-forest-50 text-neutral-950">
      <Navbar />

      <main className="flex-grow py-16">
        <article className="max-w-3xl mx-auto px-6 text-left">
          {/* Tag Pequena Colorida */}
          <span className="inline-block px-3 py-1 rounded-full bg-forest-400/15 text-forest-600 text-[10px] font-bold uppercase tracking-wider mb-4">
            {tag}
          </span>

          {/* Título Principal */}
          <h1 className="text-3xl sm:text-4xl font-bold text-forest-900 mb-2 leading-tight">
            {title}
          </h1>

          {/* Data de Atualização */}
          {updatedAt && (
            <p className="text-sm text-forest-600/70 mb-6">
              {updatedAt}
            </p>
          )}

          {/* Divisor */}
          <div className="border-b border-forest-200 mb-8"></div>

          {/* Conteúdo Prose Customizado */}
          <div className="space-y-6 text-neutral-700 leading-relaxed">
            {children}
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}

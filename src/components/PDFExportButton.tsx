'use client';

import { exportarAulasPDF } from '@/lib/pdf-export';

interface PDFButtonProps {
  mesRef: string;
  professorNome: string;
  aulas: any[];
}

export function PDFExportButton({ mesRef, professorNome, aulas }: PDFButtonProps) {
  return (
    <button
      onClick={() => exportarAulasPDF(mesRef, professorNome, aulas)}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-semibold hover:from-amber-400 hover:to-amber-500 transition-all shadow-md"
    >
      📄 Exportar PDF
    </button>
  );
}

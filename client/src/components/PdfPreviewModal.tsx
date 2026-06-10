import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface Props {
  pdfUrl: string | null;
  filename: string;
  onClose: () => void;
}

export default function PdfPreviewModal({ pdfUrl, filename, onClose }: Props) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pdfUrl) setLoading(true);
  }, [pdfUrl]);

  if (!pdfUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex flex-col"
      onClick={onClose}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-sm font-semibold truncate flex-1" style={{ color: '#5e0b1e' }}>
          {filename}
        </span>
        <a
          href={pdfUrl}
          download={filename}
          className="text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-80"
          style={{ background: '#f4eee4', color: '#6a1b52' }}
        >
          Descargar
        </a>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100"
        >
          <X size={20} />
        </button>
      </div>

      {/* PDF viewer */}
      <div className="flex-1 bg-gray-200 relative" onClick={(e) => e.stopPropagation()}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <Loader2 className="animate-spin" size={32} style={{ color: '#6a1b52' }} />
          </div>
        )}
        <iframe
          src={pdfUrl}
          className="w-full h-full border-0"
          onLoad={() => setLoading(false)}
          title={filename}
        />
      </div>
    </div>
  );
}

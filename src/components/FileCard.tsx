import React from 'react';
import { FileText, Download, FileSpreadsheet, FileCode, FileArchive, File as FileIcon } from 'lucide-react';
import { formatBytes } from '../utils/fileUtils';

interface FileCardProps {
  name: string;
  size: number;
  url: string;
}

export default function FileCard({ name, size, url }: FileCardProps) {
  // Extract extension
  const extension = name.split('.').pop()?.toUpperCase() || '';

  // Get appropriate icon based on extension
  const getFileIcon = () => {
    const ext = extension.toLowerCase();
    if (['pdf'].includes(ext)) {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    if (['doc', 'docx', 'rtf'].includes(ext)) {
      return <FileText className="w-8 h-8 text-blue-500" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return <FileSpreadsheet className="w-8 h-8 text-emerald-500" />;
    }
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
      return <FileArchive className="w-8 h-8 text-amber-500" />;
    }
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json'].includes(ext)) {
      return <FileCode className="w-8 h-8 text-indigo-500" />;
    }
    return <FileIcon className="w-8 h-8 text-zinc-500" />;
  };

  const handleDownload = (e: React.MouseEvent) => {
    // If it's base64, standard downloading can sometimes trigger chrome restrictions.
    // We can do a safe download fallback.
    if (url.startsWith('data:')) {
      e.preventDefault();
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/80 p-3 rounded-2xl max-w-[280px] sm:max-w-[320px] shadow-sm border border-zinc-100 dark:border-zinc-700/50 transition-all hover:bg-zinc-100/70 dark:hover:bg-zinc-800">
      <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl shadow-inner shrink-0">
        {getFileIcon()}
      </div>
      
      <div className="flex-1 min-w-0 pr-1">
        <h4 className="text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate" title={name}>
          {name}
        </h4>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
            {extension || 'FILE'}
          </span>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
            {formatBytes(size)}
          </span>
        </div>
      </div>

      <a
        id={`file-download-btn-${name.slice(-10)}`}
        href={url}
        download={name}
        onClick={handleDownload}
        target="_blank"
        rel="noopener noreferrer"
        className="w-8 h-8 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-300 transition-colors shrink-0"
        title="Download file"
      >
        <Download className="w-4 h-4" />
      </a>
    </div>
  );
}

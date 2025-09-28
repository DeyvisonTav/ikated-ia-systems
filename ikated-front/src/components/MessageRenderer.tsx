import React from 'react';

interface MessageRendererProps {
  content: string;
  className?: string;
}

export function MessageRenderer({ content, className }: MessageRendererProps) {
  // Função para detectar e converter links markdown [texto](url) em links clicáveis
  const renderMessageWithLinks = (text: string) => {
    // Regex para detectar links markdown: [texto](url)
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = markdownLinkRegex.exec(text)) !== null) {
      // Adicionar texto antes do link
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      // Adicionar o link clicável
      const linkText = match[1];
      const linkUrl = match[2];

      parts.push(
        <a
          key={match.index}
          href={linkUrl}
          className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            // Para links relativos (API interna), usar a URL base do backend
            if (linkUrl.startsWith('/api/')) {
              e.preventDefault();
              const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3333';
              window.location.href = `${backendUrl}${linkUrl}`;
            }
          }}
        >
          {linkText}
        </a>
      );

      lastIndex = markdownLinkRegex.lastIndex;
    }

    // Adicionar texto restante após o último link
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  // Dividir o conteúdo em linhas para preservar quebras de linha
  const lines = content.split('\n');

  return (
    <div className={className}>
      {lines.map((line, lineIndex) => (
        <React.Fragment key={lineIndex}>
          <span>
            {renderMessageWithLinks(line)}
          </span>
          {lineIndex < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </div>
  );
}
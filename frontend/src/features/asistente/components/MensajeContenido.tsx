import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

const componentesMarkdown: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-snug">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-marca-oscuro">{children}</strong>,
  ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="leading-snug">{children}</li>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-marca-medio underline">
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="bg-gray-100 rounded px-1 py-0.5 text-xs font-mono">{children}</code>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-2 -mx-1">
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-gray-200 bg-gray-100 px-2 py-1 text-left font-semibold whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border border-gray-200 px-2 py-1">{children}</td>,
}

export function MensajeContenido({ contenido }: { contenido: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={componentesMarkdown}>
      {contenido}
    </ReactMarkdown>
  )
}

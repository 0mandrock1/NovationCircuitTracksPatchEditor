/**
 * SectionPanel — shared wrapper for each editor section.
 * Provides a labelled card with consistent padding and styling.
 */

interface SectionPanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function SectionPanel({ title, children, className = "" }: SectionPanelProps) {
  return (
    <div className={`bg-panel-surface border border-panel-border rounded-lg p-4 ${className}`}>
      <h2 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-3 border-b border-panel-border pb-1">
        {title}
      </h2>
      {children}
    </div>
  );
}

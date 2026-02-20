interface SectionLabelProps {
  title: string;
  badge?: string;
}

export function SectionLabel({ title }: SectionLabelProps) {
  return (
    <div className="flex items-center gap-2 mb-4 mt-6">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
        {title}
      </h2>
      <div className="flex-1 h-px bg-border/30" />
    </div>
  );
}

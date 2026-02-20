import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

interface SectionLabelProps {
  title: string;
  badge?: string;
}

export function SectionLabel({ title, badge }: SectionLabelProps) {
  return (
    <div className="flex items-center gap-2 mb-4 mt-8">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h2>
      {badge && (
        <Badge variant="outline" className="text-xs gap-1">
          <Info className="h-3 w-3" />
          {badge}
        </Badge>
      )}
    </div>
  );
}

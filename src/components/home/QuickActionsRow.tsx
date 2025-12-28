import { LucideIcon } from "lucide-react";

interface QuickActionItem {
  label: string;
  Icon: LucideIcon;
  onClick: () => void;
}

interface QuickActionsRowProps {
  items: QuickActionItem[];
}

export const QuickActionsRow = ({ items }: QuickActionsRowProps) => {
  return (
    <div className="grid grid-cols-4 gap-3">
      {items.map(({ label, Icon, onClick }) => (
        <button
          key={label}
          type="button"
          onClick={onClick}
          className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(205,90%,95%)] via-[hsl(210,85%,92%)] to-[hsl(215,80%,88%)] border border-[hsl(210,60%,85%)]/50 px-2 py-3.5 text-foreground shadow-sm transition-all duration-200 hover:shadow-md hover:from-[hsl(205,90%,92%)] hover:to-[hsl(215,80%,85%)] active:scale-[0.98]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/60 text-[hsl(210,80%,50%)]">
            <Icon className="h-5 w-5" strokeWidth={2} />
          </span>
          <span className="mt-2 text-[11px] font-medium text-[hsl(210,50%,40%)]">{label}</span>
        </button>
      ))}
    </div>
  );
};
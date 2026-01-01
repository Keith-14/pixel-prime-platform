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
          className="flex flex-col items-center justify-center rounded-2xl bg-card/80 backdrop-blur-sm border border-primary/30 px-2 py-4 text-foreground shadow-sm transition-all duration-200 hover:bg-card hover:border-primary/50 hover:shadow-[0_0_20px_-5px_hsl(45_70%_55%/0.3)] active:scale-[0.98]"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-6 w-6" strokeWidth={1.5} />
          </span>
          <span className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-primary">{label}</span>
        </button>
      ))}
    </div>
  );
};

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
          className="group relative flex flex-col items-center justify-center rounded-2xl glass-gold px-2 py-4 text-foreground transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_30px_-5px_hsl(45_85%_58%/0.3)] active:scale-[0.98] shine-effect border-glow"
        >
          {/* Hover glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 group-hover:border-primary/40 transition-all duration-300 group-hover:shadow-[0_0_20px_-3px_hsl(45_85%_58%/0.4)]">
            <Icon className="h-6 w-6 text-primary transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_hsl(45_85%_58%/0.5)]" strokeWidth={1.5} />
          </span>
          <span className="relative mt-2.5 text-[10px] font-bold uppercase tracking-wider text-primary/90 group-hover:text-primary transition-colors duration-300">{label}</span>
        </button>
      ))}
    </div>
  );
};

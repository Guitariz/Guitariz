import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { getRelatedTools } from "@/config/relatedTools";

export interface RelatedToolsWidgetProps {
  /** Identifier of the current tool (e.g., 'chord-ai', 'tuner') or path (e.g. '/chord-ai') */
  currentTool?: string;
  currentPath?: string;
  /** Maximum number of related tools to display (defaults to 3) */
  maxItems?: number;
  /** Custom section title */
  title?: string;
  /** Additional container styling */
  className?: string;
}

export const RelatedToolsWidget = ({
  currentTool,
  currentPath,
  maxItems = 3,
  title = "Related Tools & Workflows",
  className = "",
}: RelatedToolsWidgetProps) => {
  const targetIdentifier = currentTool || currentPath || "";
  const tools = getRelatedTools(targetIdentifier, maxItems);

  if (!tools || tools.length === 0) return null;

  return (
    <section className={`mt-16 mb-8 ${className}`}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <h2 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.25em]">
            {title}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              to={tool.path}
              className="group p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/30 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-sm font-semibold text-white mb-2 flex items-center justify-between">
                  <span>{tool.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {tool.description}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center text-[10px] font-medium text-primary uppercase tracking-wider">
                Explore tool &rarr;
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RelatedToolsWidget;

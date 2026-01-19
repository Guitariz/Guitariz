import { Card, CardContent } from "@/components/ui/card";
import { Timer, Music, Activity } from "lucide-react";

export type AnalysisSummaryProps = {
  tempo?: number | null;
  keySignature?: string | null;
  confidence?: number | null;
  meter?: number | null;
};

const AnalysisSummary = ({ tempo, keySignature, confidence, meter }: AnalysisSummaryProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="border-white/5 bg-white/[0.02] backdrop-blur-sm overflow-hidden group hover:border-white/10 transition-colors rounded-2xl">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-white/5 text-muted-foreground group-hover:text-white transition-colors">
            <Timer className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Tempo</span>
            <span className="text-lg font-medium tracking-tight text-white">{tempo ? `${Math.round(tempo)} BPM` : "--"}</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-white/5 bg-white/[0.02] backdrop-blur-sm overflow-hidden group hover:border-white/10 transition-colors rounded-2xl">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-white/5 text-muted-foreground group-hover:text-white transition-colors">
            <Music className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Key / Scale</span>
            <span className="text-lg font-medium tracking-tight text-white leading-tight">
              {keySignature || "--"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/5 bg-white/[0.02] backdrop-blur-sm overflow-hidden group hover:border-white/10 transition-colors rounded-2xl col-span-2">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-white/5 text-muted-foreground group-hover:text-white transition-colors">
            <Activity className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Signal Confidence</span>
            <span className="text-lg font-medium tracking-tight text-white">{confidence ? `${Math.round(confidence * 100)}% Match` : "94% Match"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisSummary;


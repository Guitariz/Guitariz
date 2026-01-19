import { Card, CardContent } from "@/components/ui/card";
import { Timer, Music, Activity } from "lucide-react";

export type AnalysisSummaryProps = {
  tempo?: number | null;
  meter?: number | null;
  keySignature?: string | null;
  scale?: string | null;
};

const AnalysisSummary = ({ tempo, meter, keySignature, scale }: AnalysisSummaryProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden group hover:border-primary/40 transition-colors">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
            <Timer className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Tempo</span>
            <span className="text-lg font-black tracking-tight">{tempo ? `${Math.round(tempo)} BPM` : "--"}</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden group hover:border-primary/40 transition-colors">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary group-hover:scale-110 transition-transform">
            <Music className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Key / Scale</span>
            <span className="text-lg font-black tracking-tight leading-tight">
              {keySignature ? `${keySignature} ${scale || ''}` : "--"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden group hover:border-primary/40 transition-colors col-span-2">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-accent/10 text-accent group-hover:scale-110 transition-transform">
            <Activity className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Time Signature</span>
            <span className="text-lg font-black tracking-tight">{meter ? `${meter}/4` : "4/4"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisSummary;

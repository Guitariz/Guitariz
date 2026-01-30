import { ChordSegment } from "@/types/chordAI";
import { AlertTriangle, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type ConfidenceSummaryProps = {
  segments: ChordSegment[];
  onSeek: (time: number) => void;
};

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

const ConfidenceSummary = ({ segments, onSeek }: ConfidenceSummaryProps) => {
  // Calculate statistics
  const totalSegments = segments.length;
  const lowConfidence = segments.filter(s => (s.confidence || 0.94) < 0.70);
  const mediumConfidence = segments.filter(s => {
    const c = s.confidence || 0.94;
    return c >= 0.70 && c < 0.85;
  });
  const highConfidence = segments.filter(s => (s.confidence || 0.94) >= 0.85);
  
  const avgConfidence = segments.length > 0 
    ? segments.reduce((sum, s) => sum + (s.confidence || 0.94), 0) / segments.length 
    : 0;

  // Overall quality rating
  const getQualityRating = () => {
    const lowPercent = (lowConfidence.length / totalSegments) * 100;
    
    if (avgConfidence >= 0.85 && lowPercent < 5) {
      return {
        label: "Excellent",
        color: "text-green-400",
        bg: "bg-green-500/10",
        icon: CheckCircle2
      };
    } else if (avgConfidence >= 0.75 && lowPercent < 15) {
      return {
        label: "Good",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        icon: CheckCircle2
      };
    } else if (avgConfidence >= 0.65) {
      return {
        label: "Fair",
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        icon: AlertCircle
      };
    } else {
      return {
        label: "Needs Review",
        color: "text-orange-400",
        bg: "bg-orange-500/10",
        icon: AlertTriangle
      };
    }
  };

  const quality = getQualityRating();
  const QualityIcon = quality.icon;

  if (totalSegments === 0) return null;

  return (
    <Card className="border-white/10 bg-white/[0.02]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2 truncate">
              <Info className="w-4 h-4" />
              Analysis Confidence
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1 text-muted-foreground">
              Detection quality overview
            </CardDescription>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${quality.bg} ${quality.color} shrink-0`}>
            <QualityIcon className="w-4 h-4" />
            <span className="text-sm font-semibold">{quality.label}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-3 sm:p-4">
        {/* Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 flex flex-col items-start sm:items-center">
            <div className="text-lg sm:text-2xl font-bold text-white leading-none">
              {Math.round(avgConfidence * 100)}%
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground uppercase font-semibold tracking-wide mt-1">
              Avg Score
            </div>
          </div>
          
          <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 flex flex-col items-start sm:items-center">
            <div className="text-lg sm:text-2xl font-bold text-green-400 leading-none">
              {highConfidence.length}
            </div>
            <div className="text-[10px] sm:text-xs text-green-400/70 uppercase font-semibold tracking-wide mt-1">
              High (≥85%)
            </div>
          </div>
          
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3 flex flex-col items-start sm:items-center">
            <div className="text-lg sm:text-2xl font-bold text-yellow-400 leading-none">
              {mediumConfidence.length}
            </div>
            <div className="text-[10px] sm:text-xs text-yellow-400/70 uppercase font-semibold tracking-wide mt-1">
              Medium (70-84%)
            </div>
          </div>
          
          <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3 flex flex-col items-start sm:items-center">
            <div className="text-lg sm:text-2xl font-bold text-orange-400 leading-none">
              {lowConfidence.length}
            </div>
            <div className="text-[10px] sm:text-xs text-orange-400/70 uppercase font-semibold tracking-wide mt-1">
              Low (&lt;70%)
            </div>
          </div>
        </div>

        {/* Low confidence segments list */}
        {lowConfidence.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <h4 className="text-sm sm:text-base font-semibold text-orange-400">
                Segments Needing Review ({lowConfidence.length})
              </h4>
            </div>
            
            <div className="space-y-2 max-h-52 sm:max-h-40 overflow-y-auto custom-scrollbar">
              {lowConfidence.map((seg, idx) => (
                <button
                  key={`low-conf-${seg.start}-${idx}`}
                  onClick={() => onSeek(seg.start)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-3 sm:px-3 sm:py-2 bg-orange-500/5 hover:bg-orange-500/10 border border-orange-500/20 hover:border-orange-500/30 rounded-lg transition-colors text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant="outline" className="border-orange-500/30 text-orange-400 shrink-0 px-2 py-0.5 text-xs">
                      {seg.chord}
                    </Badge>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm sm:text-base font-medium truncate">{formatTime(seg.start)}</span>
                      <span className="text-xs text-muted-foreground truncate">{((seg.end || seg.start) - seg.start).toFixed(1)}s</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-orange-400">
                      {Math.round((seg.confidence || 0) * 100)}%
                    </span>
                    <span className="text-sm text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Success message for high quality */}
        {lowConfidence.length === 0 && avgConfidence >= 0.85 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-500/5 border border-green-500/20 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
            <p className="text-sm sm:text-xs text-green-400/90">
              All chord detections have high confidence. No manual review needed!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConfidenceSummary;

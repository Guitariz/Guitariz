import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Music, Scale, Hash, Music2, Guitar, Piano } from "lucide-react";

const CIRCLE_KEYS = [
  {
    note: "C",
    position: 0,
    sharps: 0,
    flats: 0,
    relativeMinor: "Am",
    keySignature: [],
    majorScale: ["C", "D", "E", "F", "G", "A", "B"],
    minorScale: ["A", "B", "C", "D", "E", "F", "G"],
    commonChords: ["C", "Dm", "Em", "F", "G", "Am", "Bdim"],
    diatonicChords: ["C", "Dm", "Em", "F", "G", "Am", "Bdim"],
    parallelKey: "Cm",
    dominantKey: "G",
    subdominantKey: "F"
  },
  {
    note: "G",
    position: 1,
    sharps: 1,
    flats: 0,
    relativeMinor: "Em",
    keySignature: ["F#"],
    majorScale: ["G", "A", "B", "C", "D", "E", "F#"],
    minorScale: ["E", "F#", "G", "A", "B", "C", "D"],
    commonChords: ["G", "Am", "Bm", "C", "D", "Em", "F#dim"],
    diatonicChords: ["G", "Am", "Bm", "C", "D", "Em", "F#dim"],
    parallelKey: "Gm",
    dominantKey: "D",
    subdominantKey: "C"
  },
  {
    note: "D",
    position: 2,
    sharps: 2,
    flats: 0,
    relativeMinor: "Bm",
    keySignature: ["F#", "C#"],
    majorScale: ["D", "E", "F#", "G", "A", "B", "C#"],
    minorScale: ["B", "C#", "D", "E", "F#", "G", "A"],
    commonChords: ["D", "Em", "F#m", "G", "A", "Bm", "C#dim"],
    diatonicChords: ["D", "Em", "F#m", "G", "A", "Bm", "C#dim"],
    parallelKey: "Dm",
    dominantKey: "A",
    subdominantKey: "G"
  },
  {
    note: "A",
    position: 3,
    sharps: 3,
    flats: 0,
    relativeMinor: "F#m",
    keySignature: ["F#", "C#", "G#"],
    majorScale: ["A", "B", "C#", "D", "E", "F#", "G#"],
    minorScale: ["F#", "G#", "A", "B", "C#", "D", "E"],
    commonChords: ["A", "Bm", "C#m", "D", "E", "F#m", "G#dim"],
    diatonicChords: ["A", "Bm", "C#m", "D", "E", "F#m", "G#dim"],
    parallelKey: "Am",
    dominantKey: "E",
    subdominantKey: "D"
  },
  {
    note: "E",
    position: 4,
    sharps: 4,
    flats: 0,
    relativeMinor: "C#m",
    keySignature: ["F#", "C#", "G#", "D#"],
    majorScale: ["E", "F#", "G#", "A", "B", "C#", "D#"],
    minorScale: ["C#", "D#", "E", "F#", "G#", "A", "B"],
    commonChords: ["E", "F#m", "G#m", "A", "B", "C#m", "D#dim"],
    diatonicChords: ["E", "F#m", "G#m", "A", "B", "C#m", "D#dim"],
    parallelKey: "Em",
    dominantKey: "B",
    subdominantKey: "A"
  },
  {
    note: "B",
    position: 5,
    sharps: 5,
    flats: 0,
    relativeMinor: "G#m",
    keySignature: ["F#", "C#", "G#", "D#", "A#"],
    majorScale: ["B", "C#", "D#", "E", "F#", "G#", "A#"],
    minorScale: ["G#", "A#", "B", "C#", "D#", "E", "F#"],
    commonChords: ["B", "C#m", "D#m", "E", "F#", "G#m", "A#dim"],
    diatonicChords: ["B", "C#m", "D#m", "E", "F#", "G#m", "A#dim"],
    parallelKey: "Bm",
    dominantKey: "F#/Gb",
    subdominantKey: "E"
  },
  {
    note: "F#/Gb",
    position: 6,
    sharps: 6,
    flats: 6,
    relativeMinor: "D#m/Ebm",
    keySignature: ["F#", "C#", "G#", "D#", "A#", "E#"],
    majorScale: ["F#", "G#", "A#", "B", "C#", "D#", "E#"],
    minorScale: ["D#", "E#", "F#", "G#", "A#", "B", "C#"],
    commonChords: ["F#", "G#m", "A#m", "B", "C#", "D#m", "E#dim"],
    diatonicChords: ["F#", "G#m", "A#m", "B", "C#", "D#m", "E#dim"],
    parallelKey: "F#m/Gbm",
    dominantKey: "C#/Db",
    subdominantKey: "B"
  },
  {
    note: "Db",
    position: 7,
    sharps: 0,
    flats: 5,
    relativeMinor: "Bbm",
    keySignature: ["Bb", "Eb", "Ab", "Db", "Gb"],
    majorScale: ["Db", "Eb", "F", "Gb", "Ab", "Bb", "C"],
    minorScale: ["Bb", "C", "Db", "Eb", "F", "Gb", "Ab"],
    commonChords: ["Db", "Ebm", "Fm", "Gb", "Ab", "Bbm", "Cdim"],
    diatonicChords: ["Db", "Ebm", "Fm", "Gb", "Ab", "Bbm", "Cdim"],
    parallelKey: "C#m/Dbm",
    dominantKey: "Ab",
    subdominantKey: "Gb"
  },
  {
    note: "Ab",
    position: 8,
    sharps: 0,
    flats: 4,
    relativeMinor: "Fm",
    keySignature: ["Bb", "Eb", "Ab", "Db"],
    majorScale: ["Ab", "Bb", "C", "Db", "Eb", "F", "G"],
    minorScale: ["F", "G", "Ab", "Bb", "C", "Db", "Eb"],
    commonChords: ["Ab", "Bbm", "Cm", "Db", "Eb", "Fm", "Gdim"],
    diatonicChords: ["Ab", "Bbm", "Cm", "Db", "Eb", "Fm", "Gdim"],
    parallelKey: "Abm",
    dominantKey: "Eb",
    subdominantKey: "Db"
  },
  {
    note: "Eb",
    position: 9,
    sharps: 0,
    flats: 3,
    relativeMinor: "Cm",
    keySignature: ["Bb", "Eb", "Ab"],
    majorScale: ["Eb", "F", "G", "Ab", "Bb", "C", "D"],
    minorScale: ["C", "D", "Eb", "F", "G", "Ab", "Bb"],
    commonChords: ["Eb", "Fm", "Gm", "Ab", "Bb", "Cm", "Ddim"],
    diatonicChords: ["Eb", "Fm", "Gm", "Ab", "Bb", "Cm", "Ddim"],
    parallelKey: "Ebm",
    dominantKey: "Bb",
    subdominantKey: "Ab"
  },
  {
    note: "Bb",
    position: 10,
    sharps: 0,
    flats: 2,
    relativeMinor: "Gm",
    keySignature: ["Bb", "Eb"],
    majorScale: ["Bb", "C", "D", "Eb", "F", "G", "A"],
    minorScale: ["G", "A", "Bb", "C", "D", "Eb", "F"],
    commonChords: ["Bb", "Cm", "Dm", "Eb", "F", "Gm", "Adim"],
    diatonicChords: ["Bb", "Cm", "Dm", "Eb", "F", "Gm", "Adim"],
    parallelKey: "Bbm",
    dominantKey: "F",
    subdominantKey: "Eb"
  },
  {
    note: "F",
    position: 11,
    sharps: 0,
    flats: 1,
    relativeMinor: "Dm",
    keySignature: ["Bb"],
    majorScale: ["F", "G", "A", "Bb", "C", "D", "E"],
    minorScale: ["D", "E", "F", "G", "A", "Bb", "C"],
    commonChords: ["F", "Gm", "Am", "Bb", "C", "Dm", "Edim"],
    diatonicChords: ["F", "Gm", "Am", "Bb", "C", "Dm", "Edim"],
    parallelKey: "Fm",
    dominantKey: "C",
    subdominantKey: "Bb"
  },
];

const CircleOfFifths = () => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const selectedKeyData = useMemo(() => {
    return CIRCLE_KEYS.find(key => key.note === selectedKey);
  }, [selectedKey]);

  const commonProgressions = useMemo(() => {
    if (!selectedKeyData) return [];

    const key = selectedKeyData.note;
    const chords = selectedKeyData.diatonicChords;

    return [
      {
        name: "I-IV-V-I",
        chords: [chords[0], chords[3], chords[4], chords[0]],
        description: "The most common chord progression in popular music"
      },
      {
        name: "ii-V-I",
        chords: [chords[1], chords[4], chords[0]],
        description: "Jazz standard progression, resolves strongly to tonic"
      },
      {
        name: "I-vi-IV-V",
        chords: [chords[0], chords[5], chords[3], chords[4]],
        description: "Pop progression used in many hit songs"
      },
      {
        name: "vi-IV-I-V",
        chords: [chords[5], chords[3], chords[0], chords[4]],
        description: "Alternative pop progression"
      }
    ];
  }, [selectedKeyData]);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Circle of Fifths</h2>
        <p className="text-sm text-muted-foreground">
          Comprehensive interactive music theory reference with scales, chords, and progressions
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Circle visualization */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-2xl p-8">
            <div className="relative w-full aspect-square max-w-[600px] mx-auto">
              {/* Center circle */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-gradient-primary flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                     onClick={() => setSelectedKey(null)}>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Key of</div>
                    <div className="text-2xl font-bold text-gradient">
                      {selectedKey || "Select"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Key segments */}
              {CIRCLE_KEYS.map((key) => {
                const angle = (key.position * 30 - 90) * (Math.PI / 180);
                const radius = 42;
                const x = 50 + radius * Math.cos(angle);
                const y = 50 + radius * Math.sin(angle);

                return (
                  <button
                    key={key.note}
                    className="absolute group"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    onClick={() => setSelectedKey(key.note)}
                  >
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold transition-all hover-lift ${
                        selectedKey === key.note
                          ? "bg-gradient-accent text-primary-foreground shadow-lg shadow-primary/50 scale-110"
                          : "glass-card hover:bg-primary/20"
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-sm">{key.note}</div>
                        {key.sharps > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {key.sharps}♯
                          </div>
                        )}
                        {key.flats > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {key.flats}♭
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Key information */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">How to Use</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  Click any key to explore scales, chords, and progressions
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  Moving clockwise adds sharps to the key signature
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  Moving counterclockwise adds flats to the key signature
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  Adjacent keys share many common notes and chords
                </span>
              </li>
            </ul>
          </div>

          {selectedKeyData && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="text-xs">
                  <Music className="w-4 h-4 mr-1" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="scales" className="text-xs">
                  <Scale className="w-4 h-4 mr-1" />
                  Scales
                </TabsTrigger>
                <TabsTrigger value="chords" className="text-xs">
                  <Hash className="w-4 h-4 mr-1" />
                  Chords
                </TabsTrigger>
                <TabsTrigger value="progressions" className="text-xs">
                  <Music2 className="w-4 h-4 mr-1" />
                  Progressions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-gradient">Key of {selectedKey}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium mb-2">Key Signature</div>
                        <div className="flex flex-wrap gap-1">
                          {selectedKeyData.keySignature.length > 0 ? (
                            selectedKeyData.keySignature.map((accidental, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {accidental}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">Natural</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-2">Relative Minor</div>
                        <Badge variant="outline">{selectedKeyData.relativeMinor}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm font-medium mb-2">Parallel Key</div>
                        <Badge variant="outline" className="text-xs">{selectedKeyData.parallelKey}</Badge>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-2">Dominant</div>
                        <Badge variant="outline" className="text-xs">{selectedKeyData.dominantKey}</Badge>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-2">Subdominant</div>
                        <Badge variant="outline" className="text-xs">{selectedKeyData.subdominantKey}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="scales" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Scales in {selectedKey}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Scale className="w-4 h-4" />
                        Major Scale
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedKeyData.majorScale.map((note, index) => (
                          <Badge key={index} variant="default" className="font-mono">
                            {note}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Scale className="w-4 h-4" />
                        Natural Minor Scale
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedKeyData.minorScale.map((note, index) => (
                          <Badge key={index} variant="secondary" className="font-mono">
                            {note}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chords" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Diatonic Chords in {selectedKey}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedKeyData.diatonicChords.map((chord, index) => {
                        const degrees = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
                        return (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                            <div className="font-mono font-medium">{chord}</div>
                            <Badge variant="outline" className="text-xs">{degrees[index]}</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="progressions" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Common Progressions in {selectedKey}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {commonProgressions.map((progression, index) => (
                      <div key={index} className="p-4 rounded-lg bg-muted/30">
                        <div className="font-medium mb-1">{progression.name}</div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {progression.chords.map((chord, chordIndex) => (
                            <Badge key={chordIndex} variant="default" className="font-mono">
                              {chord}
                            </Badge>
                          ))}
                        </div>
                        <div className="text-sm text-muted-foreground">{progression.description}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-3">Quick Reference</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Perfect Fifth:</span>
                <span className="font-medium">7 semitones</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Perfect Fourth:</span>
                <span className="font-medium">5 semitones</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Major Third:</span>
                <span className="font-medium">4 semitones</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Minor Third:</span>
                <span className="font-medium">3 semitones</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Major Second:</span>
                <span className="font-medium">2 semitones</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Minor Second:</span>
                <span className="font-medium">1 semitone</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CircleOfFifths;

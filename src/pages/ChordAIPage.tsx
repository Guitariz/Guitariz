import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Bot, Sparkles, ArrowLeft } from "lucide-react";

const ChordAIPage = () => {
  useEffect(() => {
    toast({
      title: "Chord AI",
      description: "Coming soon. We\'re crafting an AI that learns your chords.",
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/80 to-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-60" aria-hidden="true">
        <div className="absolute -left-10 top-10 w-72 h-72 rounded-full blur-3xl bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20" />
        <div className="absolute right-0 bottom-10 w-80 h-80 rounded-full blur-3xl bg-gradient-to-br from-secondary/18 via-primary/16 to-accent/18" />
      </div>

      <Navigation />

      <main className="pt-28 pb-16 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/15 via-secondary/15 to-accent/15 border border-border/60">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold">Chord AI</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl">
                  Coming soon: drop any song here and Chord AI will call out the chords, suggested scales, tempo, and even a MIDI export (if I can pull that off).
                </p>
              </div>
            </div>

            <Card className="border-border/70 bg-card/70 backdrop-blur-md shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Coming soon
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Thanks for checking this out. Soon you\'ll be able to upload any track and get chords, scales, tempo, and a hopeful MIDI (if I manage to do that) with a bit of humor.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link to="/fretboard">Try the fretboard</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/chords">Browse chords</Link>
                  </Button>
                </div>
                <p className="text-xs">You\'ll see a toast when this page loads so you know you\'re early.</p>
              </CardContent>
            </Card>

            <Button variant="ghost" className="gap-2" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4" />
                Back home
              </Link>
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ChordAIPage;

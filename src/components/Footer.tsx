
import { Github, Twitter, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative z-10 border-t border-white/5 bg-[#0a0a0a]/90 pt-16 pb-8">
            <div className="container mx-auto max-w-5xl px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
                    {/* Brand Column */}
                    <div className="space-y-4 md:col-span-1">
                        <Link to="/" className="flex items-center gap-3">
                            <img src="/logo.svg" alt="Guitariz" className="w-8 h-8 object-contain" />
                            <span className="font-bold text-lg text-white tracking-tight">Guitariz</span>
                        </Link>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            <strong>Guitariz Studio</strong>: High-precision AI Chord Recognition, Vocal Stem Separation, and interactive Music Theory tools. Built for musicians, by musicians.
                        </p>
                    </div>

                    {/* Tools */}
                    <div>
                        <h4 className="font-semibold text-white mb-4">Tools</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link to="/fretboard" className="hover:text-white transition-colors">Fretboard</Link></li>
                            <li><Link to="/chords" className="hover:text-white transition-colors">Chord Library</Link></li>
                            <li><Link to="/scales" className="hover:text-white transition-colors">Scale Explorer</Link></li>
                            <li><Link to="/chord-ai" className="hover:text-white transition-colors">Chord AI</Link></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="font-semibold text-white mb-4">Resources</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link to="/theory" className="hover:text-white transition-colors">Music Theory</Link></li>
                            <li><a href="https://github.com/abhi9vaidya/guitariz" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Source Code</a></li>
                            <li><a href="https://github.com/abhi9vaidya/guitariz/issues" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Report Issue</a></li>
                        </ul>
                    </div>

                    {/* Social / Legal */}
                    <div>
                        <h4 className="font-semibold text-white mb-4">Connect</h4>
                        <div className="flex gap-4">
                            <a href="https://github.com/abhi9vaidya/Guitariz" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-white transition-colors">
                                <Github className="w-5 h-5" />
                            </a>
                            <a href="https://x.com/GuitarizStudio" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-white transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="mailto:guitariz.studio@gmail.com" className="text-muted-foreground hover:text-white transition-colors">
                                <Mail className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/5 flex justify-center">
                    <p className="text-xs text-muted-foreground text-center">
                        © {currentYear} Guitariz Studio. MIT License.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

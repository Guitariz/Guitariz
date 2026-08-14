
import { Github, Twitter, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { openFeedbackModal } from "@/components/FeedbackModal";

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative z-10 border-t border-white/5 bg-[#0a0a0a]/90 pt-16 pb-8">
            <div className="container mx-auto max-w-5xl px-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-16">
                    {/* Brand Column */}
                    <div className="space-y-4 md:col-span-1">
                        <Link to="/" className="flex items-center gap-3">
                            <img src="/logo.png" alt="Guitariz Studio" className="w-8 h-8 object-contain" />
                            <span className="font-bold text-lg text-white tracking-tight">Guitariz Studio</span>
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
                            <li><Link to="/blog" className="hover:text-white transition-colors">Blog & Guides</Link></li>
                            <li><Link to="/gear" className="hover:text-white transition-colors">Recommended Gear</Link></li>
                            <li>
                                <button 
                                    onClick={() => openFeedbackModal("idea")} 
                                    className="hover:text-emerald-400 transition-colors text-left font-medium"
                                >
                                    Send Feedback
                                </button>
                            </li>
                            <li><a href="https://github.com/Guitariz/Guitariz" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Source Code</a></li>
                        </ul>
                    </div>

                    {/* Company & Legal */}
                    <div>
                        <h4 className="font-semibold text-white mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                            <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                            <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                            <li><Link to="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link></li>
                        </ul>
                    </div>

                    {/* Social / Connect */}
                    <div>
                        <h4 className="font-semibold text-white mb-4">Connect</h4>
                        <div className="flex gap-4 mb-4">
                            <a href="https://github.com/Guitariz/Guitariz" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-white transition-colors" title="GitHub">
                                <Github className="w-5 h-5" />
                            </a>
                            <a href="https://x.com/GuitarizStudio" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-white transition-colors" title="X (formerly Twitter)">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="mailto:support@guitariz.studio" className="text-muted-foreground hover:text-white transition-colors" title="Email">
                                <Mail className="w-5 h-5" />
                            </a>
                        </div>
                        <p className="text-[10px] text-zinc-550 leading-normal">
                            Note: We do not have any official Instagram page. Any Instagram account using the name "Guitariz" is completely unaffiliated.
                        </p>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/5 flex flex-col items-center gap-6">
                    <a 
                        href="https://www.producthunt.com/products/guitariz-studio?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-guitariz-studio" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:scale-105 transition-transform duration-200 active:scale-95 block rounded-xl overflow-hidden border border-white/5 hover:border-white/10"
                    >
                        <img 
                            src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1200915&theme=dark" 
                            alt="Guitariz Studio - Free AI Chord Recognition, 6-Stem Separator & Music Lab | Product Hunt" 
                            width="250" 
                            height="54" 
                            className="w-[250px] h-[54px] block"
                        />
                    </a>
                <div className="flex flex-col items-center gap-2">
                        <p className="text-xs text-muted-foreground text-center">
                            © {currentYear} Guitariz Studio. MIT License.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Calendar, User, Clock, ArrowLeft, Share2, Check, BookOpen } from "lucide-react";
import { Breadcrumb } from "@/components/SEOContent";
import RelatedTools from "@/components/RelatedTools";
import { usePageMetadata } from "@/hooks/usePageMetadata";

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  coverImage: string;
  category: string;
  tags: string[];
  readTime: string;
  html: string;
}

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Dynamic Page Metadata hooks
  usePageMetadata({
    title: post ? `${post.title} | Guitariz Blog` : "Loading Article...",
    description: post ? post.description : "Guitariz music theory and AI guide article.",
    canonicalUrl: post ? `https://guitariz.studio/blog/${post.slug}` : "https://guitariz.studio/blog",
  });

  useEffect(() => {
    fetch("/blog-posts.json")
      .then((res) => res.json())
      .then((data: BlogPost[]) => {
        const foundPost = data.find((p) => p.slug === slug);
        if (foundPost) {
          setPost(foundPost);
        } else {
          // If the post is not found, redirect to blog home
          navigate("/blog", { replace: true });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching blog post:", err);
        setLoading(false);
      });
  }, [slug, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      const element = contentRef.current;
      const totalHeight = element.clientHeight - window.innerHeight;
      const windowScrollTop = window.scrollY || document.documentElement.scrollTop;
      
      if (windowScrollTop === 0) {
        setScrollProgress(0);
      } else if (windowScrollTop > totalHeight) {
        setScrollProgress(100);
      } else {
        setScrollProgress((windowScrollTop / totalHeight) * 100);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [post]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-zinc-550 dark:text-zinc-400 text-sm animate-pulse">Loading article...</span>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-rose-500/30 selection:text-rose-200">
      {/* Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500 z-50 transition-all duration-100 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-500/5 dark:from-zinc-900/40 via-transparent to-transparent pointer-events-none h-[800px]" />

      <main ref={contentRef} className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <Breadcrumb
          items={[
            { name: "Home", url: "https://guitariz.studio/" },
            { name: "Blog", url: "https://guitariz.studio/blog" },
            { name: post.category, url: "https://guitariz.studio/blog" },
          ]}
        />

        {/* Back Link */}
        <div className="mt-8 mb-6">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-zinc-550 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 text-sm font-semibold transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Blog
          </Link>
        </div>

        {/* Article Header */}
        <header className="mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20 dark:border-rose-500/30">
            {post.category}
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-6 leading-tight">
            {post.title}
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
            {post.description}
          </p>

          {/* Author/Date Info */}
          <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-600 dark:text-zinc-400">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                {post.author}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                {new Date(post.date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                {post.readTime}
              </span>
            </div>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-250 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 font-semibold transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                  Copied link!
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-rose-500" />
                  Share Article
                </>
              )}
            </button>
          </div>
        </header>

        {/* Cover Image */}
        <div className="aspect-[21/9] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-850 mb-12 shadow-2xl">
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
        </div>

        {/* Markdown HTML Content */}
        <div className="prose dark:prose-invert prose-zinc max-w-none prose-rose prose-headings:font-bold prose-headings:text-zinc-900 dark:prose-headings:text-zinc-100 prose-a:text-rose-600 dark:prose-a:text-rose-400 hover:prose-a:text-rose-500 dark:hover:prose-a:text-rose-300 prose-img:rounded-xl prose-img:border prose-img:border-zinc-200 dark:prose-img:border-zinc-850 prose-pre:bg-zinc-50 dark:prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-250 dark:prose-pre:border-zinc-850/80 prose-hr:border-zinc-200 dark:prose-hr:border-zinc-900">
          <div dangerouslySetInnerHTML={{ __html: post.html }} />
        </div>

        {/* Divider */}
        <hr className="my-16 border-t border-zinc-200 dark:border-zinc-800" />

        {/* Footer Sidebar / Recommended tools inside the blog post */}
        <div className="mt-12 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-5 h-5 text-rose-500" />
            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">About Guitariz Studio</h3>
          </div>
          <p className="text-zinc-650 dark:text-zinc-400 text-sm leading-relaxed mb-6">
            This article is brought to you by Guitariz Studio. We provide professional-grade, free tools for music theory, chord recognition, and audio stem separation. Start practicing smarter today!
          </p>
          <RelatedTools currentPath="/blog" />
        </div>
      </main>
    </div>
  );
};

export default BlogPostPage;

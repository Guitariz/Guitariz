import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Calendar, User, Clock, ArrowRight, BookOpen } from "lucide-react";
import { Breadcrumb } from "@/components/SEOContent";
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
}

const BlogListPage: React.FC = () => {
  usePageMetadata({
    title: "Blog - Guitariz Studio | Music Theory & AI Production Articles",
    description: "Learn guitar chord transcription by ear, music theory tips, circle of fifths tutorials, and AI stem separation guides.",
    canonicalUrl: "https://guitariz.studio/blog",
  });
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/blog-posts.json")
      .then((res) => res.json())
      .then((data) => {
        setPosts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading blog posts:", err);
        setLoading(false);
      });
  }, []);

  const categories = ["All", ...Array.from(new Set(posts.map((p) => p.category)))];

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const featuredPost = filteredPosts[0];
  const regularPosts = filteredPosts.slice(1);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-rose-500/30 selection:text-rose-200">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-500/5 dark:from-zinc-900/40 via-transparent to-transparent pointer-events-none" />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <Breadcrumb
          items={[
            { name: "Home", url: "https://guitariz.studio/" },
            { name: "Blog", url: "https://guitariz.studio/blog" },
          ]}
        />

        {/* Hero Header */}
        <div className="mt-8 mb-16 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-650 dark:text-zinc-400 mb-4 backdrop-blur-sm">
            <BookOpen className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>Guitariz Studio Guidebook</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-zinc-850 to-zinc-700 dark:from-zinc-100 dark:via-zinc-200 dark:to-zinc-400">
            Music Theory & AI Guides
          </h1>
          <p className="mt-4 text-lg text-zinc-655 dark:text-zinc-400 max-w-2xl">
            In-depth guides, theory tutorials, and practical walk-throughs to level up your playing, transcribing, and production.
          </p>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-12 pb-6 border-b border-zinc-200 dark:border-zinc-800">
          {/* Categories */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto justify-start">
            {loading ? (
              <div className="h-9 w-24 bg-zinc-100 dark:bg-zinc-900/50 rounded-lg animate-pulse" />
            ) : (
              categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    selectedCategory === category
                      ? "bg-rose-600 text-white shadow-lg shadow-rose-900/25"
                      : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900/60 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800/85 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  {category}
                </button>
              ))
            )}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-100/50 dark:bg-zinc-900/40 border border-zinc-250 dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-700 focus:border-rose-500/50 dark:focus:border-rose-500/50 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-rose-500/30 transition-all duration-300"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 bg-zinc-100 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/10 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-500 dark:text-zinc-400 text-lg">No articles found matching your criteria.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="mt-4 text-rose-600 dark:text-rose-500 hover:text-rose-550 dark:hover:text-rose-400 text-sm font-semibold transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featuredPost && selectedCategory === "All" && searchQuery === "" && (
              <div className="group relative bg-zinc-50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700/80 rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-rose-950/5 mb-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  <div className="lg:col-span-7 aspect-[16/10] lg:aspect-auto overflow-hidden relative min-h-[300px]">
                    <img
                      src={featuredPost.coverImage}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-zinc-50/90 dark:from-[#060606]/85 via-transparent to-transparent" />
                    <span className="absolute top-4 left-4 px-3 py-1 rounded-md bg-rose-600 text-white text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
                      Featured
                    </span>
                  </div>
                  <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-center">
                    <span className="text-xs font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-2">
                      {featuredPost.category}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors duration-300 leading-tight">
                      <Link to={`/blog/${featuredPost.slug}`}>{featuredPost.title}</Link>
                    </h2>
                    <p className="mt-4 text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed line-clamp-3">
                      {featuredPost.description}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-4 items-center text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(featuredPost.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {featuredPost.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {featuredPost.readTime}
                      </span>
                    </div>
                    <div className="mt-8">
                      <Link
                        to={`/blog/${featuredPost.slug}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-700 text-sm font-semibold text-zinc-750 dark:text-zinc-200 transition-all"
                      >
                        Read Article
                        <ArrowRight className="w-4 h-4 text-rose-500 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Regular Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(selectedCategory === "All" && searchQuery === "" ? regularPosts : filteredPosts).map((post) => (
                <article
                  key={post.slug}
                  className="group flex flex-col bg-zinc-50 dark:bg-zinc-900/10 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700/80 rounded-2xl overflow-hidden transition-all duration-300 hover:translate-y-[-4px] hover:shadow-xl hover:shadow-rose-950/5"
                >
                  <div className="aspect-[16/10] overflow-hidden relative">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-white/95 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-300 text-[10px] font-semibold uppercase tracking-wider border border-zinc-200 dark:border-zinc-800 backdrop-blur-sm">
                      {post.category}
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="text-lg font-bold text-zinc-850 dark:text-zinc-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2">
                      <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                    </h3>
                    <p className="mt-2.5 text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed line-clamp-3 flex-grow">
                      {post.description}
                    </p>
                    <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default BlogListPage;

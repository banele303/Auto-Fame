
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Clock, ArrowLeft, UserIcon, CalendarIcon } from "lucide-react";
import { Metadata } from "next";
import MarkdownRenderer from "@/components/blog/MarkdownRenderer";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug },
  });
  
  if (!post) return { title: 'Post Not Found' };
  
  return {
    title: `${post.title} | Advance Auto Blog`,
    description: post.excerpt || post.metaDescription || `Read about ${post.title}`,
    keywords: post.metaKeywords,
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug },
  });

  if (!post) {
    notFound();
  }

  const formattedDate = post.publishedAt 
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Draft';

  // Estimate reading time (rough calc: 200 words per minute)
  const wordCount = post.content.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / 200);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Title & Metadata Header */}
      <div className="pt-28 pb-24 bg-slate-50 dark:bg-slate-900/50 border-b">
        <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
                <Button variant="ghost" size="sm" asChild className="mb-8 -ml-2 text-muted-foreground hover:text-primary transition-colors">
                    <Link href="/blog" className="flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Articles
                    </Link>
                </Button>
                
                <div className="space-y-6">
                    <div className="flex flex-wrap gap-2">
                        {post.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 py-1">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
                        {post.title}
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-6 text-muted-foreground text-sm md:text-base pt-6 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <UserIcon className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-semibold text-slate-900 dark:text-slate-200">{post.authorName || 'Advance Auto Team'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 opacity-70" />
                            <span>{formattedDate}</span>
                        </div>
                         <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 opacity-70" />
                            <span>{readTime} min read</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Featured Image - Contained & Centered */}
      <div className="container mx-auto px-4 md:px-6 -mt-12 relative z-10">
        <div className="max-w-5xl mx-auto">
            <div className="relative aspect-video md:aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl border-8 border-white dark:border-slate-950 bg-muted">
                {post.coverImage ? (
                     <img 
                        src={post.coverImage} 
                        alt={post.title} 
                        className="w-full h-full object-cover"
                     />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10" />
                )}
            </div>
        </div>
      </div>

      {/* Content Container */}
      <article className="container mx-auto px-4 md:px-6 pt-16">
        <div className="bg-card rounded-2xl shadow-xl p-8 md:p-12 lg:p-14 max-w-4xl border mx-auto">
             
             {post.excerpt && (
                 <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-10 font-light border-l-4 border-primary pl-6 py-2 italic">
                     {post.excerpt}
                 </p>
             )}

            {/* Main Content */}
            <div className="prose prose-lg dark:prose-invert prose-stone max-w-none 
                prose-headings:font-bold prose-headings:tracking-tight
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-xl prose-img:shadow-lg
                prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:py-2 prose-blockquote:pl-4 prose-blockquote:rounded-r
            ">
                <MarkdownRenderer content={post.content} />
            </div>

            <div className="mt-16 pt-8 border-t flex justify-between items-center">
                <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Written by</span>
                    <span className="text-lg font-bold">{post.authorName || 'Advance Auto Team'}</span>
                </div>
                <Button variant="outline" size="icon" className="rounded-full h-12 w-12 hover:bg-muted" title="Share Article">
                    <Share2 className="w-5 h-5" />
                </Button>
            </div>
        </div>
      </article>

      {/* Suggested/Related Posts Placeholder - Can be implemented later */}
    </div>
  );
}


import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, UserIcon, ArrowRight } from "lucide-react";
import Image from "next/image";

interface BlogPost {
  id: number;
  title: string;
  excerpt: string | null;
  slug: string;
  coverImage: string | null;
  authorName: string | null;
  publishedAt: string | Date | null;
  tags: string[];
}

export function BlogCard({ post }: { post: BlogPost }) {
  // Format date safely
  const formattedDate = post.publishedAt 
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Draft';

  return (
    <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full group border-border/50 bg-card/50 backdrop-blur-sm">
      {post.coverImage && (
        <div className="relative w-full h-56 overflow-hidden">
            {/* Using img tag to avoid Next.js Image domain configuration issues for now, 
                can be swapped to Next.js Image if domains are configured */}
            <img 
              src={post.coverImage} 
              alt={post.title} 
              className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      )}
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
            {post.tags && post.tags.length > 0 && (
                <Badge variant="secondary" className="font-normal text-xs px-2.5 py-0.5 pointer-events-none">
                  {post.tags[0]}
                </Badge>
            )}
             <span className="text-muted-foreground/80 text-xs flex items-center gap-1.5 ml-auto">
                <CalendarIcon className="w-3.5 h-3.5" />
                {formattedDate}
             </span>
        </div>
        <CardTitle className="text-xl font-bold line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            <Link href={`/blog/${post.slug}`} className="focus:outline-none">
                <span className="absolute inset-0 z-10" aria-hidden="true" />
                {post.title}
            </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
            {post.excerpt || "No description available."}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t border-border/50 pt-4 mt-auto">
         <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <UserIcon className="w-4 h-4 text-primary/80" />
            <span>{post.authorName || 'Advance Auto Team'}</span>
         </div>
         <span className="text-sm font-semibold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Read Article <ArrowRight className="w-4 h-4" />
         </span>
      </CardFooter>
    </Card>
  );
}


import { prisma } from "@/lib/prisma";
import { BlogCard } from "@/components/blog/BlogCard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Advance Auto",
  description: "Latest news, reviews, and insights from the automotive world.",
};

// Force dynamic rendering to ensure latest posts are shown
export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 md:px-6 bg-muted/30 border-b">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Automotive Insights
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Discover the latest trends, expert reviews, and maintenance tips to keep your journey smooth.
          </p>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="container mx-auto py-16 px-4 md:px-6">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border rounded-2xl bg-muted/10 border-dashed">
            <h3 className="text-2xl font-semibold mb-2">No articles published yet</h3>
            <p className="text-muted-foreground max-w-md">
              We are working on bringing you the best content. Check back soon for updates!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
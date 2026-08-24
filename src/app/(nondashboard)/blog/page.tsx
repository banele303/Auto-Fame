import { BlogCard } from "@/components/blog/BlogCard";
import { Metadata } from "next";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import { siteConfig } from "@/lib/siteConfig";
import { convexClient } from "@/lib/convex";
import { api } from "../../../../convex/_generated/api";

export const metadata: Metadata = {
  title: "AutoFame Blog | Used Car Advice, News & Guides in South Africa",
  description: "Read the latest South African car buying guides, vehicle financing tips, maintenance advice, and dealership news from AutoFame Johannesburg South.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "AutoFame Automotive Blog | South Africa",
    description: "Car advice, buying guides, and automotive news in Johannesburg.",
    url: `${siteConfig.brand.url}/blog`,
  },
};

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  let posts: any[] = [];
  try {
    const convexPosts = await convexClient.query(api.blogs.list, { publishedOnly: true });
    if (Array.isArray(convexPosts)) {
      posts = convexPosts;
    }
  } catch (error) {
    console.warn("Failed to fetch blog posts from Convex, rendering empty state:", error);
  }

  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Blog', url: '/blog' },
        ]}
      />
      {/* Hero Section */}
      <section className="relative py-20 px-4 md:px-6 bg-muted/30 border-b">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Automotive Insights & Guides
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Discover car buying advice, vehicle financing tips, and maintenance insights from the AutoFame team in Johannesburg South.
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
              <BlogCard key={post.id || post.slug} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
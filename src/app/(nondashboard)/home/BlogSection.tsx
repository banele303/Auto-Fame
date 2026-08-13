"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ChevronRight, UserIcon, Loader2 } from "lucide-react";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  authorName: string | null;
  publishedAt: string | null;
  tags: string[];
}

const BlogSection = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch("/api/posts?limit=3&page=1");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setPosts(data.posts || []);
      } catch (error) {
        console.error("Error fetching blog posts:", error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Don't render the section if there are no posts and we're done loading
  if (!loading && posts.length === 0) {
    return null;
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Draft";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getReadTime = (excerpt: string | null) => {
    // Rough estimate based on excerpt length
    const words = (excerpt || "").split(/\s+/).length;
    return Math.max(2, Math.ceil(words / 50)) + " min read";
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Latest from Our Blog</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Stay informed with the latest automotive news, tips, and insights from our team.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#00A211]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col"
              >
                <div className="relative h-48">
                  {post.coverImage ? (
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#00A211]/20 to-[#00A211]/5 flex items-center justify-center">
                      <span className="text-4xl font-bold text-[#00A211]/20">
                        {post.title.charAt(0)}
                      </span>
                    </div>
                  )}
                  {post.tags && post.tags.length > 0 && (
                    <div className="absolute top-0 right-0 bg-[#00A211] text-white text-xs font-bold px-3 py-1 m-2 rounded">
                      {post.tags[0]}
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center">
                      <Calendar size={12} className="mr-1" />
                      {formatDate(post.publishedAt)}
                    </span>
                    <span className="flex items-center">
                      <Clock size={12} className="mr-1" />
                      {getReadTime(post.excerpt)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-[#00A211] transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 flex-grow line-clamp-3">
                    {post.excerpt || "Read more about this article..."}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <UserIcon size={12} />
                      <span>{post.authorName || "Advance Auto Team"}</span>
                    </div>
                    <span className="text-[#00A211] font-semibold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Read More
                      <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {posts.length > 0 && (
          <div className="text-center mt-10">
            <Link href="/blog">
              <Button className="bg-[#00A211] hover:bg-[#009210]">
                View All Articles
                <ChevronRight size={16} className="ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogSection;

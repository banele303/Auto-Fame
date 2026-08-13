
# Blog Section Implementation

## Overview
A full-stack blog section has been added to the website, featuring:
- **Database Schema**: New `Post` model in Prisma.
- **API Routes**: Endpoints to list, create, read, update, and delete posts.
- **Frontend**: A modern, responsive blog listing page and detailed single post page.

## Features
- **SEO Optimized**: Dynamic metadata generation for each post.
- **Responsive Design**: Works on mobile, tablet, and desktop.
- **Modern UI**: Uses Card components, badges, and clean typography.
- **Dynamic Content**: Fetches latest published posts from the database.

## How to Manage Posts

Currently, you can manage posts using the API endpoints. An admin UI can be built later.

### Create a Post (Example)

**endpoint**: `POST /api/posts`

**Body (JSON)**:
```json
{
  "title": "Top 10 Cars for 2026",
  "slug": "top-10-cars-2026",
  "excerpt": "Discover the most anticipated vehicles arriving this year.",
  "content": "This is the full content of the blog post. It supports newlines and basic text.",
  "coverImage": "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=2070",
  "tags": ["Reviews", "New Arrivals"],
  "authorName": "John Doe",
  "published": true,
  "publishedAt": "2026-02-18T10:00:00Z"
}
```

### Accessing the Blog
- **Blog Home**: Navigate to `/blog`
- **Single Post**: Navigate to `/blog/your-post-slug`

## Files Created
- `prisma/schema.prisma` (Updated)
- `src/app/api/posts/route.ts`
- `src/app/api/posts/[slug]/route.ts`
- `src/app/(nondashboard)/blog/page.tsx`
- `src/app/(nondashboard)/blog/[slug]/page.tsx`
- `src/components/blog/BlogCard.tsx`

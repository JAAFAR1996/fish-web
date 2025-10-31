import { cache } from 'react';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

import type { BlogPost, BlogPostMetadata, BlogCategory, BlogCategoryInfo } from '@/types';
import { CONTENT_DIR, MAX_EXCERPT_LENGTH, BLOG_CATEGORIES, DEFAULT_COVER_IMAGE } from './constants';

export const getAllBlogPosts = cache(async (): Promise<BlogPost[]> => {
  const contentDir = path.join(process.cwd(), CONTENT_DIR);
  
  if (!fs.existsSync(contentDir)) {
    return [];
  }

  const files = fs.readdirSync(contentDir);
  const mdxFiles = files.filter((file) => file.endsWith('.mdx'));

  const posts = mdxFiles
    .map((file) => {
      try {
        const filePath = path.join(contentDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const { data, content } = matter(fileContent);
        const slug = file.replace('.mdx', '');
        const readingTimeMinutes = Math.ceil(readingTime(content).minutes);

        // Validate and apply defaults
        const stats = fs.statSync(filePath);
        const publishedAt = validateDate(data.publishedAt) 
          ? data.publishedAt 
          : stats.birthtime.toISOString();
        const excerpt = data.excerpt || extractExcerpt(content, MAX_EXCERPT_LENGTH);

        // Skip posts with invalid required fields
        if (!data.title || !data.category || !data.author?.name) {
          console.warn(`Skipping invalid post: ${file}`);
          return null;
        }

        return {
          slug,
          content,
          readingTime: readingTimeMinutes,
          title: data.title,
          excerpt,
          category: data.category,
          tags: data.tags || [],
          coverImage: data.coverImage || DEFAULT_COVER_IMAGE,
          author: {
            name: data.author.name,
            avatar: data.author.avatar || '',
            bio: data.author.bio || '',
            social: data.author.social || {},
          },
          publishedAt,
          updatedAt: data.updatedAt || null,
          relatedProducts: data.relatedProducts || [],
          seo: data.seo || {
            title: data.title,
            description: excerpt,
          },
        } as BlogPost;
      } catch (error) {
        console.error(`Error parsing ${file}:`, error);
        return null;
      }
    })
    .filter((post): post is BlogPost => post !== null);

  return posts.sort((a, b) => {
    const dateA = new Date(a.publishedAt).getTime() || 0;
    const dateB = new Date(b.publishedAt).getTime() || 0;
    return dateB - dateA;
  });
});

export const getBlogPostBySlug = cache(async (slug: string): Promise<BlogPost | null> => {
  const filePath = path.join(process.cwd(), CONTENT_DIR, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent);
    const readingTimeMinutes = Math.ceil(readingTime(content).minutes);

    // Validate and apply defaults
    const stats = fs.statSync(filePath);
    const publishedAt = validateDate(data.publishedAt) 
      ? data.publishedAt 
      : stats.birthtime.toISOString();
    const excerpt = data.excerpt || extractExcerpt(content, MAX_EXCERPT_LENGTH);

    if (!data.title || !data.category || !data.author?.name) {
      console.error(`Invalid post: ${slug}`);
      return null;
    }

    return {
      slug,
      content,
      readingTime: readingTimeMinutes,
      title: data.title,
      excerpt,
      category: data.category,
      tags: data.tags || [],
      coverImage: data.coverImage || DEFAULT_COVER_IMAGE,
      author: {
        name: data.author.name,
        avatar: data.author.avatar || '',
        bio: data.author.bio || '',
        social: data.author.social || {},
      },
      publishedAt,
      updatedAt: data.updatedAt || null,
      relatedProducts: data.relatedProducts || [],
      seo: data.seo || {
        title: data.title,
        description: excerpt,
      },
    } as BlogPost;
  } catch (error) {
    console.error(`Error parsing ${slug}:`, error);
    return null;
  }
});

export const getBlogPostsByCategory = cache(async (category: BlogCategory): Promise<BlogPost[]> => {
  const allPosts = await getAllBlogPosts();
  return allPosts.filter((post) => post.category === category);
});

export const getRelatedPosts = cache(async (currentPost: BlogPost, limit: number = 3): Promise<BlogPost[]> => {
  const allPosts = await getAllBlogPosts();
  const otherPosts = allPosts.filter((p) => p.slug !== currentPost.slug);

  const scoredPosts = otherPosts.map((post) => {
    let score = 0;

    if (post.category === currentPost.category) {
      score += 10;
    }

    const overlappingTags = post.tags.filter((tag) => currentPost.tags.includes(tag));
    score += overlappingTags.length * 5;

    const daysSincePublished = Math.floor(
      (Date.now() - new Date(post.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSincePublished <= 30) {
      score += 1;
    }

    return { post, score };
  });

  scoredPosts.sort((a, b) => b.score - a.score);

  return scoredPosts.slice(0, limit).map((item) => item.post);
});

export const getBlogCategories = cache(async (): Promise<BlogCategoryInfo[]> => {
  const allPosts = await getAllBlogPosts();

  const categoryCounts = allPosts.reduce((acc, post) => {
    acc[post.category] = (acc[post.category] || 0) + 1;
    return acc;
  }, {} as Record<BlogCategory, number>);

  return BLOG_CATEGORIES.map((cat) => ({
    key: cat.key,
    title: cat.key,
    description: '',
    icon: cat.icon,
    color: cat.color,
    postCount: categoryCounts[cat.key] || 0,
  }));
});

function validateDate(dateString: string | undefined): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

export function extractExcerpt(content: string, maxLength: number = MAX_EXCERPT_LENGTH): string {
  const plainText = content
    .replace(/^#{1,6}\s+.*$/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~]/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  const truncated = plainText.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    return truncated.slice(0, lastSpace) + '...';
  }

  return truncated + '...';
}

// src/lib/paths.ts

export const PATHS = {
    adminBlog: '/admin/blog',
    adminBlogPosts: '/admin/blog/posts',
    adminBlogPostsNew: '/admin/blog/posts/new',
    adminBlogPostsArchives: '/admin/blog/posts/archives',
    adminBlogCategories: '/admin/blog/categories',
    adminBlogPCategoriesNew: '/admin/blog/categories/new',
    publicBlogIndex: '/blog',
    publicPost: (slug: string) => `/blog/${slug}`,
};

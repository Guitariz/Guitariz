import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

const blogDir = path.resolve(process.cwd(), 'src/content/blog');
const publicDir = path.resolve(process.cwd(), 'public');

const files = fs.readdirSync(blogDir);
const posts = [];

for (const file of files) {
  if (file.endsWith('.md')) {
    const slug = file.replace(/\.md$/, '');
    const rawContent = fs.readFileSync(path.join(blogDir, file), 'utf8');
    const { data, content } = matter(rawContent);
    const htmlContent = marked(content);

    posts.push({
      slug,
      title: data.title,
      description: data.description,
      date: data.date,
      author: data.author,
      coverImage: data.coverImage,
      category: data.category,
      tags: data.tags || [],
      readTime: data.readTime || '5 min read',
      html: htmlContent
    });
  }
}

posts.sort((a, b) => new Date(b.date) - new Date(a.date));

fs.writeFileSync(path.join(publicDir, 'blog-posts.json'), JSON.stringify(posts, null, 2));
console.log(`Successfully compiled ${posts.length} blog posts to public/blog-posts.json!`);

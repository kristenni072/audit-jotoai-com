import React from 'react';
import { motion } from 'motion/react';
import { Calendar, User, Tag, ArrowLeft, Share2, MessageSquare } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { blogPosts } from '../data/blogData';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

export default function BlogPost() {
  const { id: idParam } = useParams();
  const id = parseInt(idParam || '0');
  const post = blogPosts.find(p => p.id === id);

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-4">文章未找到</h1>
          <p className="text-slate-500 mb-8">抱歉，您访问的文章可能已被移动或删除。</p>
          <Link to="/blog" className="inline-flex items-center text-blue-600 font-bold hover:underline">
            <ArrowLeft className="h-4 w-4 mr-2" /> 返回博客列表
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Article Header */}
      <div className="relative h-[400px] md:h-[500px] overflow-hidden">
        <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          src={post.image} 
          alt={post.title} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <div className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-wider mb-6">
              {post.category}
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center text-slate-300 text-sm gap-6">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {post.date}
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                {post.author}
              </div>
              <div className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                12 评论
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Content */}
          <motion.article 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex-1"
          >
            <div 
              className="prose prose-lg prose-slate max-w-none 
                prose-headings:text-slate-900 prose-headings:font-bold 
                prose-p:text-slate-600 prose-p:leading-relaxed
                prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-slate-50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:italic
                prose-strong:text-slate-900
                prose-ul:list-disc prose-ul:pl-6
              "
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
            
            {/* Tags & Share */}
            <motion.div 
              {...fadeInUp}
              className="mt-16 pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6"
            >
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">AI 法律</span>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">合同审查</span>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">数字化转型</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm font-bold text-slate-900">分享文章:</span>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-blue-600 hover:text-white transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                </motion.button>
              </div>
            </motion.div>

            {/* Navigation */}
            <div className="mt-12 flex justify-between items-center">
              <motion.div 
                whileHover={{ x: -5 }}
              >
                <Link 
                  to="/blog" className="inline-flex items-center text-blue-600 font-bold hover:underline"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" /> 返回博客列表
                </Link>
              </motion.div>
            </div>
          </motion.article>

          {/* Sidebar */}
          <aside className="lg:w-64 hidden lg:block">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="sticky top-24 space-y-8"
            >
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <h4 className="font-bold text-slate-900 mb-4">关于作者</h4>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{post.author}</div>
                    <div className="text-slate-500 text-xs">高级法律科技专家</div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  专注于 AI 在法律领域的落地应用，拥有超过 10 年的法务管理经验。
                </p>
              </div>
            </motion.div>
          </aside>
        </div>
      </div>
    </div>
  );
}

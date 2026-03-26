import { Helmet } from 'react-helmet-async';
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Calendar, ArrowRight, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { blogPosts } from '../data/blogData';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const categories = [
  { name: '全部动态', count: 24 },
  { name: '行业趋势', count: 8 },
  { name: '产品更新', count: 12 },
  { name: '法律百科', count: 4 },
];

const POSTS_PER_PAGE = 4;

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部动态');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredPosts = useMemo(() => {
    return blogPosts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === '全部动态' || post.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const currentPosts = filteredPosts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
    <Helmet>
      <title>博客 - 唯客智审 | 法律科技与 AI 合同审查资讯</title>
      <meta name="description" content="唯客智审博客：聚焦 AI 法律科技、合同风险管理、智能法务工作流最新动态与行业洞察。" />
    </Helmet>
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Section */}
      <section className="bg-white py-20 border-b border-slate-100">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <div className="inline-block bg-slate-100 text-slate-500 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-6">
            BLOG
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
            探索 AI 合同审查的最新动态
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            深入了解智能合同审查技术趋势、行业案例与法律风控深度洞察。
          </p>
        </motion.div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Sidebar */}
          <aside className="lg:col-span-3 space-y-8">
            {/* Search */}
            <motion.div 
              {...fadeInUp}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-4">搜索动态</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="输入关键词搜索..." 
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </motion.div>

            {/* Categories */}
            <motion.div 
              {...fadeInUp}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-4">文章分类</h3>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <motion.button 
                    key={cat.name}
                    whileHover={{ x: 5 }}
                    onClick={() => {
                      setSelectedCategory(cat.name);
                      setCurrentPage(1);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === cat.name
                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${selectedCategory === cat.name ? 'bg-blue-100' : 'bg-slate-100 text-slate-400'}`}>
                      {cat.count}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Newsletter Card */}
            <motion.div 
              {...fadeInUp}
              transition={{ delay: 0.4 }}
              className="bg-[#1e3a8a] rounded-2xl p-6 text-white flex flex-col justify-center items-center text-center shadow-lg"
            >
              <div className="bg-blue-500/20 p-3 rounded-xl mb-4">
                <Mail className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">订阅我们的通讯</h3>
              <p className="text-blue-100 text-xs mb-6 leading-relaxed">
                每周获取最新的法律科技资讯和产品动态。
              </p>
              <div className="w-full space-y-3">
                <input 
                  type="email" 
                  placeholder="您的邮箱地址" 
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-xs placeholder:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link 
                    to="/contact"
                    className="block w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-2.5 rounded-lg transition-colors shadow-lg text-center"
                  >
                    立即订阅
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </aside>

          {/* Blog Grid */}
          <main className="lg:col-span-9">
            <AnimatePresence mode="wait">
              <motion.div 
                key={selectedCategory + searchQuery + currentPage}
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                {currentPosts.length > 0 ? (
                  currentPosts.map((post) => (
                    <motion.article 
                      key={post.id} 
                      variants={fadeInUp}
                      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group"
                    >
                      <div className="relative h-52 overflow-hidden">
                        <img 
                          src={post.image} 
                          alt={post.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className={`absolute top-4 left-4 ${post.tagColor} text-white text-[10px] font-bold px-3 py-1 rounded uppercase tracking-wider`}>
                          {post.category}
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex items-center text-slate-400 text-xs mb-4">
                          <Calendar className="h-3 w-3 mr-2" />
                          {post.date}
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          <Link to={`/blog/${post.id}`}>{post.title}</Link>
                        </h2>
                        <p className="text-slate-500 text-sm mb-6 line-clamp-3 leading-relaxed">
                          {post.excerpt}
                        </p>
                        <motion.div 
                          whileHover={{ x: 5 }}
                        >
                          <Link 
                            to={`/blog/${post.id}`} className="inline-flex items-center text-blue-600 text-sm font-bold hover:text-blue-700 transition-colors"
                          >
                            阅读全文 <ArrowRight className="h-4 w-4 ml-2" />
                          </Link>
                        </motion.div>
                      </div>
                    </motion.article>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center">
                    <p className="text-slate-500">未找到相关文章</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div 
                {...fadeInUp}
                className="mt-16 flex justify-center"
              >
                <nav className="flex items-center space-x-2">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button 
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                          currentPage === pageNum 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </nav>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
    </>
  );
}
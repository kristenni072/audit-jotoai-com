const axios = require('axios');
const { OpenAI } = require('openai');
const { markdownToHtml, cleanHtml } = require('./article-rewriter');
const { searchAndFetchArticles, selectBestArticle } = require('./article-search');
const { rewriteArticle } = require('./article-rewriter');
const { UnsplashFetcher } = require('./unsplash-fetcher-simple');

// 默认SEO关键词列表（仅在未配置时使用）
const DEFAULT_KEYWORDS = [
  'RAG',
  '检索增强生成',
  '企业知识库',
  '企业知识中台',
  '知识管理平台',
  '智能知识库',
  'AI知识管理',
  '企业AI应用',
  '智能客服系统',
  '知识图谱'
];

// 解析关键词字符串为数组
function parseKeywords(keywordsInput) {
  if (Array.isArray(keywordsInput) && keywordsInput.length > 0) {
    return keywordsInput;
  }
  if (typeof keywordsInput === 'string' && keywordsInput.trim()) {
    return keywordsInput.split(/[,，、\n]+/).map(k => k.trim()).filter(k => k);
  }
  return DEFAULT_KEYWORDS;
}

// 从关键词列表中随机选择一个
function pickRandomKeyword(keywords) {
  const list = parseKeywords(keywords);
  return list[Math.floor(Math.random() * list.length)];
}

// 本地图片库（合同审查/法律科技主题，仅作最终备用）
const LOCAL_IMAGES = [
  '/images/articles/contract-review-1.jpg',
  '/images/articles/legal-tech-1.jpg',
  '/images/articles/ai-contract-1.jpg',
  '/images/articles/business-document-1.jpg',
  '/images/articles/legal-compliance-1.jpg'
];

// 获取本地图片（随机选择，仅作最终备用）
function getLocalImage(keyword) {
  // 根据关键词选择最相关的图片
  const keywordLower = keyword.toLowerCase();

  if (keywordLower.includes('合同') || keywordLower.includes('contract')) {
    return Math.random() > 0.5 ? '/images/articles/contract-review-1.jpg' : '/images/articles/ai-contract-1.jpg';
  } else if (keywordLower.includes('法律') || keywordLower.includes('legal') || keywordLower.includes('法务')) {
    return Math.random() > 0.5 ? '/images/articles/legal-tech-1.jpg' : '/images/articles/legal-compliance-1.jpg';
  } else {
    // 随机选择一张图片
    return LOCAL_IMAGES[Math.floor(Math.random() * LOCAL_IMAGES.length)];
  }
}

// 获取Unsplash免费图片（保留作为备用）
async function getUnsplashImage(keyword) {
  try {
    const response = await axios.get(`https://source.unsplash.com/800x600/?${encodeURIComponent(keyword)},legal,business,contract`, {
      maxRedirects: 0,
      validateStatus: (status) => status === 302
    });
    return response.headers.location || `https://source.unsplash.com/800x600/?legal,business,professional`;
  } catch (error) {
    return `https://source.unsplash.com/800x600/?legal,business,professional`;
  }
}

// 获取唯一图片（Unsplash → AI生成 → 本地图片）
// recentImageUrls: 最近N篇文章已使用的图片URL列表，用于去重
async function getUniqueArticleImage(keyword, imageConfig = null, recentImageUrls = []) {
  console.log(`\n获取文章配图: ${keyword}`);
  console.log(`imageConfig:`, imageConfig);
  console.log(`去重: 排除最近 ${recentImageUrls.length} 张已用图片`);

  // 方案1: 优先使用Unsplash（每张图片都不重复）
  if (imageConfig && imageConfig.unsplashApiKey) {
    console.log(`尝试使用Unsplash API: ${imageConfig.unsplashApiKey.substring(0, 10)}...`);
    try {
      const unsplashFetcher = new UnsplashFetcher(imageConfig.unsplashApiKey);
      const image = await unsplashFetcher.getUniqueImage(keyword);
      console.log(`✓ 使用Unsplash图片: ${image.webPath}`);
      return {
        url: image.webPath,
        source: 'unsplash',
        author: image.author,
        authorUrl: image.authorUrl,
        unsplashUrl: image.unsplashUrl
      };
    } catch (error) {
      console.log(`Unsplash图片获取失败: ${error.message}，尝试备用方案`);
    }
  }

  // 方案2: 备用 - AI生成图片
  if (imageConfig && imageConfig.useAI && imageConfig.apiKey) {
    try {
      const { OpenAI } = require('openai');
      const openai = new OpenAI({ apiKey: imageConfig.apiKey });

      const imageResponse = await openai.images.generate({
        model: 'dall-e-3',
        prompt: `A professional, modern illustration about ${keyword} related to legal contract review and AI legal technology. Clean, minimalist design with blue and navy colors. Show professional business documents, legal contracts, and AI elements in a harmonious way. NO text, NO logos, NO brand names, NO watermarks.`,
        size: '1024x1024',
        quality: 'standard',
        n: 1,
      });

      console.log(`✓ 使用AI生成图片`);
      return {
        url: imageResponse.data[0].url,
        source: 'ai'
      };
    } catch (error) {
      console.log(`AI图片生成失败: ${error.message}，使用本地图片`);
    }
  }

  // 方案3: 最后备用 - 本地图片（带去重）
  const usedSet = new Set(recentImageUrls);
  // 先尝试按关键词匹配的图片
  const preferredImage = getLocalImage(keyword);
  if (!usedSet.has(preferredImage)) {
    console.log(`✓ 使用本地图片: ${preferredImage}`);
    return { url: preferredImage, source: 'local' };
  }
  // 关键词匹配的图片已被使用，从未使用的图片中随机选
  const available = LOCAL_IMAGES.filter(img => !usedSet.has(img));
  if (available.length > 0) {
    const picked = available[Math.floor(Math.random() * available.length)];
    console.log(`✓ 使用本地图片（去重后）: ${picked}`);
    return { url: picked, source: 'local' };
  }
  // 所有本地图片都用过了，回退到随机选（总比报错好）
  const fallback = LOCAL_IMAGES[Math.floor(Math.random() * LOCAL_IMAGES.length)];
  console.log(`⚠️ 本地图片全部用过，随机回退: ${fallback}`);
  return { url: fallback, source: 'local' };
}

// 使用LLM生成文章
async function generateArticleWithLLM(llmConfig, keyword, wordCount = 1000) {
  try {
    let endpoint = llmConfig.apiEndpoint;
    if (!endpoint.includes('/chat/completions')) {
      endpoint = endpoint.replace(/\/$/, '') + '/chat/completions';
    }
    
    const response = await axios.post(
      endpoint,
      {
        model: llmConfig.model || 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: '你是一名专注于AI合同审查、法律合规和法律科技领域的专业内容创作者，擅长撰写合同风控、智能合同审查、企业法务管理等主题的SEO文章。请严格按照要求的字数生成文章，不得少于要求字数的90%，内容要充实详细，紧扣合同审查和法律科技主题，不要涉及教育相关内容。'
          },
          {
            role: 'user',
            content: `请写一篇关于"${keyword}"的SEO文章，要求：
1. 字数必须达到${wordCount}字以上（不少于${Math.floor(wordCount * 0.9)}字），内容要充实，多举例说明
2. 包含吸引人的标题
3. 内容专业、实用，面向企业法务、合同管理人员
4. 自然融入关键词"${keyword}"
5. 包含实际应用场景和案例
6. 文章结构：引言 → 3-5个主章节（每章节有2-3个子章节）→ 总结
7. 直接输出 HTML 格式，使用以下标签：
   - <h2> 主章节标题
   - <h3> 子章节标题
   - <p> 段落正文
   - <strong> 关键词加粗（每段1-2处）
   - <ul><li> 列表
8. 禁止使用 Markdown 语法（###、**、- 等），禁止输出 <html>/<head>/<body> 标签
9. 用 JSON 格式返回，包含 title 和 content 字段，content 为 HTML 字符串`
          }
        ],
        temperature: 0.8,
        max_tokens: Math.max(4000, wordCount * 2),
      },
      {
        headers: {
          'Authorization': `Bearer ${llmConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 180000
      }
    );
    
    const content = response.data.choices[0].message.content;
    
    // 尝试解析JSON，并后处理 content 为规范 HTML
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      // 如果不是JSON格式，尝试提取标题和内容
      const contentLines = content.split('\n').filter(line => line.trim());
      parsed = {
        title: contentLines[0].replace(/^#+\s*/, '').replace(/^["']|["']$/g, ''),
        content: contentLines.slice(1).join('\n\n')
      };
    }
    // 后处理：把 Markdown 或混合内容转为规范 HTML
    if (parsed && parsed.content) {
      parsed.content = cleanHtml(markdownToHtml(parsed.content));
    }
    return parsed;
  } catch (error) {
    console.error('LLM API调用失败:', error.message);
    throw error;
  }
}

// 生成AI原创文章
// existingArticles: 现有文章数组，用于图片去重
async function generateArticle(llmConfig = null, imageConfig = null, dedupConfig = null, wordCount = 1000, seoKeywords = null, existingArticles = []) {
  console.log('[generateArticle] 收到的imageConfig:', JSON.stringify(imageConfig));
  console.log('[generateArticle] dedupConfig:', JSON.stringify(dedupConfig));
  const keyword = pickRandomKeyword(seoKeywords);

  let articleData;

  // 生成文章内容
  if (llmConfig && llmConfig.apiKey && llmConfig.apiEndpoint) {
    try {
      articleData = await generateArticleWithLLM(llmConfig, keyword, wordCount);
    } catch (error) {
      console.error('使用配置的LLM失败，使用默认内容:', error.message);
      articleData = generateDefaultArticle(keyword);
    }
  } else {
    // 使用环境变量中的OpenAI配置
    try {
      const { OpenAI } = require('openai');
      const openai = new OpenAI();

      const articleResponse = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: '你是一名专注于AI合同审查和法律科技领域的专业内容创作者，请勿撰写与教育相关的内容。'
          },
          {
            role: 'user',
            content: `请写一篇关于"${keyword}"的SEO文章，要求：
1. 字数约${wordCount}字（误差±10%）
2. 包含吸引人的标题
3. 内容专业、实用，适合目标读者阅读
4. 自然融入关键词"${keyword}"
5. 包含实际应用场景和案例
6. **重要**：文章必须分段，每段3-5句话，段落之间用空行分隔
7. **重要**：使用\n\n来分隔段落，确保文章有清晰的段落结构
8. 以JSON格式返回，包含title和content字段，content中使用\n\n分隔段落`
          }
        ],
        temperature: 0.8,
      });

      articleData = JSON.parse(articleResponse.choices[0].message.content);
    } catch (error) {
      console.error('使用默认OpenAI失败:', error.message);
      articleData = generateDefaultArticle(keyword);
    }
  }

  // 构建最近已用图片列表（用于去重）
  const window = dedupConfig?.deduplicationWindow || 5;
  const enabled = dedupConfig?.enableImageDeduplication !== false;
  const recentImageUrls = enabled
    ? existingArticles.slice(0, window).map(a => a.imageUrl).filter(Boolean)
    : [];

  // 生成图片（优先Unsplash，备用AI生成，最后本地图片）
  const imageData = await getUniqueArticleImage(keyword, imageConfig, recentImageUrls);
  
  return {
    id: Date.now().toString(),
    title: articleData.title,
    content: articleData.content,
    imageUrl: imageData.url || imageData,  // 兼容旧格式
    imageSource: imageData.source,
    imageAuthor: imageData.author,
    imageAuthorUrl: imageData.authorUrl,
    imageUnsplashUrl: imageData.unsplashUrl,
    keyword: keyword,
    createdAt: new Date().toISOString(),
    published: true,
    type: 'ai_generated'  // 标记文章类型
  };
}

// 生成搜索改写文章
async function generateRewrittenArticle(llmConfig = null, imageConfig = null, rewriteRounds = 3, dedupConfig = null, seoKeywords = null, wordCount = 1000, rewritePrompt = null) {
  const keyword = pickRandomKeyword(seoKeywords);
  
  console.log(`\n========== 开始生成搜索改写文章 ==========`);
  console.log(`关键词: ${keyword}`);
  console.log(`改写轮数: ${rewriteRounds}`);
  
  try {
    // 1. 搜索相关文章
    console.log('\n步骤1: 搜索相关文章...');
    const articles = await searchAndFetchArticles(keyword, dedupConfig || {});
    
    if (!articles || articles.length === 0) {
      console.log('未找到相关文章，回退到AI原创生成');
      return await generateArticle(llmConfig, imageConfig, null, wordCount, seoKeywords);
    }
    
    // 2. 选择最佳文章
    console.log(`\n步骤2: 从 ${articles.length} 篇文章中选择最佳文章...`);
    const bestArticle = selectBestArticle(articles, keyword);
    console.log(`选中文章: ${bestArticle.title}`);
    console.log(`文章长度: ${bestArticle.length} 字`);
    console.log(`来源URL: ${bestArticle.url}`);
    
    // 记录已使用的URL
    const usedUrlsManager = require('./used-urls-manager');
    await usedUrlsManager.addUsedUrl(bestArticle.url, keyword);
    
    // 3. 深度改写文章
    console.log(`\n步骤3: 开始深度改写（${rewriteRounds}轮）...`);
    if (rewritePrompt) console.log('[改写] 使用自定义改写提示词');
    const rewrittenData = await rewriteArticle(
      bestArticle.content,
      keyword,
      llmConfig,
      rewriteRounds,
      wordCount,
      rewritePrompt
    );
    
    console.log(`\n改写完成！`);
    console.log(`新标题: ${rewrittenData.title}`);
    console.log(`新内容长度: ${rewrittenData.content.length} 字`);
    
    // 4. 生成图片（优先Unsplash，备用AI生成，最后本地图片）
    console.log(`\n步骤4: 生成配图...`);
    const imageData = await getUniqueArticleImage(keyword, imageConfig);
    
    console.log(`========== 搜索改写文章生成完成 ==========\n`);
    
    return {
      id: Date.now().toString() + '_rewritten',
      title: rewrittenData.title,
      content: rewrittenData.content,
      imageUrl: imageData.url || imageData,  // 兼容旧格式
      imageSource: imageData.source,
      imageAuthor: imageData.author,
      imageAuthorUrl: imageData.authorUrl,
      imageUnsplashUrl: imageData.unsplashUrl,
      keyword: keyword,
      createdAt: new Date().toISOString(),
      published: true,
      type: 'search_rewritten',  // 标记文章类型
      sourceUrl: bestArticle.url,  // 保存原文URL
      rewriteRounds: rewriteRounds  // 保存改写轮数
    };
  } catch (error) {
    console.error('搜索改写失败:', error.message);
    console.log('回退到AI原创生成');
    return await generateArticle(llmConfig, imageConfig, null, 1000, seoKeywords);
  }
}

// 批量生成文章（支持搜索改写）
async function generateArticles(config = {}) {
  const {
    llmConfig = null,
    imageConfig = null,
    enableSearchRewrite = false,
    rewriteRounds = 3,
    aiArticleCount = 1,
    rewriteArticleCount = 0,
    enableImageDeduplication = false,
    deduplicationWindow = 5,
    wordCount = 1000,
    seoKeywords = null,
    rewritePrompt = null
  } = config;
  
  // 构建去重配置对象
  const dedupConfig = {
    enableImageDeduplication,
    deduplicationWindow
  };
  
  const articles = [];
  const totalCount = aiArticleCount + rewriteArticleCount;
  
  console.log(`\n========== 开始批量生成文章 ==========`);
  console.log(`AI原创: ${aiArticleCount} 篇`);
  console.log(`搜索改写: ${rewriteArticleCount} 篇`);
  console.log(`总数量: ${totalCount} 篇`);
  
  let currentIndex = 0;
  
  // 生成AI原创文章
  for (let i = 0; i < aiArticleCount; i++) {
    currentIndex++;
    console.log(`\n[${currentIndex}/${totalCount}] 生成AI原创文章...`);
    const aiArticle = await generateArticle(llmConfig, imageConfig, dedupConfig, wordCount, seoKeywords);
    articles.push(aiArticle);
    console.log(`✓ AI原创文章生成完成: ${aiArticle.title}`);
    
    // 等待1秒，避免ID冲突
    if (currentIndex < totalCount) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // 生成搜索改写文章
  if (enableSearchRewrite && rewriteArticleCount > 0) {
    for (let i = 0; i < rewriteArticleCount; i++) {
      currentIndex++;
      console.log(`\n[${currentIndex}/${totalCount}] 生成搜索改写文章...`);
      const rewrittenArticle = await generateRewrittenArticle(llmConfig, imageConfig, rewriteRounds, dedupConfig, seoKeywords, wordCount, rewritePrompt);
      articles.push(rewrittenArticle);
      console.log(`✓ 搜索改写文章生成完成: ${rewrittenArticle.title}`);
      
      // 等待1秒，避免ID冲突
      if (currentIndex < totalCount) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } else if (rewriteArticleCount > 0) {
    console.log(`\n警告: 未启用搜索改写功能，但配置了改写文章数量，将被忽略`);
  }
  
  console.log(`\n========== 批量生成完成，共 ${articles.length} 篇 ==========\n`);
  
  return articles;
}

// 生成默认文章（当API失败时，合同审查主题）
function generateDefaultArticle(keyword) {
  const titles = [
    `${keyword}：企业法务管理的智能化新趋势`,
    `如何利用${keyword}大幅提升合同审查效率`,
    `${keyword}在企业法律合规中的应用与实践`,
    `探索${keyword}在现代企业法务中的核心价值`,
    `${keyword}：让合同风控更智能、更高效`
  ];

  const title = titles[Math.floor(Math.random() * titles.length)];

  const content = `随着人工智能技术的快速发展，${keyword}正在成为企业法务管理领域的重要创新方向。通过AI技术，法务人员可以大幅提升合同审查效率，企业也能获得更及时、更精准的风险预警和合规支持。

${keyword}系统能够自动识别合同文本中的关键条款、风险点和不合规内容，准确评估合同的法律风险，并给出专业的修改建议。这不仅节省了法务团队大量的审查时间，还能确保合规检查的客观性和一致性。

在实际应用场景中，${keyword}展现出了多方面的优势。首先，它能够处理大批量的合同审查任务，在业务高峰期为企业法务部门减轻巨大的工作压力。其次，系统提供的风险分析功能，帮助法务人员深入了解合同中的潜在风险，发现容易被忽视的法律漏洞。

许多大型企业和律所已经开始采用${keyword}技术。法务人员普遍反映，使用智能合同审查系统后，他们有更多时间关注复杂案件的研究和谈判策略，工作质量得到了显著提升。业务部门也因为能够更快地获得合同审查结果而加速了商业进程。

技术的进步还带来了更多可能性。现代${keyword}系统不仅能够识别标准风险条款，对于特定行业的专业合同也越来越精准。通过自然语言处理和机器学习技术，系统能够理解合同语义，结合法律法规数据库给出有据可查的合规建议。

当然，${keyword}并不是要取代法务人员，而是作为他们的智能助手。系统处理重复性的审查工作，让法务人员有更多精力投入到高价值的法律策略和客户服务中。这种人机协作的模式，正在重塑传统的企业法务管理方式。

展望未来，${keyword}技术将会变得更加智能和专业化。随着大数据和人工智能的深度融合，系统将能够提供更精准的风险预测，为企业的合同管理决策提供强有力的数据支持，真正实现全流程的智能化合同风控。`;

  return { title, content };
}

// 测试LLM API配置
async function testLLMConfig(config) {
  try {
    // 如果endpoint不包含/chat/completions，自动补全
    let endpoint = config.apiEndpoint;
    if (!endpoint.includes('/chat/completions')) {
      endpoint = endpoint.replace(/\/$/, '') + '/chat/completions';
    }
    
    const response = await axios.post(
      endpoint,
      {
        model: config.model || 'gpt-4.1-mini',
        messages: [
          {
            role: 'user',
            content: '请回复"测试成功"'
          }
        ],
        max_tokens: 10
      },
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    return {
      success: true,
      message: '连接成功',
      response: response.data.choices[0].message.content
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.error?.message || error.message
    };
  }
}

module.exports = {
  generateArticle,
  generateRewrittenArticle,
  generateArticles,
  testLLMConfig,
  getUnsplashImage
};

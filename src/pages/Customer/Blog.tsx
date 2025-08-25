import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import {
  getAllBlogs,
  getAllCategories,
  getBlogsByCategoryId,
} from '@/api/blog';
import type { Blog, BlogCategory } from '@/types/blog';

const FALLBACK_IMG = '/TerraTechLogo.png';

// chia mảng thành các trang size=3 (3 card/slide)
const chunk = <T,>(arr: T[], size: number) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );

// gradient cố định theo categoryId
const GRADIENT_POOL = [
  'from-emerald-400 to-green-500',
  'from-orange-400 to-amber-500',
  'from-teal-400 to-cyan-500',
  'from-purple-400 to-pink-500',
  'from-rose-400 to-red-500',
  'from-sky-400 to-indigo-500',
  'from-lime-400 to-green-500',
];

const Blog: React.FC = () => {
  const navigate = useNavigate();

  // Refs animation
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);
  const postsRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const floatingElementsRef = useRef<HTMLDivElement[]>([]);

  // State
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // lọc theo danh mục
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [fetchingFilter, setFetchingFilter] = useState(false);

  // slider phân trang
  const [pageIdx, setPageIdx] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [blogList, categoryList] = await Promise.all([
          getAllBlogs(),
          getAllCategories(),
        ]);
        setBlogs(
          (blogList || []).filter(b => b.status === 'Active').map((b) => ({
            ...b,
            urlImage: b.urlImage && b.urlImage.trim() !== '' ? b.urlImage : FALLBACK_IMG,
            bodyHTML: (b as any).bodyHTML ?? (b as any).bodyHtml ?? '',
          }))
        );
        setCategories(categoryList || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // map id -> name/gradient
  const categoryGradientMap = useMemo(() => {
    const map: Record<number, string> = {};
    const ordered = [...categories].sort((a, b) => a.blogCategoryId - b.blogCategoryId);
    ordered.forEach((c, idx) => (map[c.blogCategoryId] = GRADIENT_POOL[idx % GRADIENT_POOL.length]));
    return map;
  }, [categories]);
  const getCategoryGradient = (categoryId: number) =>
    categoryGradientMap[categoryId] || 'from-gray-400 to-gray-500';

  const categoryById = (id: number) =>
    categories.find((c) => c.blogCategoryId === id);

  // ===== Lọc theo danh mục (reset slider về trang 0) =====
  const handleSelectCategory = async (id: number | 'all') => {
    if (id === selectedCategory) return;
    setSelectedCategory(id);
    setPageIdx(0);
    setFetchingFilter(true);
    try {
      const data =
        id === 'all' ? await getAllBlogs() : await getBlogsByCategoryId(id);
      setBlogs(
        (data || []).filter(b => b.status === 'Active').map((b) => ({
          ...b,
          urlImage: b.urlImage && b.urlImage.trim() !== '' ? b.urlImage : FALLBACK_IMG,
          bodyHTML: (b as any).bodyHTML ?? (b as any).bodyHtml ?? '',
        }))
      );
    } finally {
      setFetchingFilter(false);
    }
  };

  // ===== Featured chỉ hiển thị ở tab "Tất cả" =====
  const featuredBlog = useMemo(() => {
    if (selectedCategory !== 'all') return undefined;
    return blogs.find((b) => b.isFeatured) || undefined;
  }, [blogs, selectedCategory]);

  // latestBlogs: nếu tab all -> bỏ featured; nếu tab khác -> dùng toàn bộ
  const latestBlogs = useMemo(
    () =>
      blogs.filter((b) =>
        featuredBlog ? b.blogId !== featuredBlog.blogId : true
      ),
    [blogs, featuredBlog]
  );

  // các danh mục đang dùng (để hiển thị phần “Danh mục” cuối trang)
  const usedCategories: BlogCategory[] = useMemo(() => {
    const ids = Array.from(new Set(blogs.map((b) => b.blogCategoryId)));
    return ids
      .map((id) => categoryById(id))
      .filter(Boolean) as BlogCategory[];
  }, [blogs, categories]);

  // ===== Slider (3 item/slide, loop, dots, vuốt mobile) =====
  const pages = useMemo(() => chunk(latestBlogs, 3), [latestBlogs]);

  const nextPage = () => {
    if (pages.length === 0) return;
    setPageIdx((p) => (p + 1) % pages.length);
  };
  const prevPage = () => {
    if (pages.length === 0) return;
    setPageIdx((p) => (p - 1 + pages.length) % pages.length);
  };

  const touchStartX = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) nextPage();
    else prevPage();
  };

  // GSAP animations
  useEffect(() => {
    const loadGSAPAndAnimate = () => {
      const s1 = document.createElement('script');
      s1.src =
        'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
      s1.onload = () => {
        const s2 = document.createElement('script');
        s2.src =
          'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js';
        s2.onload = () => {
          const gsap = (window as any).gsap;
          const ScrollTrigger = (window as any).ScrollTrigger;
          if (!gsap || !ScrollTrigger) return;
          gsap.registerPlugin(ScrollTrigger);

          gsap.set(
            [headerRef.current, featuredRef.current, postsRef.current, categoriesRef.current],
            { opacity: 0, y: 60 }
          );

          const tl = gsap.timeline();
          tl.to(headerRef.current, {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'back.out(1.7)',
            delay: 0.2,
          })
            .to(
              featuredRef.current,
              { opacity: 1, y: 0, duration: 1, ease: 'power3.out' },
              '-=0.5'
            )
            .to(
              postsRef.current,
              { opacity: 1, y: 0, duration: 1, ease: 'power3.out' },
              '-=0.7'
            )
            .to(
              categoriesRef.current,
              { opacity: 1, y: 0, duration: 1, ease: 'power3.out' },
              '-=0.5'
            );

          floatingElementsRef.current.forEach((el, i) => {
            if (!el) return;
            gsap.to(el, {
              y: -15,
              duration: 2.5 + i * 0.3,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
              delay: i * 0.4,
            });
          });

          gsap.to('.blog-parallax-leaf', {
            yPercent: -30,
            ease: 'none',
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
            },
          });

          ScrollTrigger.batch('.blog-card', {
            onEnter: (els: any) => {
              gsap.from(els, {
                y: 60,
                opacity: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: 'power3.out',
              });
            },
          });

          ScrollTrigger.batch('.category-card', {
            onEnter: (els: any) => {
              gsap.from(els, {
                scale: 0.8,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: 'back.out(1.7)',
              });
            },
          });
        };
        document.head.appendChild(s2);
      };
      document.head.appendChild(s1);
    };
    if (!(window as any).gsap) loadGSAPAndAnimate();
  }, []);

  // ref callback phải trả về void (fix TS 2322)
  const addToFloatingRefs: React.RefCallback<HTMLDivElement> = (el) => {
    if (!el) return;
    if (!floatingElementsRef.current.includes(el)) {
      floatingElementsRef.current.push(el);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="animate-pulse text-emerald-700 font-semibold">
          Đang tải bài viết…
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50"
    >
      {/* Floating bg */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="blog-parallax-leaf absolute top-10 left-20 w-20 h-20 bg-green-200 rounded-full opacity-15 blur-sm" />
        <div className="blog-parallax-leaf absolute top-60 right-10 w-16 h-16 bg-emerald-300 rounded-full opacity-20 blur-sm" />
        <div className="blog-parallax-leaf absolute bottom-80 left-10 w-24 h-24 bg-teal-200 rounded-full opacity-10 blur-sm" />
        <div className="blog-parallax-leaf absolute bottom-40 right-40 w-18 h-18 bg-green-100 rounded-full opacity-25 blur-sm" />
        <div className="blog-parallax-leaf absolute top-80 left-1/3 w-14 h-14 bg-emerald-200 rounded-full opacity-15 blur-sm" />
      </div>

      <div className="flex-1 container mx-auto py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-10">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-emerald-800 via-green-700 to-teal-700 bg-clip-text text-transparent mb-6 leading-tight">
            Blog TerraTech
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Khám phá những bài viết hữu ích về terrarium, từ cách chăm sóc đến lợi ích sức khỏe và mẹo DIY.
          </p>
          <div className="mt-8 h-1 w-32 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mx-auto" />
        </div>

        {/* Filter theo danh mục */}
        <div ref={categoriesRef} className="text-center mb-8">
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => handleSelectCategory('all')}
              className={`category-card px-6 py-2 rounded-2xl font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white'
                  : 'bg-white text-emerald-700 border border-emerald-200 hover:shadow-xl'
              }`}
            >
              Tất cả
            </button>
            {categories.map((c) => (
              <button
                key={c.blogCategoryId}
                onClick={() => handleSelectCategory(c.blogCategoryId)}
                className={`category-card px-6 py-2 rounded-2xl font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 ${
                  selectedCategory === c.blogCategoryId
                    ? `bg-gradient-to-r ${getCategoryGradient(
                        c.blogCategoryId
                      )} text-white`
                    : 'bg-white text-emerald-700 border border-emerald-200 hover:shadow-xl'
                }`}
                title={c.description}
              >
                {c.categoryName}
              </button>
            ))}
          </div>
          {fetchingFilter && <div className="mt-4"><Spin /></div>}
        </div>

        {/* Featured: chỉ hiển thị khi tab Tất cả */}
        {featuredBlog && selectedCategory === 'all' && (
          <div ref={featuredRef} className="mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-green-100 hover:shadow-3xl transition-all duration-500 group">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                <div className="relative overflow-hidden">
                  <img
                    src={featuredBlog.urlImage || FALLBACK_IMG}
                    alt={featuredBlog.title}
                    className="w-full h-80 lg:h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => ((e.currentTarget.src = FALLBACK_IMG))}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute top-6 left-6">
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r ${getCategoryGradient(
                        featuredBlog.blogCategoryId
                      )} shadow-lg`}
                    >
                      {categoryById(featuredBlog.blogCategoryId)?.categoryName || 'Danh mục'}
                    </span>
                  </div>
                </div>
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getCategoryGradient(
                        featuredBlog.blogCategoryId
                      )}`}
                    >
                      {categoryById(featuredBlog.blogCategoryId)?.categoryName || 'Danh mục'}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {featuredBlog.createdAt
                        ? new Date(featuredBlog.createdAt).toLocaleDateString('vi-VN')
                        : ''}
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 group-hover:text-emerald-700 transition-colors">
                    {featuredBlog.title}
                  </h2>
                  <p className="text-gray-600 text-lg leading-relaxed mb-6">
                    {featuredBlog.content}
                  </p>
                  <button
                    onClick={() => navigate(`/blog/${featuredBlog.blogId}`)}
                    className="self-start bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-3 rounded-full font-semibold hover:from-emerald-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Đọc Thêm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Latest Posts – SLIDER 3 item/slide + dots + vuốt */}
        <div ref={postsRef} className="mb-16">
          <h2 className="text-3xl font-bold text-center text-emerald-800 mb-8">
            Bài Viết Mới Nhất
          </h2>

          <div className="relative" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            {pages.length > 1 && (
              <>
                <button
                  aria-label="Previous"
                  onClick={prevPage}
                  className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur px-3 py-2 rounded-full shadow hover:bg-white"
                >
                  ‹
                </button>
                <button
                  aria-label="Next"
                  onClick={nextPage}
                  className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur px-3 py-2 rounded-full shadow hover:bg-white"
                >
                  ›
                </button>
              </>
            )}

            {/* viewport */}
            <div className="overflow-hidden rounded-2xl">
              {/* track */}
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${pageIdx * 100}%)` }}
              >
                {pages.map((page, pi) => (
                  <div key={pi} className="min-w-full px-1">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {page.map((b) => {
                        const cat = categoryById(b.blogCategoryId);
                        return (
                          <div
                            key={b.blogId}
                            ref={addToFloatingRefs}
                            className="blog-card bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-green-100 hover:shadow-2xl transition-all duration-500 group hover:scale-105"
                          >
                            <div className="relative overflow-hidden">
                              <img
                                src={b.urlImage || FALLBACK_IMG}
                                alt={b.title}
                                className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
                                onError={(e) => ((e.currentTarget.src = FALLBACK_IMG))}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                              <div className="absolute top-4 left-4">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getCategoryGradient(
                                    b.blogCategoryId
                                  )} shadow-lg`}
                                >
                                  {cat?.categoryName || 'Danh mục'}
                                </span>
                              </div>
                            </div>
                            <div className="p-6">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-gray-500 text-sm">
                                  {b.createdAt
                                    ? new Date(b.createdAt).toLocaleDateString('vi-VN')
                                    : ''}
                                </span>
                                <div className="w-2 h-2 bg-green-400 rounded-full" />
                              </div>
                              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors line-clamp-2">
                                {b.title}
                              </h3>
                              <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                                {b.content}
                              </p>
                              <button
                                onClick={() => navigate(`/blog/${b.blogId}`)}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105"
                              >
                                Đọc Thêm
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* dots */}
            {pages.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {pages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPageIdx(i)}
                    className={`h-2.5 rounded-full transition-all ${
                      i === pageIdx ? 'w-6 bg-emerald-600' : 'w-2.5 bg-emerald-300'
                    }`}
                    aria-label={`Chuyển tới trang ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Danh mục */}
        <div className="text-center">
          
          

          
        </div>
      </div>

      {/* Waves */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden">
        <svg className="relative block w-full h-24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill="url(#blogGradient)"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" fill="url(#blogGradient)"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="url(#blogGradient)"></path>
          <defs>
            <linearGradient id="blogGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#059669" /><stop offset="50%" stopColor="#10b981" /><stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};

export default Blog;

import React, { useEffect, useRef } from 'react';

// Mock images for demo
const forestImg = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImZvcmVzdCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzIyYzU1ZSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzE2YTM0YSIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZm9yZXN0KSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyNCIgZm9udC1mYW1pbHk9IkFyaWFsIj5Gb3Jlc3Q8L3RleHQ+PC9zdmc+";
const desertImg = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImRlc2VydCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI2Y5NzMxNiIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2RkNmIyMCIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZGVzZXJ0KSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyNCIgZm9udC1mYW1pbHk9IkFyaWFsIj5EZXNLCNQPC90ZXh0Pjwvc3ZnPg==";
const tropicalImg = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9InRyb3BpY2FsIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMGY3NjY1Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMTM1NDRlIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCN0cm9waWNhbCkiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtZmFtaWx5PSJBcmlhbCI+VHJvcGljYWw8L3RleHQ+PC9zdmc+";
const succulentImg = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9InN1Y2N1bGVudCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzg0Y2M3OCIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzY1YTE0ZiIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjc3VjY3VsZW50KSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyNCIgZm9udC1mYW1pbHk9IkFyaWFsIj5TdWNjdWxlbnQ8L3RleHQ+PC9zdmc+";

const blogs = [
  {
    id: '1',
    title: 'Hướng Dẫn Chăm Sóc Terrarium Cho Người Mới Bắt Đầu',
    excerpt: 'Tìm hiểu các bước cơ bản để chăm sóc terrarium của bạn, từ ánh sáng, tưới nước đến cách chọn cây phù hợp.',
    image: forestImg,
    content: 'Terrarium là một hệ sinh thái thu nhỏ, rất phù hợp để trang trí không gian sống...',
    date: '20/04/2025',
    category: 'Hướng Dẫn',
    featured: true,
  },
  {
    id: '2',
    title: 'Top 5 Loại Cây Phù Hợp Với Terrarium Sa Mạc',
    excerpt: 'Khám phá 5 loại cây lý tưởng để tạo nên một terrarium sa mạc độc đáo và dễ chăm sóc.',
    image: desertImg,
    content: 'Terrarium sa mạc là một lựa chọn tuyệt vời nếu bạn yêu thích phong cách tối giản...',
    date: '18/04/2025',
    category: 'Sa Mạc',
    featured: false,
  },
  {
    id: '3',
    title: 'Lợi Ích Của Terrarium Đối Với Sức Khỏe Tinh Thần',
    excerpt: 'Terrarium không chỉ làm đẹp không gian mà còn giúp giảm căng thẳng và cải thiện tâm trạng.',
    image: tropicalImg,
    content: 'Terrarium không chỉ là một món đồ trang trí mà còn mang lại nhiều lợi ích...',
    date: '15/04/2025',
    category: 'Sức Khỏe',
    featured: false,
  },
  {
    id: '4',
    title: 'Cách Tự Làm Terrarium Tại Nhà',
    excerpt: 'Hướng dẫn chi tiết để bạn tự tay tạo một terrarium xinh xắn tại nhà với chi phí thấp.',
    image: succulentImg,
    content: 'Tự làm terrarium là một trải nghiệm thú vị và tiết kiệm...',
    date: '12/04/2025',
    category: 'DIY',
    featured: false,
  },
];

const Blog: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);
  const postsRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const floatingElementsRef = useRef<HTMLDivElement[]>([]);

  const featuredBlog = blogs.find((blog) => blog.featured);
  const latestBlogs = blogs.filter((blog) => !blog.featured);
  const categories = [...new Set(blogs.map((blog) => blog.category))];

  useEffect(() => {
    const loadGSAPAndAnimate = () => {
      const script1 = document.createElement('script');
      script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
      
      script1.onload = () => {
        const script2 = document.createElement('script');
        script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js';
        
        script2.onload = () => {
          const gsap = (window as any).gsap;
          const ScrollTrigger = (window as any).ScrollTrigger;
          
          if (gsap && ScrollTrigger) {
            gsap.registerPlugin(ScrollTrigger);
            
            // Initial setup - hide all sections
            gsap.set([headerRef.current, featuredRef.current, postsRef.current, categoriesRef.current], { 
              opacity: 0,
              y: 60 
            });

            // Stagger animation timeline for initial load
            const tl = gsap.timeline();
            
            tl.to(headerRef.current, {
              opacity: 1,
              y: 0,
              duration: 1,
              ease: "back.out(1.7)",
              delay: 0.2
            })
            .to(featuredRef.current, {
              opacity: 1,
              y: 0,
              duration: 1,
              ease: "power3.out"
            }, "-=0.5")
            .to(postsRef.current, {
              opacity: 1,
              y: 0,
              duration: 1,
              ease: "power3.out"
            }, "-=0.7")
            .to(categoriesRef.current, {
              opacity: 1,
              y: 0,
              duration: 1,
              ease: "power3.out"
            }, "-=0.5");

            // Floating animation for blog cards
            floatingElementsRef.current.forEach((element, index) => {
              if (element) {
                gsap.to(element, {
                  y: -15,
                  duration: 2.5 + index * 0.3,
                  repeat: -1,
                  yoyo: true,
                  ease: "sine.inOut",
                  delay: index * 0.4
                });
              }
            });

            // Parallax effect for background elements
            gsap.to('.blog-parallax-leaf', {
              yPercent: -30,
              ease: "none",
              scrollTrigger: {
                trigger: containerRef.current,
                start: "top bottom",
                end: "bottom top",
                scrub: 1
              }
            });

            // Blog cards stagger animation on scroll
            ScrollTrigger.batch('.blog-card', {
              onEnter: (elements: any) => {
                gsap.from(elements, {
                  y: 60,
                  opacity: 0,
                  duration: 0.8,
                  stagger: 0.15,
                  ease: "power3.out"
                });
              }
            });

            // Category cards animation
            ScrollTrigger.batch('.category-card', {
              onEnter: (elements: any) => {
                gsap.from(elements, {
                  scale: 0.8,
                  opacity: 0,
                  duration: 0.6,
                  stagger: 0.1,
                  ease: "back.out(1.7)"
                });
              }
            });
          }
        };
        
        document.head.appendChild(script2);
      };
      
      document.head.appendChild(script1);
    };

    if (!(window as any).gsap) {
      loadGSAPAndAnimate();
    }
  }, []);

  const addToFloatingRefs = (el: HTMLDivElement | null) => {
    if (el && !floatingElementsRef.current.includes(el)) {
      floatingElementsRef.current.push(el);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Hướng Dẫn': 'from-emerald-400 to-green-500',
      'Sa Mạc': 'from-orange-400 to-amber-500', 
      'Sức Khỏe': 'from-teal-400 to-cyan-500',
      'DIY': 'from-purple-400 to-pink-500'
    };
    return colors[category as keyof typeof colors] || 'from-gray-400 to-gray-500';
  };

  return (
    <div ref={containerRef} className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="blog-parallax-leaf absolute top-10 left-20 w-20 h-20 bg-green-200 rounded-full opacity-15 blur-sm"></div>
        <div className="blog-parallax-leaf absolute top-60 right-10 w-16 h-16 bg-emerald-300 rounded-full opacity-20 blur-sm"></div>
        <div className="blog-parallax-leaf absolute bottom-80 left-10 w-24 h-24 bg-teal-200 rounded-full opacity-10 blur-sm"></div>
        <div className="blog-parallax-leaf absolute bottom-40 right-40 w-18 h-18 bg-green-100 rounded-full opacity-25 blur-sm"></div>
        <div className="blog-parallax-leaf absolute top-80 left-1/3 w-14 h-14 bg-emerald-200 rounded-full opacity-15 blur-sm"></div>
      </div>

      <div className="flex-1 container mx-auto py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Blog Header */}
        <div ref={headerRef} className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-emerald-800 via-green-700 to-teal-700 bg-clip-text text-transparent mb-6 leading-tight">
            Blog TerraTech
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Khám phá những bài viết hữu ích về terrarium, từ cách chăm sóc đến lợi ích sức khỏe và mẹo DIY.
          </p>
          <div className="mt-8 h-1 w-32 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mx-auto"></div>
        </div>

        {/* Featured Post */}
        {featuredBlog && (
          <div ref={featuredRef} className="mb-20">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-green-100 hover:shadow-3xl transition-all duration-500 group">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                <div className="relative overflow-hidden">
                  <img
                    src={featuredBlog.image}
                    alt={featuredBlog.title}
                    className="w-full h-80 lg:h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute top-6 left-6">
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r ${getCategoryColor(featuredBlog.category)} shadow-lg`}>
                      Bài Viết Nổi Bật
                    </span>
                  </div>
                </div>
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getCategoryColor(featuredBlog.category)}`}>
                      {featuredBlog.category}
                    </span>
                    <span className="text-gray-500 text-sm">{featuredBlog.date}</span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 group-hover:text-emerald-700 transition-colors">
                    {featuredBlog.title}
                  </h2>
                  <p className="text-gray-600 text-lg leading-relaxed mb-6">
                    {featuredBlog.excerpt}
                  </p>
                  <button className="self-start bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-3 rounded-full font-semibold hover:from-emerald-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                    Đọc Thêm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Latest Posts */}
        <div ref={postsRef} className="mb-16">
          <h2 className="text-3xl font-bold text-center text-emerald-800 mb-12">Bài Viết Mới Nhất</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {latestBlogs.map((blog, index) => (
              <div
                key={blog.id}
                ref={addToFloatingRefs}
                className="blog-card bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-green-100 hover:shadow-2xl transition-all duration-500 group hover:scale-105"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getCategoryColor(blog.category)} shadow-lg`}>
                      {blog.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-500 text-sm">{blog.date}</span>
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors line-clamp-2">
                    {blog.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                    {blog.excerpt}
                  </p>
                  <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105">
                    Đọc Thêm
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div ref={categoriesRef} className="text-center">
          <h2 className="text-3xl font-bold text-emerald-800 mb-12">Danh Mục Bài Viết</h2>
          <div className="flex flex-wrap justify-center gap-6">
            {categories.map((category, index) => (
              <div
                key={category}
                className={`category-card px-8 py-4 rounded-2xl bg-gradient-to-r ${getCategoryColor(category)} text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 cursor-pointer`}
              >
                {category}
              </div>
            ))}
          </div>
          <div className="mt-12">
            <p className="text-gray-600 text-lg mb-6">
              Tham gia cộng đồng TerraTech để không bỏ lỡ những bài viết mới nhất!
            </p>
            <button className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              Đăng Ký Nhận Tin
            </button>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden">
        <svg className="relative block w-full h-24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill="url(#blogGradient)"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" fill="url(#blogGradient)"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="url(#blogGradient)"></path>
          <defs>
            <linearGradient id="blogGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#059669"/>
              <stop offset="50%" stopColor="#10b981"/>
              <stop offset="100%" stopColor="#34d399"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};

export default Blog;
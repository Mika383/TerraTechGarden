import React, { useEffect, useRef } from 'react';

// Mock image for demo
const forestImg = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNjhkMzkxIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMzQ2NzUxIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmFkaWVudCkiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjUwIiBmaWxsPSIjNTU3ZTUyIiBvcGFjaXR5PSIwLjciLz48Y2lyY2xlIGN4PSIzMDAiIGN5PSIyMDAiIHI9IjMwIiBmaWxsPSIjOGVjMDc4IiBvcGFjaXR5PSIwLjgiLz48L3N2Zz4=";

const About: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const missionRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);
  const floatingElementsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    // Load GSAP from CDN and initialize animations
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
            
            // Initial setup
            gsap.set([titleRef.current, missionRef.current, contactRef.current, teamRef.current], { 
              opacity: 0,
              y: 60 
            });

            // Title animation with organic bounce
            gsap.to(titleRef.current, {
              opacity: 1,
              y: 0,
              duration: 1.2,
              ease: "back.out(1.7)",
              delay: 0.3
            });

            // Mission section animation
            ScrollTrigger.create({
              trigger: missionRef.current,
              start: "top 80%",
              onEnter: () => {
                gsap.to(missionRef.current, {
                  opacity: 1,
                  y: 0,
                  duration: 1,
                  ease: "power3.out"
                });
              }
            });

            // Contact section animation
            ScrollTrigger.create({
              trigger: contactRef.current,
              start: "top 80%",
              onEnter: () => {
                gsap.to(contactRef.current, {
                  opacity: 1,
                  y: 0,
                  duration: 1,
                  ease: "power3.out",
                  delay: 0.2
                });
              }
            });

            // Team section animation
            ScrollTrigger.create({
              trigger: teamRef.current,
              start: "top 80%",
              onEnter: () => {
                gsap.to(teamRef.current, {
                  opacity: 1,
                  y: 0,
                  duration: 1,
                  ease: "power3.out",
                  delay: 0.4
                });
              }
            });

            // Floating elements animation
            floatingElementsRef.current.forEach((element, index) => {
              if (element) {
                gsap.to(element, {
                  y: -20,
                  duration: 2 + index * 0.5,
                  repeat: -1,
                  yoyo: true,
                  ease: "sine.inOut",
                  delay: index * 0.3
                });
              }
            });

            // Parallax effect for background elements
            gsap.to('.parallax-leaf', {
              yPercent: -50,
              ease: "none",
              scrollTrigger: {
                trigger: containerRef.current,
                start: "top bottom",
                end: "bottom top",
                scrub: true
              }
            });
          }
        };
        
        document.head.appendChild(script2);
      };
      
      document.head.appendChild(script1);
    };

    // Only load if GSAP is not already loaded
    if (!(window as any).gsap) {
      loadGSAPAndAnimate();
    }
  }, []);

  const addToFloatingRefs = (el: HTMLDivElement | null) => {
    if (el && !floatingElementsRef.current.includes(el)) {
      floatingElementsRef.current.push(el);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="parallax-leaf absolute top-20 left-10 w-16 h-16 bg-green-200 rounded-full opacity-20 blur-sm"></div>
        <div className="parallax-leaf absolute top-40 right-20 w-12 h-12 bg-emerald-300 rounded-full opacity-15 blur-sm"></div>
        <div className="parallax-leaf absolute bottom-40 left-1/4 w-20 h-20 bg-green-100 rounded-full opacity-25 blur-sm"></div>
        <div className="parallax-leaf absolute bottom-20 right-1/3 w-14 h-14 bg-teal-200 rounded-full opacity-20 blur-sm"></div>
      </div>

      <div className="flex-1 container mx-auto py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Tiêu đề chính */}
        <h1 
          ref={titleRef}
          className="text-5xl md:text-6xl font-bold text-center bg-gradient-to-r from-emerald-800 via-green-700 to-teal-700 bg-clip-text text-transparent mb-16 leading-tight"
        >
          Giới Thiệu Về TerraTech
        </h1>

        {/* Sứ Mệnh */}
        <div 
          ref={missionRef}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20"
        >
          <div 
            ref={addToFloatingRefs}
            className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-green-100 group hover:scale-105"
          >
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full opacity-70 group-hover:scale-110 transition-transform duration-300"></div>
              <h2 className="text-3xl font-bold text-emerald-800 mb-6 group-hover:text-green-700 transition-colors">
                Sứ Mệnh Của Chúng Tôi
              </h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                Tại TerraTech, chúng tôi cam kết mang thiên nhiên gần gũi hơn đến cuộc sống hàng ngày của bạn thông qua các Terrarium độc đáo và bền vững. Với sự kết hợp giữa nghệ thuật thiết kế và công nghệ AI tiên tiến, chúng tôi không chỉ cung cấp những sản phẩm chất lượng cao mà còn hỗ trợ bạn chăm sóc và cá nhân hóa không gian xanh của riêng mình.
              </p>
              <div className="mt-6 h-1 w-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full group-hover:w-32 transition-all duration-500"></div>
            </div>
          </div>
          
          <div className="flex items-center justify-center group">
            <div className="relative overflow-hidden rounded-2xl shadow-2xl group-hover:shadow-3xl transition-all duration-500">
              <img
                src={forestImg}
                alt="Sứ mệnh TerraTech"
                className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-green-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          </div>
        </div>

        {/* Liên Hệ */}
        <div 
          ref={contactRef}
          className="bg-gradient-to-br from-white/90 to-green-50/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 mb-20 border border-emerald-100 group"
        >
          <div className="relative">
            <div className="absolute -top-6 left-8 w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full opacity-80 group-hover:rotate-180 transition-transform duration-700"></div>
            <h2 className="text-3xl font-bold text-emerald-800 mb-6 group-hover:text-green-700 transition-colors">
              Liên Hệ Với Chúng Tôi
            </h2>
            <p className="text-gray-700 mb-6 text-lg">
              Chúng tôi luôn sẵn sàng hỗ trợ bạn. Hãy liên hệ qua các kênh sau:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="flex items-center space-x-3 p-4 bg-white/60 rounded-lg hover:bg-white/80 transition-colors duration-300">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <div>
                  <span className="font-semibold text-gray-800">Email:</span>
                  <a href="mailto:support@terratech.com" className="block text-emerald-600 hover:text-emerald-800 transition-colors">
                    support@terratech.com
                  </a>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-white/60 rounded-lg hover:bg-white/80 transition-colors duration-300">
                <div className="w-3 h-3 bg-teal-400 rounded-full"></div>
                <div>
                  <span className="font-semibold text-gray-800">Điện thoại:</span>
                  <a href="tel:+84123456789" className="block text-emerald-600 hover:text-emerald-800 transition-colors">
                    +84 123 456 789
                  </a>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-white/60 rounded-lg hover:bg-white/80 transition-colors duration-300 md:col-span-2 lg:col-span-1">
                <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                <div>
                  <span className="font-semibold text-gray-800">Địa chỉ:</span>
                  <span className="block text-gray-700">123 Đường Xanh, Quận 1, TP.HCM</span>
                </div>
              </div>
            </div>
            <button
              className="relative overflow-hidden bg-gradient-to-r from-emerald-500 to-green-600 text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
              onClick={() => alert('Chức năng liên hệ sẽ được phát triển!')}
            >
              <span className="relative z-10">Gửi Tin Nhắn</span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </button>
          </div>
        </div>

        {/* Đội Ngũ */}
        <div 
          ref={teamRef}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12"
        >
          <div className="flex items-center justify-center group order-2 lg:order-1">
            <div className="relative overflow-hidden rounded-2xl shadow-2xl group-hover:shadow-3xl transition-all duration-500">
              <img
                src={forestImg}
                alt="Đội ngũ TerraTech"
                className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          </div>
          
          <div 
            ref={addToFloatingRefs}
            className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-green-100 group hover:scale-105 order-1 lg:order-2"
          >
            <div className="relative">
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-teal-400 to-green-500 rounded-full opacity-70 group-hover:scale-110 transition-transform duration-300"></div>
              <h2 className="text-3xl font-bold text-emerald-800 mb-6 group-hover:text-green-700 transition-colors">
                Đội Ngũ Của Chúng Tôi
              </h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                Đội ngũ TerraTech tự hào quy tụ các chuyên gia trong lĩnh vực thực vật học, thiết kế nội thất và công nghệ AI. Với hơn 10 năm kinh nghiệm, chúng tôi không ngừng đổi mới để mang đến những giải pháp chăm sóc Terrarium tối ưu. Mỗi thành viên đều đam mê tạo ra những không gian xanh hoàn hảo.
              </p>
              <div className="mt-6 h-1 w-20 bg-gradient-to-r from-teal-400 to-green-500 rounded-full group-hover:w-32 transition-all duration-500"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative bottom wave */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden">
        <svg className="relative block w-full h-20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill="url(#gradient)"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" fill="url(#gradient)"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="url(#gradient)"></path>
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981"/>
              <stop offset="50%" stopColor="#059669"/>
              <stop offset="100%" stopColor="#047857"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};

export default About;
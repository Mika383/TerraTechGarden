import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Row, Col } from 'antd';
import { getNewestTerrariums, getEnvironmentById, getTerrariumById } from '@/api/terrarium';
import { Terrarium, Environment, TankMethod } from '@/types/terrarium';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import TerrariumCard from './TerrariumCard';
import miniForest from '@/assets/image/1.jpg';

gsap.registerPlugin(ScrollTrigger);

const PAGE_SIZE = 6;

// Cache đơn giản để tránh gọi lặp lại
const envCache = new Map<number, string>(); // environmentId -> environmentName
const tankMethodCache = new Map<number, string>(); // tankMethodId -> tankMethodLabel

// Lấy nhãn tank method “đẹp” từ object
const tankLabel = (tm?: Partial<TankMethod> | null) =>
  (tm?.tankMethodName?.trim() ||
    tm?.tankMethodType?.trim() ||
    '').trim();

const NewestProducts: React.FC = () => {
  const [terrariums, setTerrariums] = useState<Array<Partial<Terrarium> & {
    environmentName?: string;
    tankMethodLabel?: string;
  }>>([]);

  const rootRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const gsapCtx = useRef<gsap.Context | null>(null);

  useEffect(() => {
    (async () => {
      // 1) Lấy newest
      const list = await getNewestTerrariums(PAGE_SIZE);
      const cleaned = (list || []).filter((t) => t?.terrariumId);

      // 2) Enrich: lấy environmentName & tankMethodLabel giống trang Shop
      const enriched = await Promise.all(
        cleaned.map(async (raw) => {
          const t = { ...raw };

          // Environment name
          let envName: string | undefined;
          if (typeof t.environmentId === 'number') {
            if (envCache.has(t.environmentId)) {
              envName = envCache.get(t.environmentId);
            } else {
              try {
                const env = await getEnvironmentById(t.environmentId);
                envName = (env as Environment)?.environmentName;
                if (envName) envCache.set(t.environmentId, envName);
              } catch {}
            }
          }

          // Tank method label
          let tmLabel: string | undefined;
          if (typeof t.tankMethodId === 'number') {
            if (tankMethodCache.has(t.tankMethodId)) {
              tmLabel = tankMethodCache.get(t.tankMethodId);
            } else {
              try {
                // Lấy chi tiết terrarium (ít item nên N+1 ok) để phòng trường hợp thiếu field
                // hoặc bạn có sẵn API get TankMethod by id thì thay vào đây
                const full = await getTerrariumById(Number(t.terrariumId));
                const tmObj = full?.tankMethod ?? { tankMethodId: t.tankMethodId, tankMethodName: undefined, tankMethodType: undefined };
                tmLabel = tankLabel(tmObj);
                if (tmLabel) tankMethodCache.set(Number(tmObj.tankMethodId), tmLabel);
              } catch {}
            }
          }

          return { ...t, environmentName: envName, tankMethodLabel: tmLabel };
        })
      );

      setTerrariums(enriched);
    })();
  }, []);

  useEffect(() => {
    gsapCtx.current = gsap.context(() => {
      gsap.fromTo(
        rootRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top 80%',
          },
        }
      );

      cardRefs.current.forEach((card, index) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { opacity: 0, y: 40, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.0,
            delay: index * 0.15,
            ease: 'expo.out',
            scrollTrigger: { trigger: card, start: 'top 85%' },
          }
        );
      });
    }, rootRef);

    return () => gsapCtx.current?.revert();
  }, [terrariums]);

  return (
    <div ref={rootRef} className="mb-16 font-roboto will-change-transform-opacity">
      <h2 className="text-4xl font-bold text-center mb-10 text-teal-700">
        Sản phẩm mới nhất
      </h2>

      <Row gutter={[24, 24]} justify="center">
        {terrariums.map((item, index) => {
          const image =
            (item as any)?.thumbnailUrl ||
            (item as any)?.terrariumImages?.[0]?.imageUrl ||
            miniForest;

          const rating = Number((item as any)?.averageRating ?? 0);
          const purchases = Number((item as any)?.purchaseCount ?? 0);

          return (
            <Col xs={24} sm={12} md={8} key={item.terrariumId}>
              <div
                ref={(el) => { cardRefs.current[index] = el; }}
                className="will-change-transform-opacity"
              >
                <TerrariumCard
                  id={String(item.terrariumId)}
                  name={String(item.terrariumName)}
                  description={(item as any)?.description}
                  type={`#${item.terrariumId}`}
                  price={Number(item.minPrice)}
                  rating={rating}
                  purchases={purchases}
                  image={image}
                  /** 👇 Truyền thêm “học” từ Shop */
                  environmentName={item.environmentName}          // ví dụ: "Rừng nhiệt đới"
                  tankMethodLabel={item.tankMethodLabel}          // ví dụ: "Mở hoàn toàn"
                />
              </div>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default NewestProducts;

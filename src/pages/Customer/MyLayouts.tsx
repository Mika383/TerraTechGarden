// src/pages/Customer/MyLayoutsPage.tsx
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EyeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  PencilIcon,
  PhotoIcon,
  PlusIcon,
  ChartBarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleSolid,
  XCircleIcon as XCircleSolid,
  ClockIcon as ClockSolid
} from '@heroicons/react/24/solid';

import { getMyLayouts, deleteLayout } from '@/api/layout';
import type { LayoutSummary } from '@/types/layout';
import { getTerrariumById } from '@/api/terrarium';
import api from '@/lib/axios/axiosInstance';

// ===== Helpers =====
type LayoutRow = LayoutSummary & {
  terrariumName?: string;
  terrariumImage?: string; // thumbnail
};

const money = (v?: number | null) =>
  v || v === 0 ? `${(v || 0).toLocaleString('vi-VN')}₫` : 'Chưa có giá';

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleString('vi-VN') : 'N/A';

const norm = (s?: string) => (s || '').trim().toLowerCase();

const statusIcon = (s?: string) => {
  switch (norm(s)) {
    case 'draft':    return <PencilIcon className="w-5 h-5 text-slate-500" />;
    case 'pending':  return <ClockSolid className="w-5 h-5 text-amber-500" />;
    case 'approved': return <CheckCircleSolid className="w-5 h-5 text-emerald-500" />;
    case 'rejected': return <XCircleSolid className="w-5 h-5 text-red-500" />;
    case 'ordered':  return <CheckCircleSolid className="w-5 h-5 text-sky-500" />;
    default:         return <ExclamationTriangleIcon className="w-5 h-5 text-gray-500" />;
  }
};

const statusText = (s?: string) => {
  switch (norm(s)) {
    case 'draft':    return 'Bản nháp';
    case 'pending':  return 'Đang chờ duyệt';
    case 'approved': return 'Đã duyệt';
    case 'rejected': return 'Bị từ chối';
    case 'ordered':  return 'Đã đặt hàng';
    default:         return 'Không xác định';
  }
};

const statusClass = (s?: string) => {
  switch (norm(s)) {
    case 'draft':
      return 'bg-gradient-to-r from-slate-50 to-slate-100 text-slate-800 border-slate-200 shadow-slate-100';
    case 'pending':
      return 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800 border-amber-200 shadow-amber-100';
    case 'approved':
      return 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-800 border-emerald-200 shadow-emerald-100';
    case 'rejected':
      return 'bg-gradient-to-r from-red-50 to-red-100 text-red-800 border-red-200 shadow-red-100';
    case 'ordered':
      return 'bg-gradient-to-r from-sky-50 to-sky-100 text-sky-800 border-sky-200 shadow-sky-100';
    default:
      return 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border-gray-200 shadow-gray-100';
  }
};

const MyLayoutsPage: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<LayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  // ✅ Gán kiểu rõ ràng cho các ref để tránh 'never'
  const headerRef = useRef<HTMLDivElement | null>(null);
  const statsRef  = useRef<HTMLDivElement | null>(null);
  const tableRef  = useRef<HTMLDivElement | null>(null);
  const cardsRef  = useRef<Array<HTMLDivElement | null>>([]);

  const userId = Number(localStorage.getItem('userId') || 0);

  const load = async () => {
    if (!userId) {
      setErr('Bạn chưa đăng nhập.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setErr(null);

      const list = await getMyLayouts(userId);

      const enriched = await Promise.all(
        list.map(async (it): Promise<LayoutRow> => {
          let terrariumName: string | undefined;
          let terrariumImage: string | undefined;
          try {
            const t = await getTerrariumById(it.terrariumId);
            terrariumName = t?.terrariumName || `Terrarium #${it.terrariumId}`;
            terrariumImage =
              t?.terrariumImages?.[0]?.imageUrl ||
              (Array.isArray(t?.terrariumImages) && typeof t?.terrariumImages[0] === 'string'
                ? (t?.terrariumImages[0] as unknown as string)
                : '') ||
              (t as any)?.thumbnailUrl ||
              '';
          } catch {
            terrariumName = `Terrarium #${it.terrariumId}`;
          }
          return { ...it, terrariumName, terrariumImage };
        })
      );

      setRows(enriched);
    } catch (e: any) {
      console.error(e);
      if (e?.response?.status === 401) {
        setErr('Hết phiên đăng nhập. Vui lòng đăng nhập lại.');
      } else {
        setErr('Không thể tải danh sách layout. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  // GSAP Animations
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
    script.onload = () => {
      const gsap: any = (window as any).gsap;
      if (!loading && !err && gsap) {
        if (headerRef.current) {
          const tl = gsap.timeline();
          tl.fromTo(headerRef.current, { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
        }
        if (statsRef.current) {
          const children = Array.from(statsRef.current.children) as HTMLElement[];
          gsap.fromTo(
            children,
            { opacity: 0, y: 30, scale: 0.9 },
            { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'back.out(1.7)', delay: 0.3 }
          );
        }
        if (tableRef.current) {
          gsap.fromTo(tableRef.current, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.6 });
        }
        cardsRef.current.forEach((card, index) => {
          if (card) {
            gsap.fromTo(card, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.5, delay: 0.8 + index * 0.1, ease: 'power2.out' });
          }
        });
      }
    };
    document.head.appendChild(script);
    return () => { if (document.head.contains(script)) document.head.removeChild(script); };
  }, [loading, err, rows]);

  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      const matchesSearch =
        row.layoutName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.terrariumName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === 'all' || norm(row.status) === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [rows, searchTerm, filterStatus]);

  const stats = useMemo(() => ({
    total: rows.length,
    pending: rows.filter(x => norm(x.status) === 'pending').length,
    approved: rows.filter(x => norm(x.status) === 'approved').length,
    rejected: rows.filter(x => norm(x.status) === 'rejected').length,
    // Có thể bổ sung draft/ordered nếu cần hiển thị thêm
  }), [rows]);

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa layout này?')) return;
    try {
      await deleteLayout(id);
      setRows(prev => prev.filter(x => x.layoutId !== id));
      const gsap: any = (window as any).gsap;
      if (gsap) {
        gsap.to(`.layout-row-${id}`, { opacity: 0, x: -100, duration: 0.5, ease: 'power2.in' });
      }
      alert('Đã xóa layout thành công!');
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.status === 401 ? 'Hết phiên đăng nhập. Vui lòng đăng nhập lại.' : 'Xoá thất bại. Vui lòng thử lại.');
    }
  };

  // ===== Gửi yêu cầu định giá (Draft -> Pending) =====
  const handleSubmitPricing = async (layoutId: number) => {
    if (!userId) {
      alert('Bạn chưa đăng nhập.');
      return;
    }
    if (!confirm('Gửi yêu cầu định giá cho layout này?')) return;

    try {
      setSubmittingId(layoutId);
      // PUT /api/TerrariumLayout/{id}/submit?userId=...
      await api.put(`/TerrariumLayout/${layoutId}/submit`, null, { params: { userId } });
      // Cập nhật status local -> Pending
      setRows(prev =>
        prev.map(r => (r.layoutId === layoutId ? { ...r, status: 'Pending' } : r))
      );
      alert('Đã gửi yêu cầu định giá. Layout chuyển sang trạng thái "Đang chờ duyệt".');
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.status === 401 ? 'Hết phiên đăng nhập. Vui lòng đăng nhập lại.' : 'Gửi yêu cầu thất bại. Vui lòng thử lại.');
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-emerald-400 animate-ping mx-auto"></div>
          </div>
          <p className="mt-6 text-slate-600 font-medium">Đang tải danh sách layout...</p>
          <p className="text-sm text-slate-400 mt-2">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4">
          <XCircleIcon className="w-20 h-20 text-red-500 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Có lỗi xảy ra</h3>
          <p className="text-red-600 mb-6">{err}</p>
          <button
            onClick={load}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-3 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div ref={headerRef} className="mb-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Layout Terrarium của tôi
            </h1>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Quản lý và theo dõi các layout terrarium bạn đã tạo với giao diện hiện đại
            </p>
          </div>

          {/* Search and Filter */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm layout hoặc terrarium..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-300 bg-white/80"
                />
              </div>
              <div className="relative">
                <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-10 pr-8 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-300 bg-white/80 min-w-[190px]"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="draft">Bản nháp</option>
                  <option value="pending">Đang chờ duyệt</option>
                  <option value="approved">Đã duyệt</option>
                  <option value="rejected">Bị từ chối</option>
                  <option value="ordered">Đã đặt hàng</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium uppercase tracking-wider">Tổng layout</p>
                <p className="text-3xl font-bold mt-2">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium uppercase tracking-wider">Đang chờ</p>
                <p className="text-3xl font-bold mt-2">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium uppercase tracking-wider">Đã duyệt</p>
                <p className="text-3xl font-bold mt-2">{stats.approved}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium uppercase tracking-wider">Bị từ chối</p>
                <p className="text-3xl font-bold mt-2">{stats.rejected}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <XCircleIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div ref={tableRef}>
          {filteredRows.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <EyeIcon className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                {searchTerm || filterStatus !== 'all' ? 'Không tìm thấy layout nào' : 'Chưa có layout nào'}
              </h3>
              <p className="text-slate-500 text-lg mb-8 max-w-md mx-auto">
                {searchTerm || filterStatus !== 'all'
                  ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc để xem kết quả khác'
                  : 'Bạn chưa tạo layout terrarium nào. Hãy bắt đầu tạo layout đầu tiên của bạn!'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button
                  onClick={() => navigate('/customer-dashboard/create-layout')}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-8 py-4 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                >
                  <PlusIcon className="w-5 h-5 inline mr-2" />
                  Tạo Layout Mới
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
                <h3 className="text-xl font-bold text-slate-900">
                  Danh sách Layout ({filteredRows.length})
                </h3>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredRows.map((layout, index) => {
                  const isDraft = norm(layout.status) === 'draft';
                  return (
                    <div
                      key={layout.layoutId}
                      ref={(el) => { cardsRef.current[index] = el; }}
                      className={`layout-row-${layout.layoutId} p-6 hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 transition-all duration-300 group`}
                    >
                      <div className="flex items-center justify-between">
                        {/* Layout Info */}
                        <div className="flex items-center gap-6 flex-1">
                          <div className="relative group-hover:scale-105 transition-transform duration-300">
                            {layout.terrariumImage ? (
                              <img
                                src={layout.terrariumImage}
                                alt={layout.terrariumName || 'Terrarium'}
                                className="h-16 w-16 rounded-xl object-cover border-2 border-white shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300"
                                onClick={() => navigate(`/terrarium/${layout.terrariumId}`)}
                              />
                            ) : (
                              <div
                                className="h-16 w-16 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:shadow-xl transition-all duration-300"
                                onClick={() => navigate(`/terrarium/${layout.terrariumId}`)}
                                title="Xem terrarium"
                              >
                                <PhotoIcon className="w-8 h-8 text-slate-400" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors duration-300">
                                  {layout.layoutName}
                                </h4>
                                <button
                                  onClick={() => navigate(`/terrarium/${layout.terrariumId}`)}
                                  className="text-sm text-slate-600 hover:text-emerald-600 font-medium transition-colors duration-300"
                                  title="Đi đến trang Terrarium"
                                >
                                  {layout.terrariumName || `Terrarium #${layout.terrariumId}`}
                                </button>
                                <div className="text-xs text-slate-400 mt-1">ID: {layout.layoutId}</div>
                              </div>

                              {/* Status Badge */}
                              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border shadow-sm ${statusClass(layout.status)} group-hover:scale-105 transition-transform duration-300`}>
                                {statusIcon(layout.status)}
                                <span className="ml-2">{statusText(layout.status)}</span>
                              </span>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                              <div className="flex items-center text-sm text-slate-600">
                                <CurrencyDollarIcon className="w-4 h-4 mr-2 text-emerald-600" />
                                <span className="font-medium">{money(layout.finalPrice ?? null)}</span>
                              </div>
                              <div className="flex items-center text-sm text-slate-600">
                                <CalendarIcon className="w-4 h-4 mr-2 text-blue-600" />
                                <span>Tạo: {fmt(layout.createdDate)}</span>
                              </div>
                              <div className="flex items-center text-sm text-slate-600">
                                <CalendarIcon className="w-4 h-4 mr-2 text-purple-600" />
                                <span>Duyệt: {layout.reviewDate ? fmt(layout.reviewDate) : 'Chưa duyệt'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 ml-6">
                          

                          {/* Nút gửi yêu cầu định giá khi Draft */}
                          {isDraft && (
                            <button
                              onClick={() => handleSubmitPricing(layout.layoutId)}
                              disabled={submittingId === layout.layoutId}
                              className="p-3 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-xl transition-all duration-300 group-hover:scale-105 font-medium"
                              title="Gửi yêu cầu định giá"
                            >
                              <PaperAirplaneIcon className={`w-5 h-5 ${submittingId === layout.layoutId ? 'animate-pulse' : ''}`} />
                            </button>
                          )}

                          
                          <button
                            onClick={() => handleDelete(layout.layoutId)}
                            className="p-3 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-all duration-300 group-hover:scale-105"
                            title="Xoá"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Review Notes */}
        {rows.some(l => !!l.reviewNotes) && (
          <div className="mt-10">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">
              Ghi chú từ người duyệt
            </h3>
            <div className="grid gap-6">
              {rows.filter(l => !!l.reviewNotes).map(l => (
                <div key={l.layoutId} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ExclamationTriangleIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-blue-900 mb-2">{l.layoutName}</h4>
                      <p className="text-blue-800 mb-3 leading-relaxed">{l.reviewNotes}</p>
                      <div className="flex items-center gap-4 text-sm text-blue-600">
                        <span className="font-medium">Duyệt bởi: {l.reviewedBy || 'N/A'}</span>
                        <span>•</span>
                        <span>{l.reviewDate ? fmt(l.reviewDate) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Button */}
        <div className="mt-12 text-center">
          <button
            onClick={() => navigate('/customer-dashboard/create-layout')}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-10 py-4 rounded-2xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 font-bold text-lg"
          >
            <PlusIcon className="w-6 h-6 inline mr-3" />
            Tạo Layout Mới
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyLayoutsPage;

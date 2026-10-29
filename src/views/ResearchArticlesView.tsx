import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Bookmark,
  Calendar,
  User as UserIcon,
  Tag,
  Clock,
  Share2,
  FileText,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Filter,
} from 'lucide-react';
import { ArticleRecord, UserSession } from '../types';

interface ResearchArticlesViewProps {
  currentSession: UserSession;
  articles: ArticleRecord[];
  onAddArticle: (article: ArticleRecord) => void;
  onUpdateArticle: (article: ArticleRecord) => void;
  onDeleteArticle: (id: string) => void;
}

export function ResearchArticlesView({
  currentSession,
  articles,
  onAddArticle,
  onUpdateArticle,
  onDeleteArticle,
}: ResearchArticlesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedArticle, setSelectedArticle] = useState<ArticleRecord | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states for adding new article
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ArticleRecord['category']>('วิจัยและนวัตกรรมการคลัง');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newAuthor, setNewAuthor] = useState(
    currentSession.roleTitle || 'กลุ่มงานวิจัยและพัฒนาระบบการคลังท้องถิ่น เทศบาลเมืองมหาสารคาม'
  );
  const [newTags, setNewTags] = useState('วิจัยการคลัง, 2570, เทศบาลเมืองมหาสารคาม');
  const [newReadTime, setNewReadTime] = useState<number>(5);

  const categories = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'วิจัยและนวัตกรรมการคลัง', label: 'วิจัยและนวัตกรรมการคลัง' },
    { id: 'บำเหน็จบำนาญ', label: 'บำเหน็จบำนาญ' },
    { id: 'กองทุน ช.ค.บ./ก.บ.ท.', label: 'กองทุน ช.ค.บ./ก.บ.ท.' },
    { id: 'สารบรรณ E-Office', label: 'สารบรรณ E-Office' },
    { id: 'ระเบียบกฎหมายท้องถิ่น', label: 'ระเบียบกฎหมายท้องถิ่น' },
  ];

  const filteredArticles = articles.filter((art) => {
    const matchCat = selectedCategory === 'all' || art.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchCat;
    const matchQuery =
      art.title.toLowerCase().includes(q) ||
      art.summary.toLowerCase().includes(q) ||
      art.content.toLowerCase().includes(q) ||
      art.author.toLowerCase().includes(q) ||
      art.tags.some((t) => t.toLowerCase().includes(q));
    return matchCat && matchQuery;
  });

  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const record: ArticleRecord = {
      id: `ART-2570-${Date.now().toString().slice(-4)}`,
      title: newTitle.trim(),
      category: newCategory,
      summary: newSummary.trim() || newContent.slice(0, 140) + '...',
      content: newContent.trim(),
      author: newAuthor.trim() || currentSession.username,
      publishDate: new Date().toISOString().split('T')[0],
      readTimeMinutes: Number(newReadTime) || 5,
      tags: newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      recordedBy: currentSession.username,
      updatedAt: new Date().toISOString(),
    };

    onAddArticle(record);
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewSummary('');
    setNewContent('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                คลังปัญญาและการวิจัยการคลัง 2570
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                อัปเดตบทความอัตโนมัติ
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              ศูนย์ค้นคว้าวิจัยและบทความการคลังท้องถิ่นล่าสุด
            </h1>
            <p className="text-blue-200 text-xs sm:text-sm mt-1 max-w-3xl">
              เทศบาลเมืองมหาสารคาม • แหล่งรวบรวมงานศึกษาวิจัย บทวิเคราะห์ระเบียบกฎหมายบำนาญ กองทุน ช.ค.บ./ก.บ.ท. และนวัตกรรมการคลังภาครัฐ มีการอัปเดตอัตโนมัติทุกครั้งเมื่อมีการค้นคว้าหรือบันทึกใหม่
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              เพิ่มบทความ / งานวิจัยใหม่
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Control Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นคว้าวิจัย: พิมพ์คำค้นหา เช่น บำนาญ 2570, ช.ค.บ., เกณฑ์อายุ 60 ปี, ทายาท 3 เท่า..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2 shrink-0">
            <span>พบทั้งหมด:</span>
            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              {filteredArticles.length} รายการ
            </span>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> หมวดหมู่:
          </span>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-blue-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      {filteredArticles.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">ไม่พบบทความหรือผลงานวิจัยที่ค้นหา</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            ลองปรับเปลี่ยนคำค้นหา หรือกดปุ่ม "เพิ่มบทความ / งานวิจัยใหม่" เพื่อบันทึกผลการค้นคว้าเข้าสู่ระบบ
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredArticles.map((art) => (
            <div
              key={art.id}
              onClick={() => setSelectedArticle(art)}
              className="bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all p-5 flex flex-col justify-between cursor-pointer group"
            >
              <div>
                {/* Header info */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <Bookmark className="w-3 h-3" />
                    {art.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>อ่าน ~{art.readTimeMinutes} นาที</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug">
                  {art.title}
                </h3>

                {/* Summary */}
                <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                  {art.summary}
                </p>
              </div>

              {/* Footer info */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{art.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {art.publishDate}
                  </span>
                  <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center">
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-6 sticky top-0 z-10 flex items-start justify-between gap-4">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-400 text-slate-950 mb-2">
                  {selectedArticle.category}
                </span>
                <h2 className="text-lg sm:text-xl font-bold leading-snug">
                  {selectedArticle.title}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-blue-200 mt-2">
                  <span className="flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5 text-amber-300" />
                    {selectedArticle.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-300" />
                    วันที่เผยแพร่: {selectedArticle.publishDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-300" />
                    อ่าน ~{selectedArticle.readTimeMinutes} นาที
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Summary Box */}
              <div className="bg-blue-50/80 border-l-4 border-blue-600 p-4 rounded-r-xl">
                <div className="text-xs font-bold text-blue-900 mb-1">สาระสำคัญโดยสังเขป:</div>
                <p className="text-xs sm:text-sm text-blue-950 leading-relaxed">
                  {selectedArticle.summary}
                </p>
              </div>

              {/* Full Content */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-700" />
                  เนื้อหาฉบับสมบูรณ์และข้อเสนอแนะ:
                </h4>
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-5 rounded-xl border border-slate-200 font-sans">
                  {selectedArticle.content}
                </div>
              </div>

              {/* Tags */}
              {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> คำค้น:
                  </span>
                  {selectedArticle.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs border border-slate-200"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* System Source Info */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  บทความนี้จัดเก็บและซิงค์ผ่าน Firebase Firestore & ฐานข้อมูลเทศบาลเมืองมหาสารคาม
                </span>
                <span className="text-emerald-700 text-[11px]">รหัส: {selectedArticle.id}</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                ปีงบประมาณ 2570 • กองคลัง เทศบาลเมืองมหาสารคาม
              </span>
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Article Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-blue-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold">บันทึกบทความวิจัย / ระเบียบการคลังใหม่</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อบทความ / หัวข้องานวิจัย *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="เช่น รายงานการวิเคราะห์สภาพคล่องกองทุน ก.บ.ท. ประจำปี 2570"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    หมวดหมู่ *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="วิจัยและนวัตกรรมการคลัง">วิจัยและนวัตกรรมการคลัง</option>
                    <option value="บำเหน็จบำนาญ">บำเหน็จบำนาญ</option>
                    <option value="กองทุน ช.ค.บ./ก.บ.ท.">กองทุน ช.ค.บ./ก.บ.ท.</option>
                    <option value="สารบรรณ E-Office">สารบรรณ E-Office</option>
                    <option value="ระเบียบกฎหมายท้องถิ่น">ระเบียบกฎหมายท้องถิ่น</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ผู้จัดทำ / คณะทำงาน *
                  </label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  บทคัดย่อ / สรุปย่อสาระสำคัญ
                </label>
                <textarea
                  rows={2}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="สรุปประเด็นหลัก 2-3 บรรทัด เพื่อให้อ่านเข้าใจได้ทันที"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เนื้อหาฉบับเต็ม / ผลการวิจัย / ข้อระเบียบ *
                </label>
                <textarea
                  rows={6}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="ระบุเนื้อหา ผลการศึกษา ขั้นตอนปฏิบัติงาน หรือระเบียบที่เกี่ยวข้อง..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    คำค้นหา (คั่นด้วยเครื่องหมายจุลภาค ,)
                  </label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="บำนาญ, กองทุน, 2570"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เวลาอ่านโดยประมาณ (นาที)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={newReadTime}
                    onChange={(e) => setNewReadTime(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-lg shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4 text-amber-400" />
                  บันทึกเข้าสู่ฐานข้อมูล Real-time
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

# BLOG.md — Hướng dẫn thêm bài viết mới vào help.html

File này dành cho Claude Code (và developer) để hiểu cách thêm bài viết vào tab **"Đánh giá & Phân tích"** trong `help.html`.

---

## Cách yêu cầu Claude thêm bài mới

Nói với Claude Code:

> **"Thêm bài blog mới vào help.html, chủ đề: [tên chủ đề], nội dung: [mô tả hoặc outline]"**

Ví dụ:
- `"Thêm bài blog về roadmap phát triển plugin, nội dung: 3 phases tiếp theo, ưu tiên, timeline dự kiến"`
- `"Thêm bài blog so sánh Typography DS với Tokens Studio chi tiết"`
- `"Thêm bài blog case study: triển khai Typography DS trong dự án thực tế, kết quả đạt được"`

Claude sẽ tự xử lý toàn bộ HTML — bạn chỉ cần cung cấp chủ đề và nội dung.

---

## Cấu trúc blog trong help.html

Blog nằm trong `#blog-panel`, gồm 2 phần:

```
#blog-panel
└── .blog-layout
    ├── nav.blog-sidebar          ← danh sách bài (sidebar tối)
    │   ├── .blog-nav-back        ← nút "← Về trang chủ"
    │   └── a.blog-nav-item       ← MỖI BÀI = 1 thẻ <a> ở đây
    └── .blog-content             ← nội dung bài
        └── div.article           ← MỖI BÀI = 1 thẻ <div> ở đây
```

---

## Template thêm bài mới

### Bước 1 — Thêm nav item vào sidebar

Tìm dòng `<!-- BLOG_NAV_END -->` trong `help.html` và chèn TRƯỚC nó:

```html
<a class="blog-nav-item" href="javascript:void(0)" onclick="showArticle('aXX', this)">
  <span class="bni-tag">CATEGORY</span>
  <span class="bni-title">Tiêu đề bài viết ngắn gọn</span>
  <span class="bni-date">DD/MM/YYYY</span>
</a>
```

- `aXX`: ID tăng dần — `a01`, `a02`, `a03`...
- `CATEGORY`: ví dụ `Đánh giá`, `Roadmap`, `Case Study`, `Tutorial`, `So sánh`

### Bước 2 — Thêm article div vào content

Tìm dòng `<!-- BLOG_ARTICLES_END -->` trong `help.html` và chèn TRƯỚC nó:

```html
<div class="article" id="article-aXX">
  <span class="article-tag">CATEGORY · Subtitle</span>
  <h1>Tiêu đề đầy đủ của bài viết</h1>
  <div class="article-meta">
    <span class="meta-author">Tên tác giả</span>
    <span class="meta-dot">·</span>
    <span>DD/MM/YYYY</span>
    <span class="meta-dot">·</span>
    <span>X phút đọc</span>
  </div>

  <!-- Nội dung bài viết ở đây -->
  <h2>Section heading</h2>
  <p>Đoạn văn...</p>

</div><!-- /article-aXX -->
```

---

## CSS classes có sẵn trong blog

| Class | Dùng để |
|-------|---------|
| `<h2>` | Heading section lớn |
| `<h3>` | Heading sub-section |
| `<p>` | Đoạn văn thường |
| `<ul>/<ol>` | Danh sách |
| `<code>` | Code inline |
| `<strong>` | Nhấn mạnh |
| `<hr>` | Ngăn cách sections |
| `.compare-table` | Bảng so sánh (thead tối, hover highlight) |
| `.score-grid` | Grid 2 cột cho cards pro/con |
| `.score-card.pro` | Card điểm mạnh (nền xanh) |
| `.score-card.con` | Card điểm yếu (nền đỏ) |
| `.rating-row` | Hàng rating bar ngang |
| `.rating-fill.five/.four/.three/.two/.one` | Mức đầy thanh rating (5→1) |
| `.verdict` | Callout kết luận (nền tím gradient) |
| `.callout.info/.warn/.tip` | Callout thông tin (tái dùng từ docs) |
| `.article-tag` | Tag nhỏ màu indigo ở đầu bài |
| `.article-meta` | Dòng meta: tác giả · ngày · thời gian đọc |

---

## Quy tắc đặt ID bài viết

| ID | Ý nghĩa |
|----|---------|
| `a01`, `a02`... | Thứ tự tạo (không phân loại theo category) |
| Luôn tăng dần | Không reuse ID đã xóa |
| `article-aXX` | ID của `<div>` trong content |

---

## Mang sang project khác

1. Copy `help.html` hoặc tạo file mới với cùng CSS/JS pattern
2. Copy file `BLOG.md` này vào project mới
3. Nói với Claude: `"Đọc BLOG.md để hiểu cách thêm bài blog vào help.html"`

Toàn bộ CSS blog được scoped trong block `/* ═══ Blog Panel ═══ */` trong `<style>` của `help.html` — dễ copy sang file khác.

---

## Danh sách bài viết hiện có

| ID | Tiêu đề | Ngày | Category |
|----|---------|------|----------|
| a01 | So sánh với các plugin trên thị trường | 18/04/2026 | Đánh giá |
| a02 | Tại sao Ctrl+ không phóng to được trong Typography Demo? | 18/04/2026 | Kỹ thuật & UX |
| a03 | Designer hiện đại làm responsive trong Figma như thế nào? | 18/04/2026 | Workflow thực chiến |


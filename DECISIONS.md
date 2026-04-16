# Design Decisions — figma-ds

Ghi lại các quyết định quan trọng trong quá trình xây dựng Typography DS plugin, kèm lý do.

---

## 1. Plugin là nguồn sự thật duy nhất

**Quyết định:** Token data lưu trong `figma.root.setPluginData()` (bên trong file Figma), không dùng file JSON riêng hay token manager bên ngoài.

**Lý do:** Team design dùng chung 1 file Figma → token tự động được share mà không cần sync thêm bước nào. Designer chỉnh trong plugin, lưu là xong.

**Hệ quả:** Dev handoff dùng nút "Export CSS" từ plugin, không maintain file token thủ công.

---

## 2. Tên token lock sớm, giá trị token thay đổi tự do

**Quyết định:** Tên CSS variable (`--size-base`, `--lh-sm`) và tên class (`.text-body-default`) phải ổn định từ sớm. Giá trị (`13px`, `14px`…) có thể thay đổi bất kỳ lúc nào.

**Lý do:** Design system đang xây từ đầu — token values chắc chắn sẽ thay đổi nhiều lần trong giai đoạn đầu. Nhưng nếu tên thay đổi, dev phải tìm & thay toàn bộ codebase. Giá trị đổi chỉ cần re-export `tokens.css`.

**Áp dụng:** Khi thêm token hay style mới, đặt tên cẩn thận. Khi đổi giá trị, cứ đổi thoải mái rồi Export CSS lại.

---

## 3. fontFamily KHÔNG bind vào Figma variable

**Quyết định:** `ts.fontName = { family: 'Arial', style: '...' }` — đặt trực tiếp, không dùng variable `font-family/arial`.

**Lý do:** Nếu bind variable, Figma hiển thị tên variable (`font-family/arial`) trong panel Font Family thay vì tên font thật (`Arial`). Designer bị confused, tưởng font bị lỗi.

---

## 4. Letter spacing trong text styles: dùng % (Figma), convert sang em (CSS)

**Quyết định:** STYLE_DEFS lưu `ls` dưới dạng Figma percent (e.g. `ls: 8` = 8%). Khi export CSS, convert sang `em` (`8% → 0.08em`).

**Lý do:** Figma API dùng `PERCENT` unit cho letter-spacing. CSS không có unit `%` cho letter-spacing — `em` là tương đương gần nhất và tương thích tốt.

---

## 5. Xoá style: chỉ có hiệu lực sau khi bấm Apply

**Quyết định:** Khi user xoá style trong Tab Tokens, style chỉ bị xoá khỏi danh sách UI. Bấm "Apply ngay" mới thực sự xoá text style trong Figma.

**Lý do:** Tránh xoá nhầm — user có thể undo bằng cách không bấm Apply. Figma không có undo cho plugin actions.

**Lưu ý:** Khi xoá style đã được gán cho text node trong Figma, node đó sẽ mất style assignment (Figma tự detach).

---

## 6. setupVariables + createTextStyles chạy 1 lần, autoApplyStyles loop từng frame

**Quyết định:** Khi "Chuẩn hoá" nhiều frame, biến số và text styles chỉ tạo/update 1 lần duy nhất. Chỉ bước gán style là loop.

**Lý do:** setupVariables và createTextStyles gọi Figma API nặng (tạo/upsert object). Không cần thiết phải lặp lại cho từng frame vì kết quả giống nhau.

---

## 7. Responsive: 1280 là default, 1440/1920 là @media min-width

**Quyết định:** CSS export dùng 1280 làm base (`:root`), override ở 1440 và 1920 bằng `@media (min-width: Xpx)`.

**Lý do:** Màn hình nhỏ nhất trong scope là 1280px (desktop app, không có mobile). Approach min-width đi từ nhỏ lên lớn, đúng chuẩn CSS responsive.

---

## 8. Breakpoint 1280/1440/1920 — không dùng 768/1024

**Quyết định:** 3 breakpoints của app là 1280, 1440, 1920px.

**Lý do:** Đây là app web nội bộ (tờ trình / approval workflow), chạy trên desktop. Không cần tablet hay mobile. 3 mức tương ứng Full HD / WQHD / 4K monitor phổ biến trong văn phòng.

---

## 9. Export CSS workflow — không commit tokens.css thủ công

**Quyết định:** `tokens.css` là file generated, không được sửa tay, không track bằng git (hoặc nếu track thì chỉ commit khi export từ plugin).

**Lý do:** File này thay đổi thường xuyên trong giai đoạn đầu. Nếu dev sửa tay, lần export tiếp theo sẽ ghi đè mất. Plugin là nguồn sự thật — mọi thay đổi phải đi qua plugin.

---

*Cập nhật lần cuối: 2026-04-17*

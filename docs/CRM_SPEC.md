# SPEC PHẦN MỀM CRM – MARKETING & SALES (Bản nháp v0.7)

> Ngày: 15/09/2026 · Mô hình: B2B dự án + B2B thương mại/đại lý · Người phát triển: 1 người, vibe code cùng Claude
>
> Ký hiệu: **[ĐX]** = giá trị/quy tắc do Claude đề xuất, cần bạn xác nhận. **[CH]** = Admin chỉnh được trong trang Quản trị.

---

## 0. Tổng quan

| Hạng mục | Quyết định |
|---|---|
| Loại sản phẩm | Web app, giao diện responsive, cài được như app trên điện thoại (PWA) |
| Người dùng | 10–30 người: Admin, Quản lý, Trưởng nhóm, Sale, Marketing |
| Luồng chính | Thu lead → chống trùng → chia lead → bán hàng → báo giá/duyệt → đơn hàng → chăm sóc sau bán → báo cáo |
| Ngôn ngữ / tiền / giờ | Tiếng Việt · VNĐ (số nguyên) · giờ Việt Nam (GMT+7) |

---

## 1. Thuật ngữ

| Thuật ngữ | Định nghĩa |
|---|---|
| **Lead** | Một yêu cầu/người quan tâm mới, chưa được sale xác nhận là cơ hội bán hàng |
| **Lượt gửi (submission)** | Một lần dữ liệu đi vào hệ thống (1 form, 1 tin nhắn, 1 dòng Excel). Luôn lưu nguyên bản, không sửa |
| **Khách hàng** | Công ty (Account) + người liên hệ (Contact) |
| **Cơ hội (Deal)** | Nhu cầu mua cụ thể, đi qua các giai đoạn pipeline |
| **Người phụ trách (Owner)** | Sale đang chịu trách nhiệm một lead/khách hàng/cơ hội |
| **Lượt đề xuất (offer)** | Một lần hệ thống giao lead cho một sale và chờ sale nhận |
| **Vòng chia** | Mỗi sale đủ điều kiện được đề xuất đúng 1 lần |
| **Giờ làm việc** | Theo lịch công ty, trừ ngày lễ và lịch riêng của từng người (mục 5.6) |

---

## 2. Vai trò & phân quyền

### 2.1 Vai trò

| Vai trò | Phạm vi dữ liệu mặc định |
|---|---|
| **Admin** | Toàn bộ + cấu hình hệ thống |
| **Quản lý** | Toàn bộ dữ liệu kinh doanh |
| **Trưởng nhóm** | Dữ liệu của nhóm mình |
| **Sale** | Dữ liệu mình phụ trách hoặc được thêm làm người theo dõi |
| **Marketing** | Lead, form, nguồn, chiến dịch; số liệu tổng hợp |

Một người có thể thuộc nhiều nhóm (ví dụ sale phụ trách cả kênh Dự án và Thương mại). Quyền được Admin cấu hình theo vai trò **[CH]**; bảng dưới là mặc định **[ĐX]**.

### 2.2 Ma trận quyền – dữ liệu khách hàng, lead, cơ hội

Ký hiệu: **M** = của mình · **N** = của nhóm · **T** = tất cả · ✘ = không

| Thao tác | Sale | Trưởng nhóm | Marketing | Quản lý | Admin |
|---|---|---|---|---|---|
| Xem | M | N | Lead: T · Khách/Deal: ✘ | T | T |
| Tạo | ✔ | ✔ | Lead | ✔ | ✔ |
| Sửa | M | N | Lead chưa giao | T | T |
| Xoá (vào thùng rác) | ✘ | ✘ | Lead chưa giao | T | T |
| Khôi phục từ thùng rác | ✘ | ✘ | ✘ | T | T |
| Xoá vĩnh viễn | ✘ | ✘ | ✘ | ✘ | ✔ |
| Xuất Excel | ✘ | N | Lead (che SĐT/email) | T | T |
| Giao lại / thu hồi | ✘ | N | ✘ | T | T |
| Giao lại hàng loạt | ✘ | N | ✘ | T | T |
| Hợp nhất bản ghi trùng | ✘ | N | ✘ | T | T |
| Tách bản ghi đã hợp nhất | ✘ | ✘ | ✘ | ✘ | ✔ |
| Xuất toàn bộ dữ liệu một khách hàng | ✘ | ✘ | ✘ | ✔ | ✔ |

### 2.3 Thông tin liên hệ (SĐT, email, Zalo)

| Trường hợp | Hiển thị |
|---|---|
| Bản ghi trong phạm vi của mình | Đầy đủ |
| Bản ghi ngoài phạm vi (ví dụ cảnh báo trùng, kho lead chung) | Che một phần: `0912 *** 678`, `ng***@gmail.com` |
| Marketing xem lead đã giao cho sale | Che một phần |
| Bấm "Xem đầy đủ" (nếu được phép) | Hiển thị + **ghi nhật ký** |

### 2.4 Giá và tài chính

| Dữ liệu | Sale | Trưởng nhóm | Marketing | Quản lý | Admin |
|---|---|---|---|---|---|
| Giá bán, chiết khấu | M | N | ✘ | T | T |
| Giá vốn, biên lợi nhuận | ✘ | ✘ | ✘ | T | T |
| Doanh số/doanh thu theo người | M | N | ✘ | T | T |
| Doanh thu tổng theo nguồn/chiến dịch | ✘ | ✘ | ✔ (tổng hợp) | T | T |

### 2.5 File đính kèm

| Thao tác | Quy tắc |
|---|---|
| Tải lên | Ai có quyền sửa bản ghi |
| Tải xuống / xem | Ai có quyền xem bản ghi |
| Xoá | Người tải lên (trong 24 giờ), Trưởng nhóm (N), Quản lý, Admin |

### 2.6 Báo cáo, nhật ký

| Thao tác | Sale | Trưởng nhóm | Marketing | Quản lý | Admin |
|---|---|---|---|---|---|
| Báo cáo cá nhân | ✔ | ✔ | ✔ | ✔ | ✔ |
| Báo cáo tổng hợp có dữ liệu ngoài phạm vi | ✘ | Nhóm | Marketing (không theo người) | ✔ | ✔ |
| Xem nhật ký thao tác (audit log) | ✘ | ✘ | ✘ | ✔ (chỉ xem) | ✔ |
| Xem nhật ký đăng nhập, quản lý phiên | Của mình | Của mình | Của mình | Của mình | Tất cả |

**Nguyên tắc kỹ thuật:** phạm vi dữ liệu được chặn ngay trong CSDL (Row Level Security). Giao diện chỉ ẩn nút, không phải lớp bảo vệ chính.

---

## 3. Đầu vào lead

### 3.1 Nguồn

| Nguồn | Cách vào hệ thống |
|---|---|
| Form do CRM tạo (mục 3.2) | Nhúng vào website / link gửi qua email |
| Form website có sẵn (CF7) | Webhook |
| Facebook Fanpage, Lead Ads | Webhook Facebook |
| Zalo OA | Webhook Zalo |
| Email | Hộp thư chung |
| Hotline, nhập tay | Form tạo nhanh |
| Excel/CSV | Import có ánh xạ cột, xem trước, báo lỗi từng dòng |

Mọi nguồn đều đi qua **cùng một luồng**: lưu lượt gửi nguyên bản → chuẩn hoá → chống trùng (mục 4) → chia lead (mục 5).

### 3.2 Trình tạo form

- Admin/Marketing tạo form bằng kéo thả: chọn trường (họ tên, SĐT, email, công ty, MST, tỉnh/thành, sản phẩm quan tâm, nhu cầu, trường tuỳ chỉnh), đánh dấu bắt buộc, sắp xếp.
- Cấu hình cho mỗi form: nguồn, chiến dịch, kênh (Dự án/Thương mại/Chưa rõ), đánh giá mặc định (Hot/Warm/Cool), thông báo cảm ơn hoặc chuyển trang, màu và chữ nút.
- **Đầu ra:**
  - **Mã nhúng JavaScript** – dán vào website (WordPress…), tự lấy UTM và trang nguồn.
  - **Mã iframe** – dùng khi website không cho chạy script.
  - **Link trang form riêng** – để chèn vào email, tin nhắn, QR code (email không chạy được form, nên dùng nút/link).
- Chống spam: trường ẩn bẫy bot (honeypot), giới hạn số lần gửi theo IP, Cloudflare Turnstile (tuỳ chọn).
- Ô đồng ý xử lý dữ liệu cá nhân (theo Nghị định 13/2023) – lưu nội dung và thời điểm đồng ý.
- Thống kê từng form: lượt xem, lượt gửi, tỷ lệ gửi.

### 3.3 Đánh giá lead

- Mức: **Hot / Warm / Cool** (mặc định theo form/nguồn, sale/marketing đổi được).
- Ảnh hưởng **[ĐX]**:

| Mức | Thời hạn nhận lead | Nhắc liên hệ đầu tiên | Thứ tự trong danh sách |
|---|---|---|---|
| Hot | Ngắn nhất theo nguồn, có thể tính cả ngoài giờ **[CH]** | Sau 15 phút | Đầu tiên |
| Warm | Theo nguồn | Sau 2 giờ làm việc | Thứ hai |
| Cool | Theo nguồn | Sau 1 ngày làm việc | Cuối |

- Mọi lần đổi mức đều lưu lịch sử (ai đổi, lúc nào).

### 3.4 Chống xử lý webhook trùng

1. Mỗi webhook nhận vào được lưu ngay vào bảng `webhook_events` rồi trả lời 200 cho nền tảng gửi.
2. Khoá chống trùng: `(nguồn, mã sự kiện của nền tảng)`; nếu nền tảng không có mã → dùng mã băm nội dung + khung thời gian 10 phút.
3. Sự kiện đã có → bỏ qua, không tạo lead mới.
4. Xử lý chạy nền; lỗi → thử lại tối đa 5 lần (1, 5, 15, 60, 240 phút) **[ĐX]**; vẫn lỗi → trạng thái **Thất bại**, hiện trong trang Tích hợp (mục 11).

---

## 4. Chống trùng & hợp nhất dữ liệu

### 4.1 Chuẩn hoá trước khi so sánh

| Dữ liệu | Quy tắc |
|---|---|
| SĐT Việt Nam | Bỏ khoảng trắng, dấu chấm, gạch; `+84`/`84` → `0`; đầu số 11 số cũ → 10 số mới (bảng chuyển đổi 2018); lưu cả dạng `0xxxxxxxxx` và `+84xxxxxxxxx` |
| SĐT không hợp lệ | Không đủ 10 số / đầu số lạ → vẫn lưu nhưng gắn cờ "cần kiểm tra", không dùng để so trùng |
| Email | Bỏ khoảng trắng, chuyển chữ thường |
| MST | Chỉ giữ số và dấu gạch; hợp lệ khi 10 số hoặc 10 số + `-` + 3 số (chi nhánh) |
| Tên công ty | Bỏ dấu, chữ thường, bỏ tiền tố "Công ty", "TNHH", "Cổ phần", "CP"… (chỉ dùng để so gần đúng) |

### 4.2 Ba mức kết quả

| Mức | Điều kiện | Xử lý |
|---|---|---|
| **Trùng chắc chắn** | Trùng SĐT chuẩn hoá, **hoặc** trùng email, **hoặc** trùng MST (cấp công ty) | Tự gắn lượt gửi vào hồ sơ cũ, tạo hoạt động "Khách quay lại", báo người phụ trách, áp dụng quy tắc 5.5 |
| **Có khả năng trùng** | Tên công ty giống ≥ 80% và cùng tỉnh; hoặc cùng họ tên + cùng tên miền email công ty; hoặc trùng 1 trường nhưng các trường khác mâu thuẫn mạnh | Tạo lead ở trạng thái **Chờ xác nhận trùng**, đưa vào hàng chờ; **chưa chia lead** cho đến khi có người xử lý (quá 4 giờ làm việc → tự tạo mới và chia) |
| **Không trùng** | Không thuộc hai trường hợp trên | Tạo mới, chia lead |

Email miễn phí (gmail, yahoo…) không dùng làm căn cứ "cùng tên miền".

### 4.3 Dữ liệu nào thắng khi mâu thuẫn **[ĐX]**

1. **Không tự ghi đè** giá trị đang có. Trường đang trống → điền từ dữ liệu mới.
2. Giá trị mới khác giá trị cũ → lưu vào mục "Thông tin khác từ nguồn" để sale chọn áp dụng.
3. Khi hợp nhất thủ công: người hợp nhất chọn từng trường. Gợi ý mặc định theo thứ tự ưu tiên: **sale nhập/xác nhận** > **nhập tay khác** > **form/tin nhắn gần nhất** > **import Excel**.
4. Người phụ trách **không bao giờ** thay đổi do hợp nhất tự động; hợp nhất thủ công giữ người phụ trách của bản ghi chính (người hợp nhất có thể chọn lại).
5. SĐT/email phụ không bị mất: gộp thành danh sách nhiều số/nhiều email.

### 4.4 Quyền và an toàn khi hợp nhất

- Hợp nhất: Trưởng nhóm (trong nhóm), Quản lý, Admin.
- Trước khi hợp nhất: lưu **ảnh chụp đầy đủ** hai bản ghi; mọi lượt gửi nguồn giữ nguyên.
- Sau hợp nhất: hoạt động, cơ hội, báo giá, file, việc đều chuyển sang bản ghi chính; bản ghi phụ chuyển trạng thái "Đã hợp nhất vào …".
- Tách lại: chỉ Admin, trong vòng **30 ngày** **[ĐX]**, dựa trên ảnh chụp đã lưu.
- Mọi lần hợp nhất/tách đều ghi nhật ký.

---

## 5. Chia lead tự động

### 5.1 Cấu hình **[CH]**

- Bật/tắt nhận lead cho từng sale; mức ưu tiên **1–5** (5 cao nhất).
- Kênh phụ trách: Dự án / Thương mại / cả hai.
- Lead chưa rõ kênh: Admin chọn giao cho sale phụ trách cả hai, tất cả sale đang bật, hoặc một nhóm chỉ định.
- **Thời hạn nhận theo nguồn** (ví dụ Zalo 10 phút, form 30 phút) và theo mức Hot/Warm/Cool.
- Hạn mức lead tối đa/ngày cho từng sale.
- Số vòng tối đa: **2** → hết vòng trả về kho lead chung.

### 5.2 Điều kiện một sale được đề xuất

Sale chỉ được đề xuất khi **đồng thời**:

1. Tài khoản đang hoạt động và **đang bật nhận lead**.
2. **Không** ở trạng thái "Tạm ngừng nhận lead" (sale tự bật, có thời điểm tự hết hạn, ví dụ đang họp 2 giờ).
3. **Không** nghỉ phép trong thời điểm hiện tại.
4. **Đang trong ca** theo lịch làm việc cá nhân (mục 5.6).
5. Kênh phù hợp với lead.
6. **Chưa đạt hạn mức ngày** (mục 5.7).
7. **Chưa từng** từ chối hoặc để hết hạn chính lead này.

Nếu không có sale nào đủ điều kiện (ví dụ ngoài giờ): lead **chờ** đến khi có người vào ca; lead Hot báo ngay cho Trưởng nhóm/Quản lý.

### 5.3 Thứ tự chọn

1. Mức ưu tiên cao trước (5 → 1).
2. Cùng mức: người **được đề xuất lâu nhất** trước (xoay vòng công bằng).
3. Cùng thời điểm: người ít lead đang mở hơn.

### 5.4 Luồng xử lý một lượt đề xuất

```
Lead mới ─► Chọn sale đủ điều kiện ─► Tạo lượt đề xuất (hạn = giờ đề xuất + thời hạn, tính theo giờ làm việc)
           ─► Thông báo app + Zalo
           ─► Sale chọn:
               • NHẬN      → lead thuộc sale, bắt đầu tính thời gian liên hệ đầu tiên
               • TỪ CHỐI   → bắt buộc chọn lý do → chuyển ngay sang sale kế tiếp
               • Không làm → hết hạn → chuyển sang sale kế tiếp
           ─► Hết 2 vòng không ai nhận → Kho lead chung + báo Quản lý
```

**Lý do từ chối** (danh sách **[CH]**): Đang quá tải · Ngoài khu vực · Không đúng chuyên môn/sản phẩm · Nghi trùng khách đang chăm sóc · Thông tin không hợp lệ/spam · Khác (bắt buộc ghi chú).
Lý do "Thông tin không hợp lệ/spam" → gửi Trưởng nhóm xác nhận thay vì chuyển tiếp.

**Quản lý/Trưởng nhóm** có thể thu hồi hoặc giao thẳng bất kỳ lúc nào (bắt buộc ghi lý do).

### 5.5 Các tình huống đặc biệt

| Tình huống | Quy tắc |
|---|---|
| **Sale bấm Nhận đúng lúc hết hạn** | Máy chủ quyết định: chỉ nhận thành công nếu **thời điểm máy chủ ghi nhận < hạn** và lượt đề xuất vẫn đang "Chờ". Thao tác nhận và thao tác hết hạn đều là "đổi trạng thái có điều kiện" trong CSDL → **cái nào ghi trước thì thắng**, cái sau thất bại. Sale bấm muộn thấy thông báo "Lead đã được chuyển cho người khác". |
| **Hai tiến trình chia cùng lúc** | Việc chia chạy trong **một hàm CSDL có khoá dòng** (`SELECT … FOR UPDATE SKIP LOCKED`). Ràng buộc duy nhất: mỗi lead chỉ có **tối đa 1 lượt đề xuất đang chờ**. Lần chia thứ hai bị từ chối, không giao trùng. |
| **Lead quay lại từ khách cũ** | Nếu khách đã có người phụ trách **đang hoạt động** và có tương tác trong **180 ngày** → **giao thẳng cho sale cũ** (không xoay vòng). Đồng thời gửi thông báo (app + Zalo): **Sale cũ** – "Khách cũ [tên] vừa đăng ký lại qua [nguồn]" kèm nội dung yêu cầu mới; **Trưởng nhóm** của sale đó – cùng nội dung để theo dõi. Sale vẫn bấm Nhận; hết hạn → báo Trưởng nhóm xử lý. Người cũ nghỉ việc/tắt nhận lead/quá 180 ngày → chia như lead mới. |
| **Sale nghỉ phép khi đang có lead chờ** | Lượt đề xuất đang chờ bị huỷ và chuyển ngay; lead đã nhận vẫn giữ, Trưởng nhóm được nhắc giao lại nếu nghỉ > 3 ngày. |
| **Sale nghỉ việc** | Khoá tài khoản → mọi dữ liệu vào danh sách "Chờ giao lại" cho Quản lý. |

### 5.6 Lịch làm việc

- **Lịch công ty:** giờ làm từng ngày trong tuần (ví dụ T2–T6 8:00–17:30, T7 8:00–12:00, nghỉ trưa 12:00–13:30).
- **Ngày lễ:** danh sách ngày nghỉ theo năm, Admin nhập; có ngày làm bù.
- **Lịch riêng từng người:** ca làm khác lịch công ty, ngày nghỉ phép (sale tự đăng ký, Trưởng nhóm duyệt).
- Thời hạn nhận lead và các chỉ số thời gian phản hồi **chỉ tính trong giờ làm việc**; riêng lead Hot có thể bật "tính cả ngoài giờ" **[CH]**.

### 5.7 Hạn mức ngày

- Tính theo **lead đã nhận** trong ngày **cộng** lead **đang chờ** sale đó nhận.
- Lead bị từ chối hoặc hết hạn **không** tính.
- Lead khách cũ giao thẳng (mục 5.5) **không** tính vào hạn mức.

### 5.8 Nhật ký chia lead

Mỗi lượt đề xuất lưu một dòng: lead, vòng, sale, thời điểm đề xuất, hạn, kết quả (Nhận / Từ chối / Hết hạn / Bị huỷ / Thu hồi), lý do, người thao tác, thời gian phản hồi (phút làm việc).
Ngoài ra lưu **danh sách sale bị bỏ qua và lý do** (nghỉ phép, ngoài ca, đủ hạn mức…) để giải thích "vì sao tôi không nhận được lead".

---

## 6. Bán hàng & chăm sóc

### 6.1 Pipeline tuỳ chỉnh

- Nhiều pipeline (Dự án, Thương mại…), giai đoạn tự đặt: tên, thứ tự, xác suất thắng %, trường bắt buộc khi chuyển.
- Xem dạng Kanban (kéo thả) và dạng bảng.
- Kết thúc: Thắng / Thua (bắt buộc lý do thua).

### 6.2 Cơ hội

- Công ty, người liên hệ, giá trị dự kiến, ngày dự kiến chốt, sản phẩm quan tâm, đối thủ.
- Riêng dự án: tên công trình, chủ đầu tư, nhà thầu, địa điểm, giai đoạn dự án.

### 6.3 Hoạt động, cộng tác, thẻ

- Hoạt động: cuộc gọi, gặp mặt, email, tin nhắn, ghi chú, file; hiển thị theo dòng thời gian.
- **Người theo dõi / cộng tác viên:** thêm người khác vào khách hàng hoặc cơ hội; họ được xem và nhận thông báo, **không** thành người phụ trách (quyền sửa tuỳ chọn khi thêm).
- **Thẻ (tag):** gắn nhiều thẻ cho khách hàng/lead (ví dụ "Nhà thầu PCCC", "Khách VIP"); Admin quản lý danh sách thẻ, người dùng chỉ chọn.
- **Lịch sử người phụ trách:** lưu mỗi lần đổi owner: từ ai, sang ai, ai thực hiện, lý do, thời điểm.

---

## 7. Sản phẩm, báo giá, đơn hàng

### 7.1 Sản phẩm

- Mã, tên, hãng, model, thông số chính, đơn vị, hình ảnh, datasheet.
- **Giá niêm yết** (trước VAT), **thuế suất VAT** theo sản phẩm **[CH]**, giá đại lý theo cấp.
- **Giá vốn** – chỉ Quản lý/Admin xem và sửa.
- Chỉ Quản lý/Admin sửa giá niêm yết; mọi lần đổi giá được lưu lịch sử.

### 7.2 Quy tắc chiết khấu

| Câu hỏi | Quy tắc **[ĐX]** |
|---|---|
| Chiết khấu theo dòng hay toàn báo giá? | **Cả hai**: chiết khấu từng dòng + chiết khấu thêm toàn báo giá |
| Tính trên giá trước hay sau VAT? | **Trước VAT** |
| Mức dùng để xét duyệt | **Chiết khấu hiệu dụng** = (Tổng giá niêm yết − Tổng sau chiết khấu) ÷ Tổng giá niêm yết, tính trước VAT. Đồng thời xét **dòng có chiết khấu cao nhất**. Lấy mức cao hơn để xác định cấp duyệt |
| Hạn mức tự quyết **[CH]** | Sale 2% · Trưởng nhóm 5% · Quản lý 7% · Trên 7% → Admin |
| Sửa đơn giá trực tiếp | Sale **không** sửa đơn giá thấp hơn niêm yết (phải dùng ô chiết khấu). Được **tăng** giá. Sản phẩm ngoài danh mục (dòng tự do): chỉ Trưởng nhóm trở lên |
| Biên lợi nhuận tối thiểu | Có, mặc định **10%** (đã xác nhận) **[CH]**. Báo giá có dòng dưới biên tối thiểu → **bắt buộc Quản lý duyệt**, bất kể chiết khấu. Sale không thấy con số biên, chỉ thấy cảnh báo "Cần duyệt giá" |

### 7.3 Trạng thái báo giá

```
Nháp ──(gửi duyệt)──► Chờ duyệt ──(duyệt)──► Đã duyệt ──(gửi khách)──► Đã gửi ──► Chấp nhận
  ▲                       │                                               ├──► Từ chối
  └──── (trả lại + lý do) ┘                                               └──► Hết hạn (tự động)
Nháp không vượt hạn mức ──(xác nhận)──► Đã duyệt (tự động)
Bất kỳ trạng thái trước "Chấp nhận" ──► Đã huỷ
```

| Quy tắc | Nội dung **[ĐX]** |
|---|---|
| Báo giá chờ duyệt | Chỉ **xem trước PDF có dấu mờ "BẢN NHÁP – CHƯA DUYỆT"**; không gửi khách, không tải bản sạch |
| Sửa sau khi đã duyệt/đã gửi | Tạo **phiên bản mới** (v2, v3…) về trạng thái Nháp; bản cũ giữ nguyên để đối chiếu |
| Có phải duyệt lại không | Sửa giá/chiết khấu/số lượng/sản phẩm → xét lại hạn mức, vượt thì duyệt lại. Chỉ sửa điều khoản, người nhận, ghi chú → không cần duyệt lại |
| Hết hạn | Tự chuyển "Hết hạn" sau ngày hiệu lực (mặc định 30 ngày **[CH]**) |
| Chấp nhận | Tạo đơn hàng từ báo giá; cơ hội chuyển Thắng (có hỏi xác nhận) |
| Mã số | `BG-2026-0001` (tự tăng theo năm) |

### 7.4 Làm tròn và tính tiền **[ĐX]**

- Lưu tiền bằng kiểu số chính xác (`numeric`), **không** dùng số thực (float).
- Mọi số tiền làm tròn đến **đồng**, quy tắc làm tròn nửa lên.
- Thứ tự tính:
  1. Thành tiền dòng = làm tròn(số lượng × đơn giá × (1 − CK dòng %))
  2. Tạm tính = tổng thành tiền các dòng
  3. CK toàn báo giá = làm tròn(Tạm tính × CK %) → phân bổ về các dòng theo tỷ lệ (dòng cuối nhận phần chênh lệch do làm tròn)
  4. VAT = tính theo **từng nhóm thuế suất** trên tiền sau chiết khấu, làm tròn đến đồng
  5. Tổng thanh toán = Tiền sau chiết khấu + VAT
- Có dòng "Số tiền bằng chữ".

### 7.5 Đơn hàng & sau bán

- Trạng thái: Mới → Xác nhận → Đang giao → Hoàn tất / Huỷ.
- Đợt thanh toán: số tiền, hạn, đã thu, còn lại.
- Ngày giao, hạn bảo hành, lịch bảo trì định kỳ.
- Trường `mã ngoài` để sau này đồng bộ với phần mềm kế toán.

---

## 8. Nhắc việc & thông báo

### 8.1 Công việc

- Loại: gọi, gặp, gửi báo giá, khảo sát, bảo trì, khác; có hạn, người thực hiện, liên kết bản ghi.
- Màn hình **Việc hôm nay**: quá hạn / hôm nay / sắp tới.

### 8.2 Nhắc tự động **[CH]**

| Quy tắc | Mặc định |
|---|---|
| Lead đã nhận chưa liên hệ | Theo mức Hot/Warm/Cool (mục 3.3) |
| Khách lâu không tương tác | Hạng A: 5 ngày · B: 10 ngày · C: 20 ngày |
| Báo giá chưa phản hồi | 3 ngày sau khi gửi; nhắc lại 3 ngày trước hết hạn |
| Chăm sóc sau bán | 7 ngày sau giao hàng; theo lịch bảo trì; 30 ngày trước hết bảo hành |

### 8.3 Gửi thông báo

- Kênh: trong app (kèm thông báo đẩy PWA) và Zalo OA.
- **Chống gửi trùng:** mỗi thông báo có khoá duy nhất `(loại, bản ghi, người nhận, mốc thời gian)`; đã gửi thì không gửi lại.
- **Thử lại khi lỗi:** Zalo lỗi → thử lại 3 lần (1, 5, 30 phút) → vẫn lỗi thì đánh dấu Thất bại, vẫn giữ thông báo trong app.
- Người dùng tự chọn loại thông báo muốn nhận; tóm tắt việc lúc 8:00 mỗi ngày làm việc.

---

## 9. Công cụ làm việc hằng ngày

| Tính năng | Mô tả |
|---|---|
| **Tìm kiếm toàn hệ thống** | Một ô tìm theo tên, SĐT (mọi định dạng), email, MST, mã báo giá, mã đơn; kết quả chỉ trong phạm vi được xem (ngoài phạm vi hiện dạng che: "Có khách trùng do người khác phụ trách") |
| **Bộ lọc & chế độ xem đã lưu** | Lưu bộ lọc + cột hiển thị; dùng riêng hoặc chia sẻ cho nhóm |
| **Lead chưa xử lý** | Lead đang chờ nhận, đã nhận nhưng chưa liên hệ, trong kho chung, chờ xác nhận trùng |
| **Cơ hội có nguy cơ** | Đứng yên (mục 10.1), quá ngày dự kiến chốt, báo giá sắp hết hạn |
| **Hộp duyệt chung** | Một nơi cho: duyệt chiết khấu/giá, yêu cầu chuyển lead, xác nhận trùng, đơn nghỉ phép, lead bị báo spam |
| **Thao tác hàng loạt** | Chọn nhiều bản ghi → giao lại, gắn thẻ, thêm ghi chú, tạo việc (theo quyền; ghi nhật ký từng bản ghi) |

---

## 10. Báo cáo & định nghĩa KPI

### 10.1 Định nghĩa thống nhất **[ĐX]**

| Chỉ số | Định nghĩa |
|---|---|
| **Lead hợp lệ** | Lead **không** bị đánh dấu Spam, Sai thông tin, hoặc Trùng. Lead "Không có nhu cầu" vẫn là hợp lệ |
| **Tỷ lệ chuyển đổi** | Hiển thị **hai** chỉ số: Lead → Cơ hội, và Lead → Đơn hàng. Mẫu số là **lead hợp lệ tạo trong kỳ**; tử số là lead đó đã chuyển đổi (tính cả khi chuyển sau kỳ) |
| **Doanh số** (mặc định trong báo cáo) | Giá trị **trước VAT** của **đơn hàng đã xác nhận**, tính theo **ngày xác nhận đơn** |
| **Thực thu** | Số tiền khách đã thanh toán, theo ngày thu |
| **Giá trị pipeline** | Tổng giá trị cơ hội đang mở; **dự báo** = giá trị × xác suất giai đoạn |
| **Ghi nhận nguồn** | Mặc định **nguồn đầu tiên** (lượt gửi tạo ra khách hàng). Báo cáo có nút chuyển sang **nguồn gần nhất** trước khi tạo cơ hội. Hệ thống lưu cả hai |
| **Thời gian nhận lead** | Từ lúc đề xuất đến lúc bấm Nhận, **chỉ tính phút làm việc** |
| **Thời gian liên hệ đầu tiên** | Từ lúc nhận đến hoạt động liên hệ đầu tiên, chỉ tính phút làm việc |
| **Lead bỏ lỡ** | Lượt đề xuất bị Từ chối hoặc Hết hạn (tính riêng từng loại) |
| **Cơ hội đứng yên** | Không đổi giai đoạn **và** không có hoạt động trong **14 ngày** (chỉnh riêng từng giai đoạn **[CH]**) |
| **KPI khi chuyển sale** | Chỉ số phản hồi lead thuộc người được đề xuất. **Doanh số thuộc người phụ trách tại thời điểm xác nhận đơn**. Lịch sử chuyển giao vẫn lưu để Quản lý điều chỉnh thủ công nếu cần |
| **Kỳ báo cáo** | Theo ngày giờ Việt Nam; tuần bắt đầu thứ Hai |

### 10.2 Báo cáo

| Báo cáo | Nội dung |
|---|---|
| **Hiệu quả nguồn marketing** | Lead, lead hợp lệ, tỷ lệ chuyển đổi, doanh số theo nguồn/chiến dịch/form |
| **KPI từng sale** | Thời gian nhận, thời gian liên hệ, lead bỏ lỡ, số hoạt động, số báo giá, tỷ lệ thắng, doanh số so với chỉ tiêu |
| **Pipeline & dự báo** | Giá trị theo giai đoạn, dự báo doanh số, cơ hội đứng yên |

Mỗi con số trong báo cáo có chú thích cách tính (lấy từ bảng 10.1).

---

## 11. Tích hợp & giám sát

- Trang **Tích hợp**: trạng thái từng kết nối (Facebook, Zalo, form, email), lần nhận gần nhất, số sự kiện lỗi.
- Danh sách sự kiện lỗi: xem nội dung gốc, thông báo lỗi, số lần thử; nút **Xử lý lại** (một hoặc nhiều sự kiện) – vẫn tuân theo chống trùng mục 3.4.
- Cảnh báo cho Admin khi token Facebook/Zalo sắp hết hạn hoặc một nguồn không có dữ liệu bất thường (ví dụ 24 giờ).

---

## 12. Bảo mật & dữ liệu cá nhân

- Đăng nhập email + mật khẩu, tuỳ chọn 2FA; tự đăng xuất khi không hoạt động.
- **Nhật ký đăng nhập:** thời điểm, IP, thiết bị, thành công/thất bại; khoá tạm sau 5 lần sai.
- **Quản lý phiên:** xem các thiết bị đang đăng nhập, đăng xuất từ xa; Admin đăng xuất mọi phiên của một người.
- **Nhật ký thao tác (audit log):** xem SĐT đầy đủ, xuất file, giao lại, hợp nhất/tách, xoá/khôi phục, sửa giá, duyệt, đổi quyền. Không ai sửa hoặc xoá được nhật ký.
- **Thùng rác:** xoá mềm, khôi phục trong 30 ngày.
- **Xuất dữ liệu một khách hàng:** gom hồ sơ, lượt gửi, hoạt động, báo giá, đơn hàng, file thành một file ZIP (JSON + PDF) khi khách yêu cầu theo Nghị định 13/2023.
- Sao lưu tự động hằng ngày.

---

## 13. Yêu cầu phi chức năng

- Tìm kiếm < 1 giây với 100.000 khách hàng.
- Chia lead: sale nhận thông báo trong vòng 1 phút kể từ khi lead vào.
- Giao diện dùng tốt ở màn hình điện thoại 375px.

---

## 14. Công nghệ

| Lớp | Lựa chọn |
|---|---|
| Web app | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui |
| CSDL, đăng nhập, file | Supabase (PostgreSQL, Auth, Storage) |
| Phân quyền dữ liệu | Row Level Security |
| Chia lead, chống trùng, duyệt | Hàm PostgreSQL (chạy trong giao dịch, có khoá dòng) |
| So khớp tên gần đúng | Tiện ích `pg_trgm` + `unaccent` |
| Hẹn giờ (hết hạn, nhắc, thử lại) | Supabase Cron chạy mỗi phút |
| Webhook, form nhúng | Next.js API routes |
| PDF báo giá | `@react-pdf/renderer` |
| Hosting / mã nguồn | Vercel / GitHub |

**Hosting:** dùng **Vercel** trong giai đoạn phát triển và chạy thử; khi cần sẽ chuyển sang **hosting cPanel riêng** (nếu có "Setup Node.js App", Node ≥ 20, SSH, RAM ≥ 1–2 GB). Email và tên miền dùng cPanel ngay từ đầu.

Để chuyển hosting dễ dàng, code phải tuân thủ:
- Next.js cấu hình `output: 'standalone'`.
- **Không** dùng tính năng riêng của Vercel: Vercel Cron, Vercel Blob/KV/Postgres, Edge Config, Edge runtime. Hẹn giờ dùng Supabase Cron, file dùng Supabase Storage.
- Mọi cấu hình qua biến môi trường.

---

## 15. Lộ trình

Mỗi bước: làm → chạy thử → commit → sang bước tiếp.

| Bước | Nội dung |
|---|---|
| **0** | Tạo GitHub, Supabase, Vercel; khởi tạo dự án; viết `CLAUDE.md` |
| **1** | Đăng nhập, người dùng, vai trò, nhóm, kênh; nhật ký đăng nhập |
| **2** | Khách hàng, lead, lượt gửi, chuẩn hoá SĐT/email/MST, nhập tay, import Excel |
| **3** | Phân quyền RLS + che thông tin + audit log |
| **4** | Chống trùng 3 mức, hàng chờ xác nhận, hợp nhất/tách |
| **5** | Lịch làm việc, nghỉ phép, tạm ngừng; chia lead + từ chối + hết hạn + nhật ký |
| **6** | Pipeline, cơ hội, hoạt động, người theo dõi, thẻ, lịch sử người phụ trách |
| **7** | Việc, nhắc tự động, thông báo trong app, tìm kiếm, bộ lọc đã lưu, danh sách làm việc |
| — | **MVP – cho đội dùng thử** |
| **8** | Trình tạo form + mã nhúng; webhook CF7; bảng `webhook_events` + chống trùng |
| **9** | Facebook, Zalo; thông báo Zalo có thử lại; trang Tích hợp |
| **10** | Sản phẩm, báo giá, duyệt nhiều cấp, hộp duyệt chung, PDF |
| **11** | Đơn hàng, thanh toán, sau bán; thao tác hàng loạt |
| **12** | Báo cáo & KPI theo mục 10.1; xuất dữ liệu khách hàng |

---

## 15b. Giai đoạn mở rộng – tiệm cận Getfly CRM (đề xuất, chờ xác nhận)

So sánh ngày 17/09/2026 với các tính năng Getfly công bố trên getfly.vn. Chỉ chọn nhóm phù hợp B2B bán bơm/PCCC.

| Bước | Tính năng | Nội dung chính | Ưu tiên |
|---|---|---|---|
| **13** | **Hộp thư hợp nhất (Social CRM)** | Xem và **trả lời** tin nhắn Facebook Fanpage + Zalo OA ngay trong CRM, gắn vào hồ sơ khách; mẫu câu trả lời nhanh | Cao |
| **14** | **Tổng đài (IP PBX)** | Bấm gọi từ CRM (click-to-call), hiện thông tin khách khi có cuộc gọi đến, tự ghi hoạt động + link ghi âm; kết nối qua API nhà cung cấp tổng đài | Cao |
| **15** | **Chiến dịch & chăm sóc tự động** | Quản lý chiến dịch (chi phí, lead, doanh số → ROI); kịch bản tự động: *điều kiện → chờ → gửi Email/ZNS → rẽ nhánh*; gửi email hàng loạt theo phân khúc, có huỷ đăng ký | Cao |
| **16** | **Hợp đồng bán** | Hợp đồng từ báo giá/đơn, trạng thái, file ký, tiến độ thanh toán, nhắc gia hạn/hết hạn | Trung bình |
| **17** | **Bảo hành & phiếu hỗ trợ (ticket)** | Tiếp nhận yêu cầu bảo hành/khiếu nại, phân công kỹ thuật, theo dõi tiến độ sửa chữa, hạn xử lý (SLA), lịch sử dịch vụ theo thiết bị/serial | Trung bình |
| **18** | **Check-in gặp khách & tuyến viếng thăm** | Sale check-in GPS + ảnh tại công trình/đại lý; lập tuyến viếng thăm định kỳ | Trung bình |
| **19** | **KPI mở rộng** | Bộ chỉ tiêu nhiều chỉ số (cuộc gọi, lượt gặp, báo giá, doanh số, lead chiến dịch) theo người/phòng ban, có mẫu sẵn | Trung bình |
| **20** | **Công nợ phải thu** | Tuổi nợ, nhắc thu, báo cáo công nợ theo khách/sale | Trung bình |
| **21** | **Landing page đơn giản** | Trang đích dựng từ mẫu + form CRM, tên miền riêng | Thấp |
| **22** | **Kho đơn giản** | Tồn kho, xuất kho theo đơn hàng | Thấp |
| **23** | **API mở & webhook ra** | Cho hệ thống khác (kế toán, website) đọc/ghi dữ liệu có khoá API | Thấp |
| **24** | **Trợ lý AI** | Tóm tắt lịch sử khách, gợi ý việc tiếp theo, chấm điểm lead, soạn tin nhắn | Thấp |

**Không làm (không phù hợp mô hình):** bán lẻ POS, tích điểm thành viên, nhân sự/chấm công/lương, mạng xã hội nội bộ, quản lý mua hàng.

## 16. Mẹo vibe code với Claude

- Đầu mỗi phiên: đưa SPEC này + `CLAUDE.md`.
- Mỗi lần một bước nhỏ; yêu cầu Claude viết **file migration SQL** cho mọi thay đổi CSDL.
- Với chia lead, chống trùng, tính tiền: yêu cầu Claude **viết test** cho từng tình huống ở mục 5.5, 4.2, 7.4 trước khi viết giao diện.
- Không đưa khoá bí mật vào code; dùng biến môi trường.
- Tạo dữ liệu mẫu: 2 nhóm, 6 sale, vài chục khách, có sẵn bản ghi trùng để thử.

---

## 17. Quyết định đã chốt & việc để sau

**Đã xác nhận (15/09/2026):**

1. Khách cũ quay lại (tương tác trong 180 ngày) → giao thẳng sale cũ; thông báo cho sale cũ và Trưởng nhóm biết khách cũ đăng ký lại.
2. Hạn mức ngày tính lead đã nhận + đang chờ.
3. Doanh số ghi nhận theo đơn hàng đã xác nhận; nguồn mặc định là nguồn đầu tiên.
4. Biên lợi nhuận tối thiểu 10%.
5. Hàng chờ "có khả năng trùng" quá 4 giờ làm việc → tự tạo mới và chia lead.

Các mục **[ĐX]** còn lại trong tài liệu dùng làm mặc định khi phát triển; đều chỉnh được trong Quản trị.

**Việc để sau:** mẫu báo giá chính thức (trước bước 10), kết nối phần mềm kế toán.

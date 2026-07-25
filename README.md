# QuizPrep — Ôn thi FE

Web ôn tập trắc nghiệm nhiều môn. Chọn môn ở dropdown góc trên. Câu đề thi FE SP26 (chép từ ảnh, đáp án do AI giải) gắn nhãn ⚠ chưa verify để phân biệt với câu có đáp án gốc.

- **DAT301m — Deep Learning:** 172 câu (122 gốc + 50 đề FE) + 80 câu luyện lý thuyết.
- **DBM302m — Data Mining:** 247 câu (197 gốc từ 4 file + 50 đề FE) + 80 câu luyện lý thuyết.

Mỗi môn đều có tab Lý thuyết và bộ lọc chủ đề riêng (tự động theo dữ liệu môn).

## Chạy app

```bash
cd quiz-app
npm install
npm run dev
```

Mở địa chỉ hiện ra (mặc định http://localhost:5173).

Không muốn cài npm? Bản build sẵn nằm trong `dist/` — chạy `npx serve dist` hoặc bất kỳ static server nào (không mở trực tiếp file `index.html` vì trình duyệt chặn fetch JSON).

## 4 chế độ

- **Practice** — làm từng câu, hiện đáp án + giải thích ngay khi chọn.
- **Thi thử** — chọn số câu & thời gian, có đồng hồ đếm ngược, nộp bài mới hiện điểm + review từng câu.
- **Flashcard** — lật thẻ học thuộc, đánh dấu "Đã thuộc".
- **Ôn câu sai** — tự gom các câu bạn làm sai; trả lời đúng 2 lần liên tiếp thì câu đó thoát danh sách.

Lọc theo chủ đề (ML Basics / Computer Vision / NLP / Time Series) ở trang chính. Tiến độ lưu trong localStorage của trình duyệt.

## Thêm môn mới

1. Tạo file `public/data/<mã môn>.json` theo cấu trúc:

```json
{
  "id": "xxx123",
  "name": "XXX123 — Tên môn",
  "description": "Mô tả ngắn",
  "questions": [
    {
      "id": "xxx123-1",
      "question": "...?",
      "options": ["A...", "B...", "C...", "D..."],
      "answers": [0],
      "explanation": "Vì sao đáp án đúng...",
      "hint": "Mẹo ghi nhớ (hiện khi ấn H)",
      "topic": "Tên chủ đề",
      "verified": true,
      "source": "md1",
      "origNum": 1
    }
  ]
}
```

`answers` là mảng chỉ số (0 = A) — nhiều phần tử nếu câu nhiều đáp án. `verified: false` sẽ hiện nhãn ⚠.

2. Thêm 1 mục vào `public/data/subjects.json`:

```json
{ "id": "xxx123", "name": "XXX123 — Tên môn", "description": "…", "file": "data/xxx123.json" }
```

App tự hiện dropdown chọn môn khi có từ 2 môn trở lên.

## Phím tắt

- **1–4** (theo số đáp án): chọn đáp án — Practice & Thi thử
- **Enter**: kiểm tra (câu nhiều đáp án) / sang câu tiếp — Practice
- **←/→**: chuyển câu (Thi thử) / chuyển thẻ (Flashcard)
- **Space/Enter**: lật thẻ Flashcard · **K**: đánh dấu đã thuộc
- **H**: hiện/ẩn 💡 Mẹo ghi nhớ (mỗi câu đều có, tiếng Việt)

## Tài liệu học hiểu

Xem `../DAT301m_LyThuyet.md` — tổng hợp lý thuyết 4 chương + mẹo nhận diện bẫy đề, để tự xử lý các câu không có trong ngân hàng.

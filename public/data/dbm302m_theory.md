# DBM302m — Tổng hợp lý thuyết (Data Mining)

> Tài liệu ôn thi trắc nghiệm. Giải thích bằng tiếng Việt, giữ nguyên thuật ngữ tiếng Anh và công thức (đề thi bằng tiếng Anh). Học để hiểu bản chất, không học vẹt đáp án — vì đề có thể đổi số liệu.

**Công thức lõi phải thuộc:**
- support(A) = count(A) / N
- confidence(A ⇒ B) = support(A ∪ B) / support(A)
- lift(A, B) = confidence(A ⇒ B) / support(B) = P(A,B) / (P(A)·P(B))
- χ² = Σ (O − E)² / E, với E = (row total × column total) / grand total
- Euclidean = √(Σ(xᵢ − yᵢ)²); Manhattan = Σ|xᵢ − yᵢ|; Chebyshev/supremum = maxᵢ|xᵢ − yᵢ|; Minkowski(h) = (Σ|xᵢ − yᵢ|ʰ)^(1/h)
- cosine(A,B) = (A·B) / (‖A‖·‖B‖)
- z-score = (x − mean) / std; min-max = (x − min) / (max − min)

---

## 1. Data Visualization

### 1.1 Ba loại visualization (rất hay hỏi)
- **Interactive visualization**: bạn TỰ khám phá data để trả lời câu hỏi CÁ NHÂN của mình (tự filter, zoom, hover). Người dùng chủ động điều tra.
- **Presentation visualization**: trình bày MỘT CHIỀU, tĩnh, chia sẻ kết quả đã hoàn tất (ví dụ slide show cho đồng nghiệp). Không cho người xem tương tác đào sâu.
- **Interactive storytelling**: kết hợp một câu chuyện/góc nhìn ĐÃ CHUẨN BỊ SẴN + cho phép người xem TỰ đào sâu thêm. Vừa kể chuyện vừa cho khám phá.

> **Bẫy:** Trang web nhúng viz cho người xem "tự khám phá data bạn đã chuẩn bị" — nếu chỉ khám phá thuần → Interactive visualization; nếu có narrative dựng sẵn + khám phá → Interactive storytelling. Đọc kỹ chữ "prepared/curated narrative".

### 1.2 Graphics pipeline
Thứ tự xử lý: **Vertex processing → Rasterization → Pixel (fragment) processing**.
- Vertex: xử lý hình học (đỉnh, tọa độ).
- Rasterization: biến hình học thành các fragment/pixel.
- Pixel processing: tô màu cho từng pixel.
> Nhớ: hình học trước, tô màu sau. Đừng nhầm thứ tự.

### 1.3 Perception (tri giác con người)
- **Working memory (short-term memory)** chứa được khoảng **3–7 items** (luật Miller 7±2).
- **Simultaneous contrast**: một ô xám sáng đặt trên nền tối SẼ TRÔNG SÁNG HƠN (brighter) so với đặt trên nền trắng. Nền càng tối → ô càng có vẻ sáng.
- KHÔNG nên nhìn cố định một điểm suốt quá trình — hệ thị giác sẽ bị "đánh lừa" (fading, afterimage). Nên để mắt di chuyển.
- **Màu Blue khó lấy nét nhất**: mắt có ít blue cones + chromatic aberration khiến xanh dương hội tụ khác vị trí. Tránh dùng blue cho chi tiết mảnh/chữ nhỏ.

### 1.4 Pre-attentive attributes & màu sắc
- Pre-attentive: các thuộc tính não nhận ra tức thì (<250ms) không cần tập trung: màu (hue), kích thước, hướng, vị trí, độ dài.
- Effective visualization cần: **clear labeling**, **appropriate chart type**, **minimal distortion of data**. Tránh **random color** (giảm rõ ràng).

### 1.5 3-D depth cues
- **Occlusion (che khuất)**: cue MẠNH NHẤT và đáng tin nhất (vật A che vật B ⇒ A ở trước).
- **Illumination / shading**: cho biết **surface orientation** (hướng bề mặt so với nguồn sáng).
- Các cue khác: **stereopsis** (hai mắt), **shadowing** (bóng đổ), lighting.
> Bẫy hay gặp: "strongest cue" = Occlusion; "surface orientation" = Illumination/shading.

### 1.6 Reasoning
- **Deductive**: áp quy luật CHUNG (đồ thị/mô hình) vào trường hợp CỤ THỂ của bạn (ví dụ tra life expectancy theo nước + năm sinh rồi kết luận cho bản thân).
- **Inductive**: từ nhiều ví dụ cụ thể → khái quát thành quy luật.
- **Abductive**: suy ra lời giải thích khả dĩ nhất cho quan sát.

### 1.7 Shneiderman's Information Visualization Mantra
Trình tự: **Overview first → Zoom → Filter → Details-on-demand**.
- **Overview**: hiện TẤT CẢ data với biểu diễn ĐƠN GIẢN, trục trải rộng để lộ cấu trúc tổng thể (không nhồi chi tiết, không chỉ hiện subset).
- **Zoom** (vùng zoom lấp đầy màn hình): vừa là một phần của mantra, vừa cung cấp focus, vừa thực chất là **filter trên display coordinates** → đáp án "All of the above".
- **Filter**: hiển thị một **subset** của data (KHÔNG phải làm mượt nhiễu, KHÔNG phải loại outlier).
- **Details-on-demand**: chỉ xem chi tiết khi cần.

### 1.8 Fisheye lens (focus + context)
- Lợi ích thật: (1) focus vào chi tiết mà VẪN thấy context xung quanh; (2) zoom mà KHÔNG che dữ liệu chưa zoom.
- Lợi ích **ÍT quan trọng nhất**: "làm data trông thú vị hơn" (chỉ là thẩm mỹ).

### 1.9 Histogram, rollup, axis
- **Histogram**: chia MỘT biến thành các bin (range) rồi **đếm** số phần tử trong mỗi bin. VD data (x,y,b): histogram tốt = chia brightness b thành range, đếm số pixel mỗi range.
- **Rollup (aggregate)**: gộp bỏ (các) chiều. Rollup cả x và y của ảnh → còn lại một giá trị tổng hợp: **average brightness** của cả ảnh.
- **Axis để mỗi (x,y) có vị trí DUY NHẤT**: dùng **product** (tích x×y) hoặc **nesting** (lồng x dưới y) được; **concatenation** thì KHÔNG cho vị trí duy nhất → không dùng khi cần mỗi pixel một vị trí riêng.

### 1.10 Dashboard & knowledge visualization
- **Dashboard**: ưu tiên số 1 là trình bày ĐỦ thông tin cần thiết để RA QUYẾT ĐỊNH (không phải để "gây hứng thú" hay "chỉ overview đơn giản").
- **Knowledge (result) visualization**: bước trình bày KẾT QUẢ khai phá bằng charts/dashboards/reports.

### 1.11 Chart types
- **Bar chart**: so sánh giữa các **category rời rạc**.
- **Histogram**: phân phối của một biến **liên tục**.
- **Pie chart**: tỉ lệ/proportion của các category so với tổng thể. % = phần/tổng (VD 200/1000 = 20%, 150/600 = 25%).
- **Scatter plot**: quan hệ 2 biến; trend đi lên = positive correlation, đi xuống = negative, rải đều không xu hướng = correlation ~ 0.
- **Scatter plot matrix** + **correlation heatmap**: xem tương quan giữa NHIỀU biến số cùng lúc.
- Correlation coefficient r: gần +1 dương mạnh, gần −1 (VD **−0.85**) âm mạnh, gần 0 yếu.

### Mẹo làm bài — Chương 1
- Câu hỏi loại viz: xác định (a) ai điều khiển, (b) có narrative dựng sẵn không.
- Depth cue mạnh nhất luôn là **Occlusion**; hướng bề mặt luôn là **Illumination/shading**.
- Câu "least important / least relevant" về fisheye → chọn "trông thú vị hơn".
- Với mantra: Zoom-lấp-đầy = "All of the above"; Filter = "display a subset".
- Chart chọn theo mục đích: category → bar; proportion → pie; distribution → histogram; correlation → scatter/heatmap.

---

## 2. Data Preprocessing

### 2.1 Kiểu dữ liệu (attribute types)
- **Nominal**: nhãn không thứ tự (màu, giới tính). **Binary** = nominal 2 giá trị (true/false, 0/1).
- **Ordinal**: có thứ tự nhưng khoảng cách không đo được (small<medium<large).
- **Interval**: có thứ tự + khoảng cách đều, KHÔNG có mốc 0 tuyệt đối (nhiệt độ °C, năm).
- **Ratio**: có mốc 0 thật, tỉ số có nghĩa (cân nặng, chiều cao, thu nhập, count).

### 2.2 Distance / similarity measures
Cho hai điểm, differences dᵢ = |xᵢ − yᵢ|:
- **Manhattan (L1)** = Σ dᵢ. VD (0,3)&(4,0): 4+3 = 7. Iris (4.9,3.0,1.4,0.2)&(5.6,2.5,3.9,1.1): 0.7+0.5+2.5+0.9 = **4.6**.
- **Euclidean (L2)** = √(Σ dᵢ²). Iris trên: √(0.49+0.25+6.25+0.81)=√7.8 ≈ **2.8**.
- **Chebyshev / supremum (L∞)** = max dᵢ. Iris trên: max(0.7,0.5,2.5,0.9) = **2.5**.
- **Minkowski (Lh)** = (Σ dᵢʰ)^(1/h). h=1→Manhattan, h=2→Euclidean, h→∞→Chebyshev. VD (22,1,42,10)&(20,0,36,8), h=3: diff 2,1,6,2 → (8+1+216+8)^(1/3)=233^(1/3) ≈ **6.1534**.

### 2.3 Cosine similarity
- cos(A,B) = A·B / (‖A‖‖B‖) ∈ [−1, 1]. Chỉ phụ thuộc HƯỚNG, không phụ thuộc độ lớn.
- Vector cùng hướng → cos = 1 (gần nhất). VD Q=(0.8,0.6): (16,12)=20·Q cùng hướng → cos=1.
- Vector ngược hướng → cos = −1 (xa nhất). VD (−0.8,−0.6) ngược Q → cos=−1.
- Suy luận: nếu cos(A,B)=1 (B cùng hướng A) và cos(A,C)=−1 (C ngược A) ⇒ cos(B,C) = −1 (xác định được).
- **Bag-of-words cosine**: biểu diễn mỗi text bằng vector đếm từ, tính cos. Chỉ các từ TRÙNG mới đóng góp tử số; chuẩn hóa theo độ dài vector.

### 2.4 Binary distance: symmetric vs asymmetric
Bảng đối chiếu: q = số (1,1), r = số (1,0), s = số (0,1), t = số (0,0).
- **Symmetric binary distance** (0 và 1 quan trọng như nhau) = (r+s) / (q+r+s+t) = số mismatch / tổng tất cả. VD 10 biến, mismatch=4 → **4/10**.
- **Asymmetric binary**: bỏ qua (0,0) vì không mang thông tin.
  - **Jaccard coefficient** (similarity) = q / (q+r+s). VD q=3, mismatch=4 → **3/7**.
  - Asymmetric binary DISTANCE = (r+s) / (q+r+s).
- **Simple matching** cho categorical: distance = số thuộc tính KHÁC / tổng thuộc tính. VD 6 thuộc tính, khác 4 → **2/3**.
- Categorical → one-hot thành nhiều binary: mỗi thuộc tính khác nhau tạo 2 mismatch. VD 6 thuộc tính (21 binary), khác 4 → 8 mismatch → symmetric = **8/21**.

> Bẫy: "symmetric" thì chia cho TỔNG (gồm cả 0-0); "asymmetric/Jaccard" thì BỎ 0-0.

### 2.5 Thống kê mô tả
- **Covariance** Cov(X,Y)=E[XY]−E[X]E[Y]. Nếu Y là hằng số hoặc E[X]=0 và quan hệ đối xứng → có thể = 0. VD X∈{−1,1} đều, Y=X²=1 (hằng): E[X]=0 → Cov=0.
- **Correlation coefficient (Pearson)** = Cov(X,Y)/(σₓσᵧ) ∈ [−1,1]. Tính bằng cách chuẩn hóa covariance.
- **Absolute standard deviation (asd)** = (1/n)·Σ|xᵢ − median|. Tìm median TRƯỚC rồi lấy trung bình độ lệch tuyệt đối. VD 8 lương, median=(69+70)/2=69.5, Σ|diff|=153 → asd=153/8=**19.125**.
- **Skewness (Pearson)** = (mean − mode) / s. Đo độ lệch phân phối.

### 2.6 Normalization
- **Min-max**: x' = (x − min)/(max − min), đưa về [0,1] (hoặc scale sang [new_min, new_max]).
- **Z-score**: x' = (x − mean)/std. VD {200,300,400,600,100}, mean=320 → giá trị lớn nhất 600 cho z lớn nhất.
> Z-score giữ hình dạng phân phối, xử lý outlier tốt hơn min-max.

### 2.7 Dimensionality reduction & sampling
- **PCA** (Principal Component Analysis): giảm chiều bằng cách giữ các thành phần có variance lớn nhất; hay dùng trước khi visualize/cluster high-dimensional data.
- **t-SNE, UMAP**: dimensionality reduction phi tuyến, mạnh cho visualization. (Linear regression KHÔNG phải giảm chiều — nó là dự đoán.)
- Số feature bị loại = ban đầu − còn lại (10−4=6; 40−28=12; 100−45=55).
- **Data acquisition/collection**: bước đầu thu thập raw data từ nhiều nguồn.
- **Data cleaning**: xử lý missing values (bỏ dòng, điền mean/median/mode, dự đoán), noise, trùng lặp. VD bỏ 10% của 2000 mẫu missing → còn 1800.
- **Discretization**: biến liên tục → khoảng rời rạc (binning); clustering có thể hướng dẫn cách binning.
- **Sampling**: chọn tập con đại diện để giảm chi phí.

### Mẹo làm bài — Chương 2
- Thuộc 4 distance cốt lõi: Manhattan (tổng), Euclidean (căn tổng bình phương), Chebyshev (max), Minkowski (căn bậc h).
- Cosine chỉ tính theo hướng → nhân vô hướng chuẩn hóa; cùng hướng=1, ngược=−1.
- Binary: hỏi symmetric → chia tổng; asymmetric/Jaccard → bỏ 0-0.
- Categorical với simple matching → mismatch/tổng thuộc tính.
- z-score cần mean & std; asd cần median.

---

## 3. Frequent Patterns & Association Rules

### 3.1 Support, confidence, lift
- **support(X)** = số transaction chứa X / N (relative) hoặc count (absolute). minsup ví dụ 40% của 5 = 2 transaction; 50% của 5 = 3.
- **confidence(A ⇒ B)** = support(A ∪ B) / support(A). Mẫu số LUÔN là vế trái A.
- **lift(A,B)** = confidence/support(B) = P(A,B)/(P(A)P(B)).
  - lift > 1: tương quan dương (hút nhau); lift = 1: độc lập; lift < 1: tương quan âm (đẩy nhau).

Ví dụ mẫu (Table 1: T1{Beer,Nuts,Diapers}, T2{Beer,Coffee,Diapers,Nuts}, T3{Beer,Diapers,Eggs}, T4{Beer,Nuts,Eggs,Milk}, T5{Nuts,Coffee,Diapers,Eggs,Milk}):
- {Diapers}⇒{Coffee,Nuts}: {Diapers,Coffee,Nuts} ở T2,T5 → support=2/5=**0.4**; Diapers ở 4 transaction → confidence=2/4=**0.5**.
- minsup 40% (=2): {Beer,Nuts,Diapers} ở T1,T2 → frequent length-3.
- minsup 50% (=3): Coffee chỉ 2 lần → KHÔNG frequent.

Ví dụ số học nhanh: 1000 records, A xuất hiện 100 lần, "if A then B" đúng 20 lần → support=20/1000=**2%**, confidence=20/100=**20%**. (A 200 lần, đúng 100 → sup=10%, conf=50%.)

### 3.2 Closed vs Maximal frequent patterns
- **Closed**: KHÔNG có superset nào cùng support. (Lossless — khôi phục được cả pattern lẫn support.)
- **Maximal (max)**: KHÔNG có superset nào còn frequent. (Chỉ giữ pattern, MẤT thông tin support.)
- Quan hệ: **|all frequent| ≥ |closed| ≥ |max|**. Max ⊆ Closed ⊆ All.
- Từ **closed patterns** KHÔI PHỤC được toàn bộ frequent patterns + supports (lossless compression). Từ **max** thì KHÔNG khôi phục được support.
- VD (T1{a1,a2,a3},T2{a2,a3,a4},T3{a1,a3,a4}, minsup=2): {a2} sup=2 nhưng superset {a2,a3} cũng sup=2 → {a2} KHÔNG closed. {a1,a3} sup=2, không superset cùng support → **closed**.
- "Closed nhưng không max" = closed VÀ vẫn có superset frequent (nằm trong pattern lớn nhất).

### 3.3 Apriori
- **Apriori property (anti-monotone)**: mọi tập con của một frequent itemset đều frequent ⇔ nếu một tập không frequent thì mọi superset đều không frequent.
- Candidate generation: ghép các frequent (k−1)-itemset. Từ 4 frequent 1-item → C(4,2)=**6** candidate 2-itemset.
- **Pruning**: candidate bị loại nếu có bất kỳ tập con (k−1) nào KHÔNG frequent. VD F2={ab,ac,bc,be,ce}: candidate "abe" cần "ae" ∉ F2 → **prune** (abc, bce có đủ tập con nên giữ).
- **Partition-based mining**: một itemset là global frequent thì phải là local frequent ở ÍT NHẤT một partition. Cái không xuất hiện ở partition nào → chắc chắn không global frequent.

### 3.4 FP-growth & FP-tree
- FP-growth nén DB vào **FP-tree**, khai phá KHÔNG sinh candidate (nhanh hơn Apriori khi DB lớn).
- Tổng số transaction = tổng count các nhánh con của root.
- **Conditional pattern base** của item = các **prefix path** dẫn tới node của item đó (đọc ngược lên root) kèm count. Từ đó xây conditional FP-tree đệ quy.

### 3.5 Correlation & pattern evaluation
- **Contingency table 2×2**: E (expected) = (row total × column total)/grand total.
- **χ² = Σ (O−E)²/E**. Luôn ≥ 0. Range **[0, +∞)**. χ²=0 ⇔ độc lập (O=E mọi ô). (χ² KHÔNG BAO GIỜ âm → loại ngay đáp án âm.)
  - VD DM/ML: E=400,600,800,1200 → χ²=225+150+112.5+75=**562.5**.
- **lift** cùng bảng: lift(DM,ML)=(700/3000)/((1200/3000)(1000/3000))=**7/4=1.75** (>1 → dương). Nếu O=E mọi ô → lift=**1** (độc lập).
- Observed < Expected → lift < 1; Observed > Expected → lift > 1.

### 3.6 Null-invariant measures (rất hay hỏi)
- **Null-invariant** = không bị ảnh hưởng bởi số transaction "null" (không chứa cả A lẫn B).
- Null-invariant: **all-confidence, max-confidence, Kulczynski, cosine, Jaccard(all-conf họ)**.
- KHÔNG null-invariant: **lift** và **χ²** (bị bóp méo khi số null lớn).
- **Kulczynski(A,B)** = ½·(P(A|B) + P(B|A)) = ½·(sup(A∪B)/sup(B) + sup(A∪B)/sup(A)). Range **[0, 1]**.
- Khi có RẤT NHIỀU null transaction (VD DBLP co-author: null ≈ 2.7×10⁶) → chỉ **Kulczynski** (null-invariant) phản ánh đúng, lift/χ² sai lệch.
- Hai siêu thị có AB, A¬B, ¬AB giống nhau, chỉ khác số null: **confidence bằng nhau** (null-invariant) nhưng **χ² khác nhau** (không null-invariant).

### 3.7 Negative patterns
- **Support-based negative**: P(A,B) << P(A)·P(B). (So sánh sup thực với kỳ vọng độc lập.)
- **Null-invariant negative**: Kulczynski = ½(P(A|B)+P(B|A)) < ε.
- VD 10⁹ tổng, A=10⁶, B=10⁴, AB=10²: P(A,B)=10⁻⁷ > P(A)P(B)=10⁻⁸ → KHÔNG negative theo support-based; nhưng Kulczynski=(10⁻²+10⁻⁴)/2=0.00505 < 0.01 → negative theo null-invariant. ⇒ "negative CHỈ theo null-invariant".
- VD beer&frying pans: Kulc=½(600/10000+600/5000)=0.09 <0.1 → negative với ε=0.1.
- VD eggs&bacon: Kulc=½(2000/10000+2000/5000)=0.3 → ε nhỏ nhất để negative (>0.3) là 0.5.

### 3.8 Ràng buộc (constraints)
- **Anti-monotone**: thêm item vào itemset không cứu được vi phạm. VD `range(S.price) < 10`, `sum(S.price) > 25` (với giá dương thì sum tăng — cần đọc kỹ), `support ≥ minsup`. Chuẩn nhất trong đề: **range(S.price) < 10** (thêm item chỉ làm range ≥, đã vi phạm là mãi vi phạm).
- **Monotone**: một khi thỏa thì thêm item vẫn thỏa.

### 3.9 Ràng buộc support giữa các itemset
- Biết sup{a,b} KHÔNG ràng buộc sup{a,c} → sup{a,c} có thể bằng bất kỳ giá trị hợp lệ (9, 10, 11...).
- confidence(A⇒B) không tính được nếu thiếu support(A) (mẫu số).

### Mẹo làm bài — Chương 3
- χ² và mọi (O−E)²/E: luôn ≥ 0 → gạch đáp án âm ngay.
- lift: so O với E (E=row×col/N). O>E → lift>1; O=E → lift=1.
- "Nhiều null" hoặc "so sánh hai bảng khác null" → dùng null-invariant (Kulczynski, cosine). Lift/χ² sai.
- Kulczynski ∈ [0,1]; χ² ∈ [0,∞); lift ∈ [0,∞).
- closed ≥ max về "chặt", nhưng SỐ LƯỢNG: all ≥ closed ≥ max. Chỉ closed khôi phục được support.
- Apriori prune: kiểm tra MỌI tập con (k−1) có frequent không.

---

## 4. Classification

### 4.1 Khái niệm
- **Classification = supervised learning**: học từ data ĐÃ GÁN NHÃN để gán nhãn lớp đã biết. VD phân loại email spam/ham → True (là classification).
- Khác clustering (unsupervised, không nhãn).

### 4.2 Train / Validation / Test split
- Chia data: training (huấn luyện), validation (chỉnh hyperparameter), test (đánh giá cuối).
- VD 1000 records, 400 dùng cho validation+test → training = **600**.
- Tỉ lệ lớp: 300/500 thuộc class A → **60%**.

### 4.3 Decision Trees
- Chia đệ quy theo thuộc tính "tốt nhất" để tách lớp.
- **Information Gain** = Entropy(cha) − Σ (nᵢ/n)·Entropy(con). Chọn thuộc tính có gain LỚN NHẤT. Entropy = −Σ pᵢ log₂ pᵢ.
- **Gini index** = 1 − Σ pᵢ². Chọn split có Gini (weighted) NHỎ NHẤT. Gini=0 ⇔ node thuần khiết.
- ID3/C4.5 dùng info gain / gain ratio; CART dùng Gini.

### 4.4 Bayes / Naïve Bayes
- Bayes: P(C|X) = P(X|C)·P(C) / P(X).
- **Naïve Bayes**: giả định các feature ĐỘC LẬP có điều kiện khi biết lớp → P(X|C)=Πⱼ P(xⱼ|C). Chọn lớp có P(C|X) lớn nhất. Nhanh, hiệu quả kể cả khi giả định độc lập không hoàn hảo.

### 4.5 k-NN (k-Nearest Neighbors)
- Lazy learner: không "học" mô hình; khi dự đoán, tìm k điểm gần nhất và vote nhãn đa số.
- Nhạy với chọn k và scale feature (nên normalize trước).

### 4.6 SVM (Support Vector Machine)
- Tìm **hyperplane** tách lớp với **margin lớn nhất**; các điểm biên = support vectors.
- **Kernel trick** (linear, polynomial, RBF) xử lý dữ liệu không tách tuyến tính.

### 4.7 Đánh giá (evaluation)
- **Confusion matrix**: TP, FP, FN, TN.
- **Accuracy** = (TP+TN)/tổng.
- **Precision** = TP/(TP+FP) — trong số dự đoán dương, bao nhiêu đúng.
- **Recall (sensitivity)** = TP/(TP+FN) — trong số thực dương, bắt được bao nhiêu.
- **F1** = 2·(precision·recall)/(precision+recall).

### 4.8 Overfitting
- Model học cả nhiễu của training → train tốt, test kém.
- Khắc phục: pruning (tree), regularization, thêm data, cross-validation, giảm độ phức tạp.

### Mẹo làm bài — Chương 4
- "Gán vào lớp đã biết / có nhãn" = classification (supervised).
- Info gain: chọn MAX; Gini: chọn MIN (weighted).
- Precision ↔ mẫu số có FP; Recall ↔ mẫu số có FN.
- SVM = maximize margin; support vectors = điểm sát biên.

---

## 5. Clustering

### 5.1 Bản chất
- **Clustering = unsupervised**: KHÔNG cần labels.
- Có thể dùng làm **preprocessing cho classification** (binning feature liên tục, giảm sparsity, feature engineering).
- Yêu cầu chung: cần similarity measure; xử lý được mixed attribute types; có thể đưa user preference vào. KHÔNG phải mọi thuật toán đều cần biết trước số cluster (DBSCAN, hierarchical thì không).
- Cluster tốt: **high intra-cluster similarity**, **low inter-cluster similarity**, ranh giới rõ. Random assignment / noise cao = xấu.

### 5.2 Partitioning
- **K-means**:
  - Centroid mới = **mean** (trung bình cộng tọa độ) các điểm trong cluster. VD {(-1,3),(-3,1),(-2,-1)} → ((-6)/3,(3)/3)=(-2,1).
  - Gán mỗi điểm vào centroid GẦN NHẤT (Euclidean).
  - SSE = Σ (khoảng cách)² tới centroid. Đặt center = mean → **SSE KHÔNG BAO GIỜ tăng** sau mỗi bước cập nhật.
  - Chỉ đảm bảo **local minimum**, KHÔNG global. Kết quả phụ thuộc khởi tạo.
  - Init khác nhau KHÔNG luôn cho kết quả khác nhau (có thể hội tụ giống nhau).
  - SSE giảm sau update = clustering đang tốt lên.
- **K-medoids**: center (**medoid**) LUÔN là một data point thực trong cluster (bền với outlier hơn). PAM là thuật toán tiêu biểu.
- **K-median**: center = **median từng chiều**, KHÔNG nhất thiết là data point. VD x:{1,1,-2}→1, y:{-3,1,2}→1 ⇒ (1,1).
- **K-means++**: init thông minh — chọn centroid tiếp theo là điểm XA nhất (theo bình phương khoảng cách) so với các centroid đã chọn. VD từ (0,0): (-2,1)=5,(3,0)=9,(0,2)=4,(2,0)=4 → chọn (3,0).

### 5.3 Hierarchical clustering
- **Agglomerative (AGNES)**: bottom-up, gộp dần cặp cluster gần nhất đến khi còn 1. **Divisive (DIANA)**: top-down, chia dần.
- **Linkage (khoảng cách giữa 2 cluster)**:
  - **Single link** = min khoảng cách giữa 2 điểm bất kỳ (dễ tạo chuỗi).
  - **Complete link** = MAX khoảng cách (diameter); gộp cặp có max-distance NHỎ NHẤT.
  - **Average link** = trung bình mọi cặp.
- **BIRCH**: dùng **CF-tree** (Clustering Feature). Leaf entry (sub-cluster) TÁCH khi **diameter vượt ngưỡng T** (KHÔNG phải khi đếm số điểm). Nhạy với **thứ tự chèn** data; thiên về cluster hình cầu.
- **CURE**: dùng NHIỀU representative points/cluster → bắt được cluster hình dạng bất thường, bền outlier.
- **CHAMELEON**: dynamic modeling, tự XÂY dựng **kNN graph** bên trong (không cần graph làm input); bắt cluster hình dạng phức tạp.
> CURE & CHAMELEON bắt cluster irregular tốt HƠN BIRCH.
- **Probabilistic hierarchical clustering**: là **generative model** (data sinh từ cơ chế nào đó). Chất lượng clustering = TÍCH likelihood các cluster. Gộp 2 cluster khi làm TĂNG likelihood (distance định nghĩa < 0). Câu "merge khi distance > 0" là SAI.

### 5.4 Generative model / MLE Gaussian
- MLE tìm tham số tối đa likelihood: **μ = mean mẫu**, **σ = std mẫu**.
- Chiến lược chọn đáp án: chọn μ đúng (mean) TRƯỚC, rồi σ gần std nhất; σ=0 luôn vô nghĩa.
  - D={-4,5,14}: μ=5, σ=√(162/3)≈7.35 → chọn (μ=5, σ=9).
  - D={-5,5,15}: μ=5, σ≈8.16 → (μ=5, σ=10).
  - D={-1,0,1}: μ=0, σ≈0.82 → (μ=0, σ=1).
- **SOM (Kohonen self-organizing map)**: mạng neural unsupervised, ánh xạ external signal space vào internal representation (giảm chiều, hỗ trợ classification/visualization).
- **GMM (Gaussian Mixture Model)**: model-based clustering (soft assignment).

### 5.5 Density-based
- **DBSCAN**: dựa mật độ, tìm cluster **hình dạng bất kỳ** và nhận **noise/outlier**. Tham số: ε (bán kính), MinPts.
  - **Directly density-reachable**: p trong ε-neighborhood của core point q.
  - **Density-reachable**: chuỗi directly density-reachable. Direct là TRƯỜNG HỢP ĐẶC BIỆT của density-reachable → p directly density-reachable từ q ⇒ p density-reachable từ q. Quan hệ KHÔNG đối xứng.
- **OPTICS**: mở rộng DBSCAN, tạo **reachability plot**. Cluster = các "thung lũng (valley)" nằm DƯỚI đường ngưỡng. Đổi ngưỡng → số cluster khác nhau (phân cấp) → "all of the above" có thể đúng.
- **Mean Shift**: cũng là density-based.

### 5.6 Đánh giá clustering
- **External measure** (CẦN ground-truth): purity, NMI, Jaccard coefficient, F-measure, conditional entropy, maximum matching, false positive/negative.
- **Internal measure** (KHÔNG cần ground-truth, dùng chính data/đồ thị): **Modularity**, **Normalized Cut** (cần weights giữa các đỉnh), **Silhouette coefficient**, SSE, Beta-CV.
- **Relative measure** (so sánh nhiều clustering để chọn k): Silhouette coefficient.
- **Purity** = Σ (max count mỗi cluster) / N. VD hàng max 40,30,50 /200 = 120/200 = **0.6**.
- **Maximum matching** = gán 1-1 cluster↔class tối đa tổng đồng thuận (assignment problem), chia N. VD 120/200 = **0.6**.
- **NMI** = 1.0 khi clustering TRÙNG KHỚP hoàn toàn ground-truth.
- **Cặp điểm (A,B)**:
  - Cùng cluster + cùng nhãn thật = **True Positive**.
  - Cùng cluster + khác nhãn thật = **False Positive**.
  - Khác cluster + cùng nhãn thật = False Negative.
  - Khác cluster + khác nhãn thật = True Negative.
- **Silhouette coefficient**: đo compactness (trong cluster) vs separation (giữa cluster), ∈ [−1,1], càng gần 1 càng tốt.

### Mẹo làm bài — Chương 5
- Centroid k-means = mean; k-medoids = data point thật; k-median = median từng chiều.
- k-means++ = chọn điểm XA nhất (bình phương khoảng cách).
- BIRCH tách theo DIAMETER, nhạy thứ tự chèn; CURE/CHAMELEON bắt hình dạng lạ.
- Cần ground-truth = external (purity, NMI, Jaccard...); không cần = internal (modularity, silhouette, normalized cut).
- DBSCAN/OPTICS/Agglomerative KHÔNG cần k trước; K-means CẦN k.
- MLE Gaussian: μ=mean, σ=std, σ≠0.

---

## 6. Advanced Mining

### 6.1 Sequential pattern mining
- **Sequence** = danh sách CÓ THỨ TỰ các element; mỗi element (trong ngoặc) là một itemset. VD <a(bf)> = 'a' rồi element chứa cả b và f.
- **Subsequence**: giữ thứ tự; item trong cùng ngoặc phải nằm cùng một element. minsup = số sequence chứa subsequence đó.
  - VD kiểm tra <a(bf)> có trong cả 4 sequence → frequent.
  - <aa(bc)> cần a, a rồi (bc) cùng element phía sau — nếu không sequence nào có → KHÔNG phải subsequence.
- **Apriori cho sequence**: length-3 chỉ frequent nếu MỌI length-2 con đều frequent. Nếu chỉ <ab>,<ac>,<bc> frequent thì chỉ **<abc>** có thể frequent.
- **Thuật toán**:
  - **GSP**: Apriori-based cho sequence (candidate generation + prune).
  - **SPADE**: **vertical format**, dùng **id-list** = danh sách (SID, EID) — sequence id + event id nơi item xuất hiện. Đếm event ID cẩn thận khi item đứng riêng hay trong ngoặc.
  - **PrefixSpan**: pattern-growth, dùng **projected database**. `<a>-projected database` = các **suffix** SAU lần xuất hiện ĐẦU TIÊN của 'a' trong mỗi sequence. Dùng `_` để đánh dấu item còn dính element (VD `(_d)`).
    - `<g>-projected DB`: chỉ sequence nào chứa g mới góp mặt.
  - **CloSpan**: mine **closed** sequential patterns. Backward sub-pattern / super-pattern pruning: nếu super-pattern có cùng kích thước projected-DB với sub-pattern → sub-pattern bị prune (không closed). VD <c>:50 và super <bc>:50 → prune <c>, giữ <ac>,<ab>,<bc>.
  - **CP-Miner**: constraint-based, dùng cho phát hiện **copy-paste bugs / "forget-to-change" bugs** trong code (vì bug này liên quan THỨ TỰ thao tác → sequential mining hợp hơn frequent itemset). Có ràng buộc **max_gap** (khoảng cách index giữa các item khớp ≤ ngưỡng).

### 6.2 Pattern compression / representative patterns
- **Pattern distance** = 1 − Jaccard của tập transaction ủng hộ = 1 − |giao|/|hợp|.
  - VD "abc" và "abd" cùng tập {T1,T3,T4,T5} → distance = 1 − 4/4 = **0**.
  - "abcd"{T1,T3,T4,T5} & "acde"{T1,T3,T5} → 1 − 3/4 = **0.25**.
- **δ-cover**: P₁ δ-cover P₂ nếu distance ≤ δ (support gần nhau). **Representative pattern set** phải δ-cover MỌI itemset. Pattern có support THẤP NHẤT (VD {F,A,C,E,T,S}) thường không bị cover → phải tự làm representative.
- **δ-cluster**: các pattern có support gần bằng nhau (distance < δ) gộp cùng cluster.

### 6.3 Stream mining (approximate)
- **Lossy Counting**: đảm bảo **KHÔNG false negative** (tìm HẾT frequent pattern ≥ σ), có thể có false positive. Chỉ **UNDER-count**, sai số ≤ **N/w** (w=bucket size). Ước lượng ∈ [true − N/w, true]. VD w=1000, N=10000, true=100 → sai số ≤10 → ∈[90,100] → chỉ 95 hợp lệ (110,105 loại vì > true).
- Các thuật toán stream approximate khác: **Sticky Sampling**, **Space-Saving**.
- KHÔNG phải stream: **CloSpan** (closed sequential), **FP-growth** (batch/exact, quét nhiều lần).

### 6.4 Multi-level mining
- **Shared (uniform-support) multi-level**: dùng MỘT minsup THẤP NHẤT cho mọi cấp để không bỏ sót pattern cấp thấp. VD cấp cao 5%, cấp thấp 3% → candidate cấp thấp dùng 3%; cấp cao 5% & thấp 1% → dùng 1% cho cả hai.

### 6.5 Graph / spatial / trajectory mining
- **Spatial association rule** hợp lệ: phải đạt CẢ support ≥ minsup VÀ confidence ≥ minconf. VD [7%,85%] hợp lệ với ngưỡng [5%,60%]; [3%,...] hoặc [...,50%] loại.
- **Frequent trajectory pattern**: các place liên tiếp phải có time gap ≤ time constraint VÀ support ≥ ngưỡng. VD constraint 30min, minsup 5%: chỉ pattern có mọi gap ≤30min và support ≥5% hợp lệ.
- Phải **group similar locations** (toạ độ liên tục hiếm trùng khớp) thành vùng rời rạc để đếm frequent pattern; gom thành **reference spots** giúp vượt data sparsity, làm rõ **periodicity**.
- **Moving-cluster patterns**:
  - **Flock**, **Convoy**: yêu cầu di chuyển cùng nhau ở các timestamp LIÊN TIẾP.
  - **Swarm**: cho phép cùng cluster ở timestamp KHÔNG liên tiếp.

### 6.6 Phrase mining (text)
- **Contiguous pattern mining**: cụm từ liền kề đạt support ngưỡng mới là candidate. VD "support vector machine" xuất hiện 5 lần → candidate; "support machine" không liền kề → loại.
- **ToPMine**: **unsupervised**; chiến lược "**phrase mining TRƯỚC, topic modeling SAU**" (Strategy 3: first phrase mining then topic modeling).
- **SegPhrase**: **weakly/distantly supervised** — chỉ cần ÍT dữ liệu gán nhãn (do người hoặc knowledge base). Frequent pattern mining tạo **candidate phrases**, sau đó SegPhrase lọc/xếp hạng chất lượng (tần suất cao chưa chắc là phrase tốt).
- **KERT**: cũng là phương pháp xuất phrase.
- **LDA**: là topic model, output là **từ đơn lẻ**, KHÔNG xuất phrase.

### 6.7 Outlier / anomaly detection
- Outlier = điểm khác biệt đáng kể so với phần lớn data. Cách tiếp cận: statistical (phân phối), distance/density-based (DBSCAN gán noise, LOF), clustering-based.

### 6.8 Khái niệm chung
- **Frequent sub-sequence** = chuỗi (có thứ tự) xuất hiện thường xuyên (sequential pattern). Frequent sub-structure = graph/subgraph.
- **Brute-force (exhaustive) search**: liệt kê MỌI giải pháp theo thứ tự định trước rồi kiểm tra từng cái.

### Mẹo làm bài — Chương 6
- Projected DB `<x>`: lấy suffix SAU lần đầu xuất hiện x; chỉ sequence chứa x mới góp.
- SPADE id-list = (SID, EID); đếm event id kỹ khi item trong/ngoài ngoặc.
- CloSpan: super-pattern cùng projected-DB size → prune sub-pattern.
- Lossy Counting: chỉ under-count, sai số ≤ N/w, không bỏ sót frequent.
- Spatial/trajectory rule: phải thỏa CẢ support VÀ confidence (và gap nếu có).
- Swarm = timestamp không liên tiếp; Flock/Convoy = liên tiếp.
- ToPMine=unsupervised, phrase trước; SegPhrase=weakly supervised; LDA không ra phrase.

---

## Phụ lục — Tổng hợp "range" và tính chất hay bị hỏi

| Đại lượng | Range | Ghi chú |
|---|---|---|
| support, confidence | [0, 1] | tỉ lệ |
| lift | [0, +∞) | =1 độc lập; KHÔNG null-invariant |
| χ² | [0, +∞) | luôn ≥ 0; =0 độc lập; KHÔNG null-invariant |
| Kulczynski | [0, 1] | null-invariant |
| cosine similarity | [−1, 1] | (patterns: [0,1]); null-invariant |
| all-confidence | [0, 1] | null-invariant |
| Jaccard | [0, 1] | bỏ 0-0 |
| correlation coefficient r | [−1, 1] | Pearson |
| Silhouette | [−1, 1] | internal/relative |
| NMI | [0, 1] | =1 khi khớp hoàn toàn |

**Null-invariant (nhớ):** all-confidence, max-confidence, Kulczynski, cosine, Jaccard. **KHÔNG null-invariant:** lift, χ², support, confidence(theo nghĩa bị null ảnh hưởng gián tiếp — nhưng confidence bản thân null-invariant trong so sánh 2 bảng chỉ khác null).

**Số lượng patterns:** |all frequent| ≥ |closed| ≥ |max|. Chỉ **closed** khôi phục được support (lossless).

**Cần / không cần số cluster k trước:** CẦN → K-means, K-medoids, K-median. KHÔNG cần → DBSCAN, OPTICS, hierarchical (AGNES).

**Cần / không cần ground-truth:** CẦN (external) → purity, NMI, Jaccard, F-measure, conditional entropy, max matching. KHÔNG cần (internal) → modularity, normalized cut, silhouette, SSE, beta-CV.

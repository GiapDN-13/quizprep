# DAT301m — Tổng hợp lý thuyết

> Tài liệu ôn thi dựa trên chuyên đề **DeepLearning.AI TensorFlow Developer**. Mục tiêu: hiểu sâu khái niệm để trả lời được cả các câu hỏi **mới** (không có trong bank). Thuật ngữ, tên API và định nghĩa quan trọng giữ nguyên **tiếng Anh** vì đề thi bằng tiếng Anh.

---

## 1. ML Basics & Neural Networks

### 1.1. Traditional Programming vs Machine Learning
- **Traditional programming**: lập trình viên tự viết **Rules** + **Data** đưa vào → máy trả ra **Answers**.
- **Machine Learning**: đưa vào **Data** + **Answers (labels)** → thuật toán tự suy ra **Rules**.
- Câu định nghĩa chuẩn: *"In ML, the algorithm automatically formulates the rules from the data"* (thay vì programmer hand-code rules).
- **Bẫy thi**: đề hay hỏi "what comes OUT of the traditional programming diagram?" → **Answers**. Còn "what comes out of the ML diagram?" → **Rules**. Đọc kỹ đang hỏi diagram nào.

### 1.2. Labels & Supervised Learning
- **Labelling the data** = quá trình gắn nhãn cho dữ liệu (ví dụ: "data này là walking, data này là running").
- Supervised learning học **mapping từ data → label**. Không nhầm với "categorizing" hay "programming the data" (distractor phổ biến).

### 1.3. Neural Network cơ bản & Dense layer
- **Dense layer** = *a layer of neurons fully connected to its adjacent layers* (mỗi neuron nối với TẤT CẢ neuron của layer kề nó). Đây là định nghĩa hay bị hỏi nguyên văn.
- Ví dụ "Hello World" của khóa học: học quan hệ `y = 2x - 1` với 1 neuron:

```python
model = tf.keras.Sequential([tf.keras.layers.Dense(units=1, input_shape=[1])])
model.compile(optimizer='sgd', loss='mean_squared_error')
model.fit(xs, ys, epochs=500)
model.predict([10.0])   # ~19
```

### 1.4. Loss function, Optimizer, Convergence — vòng lặp học
Chu trình: **guess → measure (loss) → optimize → guess tốt hơn**, lặp lại nhiều **epochs**.
- **Loss function**: *measures how good the current guess is* — đo mức sai lệch giữa dự đoán và đáp án đúng.
- **Optimizer**: *generates a new and improved guess* — dùng giá trị loss để điều chỉnh weights (SGD, Adam, RMSprop...). **Bẫy**: Adam là **optimizer**, không phải loss function.
- **Convergence**: *the process of getting very close to the correct answer* — loss giảm dần và ổn định. **Bẫy kinh điển**: distractor *"an analysis that corresponds too closely to a particular set of data"* — đó là định nghĩa của **overfitting**, không phải convergence!

### 1.5. model.compile / model.fit / model.predict
- `model.compile(optimizer=..., loss=..., metrics=[...])` — cấu hình cách học. Lưu ý `compile()` là **instance method**: phải tạo model trước rồi gọi `tf.keras.Sequential().compile(...)`, không gọi trên class.
- `model.fit(x, y, epochs=n)` = *trains the neural network to fit one set of values to another*.
- **Epoch** = một lượt đi qua toàn bộ training data.
- `model.fit` **trả về History object**: gán `history = model.fit(...)` rồi xem `history.history['loss']`, `history.history['val_accuracy']`... Vẽ đồ thị bằng **Matplotlib** (thư viện plotting chuẩn của Python).
- Đồ thị train/val accuracy vẽ **two separate lines** (2 đường riêng) theo epochs — để dễ nhìn thấy divergence (overfitting).

### 1.6. Train / Test / Validation split
- Chia data để **test the network with previously unseen data** — đánh giá khả năng **generalization**, không phải để train nhanh hơn.
- **Validation accuracy** là chỉ số tốt hơn training accuracy vì nó tính trên dữ liệu **model chưa từng thấy** → phản ánh hiệu năng trên dữ liệu mới.

### 1.7. Overfitting & Underfitting
- **Overfitting**: model "học thuộc lòng" training set. Dấu hiệu: **training accuracy cao (≈1.0) nhưng validation accuracy thấp** / val loss tăng trong khi train loss giảm.
- **Underfitting**: model quá đơn giản, cả train lẫn val đều kém.
- Overfitting dễ xảy ra trên **small datasets** vì *"there's less likelihood of all possible features being encountered in training"*.
- Cách chống overfitting (mỗi ý đều có thể thành 1 câu hỏi):
  - **More training data** → giúp model *generalize better to new data*.
  - **Data augmentation** (Chương 2).
  - **Dropout**, **regularization** (thiếu regularization → model *fits training data too closely*).
  - **Giảm độ phức tạp model** → *captures general patterns rather than noise*.
  - **Early stopping** (dừng khi val loss ngừng cải thiện).
- **Bẫy**: nếu loss ngừng giảm sau 2 epochs mà accuracy train vẫn leo lên 1.0 sau 15 epochs → *"no point training after 2 epochs, as we overfit to the TRAINING data"* (không phải validation data).

### 1.8. Callbacks
- Đặt `callbacks=` trong `model.fit` để **"on every epoch you can call back to a code function"** — chạy code của bạn trong lúc training.
- `on_epoch_end(self, epoch, logs)` được gọi **AT THE END** of every epoch (không phải at the start — câu True/False kinh điển) và nhận **logs object** chứa loss/accuracy hiện tại.

```python
class MyCallback(tf.keras.callbacks.Callback):
    def on_epoch_end(self, epoch, logs={}):
        if logs.get('accuracy') > 0.95:
            self.model.stop_training = True
```

- Các callback có sẵn cần phân biệt:
  - **EarlyStopping** — dừng training khi metric ngừng cải thiện.
  - **ModelCheckpoint** — lưu weights/model tốt nhất.
  - **ReduceLROnPlateau** — GIẢM learning rate khi metric chững lại (một cách làm learning rate schedule bằng callback).
  - **LearningRateScheduler** — đổi learning rate mỗi epoch theo hàm bạn cung cấp.

### 1.9. Activation functions
| Activation | Công thức/ý nghĩa | Range | Dùng khi |
|---|---|---|---|
| **ReLU** | `max(0, x)` — *only returns x if x > 0*, ngược lại trả 0 | **[0, ∞)** | hidden layers |
| **Sigmoid** | nén về xác suất 1 giá trị | (0, 1) | output **binary** classification (1 neuron) |
| **Tanh** | nén đối xứng quanh 0 | (−1, 1) | hidden layers / RNN |
| **Softsign** | x/(1+\|x\|) | (−1, 1) | ít dùng |
| **Softmax** | *normalizes outputs into a probability distribution* — tổng = 1 | (0,1), sum=1 | output **multi-class** (N neurons) |

- **Bẫy**: "Which activation has range [0, ∞)?" → **ReLU**. Sigmoid là (0,1), tanh và softsign là (−1,1).
- ReLU distractor: *"returns x if x is LESS than zero"* — sai, phải là **greater than zero**.

### 1.10. Normalization & tiền xử lý
- **Normalization**: đưa pixel 0–255 về 0–1 (`images / 255.0` hoặc `rescale=1./255`) → training ổn định, hội tụ nhanh hơn.
- **One-hot encoding**: biểu diễn categorical label thành vector nhị phân (1 tại vị trí class) — dùng `tf.keras.utils.to_categorical`. Trong multiclass với softmax + `categorical_crossentropy`, labels thường **one-hot encoded**. (Nếu label là integer thì dùng `sparse_categorical_crossentropy`.)
- **Padding** (nghĩa tổng quát): *adding extra data to the input to ensure consistent dimensions*.
- Tensor cơ bản: `tf.reshape(v, (3, 4))` biến vector 12 phần tử thành ma trận 3×4 (giữ nguyên số phần tử); cộng 2 vector cùng dimension → **another vector** (cùng shape); `tf.expand_dims(x, axis=...)` — `axis` là *dimension index at which you expand the shape*.
- `tf.data.Dataset.repeat()` — lặp lại dataset (để train nhiều epochs).
- **Google Colab**: notebook trên cloud, chia sẻ như Google Doc → *real-time collaboration with multiple users*.

### 1.11. Dropout
- `tf.keras.layers.Dropout(0.2)` → **bỏ ngẫu nhiên 20% neurons** mỗi bước training (tham số là **fraction 0–1**, không phải số phần trăm — `Dropout(20)` là SAI).
- Vì sao chống overfitting: *"neighbor neurons can have similar weights and skew the final training"* — dropout buộc network học features độc lập, robust hơn.
- Dropout **quá cao** → *network loses specialization, ineffective at learning, accuracy drops* (KHÔNG làm training chậm hơn vì "extra calculations" — distractor).

### 1.12. Learning rate & hyperparameters
- **Learning rate**: kích thước bước cập nhật weights. Quá lớn → loss dao động/phân kỳ; quá nhỏ → hội tụ rất chậm.
- Là **hyperparameter** (do người chọn) — khác **parameter/weights** (do model học).
- Metrics phân loại cần biết: **Precision** = TP/(TP+FP), **Recall** = TP/(TP+FN), **F1 Score** = *balance (harmonic mean) between precision and recall*, Accuracy = tỉ lệ đúng tổng thể.

### Mẹo làm bài — Chương 1
1. Loss **đo lường** (measure), Optimizer **cải thiện** (generate improved guess) — đề luôn tráo 2 vai trò này.
2. Thấy option mô tả "corresponds too closely to a particular set of data" → đó là **overfitting**, dùng để loại nhiễu khi hỏi convergence.
3. Câu hỏi dạng "True/False + on_epoch_end": kiểm tra chữ **start/end of epoch** — tên hàm nói lên tất cả.
4. High train acc + low val acc = **overfitting on TRAINING data** (không phải "overfitting on validation data" — nghe hợp lý nhưng sai).
5. Tên API bịa (`tf.augment`, `DropoutNeurons`, `RateOfLearning`, `tf.freeze`) → hầu như luôn sai; đáp án thường là API "nhàm chán" đúng chuẩn Keras.
6. Dropout nhận **fraction** (0.2), tham số kiểu 20 hay "20%" là distractor.
7. Câu "how to prevent overfitting" có nhiều biến thể: more data / simpler model / regularization / dropout / augmentation — đáp án đúng luôn xoay quanh chữ **generalize**.

---

## 2. Computer Vision & CNNs

### 2.1. Fashion MNIST
- **70,000 ảnh**, mỗi ảnh **28×28 GREYSCALE** (1 channel) — không phải color, không phải 82×82.
- Chia sẵn: 60,000 train / 10,000 test. **10 classes** (áo, giày, túi...), labels là **số 0–9** (số thay chữ để tránh language bias và máy xử lý tốt hơn).
- Output layer có **10 neurons vì dataset có 10 labels/classes** — mỗi neuron cho xác suất một class (KHÔNG phải để "train 10x faster" hay "arbitrary").

### 2.2. Flatten & kiến trúc DNN cho ảnh
```python
model = tf.keras.Sequential([
    tf.keras.layers.Flatten(input_shape=(28, 28)),
    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.Dense(10, activation='softmax')
])
```
- **Flatten**: biến ma trận 2D (28×28) thành vector 1D (784) — không học gì, chỉ đổi shape, để Dense layer nhận input.
- **input_shape=(300, 300, 3)** nghĩa là: *every image is 300×300 pixels, with 3 bytes (channels) to define color* (RGB). Distractor: "3 convolutional layers", "batches of 3" — sai.

### 2.3. Convolution — trích xuất đặc trưng
- **Convolution** = *a technique to extract features from an image*: trượt **filter (kernel)**, ví dụ 3×3, qua ảnh; mỗi pixel mới = tổng có trọng số của vùng lân cận.
- Convolutions cải thiện image recognition vì chúng **isolate/emphasize features** (edges, shapes...) — KHÔNG phải "make image clearer/smaller/faster".
- CNN phù hợp bài horses-vs-humans vì **"there's a wide variety of humans"** — không thể hand-code rules, CNN tự học features. (Lưu ý: bank chọn đáp án này, dù "features in different parts of the frame" nghe cũng hợp lý.)
- Tác động lên training: **"It depends on many factors"** — có thể nhanh hơn hoặc chậm hơn; *a poorly designed convolutional layer may even be less efficient than a plain DNN*.

### 2.4. Toán kích thước output (RẤT hay thi)
**Conv (valid padding, stride 1): output = input − (kernel − 1)**
- 28×28 qua filter 3×3 → **26×26** (mất 1 pixel mỗi cạnh vì filter không đặt được tâm lên viền).
- 150×150 qua 3×3 → **148×148**. Qua 5×5 → 146×146 (mất kernel−1 = 4).

**MaxPooling 2×2: output = input / 2 (mỗi chiều giảm một nửa)**
- 26×26 → **13×13**; 150×150 → **75×75**.

**Chuỗi kết hợp** (nhớ luồng): 28×28 → Conv3×3 → 26×26 → MaxPool2×2 → 13×13 → Conv3×3 → 11×11 → MaxPool2×2 → 5×5.
- **Padding**: `'valid'` = không pad, output nhỏ đi; `'same'` = pad thêm để **output giữ nguyên spatial dimensions** (với stride 1). "Zero padding" là kỹ thuật pad, còn tên mode giữ nguyên kích thước là **same padding**.
- Số filters (ví dụ Conv2D(64, (3,3))) quyết định **depth/số channels** của output, không ảnh hưởng chiều rộng/cao.

### 2.5. MaxPooling
- **Pooling** = *reduces information in the image while maintaining (salient) features* — downsampling.
- MaxPooling 2×2: giữ **giá trị lớn nhất** trong mỗi khối 2×2. Distractor: "sharpen", "combine", "isolate features" (isolate là việc của convolution).

### 2.6. ImageDataGenerator & flow_from_directory
```python
from tensorflow.keras.preprocessing.image import ImageDataGenerator
train_datagen = ImageDataGenerator(rescale=1./255)
train_generator = train_datagen.flow_from_directory(
    train_dir, target_size=(300, 300), batch_size=128, class_mode='binary')
```
- Mục đích tổng quát: **preprocessing and augmenting image data for model training**.
- **Labels tự sinh từ TÊN THƯ MỤC (directory)** chứa ảnh — không phải file name, không phải manual, không phải "TensorFlow figures it out from contents".
- **rescale** = tham số normalize pixel (nhân 1/255 → về [0,1]); KHÔNG resize ảnh. Không tồn tại `normalize`, `normalize_image`, `rescale_image`.
- **target_size** trên **training generator** = kích thước ảnh được resize khi load (ảnh trên đĩa không cần cùng size).
- **class_mode**: `'binary'` cho 2 lớp, **`'categorical'`** cho nhiều lớp (không có 'multiple', 'non_binary', 'all').
- `flow_from_directory` cho cả 3 thứ: load ảnh dễ dàng + chọn size (target_size) + auto-label theo directory → đáp án thường là **"All of the above"**.

### 2.7. Image Augmentation
```python
train_datagen = ImageDataGenerator(
    rescale=1./255, rotation_range=40,
    width_shift_range=0.2, height_shift_range=0.2,
    shear_range=0.2, zoom_range=0.2,
    horizontal_flip=True, fill_mode='nearest')
```
Các fact thi đi thi lại:
- Cách bật augmentation: **"using parameters to the ImageDataGenerator"** (không có `tf.augment` / `keras.augment` API).
- Toàn bộ augmentation làm **IN-MEMORY, on the fly** — ảnh gốc trên disk **không bị sửa/copy/xóa**.
- Augmentation làm mỗi epoch **CHẬM hơn** vì *"image preprocessing takes (CPU) cycles"* — không phải vì "more data" (lượng data mỗi epoch không đổi).
- Tác dụng: *manipulates the TRAINING set to generate more scenarios for features* → **effectively simulates a larger dataset** (True) → giảm overfitting. Validation set KHÔNG augment.
- Data chỉ có người quay trái nhưng cần phân loại người quay phải → **`horizontal_flip=True`** (không có tham số 'flip' hay 'flip_vertical around Y axis').
- **fill_mode**: *attempts to recreate lost information after a transformation like a shear* (điền pixel bị mất sau shear/rotation).
- Transformation điển hình của augmentation: **random rotation**, flip, zoom, shift. (Normalization/compression/grayscale là preprocessing, KHÔNG phải augmentation.)

### 2.8. Transfer Learning
- Định nghĩa: *training a model on one task, then using it as a starting point for a different but related task*.
- Lợi ích: **"use features learned from large datasets you may not have access to"** (như ImageNet) — tiết kiệm data và thời gian.
- **Base model đóng vai trò feature extractor** cho model mới; bạn thêm các layer riêng lên trên.
- **Freeze layer**: `layer.trainable = False` — khóa weights không cho retrain. (Không có `tf.freeze(layer)` hay `layer.frozen = true`.)
- Đổi số classes (1000 → 2): *add your own DNN at the bottom (end) of the network, specify your output layer with the number of classes you want*.
- **Có thể dùng augmentation với transfer learning**: chỉ pre-trained layers bị frozen; ảnh vẫn augment được khi train các layer mới thêm vào.
- **InceptionV3** (ImageNet pre-trained) input chuẩn **299×299**. So sánh: VGG/ResNet = 224×224, NASNet-Large = 331×331.

```python
from tensorflow.keras.applications.inception_v3 import InceptionV3
pre_trained = InceptionV3(input_shape=(150,150,3), include_top=False, weights='imagenet')
for layer in pre_trained.layers:
    layer.trainable = False
```

### 2.9. Binary vs Categorical output
| | Binary (2 lớp) | Multi-class (N lớp) |
|---|---|---|
| Output layer | `Dense(1, activation='sigmoid')` | `Dense(N, activation='softmax')` |
| Loss | `binary_crossentropy` | `categorical_crossentropy` (one-hot) / `sparse_categorical_crossentropy` (integer labels) |
| class_mode | `'binary'` | `'categorical'` |

- **Bẫy**: "IMDB positive/negative dùng loss gì?" → **binary crossentropy**. Distractors: categorical crossentropy (multi-class), **Adam (là optimizer!)**, "binary gradient descent" (không tồn tại).

### 2.10. Visualize & tiện ích
- Xem tác động của convolutions lên ảnh: dùng **model.layers API** (truy cập từng layer và output trung gian của nó).
- Xem lịch sử training: `history = model.fit(...)` (Chương 1).
- Đo trade-off nén ảnh vs chất lượng: **Signal-to-Noise Ratio (SNR/PSNR)**.
- **ConvLSTM** (mở rộng): layer kết hợp convolution (trích đặc trưng không gian) + LSTM (quan hệ thời gian) — dùng cho dữ liệu spatio-temporal như video; trong Keras là `ConvLSTM2D`. Ý chính cần nhớ: convolution xử lý **spatial**, LSTM xử lý **temporal**.

### Mẹo làm bài — Chương 2
1. Học thuộc 2 công thức: **Conv 3×3 trừ 2 mỗi chiều** (input − kernel + 1), **Pool 2×2 chia đôi**. Đề chỉ thay số: 28→26, 150→148, 150→75, 26→13.
2. Câu về ImageDataGenerator: nhớ bộ tứ **rescale / target_size / class_mode / flow_from_directory**, và labels đến từ **directory name**.
3. Mọi câu augmentation quy về 4 fact: tham số của ImageDataGenerator — in-memory — chậm hơn (CPU cycles) — mô phỏng dataset lớn hơn (chống overfit).
4. "Impact of convolutions on training?" → đáp án dài nhất kiểu **"It depends on many factors..."** thường đúng.
5. Transfer learning: freeze = `layer.trainable = False`; base = feature extractor; output layer mới do bạn định nghĩa; augmentation vẫn dùng được.
6. Convolution **extracts/isolates features**; Pooling **reduces information**. Đề hay hoán đổi 2 mô tả này.

---

## 3. Natural Language Processing (NLP)

### 3.1. Tokenizer
```python
from tensorflow.keras.preprocessing.text import Tokenizer
tokenizer = Tokenizer(num_words=100, oov_token="<OOV>")
tokenizer.fit_on_texts(sentences)        # xây word_index (vocabulary)
sequences = tokenizer.texts_to_sequences(sentences)  # câu -> list số
word_index = tokenizer.word_index
```
- Object dùng để tokenize câu: **`Tokenizer`** (không phải WordTokenizer/TextTokenizer).
- Method tokenize corpus: **`fit_on_texts(sentences)`** — chú ý "texts" số nhiều, "fit_on" chứ không phải "fit_to".
- Method mã hóa câu thành số: **`texts_to_sequences(sentences)`** — bẫy chính tả: **textS** (số nhiều) + **sequences** (không phải "tokens").
- **`num_words=n`**: giữ **n−1 từ PHỔ BIẾN NHẤT** (most common) khi encode — không phải "n từ đầu tiên gặp", không error khi vượt quá. Nói cách khác: *limits the vocabulary size*.
- Tokenizer mặc định lowercase và bỏ dấu câu; word_index đánh số từ 1 (0 dành cho padding).

### 3.2. OOV token (Out-Of-Vocabulary)
- Khai báo khi khởi tạo: **`oov_token="<OOV>"`** (không phải out_of_vocab/unknown_token).
- Nếu KHÔNG đặt oov_token: từ lạ **không được encode và bị BỎ QUA (skipped)** trong sequence → sequence ngắn hơn câu gốc. (Distractor: "replaced by zero" — sai, 0 là padding.)
- Nếu có oov_token: từ lạ được thay bằng token OOV (thường index 1) → giữ nguyên độ dài câu.

### 3.3. Padding sequences
```python
from tensorflow.keras.preprocessing.sequence import pad_sequences
padded = pad_sequences(sequences, maxlen=10, padding='post', truncating='post')
```
- `pad_sequences` là **function trong namespace `tensorflow.keras.preprocessing.sequence`** — KHÔNG phải method của tokenizer (bẫy hay gặp).
- **Mặc định**: pad tới độ dài của **câu DÀI NHẤT**, thêm số 0 vào **ĐẦU** câu (**padding='pre'**).
- Muốn pad vào cuối: **truyền `padding='post'`** (không có giá trị 'after', không có "padding method").
- `maxlen` giới hạn độ dài; `truncating='pre'/'post'` quyết định cắt đầu hay cuối câu dài.
- **Sequence length** = *the number of words (tokens) in a sentence/document* — lý do phải pad về cùng độ dài để đưa vào network.

### 3.4. Datasets: TFDS, IMDB, Sarcasm
- **TensorFlow Datasets (tfds)** = thư viện chứa các dataset sẵn có để train/test.
- **IMDB Reviews**: **50,000 reviews, chia 50/50** (25k train / 25k test). Labels: **0 hoặc 1** (0 = negative, 1 = positive) → binary classification, dùng `binary_crossentropy`.
- **Sarcasm dataset**: file JSON, mỗi record có 3 trường quy ước: `headline` (câu tiêu đề), `is_sarcastic` (label 0/1), `article_link`. Cũng là binary classification.
- **Sentiment analysis** thuộc loại task **text categorization (text classification)**; mục tiêu: *determining the emotional tone of the text*.
- **Stemming**: *reducing words to their root or base form* (running → run).

### 3.5. Embeddings & Embedding layer
```python
model = tf.keras.Sequential([
    tf.keras.layers.Embedding(vocab_size, embedding_dim, input_length=max_length),
    tf.keras.layers.GlobalAveragePooling1D(),
    tf.keras.layers.Dense(24, activation='relu'),
    tf.keras.layers.Dense(1, activation='sigmoid')
])
```
- Class: **`tf.keras.layers.Embedding`** (không có WordEmbedding/Embed/Word2Vector).
- **Embedding dimension** = *the number of dimensions for the VECTOR representing the word encoding* — ví dụ dim=16 nghĩa là mỗi từ thành vector 16 chiều, các giá trị **được HỌC trong training**. KHÔNG phải số chữ cái, không phải vocabulary size.
- Ý tưởng: từ nghĩa giống nhau → vector gần nhau trong không gian; sentiment học được qua hướng của vector.
- **GlobalAveragePooling1D**: lấy trung bình các vector theo chiều thời gian → ra 1 vector cố định; nhẹ và nhanh hơn `Flatten` (Flatten giữ mọi giá trị nên nhiều tham số hơn ở Dense kế tiếp).
- Visualize embeddings: xuất `vecs.tsv` + `meta.tsv` lên **TensorFlow Embedding Projector**.

### 3.6. Subword tokenization
- IMDB subwords (SubwordTextEncoder / BPE-style): tách từ hiếm thành các mảnh nhỏ ("Tensor" + "Flow").
- Kết quả classification kém với model pooling đơn giản vì: **"Sequence becomes much more important when dealing with subwords, but we're ignoring word positions"** — từng subword ít mang nghĩa riêng → cần sequence models (RNN/LSTM).
- **SplitMergeTokenizer** (TensorFlow Text): tokenize bằng cách **splitting and merging text** theo nhãn từng ký tự — hữu ích cho **multilingual text with different scripts** (ví dụ tiếng Trung không có khoảng trắng).
- **BertTokenizer.tokenize()** trả về **a list of tokens** (WordPiece subwords, dạng chuỗi) — muốn ra số phải gọi thêm convert_tokens_to_ids.

### 3.7. RNN / LSTM / GRU
- Vì sao cần sequence: *"the order in which words appear dictates their IMPACT ON THE MEANING of the sentence"* ("not good" ≠ "good").
- **RNN**: *carries meaning from one cell to the next* — hidden state truyền qua từng bước thời gian. (Không phải "look at the whole sentence at a time".)
- **LSTM**: ngoài hidden state H còn có **CELL STATE chạy xuyên suốt các cells** → *values from earlier words can be carried to later ones*, giúp từ ở xa vẫn bổ nghĩa cho nhau. Đây cũng là **khác biệt chính giữa LSTM và simple RNN**.
- **GRU**: phiên bản gọn của LSTM (ít gates hơn), nhanh hơn, hiệu quả tương đương trong nhiều bài.
- Kiến trúc chuẩn cho **next-word prediction / language modeling**: **RNN (LSTM/GRU)** — không phải CNN/SVM/Decision Tree.

### 3.8. Bidirectional & return_sequences
```python
tf.keras.layers.Bidirectional(tf.keras.layers.LSTM(64, return_sequences=True)),
tf.keras.layers.Bidirectional(tf.keras.layers.LSTM(32)),
```
- **Bidirectional**: cho LSTM đọc câu cả xuôi lẫn ngược (không có "Bothdirection/Bilateral").
- **Output shape nhân đôi**: Bidirectional LSTM 64 units → **(None, 128)** (forward 64 + backward 64 concat). "None" là batch dimension.
- **Stacking LSTM**: layer LSTM nào **feed vào một LSTM khác** phải đặt **`return_sequences=True`** (trả về chuỗi hidden states thay vì chỉ output cuối). LSTM cuối cùng trước Dense thì KHÔNG cần. Thiếu nó → model **fail** vì shape không khớp.

### 3.9. Conv1D cho text
```python
tf.keras.layers.Conv1D(128, 5, activation='relu')
```
- Output shape: câu **120 tokens**, Conv1D **128 filters, kernel 5** → **(None, 116, 128)**: mất kernel−1 = 4 time steps (120−4=116), số filters (128) thành chiều cuối.
- Tổng quát: `(None, L − (k−1), filters)` với padding 'valid'.
- **Chống overfitting trong NLP**: KHÔNG có layer thần thánh (LSTM/GRU/Conv1D đều không tự chống) → đáp án "None of the above"; lý do: validation data chứa nhiều từ không có trong training. Phải dùng regularization/dropout/more data.

### 3.10. Text generation (sinh văn bản / poetry)
Quy trình training:
1. **Generate subphrases từ mỗi dòng bằng n_gram sequences**: câu [1,2,3,4] → [1,2], [1,2,3], [1,2,3,4].
2. **Pre-padding** các subphrase về cùng độ dài.
3. Tách: `xs = sequences[:, :-1]` (tất cả trừ từ cuối), **label = từ CUỐI** `labels = sequences[:, -1]`.
4. **One-hot encode labels bằng `tf.keras.utils.to_categorical(labels, num_classes=total_words)`** — vì next-word prediction là bài **classification** (mỗi từ trong vocab = 1 class).
5. Output layer: **`Dense(total_words, activation='softmax')`** — softmax *normalizes the output probabilities over multiple words* (phân phối xác suất trên vocabulary). **KHÔNG dùng sigmoid** cho từng neuron (câu True/False: "sigmoid Dense output, one neuron per word" → **False**).

Lúc predict: convert seed text bằng `texts_to_sequences`, pad, chọn từ có xác suất cao nhất, nối vào seed, lặp lại.
- **Sinh càng nhiều từ càng dễ gibberish** vì: *"the probability that each word matches an existing phrase goes down the more words you create"* — dự đoán chồng lên dự đoán không chắc chắn.
- **Nhược điểm word-based vs character-based**: *far more words than characters in a corpus → much more MEMORY INTENSIVE* (output layer + one-hot labels khổng lồ).
- Text generation KHÔNG chia train/test split (distractor trong câu "critical steps").

### Mẹo làm bài — Chương 3
1. Bẫy chính tả API cực nhiều: `fit_on_texts` / `texts_to_sequences` / `oov_token` / `pad_sequences` / `padding='post'` — nhớ chính xác từng chữ, số ít/số nhiều.
2. Ba fact về pad_sequences mặc định: nằm ở **preprocessing.sequence namespace** — pad về câu **dài nhất** — thêm 0 vào **ĐẦU (pre)**.
3. `num_words=n` → giữ **n−1 từ phổ biến nhất** (con số n−1 hay được kiểm tra).
4. Bidirectional = **nhân đôi units** trong output shape; stacking LSTM = `return_sequences=True` ở layer **feed LSTM tiếp theo** (không phải tất cả).
5. Next-word prediction = **classification + softmax + to_categorical**. Thấy "sigmoid" trong ngữ cảnh multi-word output → sai.
6. Số liệu phải thuộc: IMDB **50k, 50/50**, labels **0–1**; Conv1D 120 tokens/kernel 5/128 filters → **(None, 116, 128)**.
7. Câu hỏi "best way to avoid overfitting in NLP" → **None of the above** (không có kiến trúc nào tự động chống overfit).

---

## 4. Time Series & Forecasting

### 4.1. Khái niệm nền tảng
- **Time series** = chuỗi giá trị đo theo thời gian, cách đều. **Sound wave LÀ time series** (True) — biên độ theo thời gian.
- **Univariate**: 1 giá trị mỗi time step — ví dụ **"hour by hour TEMPERATURE"**.
- **Multivariate**: nhiều giá trị mỗi time step — ví dụ **"hour by hour WEATHER"** (nhiệt độ + độ ẩm + gió...). Đề dùng đúng cặp ví dụ này để phân biệt.
- **Imputed data** = *a projection of unknown (usually past or missing) data* — dữ liệu được ước lượng để lấp chỗ trống.
- Ứng dụng dự đoán: forecasting (tương lai), imputation (quá khứ/thiếu), anomaly detection, nhận dạng pattern.
- Thách thức chính của time series analysis: **accounting for TEMPORAL DEPENDENCIES** (các quan sát phụ thuộc nhau theo thời gian).
- Visualize hiệu quả nhất bằng **line charts** (giá trị theo thời gian có thứ tự).

### 4.2. Trend, Seasonality, Autocorrelation, Noise, Stationarity
| Thuật ngữ | Định nghĩa thi |
|---|---|
| **Trend** | *an overall direction for data REGARDLESS of direction* (hướng chung, lên hoặc xuống — bẫy: option chỉ nói "upward" là thiếu) |
| **Seasonality** | *a REGULAR CHANGE IN SHAPE of the data* — pattern lặp lại theo chu kỳ dự đoán được (KHÔNG nhất thiết theo 4 mùa lịch) |
| **Autocorrelation** | *data that follows a predictable shape, even if the scale is different* — chuỗi tương quan với bản trễ (lagged copy) của chính nó; giúp *identify patterns within a SINGLE series at different LAGS* |
| **Noise** | *unpredictable changes in time series data* — thành phần ngẫu nhiên, không dự báo được |
| **Stationarity** | *the CONSTANCY of statistical properties over time* (mean, variance, autocorrelation không đổi) |
| **Non-stationary** | chuỗi có *a disruptive event breaking trend and seasonality* — hành vi thay đổi, quá khứ không còn dự báo tốt tương lai |

- Xử lý seasonality: dùng **dummy variables cho mỗi season**, hoặc differencing, hoặc decomposition.
- **Decomposition** (trend + seasonality + residual): kỹ thuật cổ điển dùng **Moving Average (MA)** để ước lượng trend.

### 4.3. Train/Validation split — Fixed Partitioning
```python
split_time = 1000
time_train, x_train = time[:split_time], series[:split_time]
time_valid, x_valid = time[split_time:], series[split_time:]
```
- **KHÔNG shuffle trước khi chia** — phải chia theo thời gian (quá khứ train, tương lai validate). Nhớ cú pháp slice có dấu **hai chấm**: `[:split_time]` và `[split_time:]` (options thiếu `:` chỉ lấy 1 phần tử → sai).
- Nên chia sao cho mỗi phần chứa trọn số chu kỳ seasonality. Ngoài fixed partitioning còn **roll-forward partitioning** (mở rộng dần training set, mô phỏng production).

### 4.4. Baseline: Naive forecast, Moving average, Differencing
- **Naive forecast**: dự đoán giá trị tiếp theo = **giá trị cuối cùng** (`forecast[t] = series[t−1]`). Là baseline để mọi model phải vượt qua.
- **Moving average**: trung bình cửa sổ trượt (ví dụ 30 ngày) → khử noise, cho đường mượt; nhưng **không dự đoán được trend/seasonality** và có thể tệ hơn naive.
- **Differencing**: lấy `series[t] − series[t−365]` để **loại trend và seasonality** → dự báo trên chuỗi hiệu rồi **cộng ngược giá trị quá khứ** lại. Kết hợp moving average trên chuỗi hiệu + smoothing giá trị quá khứ cho kết quả tốt hơn.

### 4.5. Metrics đánh giá forecast
```python
tf.keras.metrics.mean_absolute_error(x_valid, results).numpy()
```
- **MSE = Mean SQUARED Error** — bình phương sai số rồi lấy trung bình; phạt nặng sai số lớn.
- **MAE = Mean ABSOLUTE Error** — trung bình trị tuyệt đối sai số. Tốt cho time series vì *"it doesn't heavily punish larger errors like square errors do"*.
- **RMSE** = căn bậc hai của MSE (đưa về cùng đơn vị với dữ liệu).
- **MAPE** = trung bình phần trăm sai số tuyệt đối.
- **Huber loss**: đặt theo tên nhà thống kê **Peter Huber** — hành xử như MSE với sai số nhỏ, như MAE với sai số lớn → **ít nhạy với outliers**; dùng nhiều khi train LSTM forecast (`loss=tf.keras.losses.Huber()`). Distractors: Hubble/Hawking/Hyatt.

### 4.6. Windowed datasets (tf.data)
```python
def windowed_dataset(series, window_size, batch_size, shuffle_buffer):
    dataset = tf.data.Dataset.from_tensor_slices(series)
    dataset = dataset.window(window_size + 1, shift=1, drop_remainder=True)
    dataset = dataset.flat_map(lambda w: w.batch(window_size + 1))
    dataset = dataset.shuffle(shuffle_buffer)
    dataset = dataset.map(lambda window: (window[:-1], window[-1:]))
    dataset = dataset.batch(batch_size).prefetch(1)
    return dataset
```
- **Windowed dataset** = *a fixed-size subset of a time series* — các giá trị đầu window làm **features (x)**, giá trị sau cùng làm **label (y)**.
- **`drop_remainder=True`**: *ensures all rows are the same length by CROPPING data* — bỏ các window cuối bị thiếu (không phải "adding data").
- Tách features/label: **`dataset.map(lambda window: (window[:-1], window[-1:]))`** — `[:-1]` là n−1 cột features, `[-1:]` là 1 cột label. (Options dùng index đơn như `window[n-1]` → sai.)
- **Target window nằm SAU input window** (dự đoán giá trị tiếp theo từ quá khứ).
- Shuffle ở đây chỉ xáo trộn các **window** (chống sequence bias), không phá thứ tự bên trong window.

### 4.7. Lambda layers & shape cho RNN
```python
model = tf.keras.Sequential([
    tf.keras.layers.Lambda(lambda x: tf.expand_dims(x, axis=-1), input_shape=[None]),
    tf.keras.layers.LSTM(32, return_sequences=True),
    tf.keras.layers.LSTM(32),
    tf.keras.layers.Dense(1),
    tf.keras.layers.Lambda(lambda x: x * 100.0)
])
```
- **Lambda layer** = *allows you to execute ARBITRARY CODE while training* (như một layer trong model) — ví dụ expand dims cho input, scale output (×100 giúp khớp thang giá trị dữ liệu vì tanh của LSTM ra (−1,1)).
- **`tf.expand_dims(x, axis=...)`**: `axis` = *the dimension index at which you will EXPAND the shape of the tensor* (chèn chiều mới size 1).
- RNN/LSTM cần input 3 chiều: `[batch, timesteps, features]`; univariate cần thêm chiều features=1 → đó là lý do dùng Lambda + expand_dims.

### 4.8. Learning rate tuning & optimizer
```python
lr_schedule = tf.keras.callbacks.LearningRateScheduler(
    lambda epoch: 1e-8 * 10**(epoch / 20))
optimizer = tf.keras.optimizers.SGD(learning_rate=1e-6, momentum=0.9)
model.compile(loss=tf.keras.losses.Huber(), optimizer=optimizer, metrics=["mae"])
history = model.fit(dataset, epochs=100, callbacks=[lr_schedule])
```
- Set learning rate của SGD: **tham số/property `learning_rate`**.
- Đổi learning rate mỗi epoch on-the-fly: **`LearningRateScheduler` object trong callbacks namespace**, gán vào `callbacks=` của fit.
- Kỹ thuật tìm LR tối ưu: cho LR tăng dần theo epoch, **plot loss theo learning rate**, chọn LR ở vùng loss thấp và ổn định.
- **Hyperparameter tuning** trong forecasting: tối ưu các cài đặt như **learning rate** (ví dụ kinh điển), window size, batch size, số units.
- Dọn state giữa các lần thử: **`tf.keras.backend.clear_session()`** (đường dẫn khác như tf.cache... không tồn tại).
- Xem weights đã học của 1 layer: *assign the layer to a variable, add it to the model using that variable, inspect after training* (ví dụ `layer.get_weights()`).

### 4.9. RNN/LSTM cho forecasting
- Ký hiệu chuẩn: input **X**, outputs = **Y(hat) và H** (output dự đoán + hidden state truyền sang cell kế).
- **Sequence-to-vector**: RNN 30 cells (0–29) → chỉ lấy **Y(hat) của cell CUỐI (cell 29)**, bỏ output trung gian. (Sequence-to-sequence thì lấy tất cả — cần `return_sequences=True`.)
- **LSTM vs simple RNN**: LSTM có thêm **cell state that runs across all cells** (ngoài H).
- Stack 2 Bidirectional LSTM + Dense mà quên `return_sequences=True` ở layer ĐẦU → **model FAIL** (layer sau cần sequence input). Layer LSTM cuối không cần vì Dense nhận vector.

### 4.10. Conv1D cho sequences & bài Sunspots
- Thêm 1D convolution cho time series: **`Conv1D` layer type** (không có 1DConv/ConvolutionD1).
- Input shape univariate cho Conv1D: **`[None, 1]`** — None = độ dài window linh hoạt, 1 = số features/channels mỗi time step. Thường dùng `padding="causal"` để không "nhìn trộm" tương lai.
```python
tf.keras.layers.Conv1D(filters=32, kernel_size=5, strides=1,
                       padding="causal", activation="relu", input_shape=[None, 1])
```
- **Sunspots dataset** (CSV): đọc bằng thư viện **`csv`** built-in của Python; bỏ header bằng **`next(reader)`**; ép kiểu cột bằng **`float(row[2])`**.
- Seasonality của sunspots: **"11 or 22 years depending on who you ask"** (chu kỳ 11 năm, nhưng đảo cực từ nên có người tính 22).
- Kiến trúc tốt nhất cho sunspots: **a COMBINATION** — Conv1D (pattern cục bộ) + LSTM (phụ thuộc chuỗi) + Dense (dự đoán) — không phải một loại đơn lẻ.

### Mẹo làm bài — Chương 4
1. Bộ định nghĩa 5 từ khóa: Trend = **direction (regardless)**; Seasonality = **regular change in shape**; Autocorrelation = **predictable shape, different scale / lags**; Noise = **unpredictable**; Stationarity = **constancy of statistical properties**. Đề gần như bê nguyên văn.
2. Cặp ví dụ chuẩn: temperature = **univariate**, weather = **multivariate**.
3. Code split: luôn tìm option có **`[:split_time]` cho train và `[split_time:]` cho valid** — dấu hai chấm là mấu chốt.
4. Windowed dataset: nhớ 3 mảnh — `drop_remainder=True` (crop cho đều), `map(lambda w: (w[:-1], w[-1:]))` (features/label), target window **sau** input window.
5. MAE vs MSE: MAE **không phạt nặng sai số lớn**; Huber = lai giữa hai (nhớ tên **Huber**).
6. Câu hỏi API: `Conv1D`, `[None, 1]`, `learning_rate`, `LearningRateScheduler`, `tf.keras.backend.clear_session()`, `next(reader)`, `float(row[2])` — option đúng luôn là cú pháp Python/Keras chuẩn, option sai nghe "giống Java/C#" (Convert.toFloat, reader.read...).
7. "Best network for sunspots?" → **combination of all** (Conv + LSTM + DNN); tương tự dạng "which single thing fixes X?" thường đáp án là "kết hợp/tuỳ trường hợp".
8. Chuỗi số liệu quen thuộc: sunspots cycle **11/22 năm**; sequence-to-vector = output của **cell cuối**; Bidirectional LSTM quên `return_sequences=True` → **fail**.

---

## Phụ lục — Bảng tra nhanh trước giờ thi

| Chủ đề | Fact 1 dòng |
|---|---|
| ML vs lập trình | ML: Data + Answers → Rules; Traditional: Rules + Data → Answers |
| Loss / Optimizer | Loss đo guess; Optimizer tạo guess tốt hơn; Adam là optimizer |
| ReLU | max(0,x), range [0, ∞) |
| Softmax | phân phối xác suất, tổng = 1, output multi-class |
| Sigmoid | (0,1), 1 neuron, binary + binary_crossentropy |
| Fashion MNIST | 70k ảnh, 28×28 greyscale, 10 classes |
| Conv 3×3 | output = input − 2 (mỗi chiều) |
| MaxPool 2×2 | output = input / 2 |
| ImageDataGenerator | rescale=1./255; label theo directory; augmentation in-memory, chậm hơn |
| Transfer learning | layer.trainable=False; base = feature extractor; InceptionV3 = 299×299 |
| Dropout(0.2) | bỏ 20% neurons; quá cao → mất khả năng học |
| Tokenizer | fit_on_texts → texts_to_sequences; num_words giữ n−1 từ phổ biến nhất |
| pad_sequences | default: pre-padding, dài bằng câu dài nhất; namespace preprocessing.sequence |
| IMDB | 50,000 reviews, 50/50, labels 0/1 |
| Bidirectional LSTM 64 | output (None, 128) |
| Stacked LSTM | return_sequences=True ở layer feed LSTM kế |
| Text generation | n_gram subphrases + pre-pad; label = từ cuối; to_categorical; softmax |
| Windowed dataset | (w[:-1], w[-1:]); drop_remainder crop cho đều |
| Huber loss | MSE khi sai số nhỏ, MAE khi lớn; ít nhạy outliers |
| MAE | không phạt nặng sai số lớn như MSE |
| Conv1D univariate | input_shape=[None, 1] |
| Sunspots | csv + next(reader); chu kỳ 11/22 năm; best = combination |

> **Chiến lược chung khi gặp câu MỚI**: (1) loại option chứa API bịa đặt hoặc cú pháp không giống Python/Keras; (2) option cực đoan ("always", "no impact", "it doesn't") thường sai — option có sắc thái ("it depends", "improves generalization") thường đúng; (3) mọi câu về overfitting quy về từ khóa **generalize**; (4) mọi câu về kích thước ảnh quy về 2 công thức Conv/Pool; (5) đọc kỹ TRAINING hay VALIDATION — đề rất hay tráo hai từ này.


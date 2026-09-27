# PRD — Shopee Ads Intelligence & Optimization Platform

## 1. Product Overview

Platform SaaS untuk membantu seller Shopee menganalisis performa iklan dan menentukan keputusan optimasi berdasarkan data.

Produk berfokus pada satu tujuan:

> **Membantu seller menggunakan budget iklan secara lebih terukur agar dapat mengurangi pemborosan dan meningkatkan peluang konversi.**

Platform tidak hanya menampilkan metrik iklan, tetapi mengubah data menjadi:

**Data → Diagnosis → Insight → Action**

Contoh:

> "ROAS turun karena CPC meningkat sementara conversion rate menurun."

Kemudian sistem memberikan tindakan:

> "Pertimbangkan menurunkan bid 10–15% atau menghentikan keyword dengan biaya tinggi dan tanpa konversi."

Keputusan akhir tetap berada pada seller.

---

# 2. Problem

Seller sering melihat:

* biaya iklan
* klik
* impression
* CTR
* CPC
* pesanan
* omzet
* ROAS

tetapi kesulitan menjawab:

* Apakah iklan ini sebenarnya menguntungkan?
* Produk mana yang menghabiskan budget?
* Keyword mana yang menghasilkan order?
* Keyword mana yang hanya menghasilkan klik?
* Apakah bid terlalu tinggi?
* Berapa ROAS minimal agar tidak rugi?
* Berapa maksimal biaya iklan yang masih masuk akal?
* Kapan iklan harus dinaikkan?
* Kapan iklan harus diturunkan atau dihentikan?
* Produk mana yang layak diiklankan?

Platform menjawab pertanyaan tersebut dalam satu dashboard.

---

# 3. Target User

### Primary

Shopee seller yang:

* sudah menjalankan Shopee Ads
* memiliki beberapa produk
* mengeluarkan budget iklan secara rutin
* ingin memahami performa iklan
* ingin mengurangi wasted ad spend

### Secondary

* E-commerce specialist
* Marketplace manager
* Digital marketer
* Brand owner
* Agency yang mengelola marketplace

---

# 4. Core Value Proposition

Platform membantu seller memahami:

> **"Uang iklan saya habis ke mana, menghasilkan apa, dan apa yang sebaiknya saya lakukan selanjutnya?"**

Bukan hanya dashboard analytics.

Produk harus memberikan **decision support**.

---

# 5. Core Product Loop

```text
Shopee Ads Data
       ↓
Data Processing
       ↓
Performance Analysis
       ↓
Problem Detection
       ↓
AI Insight
       ↓
Recommended Action
       ↓
Seller Decision
       ↓
Monitor Result
```

---

# 6. Core Features

## A. Ads Performance Dashboard

Dashboard utama menampilkan:

* Ad Spend
* Revenue
* Orders
* Impressions
* Clicks
* CTR
* CPC
* Conversion Rate
* ROAS
* Cost per Order
* Profit / Estimated Profit

User dapat memilih periode:

* Today
* Yesterday
* 7 Days
* 14 Days
* 30 Days
* Custom

### Tujuan

Memberikan gambaran cepat:

> "Kondisi iklan saya sekarang bagaimana?"

---

# 7. Profitability Analysis

ROAS saja tidak cukup.

User memasukkan:

* harga jual
* HPP
* biaya marketplace
* biaya operasional lain
* margin target

Sistem menghitung:

### Gross Profit

```text
Revenue - Product Cost
```

### Net Profit Estimate

```text
Revenue
- Product Cost
- Marketplace Fee
- Advertising Cost
- Other Costs
```

### Break-even ROAS

Sistem menentukan ROAS minimum agar iklan tidak merugikan berdasarkan margin produk.

Contoh:

```text
Selling Price       Rp100.000
Product Cost        Rp50.000
Marketplace Fee     Rp10.000
Available Margin    Rp40.000

Break-even ROAS = 2.5x
```

Kemudian dashboard dapat menunjukkan:

```text
Current ROAS     1.8x
Break-even ROAS  2.5x

Status:
Below Break-even
```

Status tersebut adalah hasil perhitungan berdasarkan input user, bukan penilaian subjektif.

---

# 8. Product Ads Analysis

Analisis performa setiap produk yang diiklankan.

Tampilkan:

| Product | Spend | Revenue | Orders | ROAS | CVR | CPC |
| ------- | ----: | ------: | -----: | ---: | --: | --: |

User dapat melihat:

* produk dengan spend tinggi
* produk dengan revenue tinggi
* produk dengan order tinggi
* produk dengan ROAS rendah
* produk dengan conversion rate rendah

### Product Performance Classification

Gunakan kategori berbasis threshold yang dapat dikonfigurasi user:

**Scale Candidate**

Performance memenuhi target.

**Monitor**

Data belum cukup atau performa berada di sekitar target.

**Optimize**

Ada indikator yang perlu diperbaiki.

**Stop Candidate**

Performance berada di bawah threshold yang ditentukan user.

Jangan menggunakan label tersebut sebagai keputusan otomatis. Sistem hanya memberikan indikator berdasarkan aturan.

---

# 9. Keyword / Search Term Analysis

Jika data keyword tersedia, analisis:

* keyword
* impression
* clicks
* CTR
* CPC
* orders
* conversion rate
* spend
* revenue
* ROAS

Kemudian kelompokkan:

### High Conversion

Banyak menghasilkan order.

### High Spend / Low Conversion

Menghabiskan budget tetapi sedikit/tidak menghasilkan order.

### High CTR / Low Conversion

Banyak diklik tetapi sedikit menghasilkan pembelian.

### Low CTR

Kurang menarik dibandingkan impression yang diterima.

### Potential

Performance menunjukkan peluang tetapi data masih terbatas.

---

# 10. Wasted Ad Spend Detection

Ini menjadi salah satu fitur utama.

Sistem mencari pola:

```text
Spend tinggi
+
Orders rendah
+
ROAS rendah
```

atau:

```text
Clicks tinggi
+
Conversion rendah
```

atau:

```text
CPC tinggi
+
Revenue rendah
```

Contoh output:

> Keyword X menghabiskan Rp120.000 dalam 7 hari, menghasilkan 3 order, dengan ROAS 1,4x. Berdasarkan break-even ROAS produk sebesar 2,5x, keyword ini berada di bawah target.

Kemudian:

> Action yang dapat dipertimbangkan: turunkan bid, evaluasi relevansi keyword, atau hentikan sementara keyword tersebut.

---

# 11. Conversion Funnel

Visualisasikan:

```text
Impressions
     ↓
Clicks
     ↓
Product Visits
     ↓
Orders
```

Metric:

```text
CTR
↓
Click → Visit
↓
Conversion Rate
```

Tujuannya mengetahui bottleneck.

Contoh:

### Banyak impression + sedikit klik

Kemungkinan masalah:

* keyword kurang relevan
* positioning kurang menarik
* creative/product presentation

### Banyak klik + sedikit order

Kemungkinan masalah:

* harga
* product page
* review
* trust
* offer
* relevansi traffic

Platform tidak menyimpulkan penyebab secara pasti jika data tidak mendukungnya. AI hanya memberikan **hipotesis berdasarkan data**.

---

# 12. Bid & Budget Simulator

User dapat melakukan simulasi sebelum mengubah budget.

Contoh:

```text
Current Budget
Rp100.000/day

Current CPC
Rp1.000

Estimated Clicks
100
```

User mengubah:

```text
Budget
Rp150.000/day
```

Sistem menunjukkan simulasi berdasarkan historical performance.

Output:

```text
Estimated Clicks
Estimated Orders
Estimated Revenue
Estimated Spend
Estimated ROAS
```

Gunakan istilah **estimated/simulation**, bukan prediksi pasti.

---

# 13. Budget Allocation

Jika user memiliki beberapa produk:

```text
Product A
ROAS 4.2x

Product B
ROAS 2.8x

Product C
ROAS 1.1x

Product D
ROAS 3.7x
```

Sistem dapat membantu user membandingkan alokasi budget berdasarkan target yang user tetapkan.

Contoh:

```text
Current Allocation
A   25%
B   25%
C   25%
D   25%

Suggested scenario
A   35%
B   25%
C   10%
D   30%
```

Ini harus ditampilkan sebagai **scenario/suggestion**, bukan keputusan otomatis.

---

# 14. AI Ads Analyst

Gunakan Gemini API.

AI tidak menerima raw data secara sembarangan.

Flow:

```text
Shopee Data
     ↓
Data Processing
     ↓
Calculated Metrics
     ↓
Structured JSON
     ↓
Gemini
     ↓
Analysis
```

AI dapat menjawab:

### "Kenapa ROAS saya turun?"

### "Produk mana yang perlu saya perhatikan?"

### "Mana yang menghasilkan konversi?"

### "Apa kemungkinan penyebab CPC meningkat?"

### "Apa yang perlu saya cek sebelum menaikkan budget?"

### "Buatkan ringkasan performa 7 hari."

AI harus membedakan:

**Fact**
→ data aktual.

**Calculation**
→ metric hasil perhitungan.

**Hypothesis**
→ kemungkinan penyebab.

**Action**
→ tindakan yang dapat dipertimbangkan user.

---

# 15. Daily / Weekly Ads Summary

Dashboard menyediakan ringkasan:

### 7 Days

```text
Spend       Rp1.250.000
Revenue     Rp5.400.000
Orders      63
ROAS        4.32x
CTR         2.4%
CVR         3.1%
```

AI summary:

> Performa revenue meningkat dibanding periode sebelumnya, sementara CPC relatif stabil. Produk A menyumbang sebagian besar revenue iklan. Produk C memiliki spend tinggi tetapi conversion rate rendah.

---

# 16. Alerts

Sistem dapat memberikan alert berbasis rule.

Contoh:

```text
ROAS turun > 20%

CPC naik > 20%

Spend meningkat tetapi order tidak meningkat

Product menghabiskan budget tanpa order

Conversion rate turun

Campaign mencapai budget limit
```

Alert ditampilkan di dashboard.

Untuk MVP, gunakan **in-app notification** terlebih dahulu.

Email/WhatsApp/Telegram dapat menjadi fitur berikutnya.

---

# 17. Research / Campaign History

User dapat menyimpan:

* campaign
* product
* keyword
* metrics
* analysis
* notes
* date

Sehingga user dapat membandingkan:

```text
7 September
vs
14 September
vs
21 September
```

Tujuan:

> mengetahui apakah optimasi yang dilakukan benar-benar menghasilkan perubahan.

---

# 18. Decision Log

Fitur penting untuk pembelajaran.

User dapat mencatat:

```text
Tanggal:
27 Sep 2026

Action:
Menurunkan bid keyword X

Reason:
CPC terlalu tinggi

Expected:
ROAS meningkat

Result:
ROAS naik dari 1.8x → 2.4x
```

Ini membuat platform bukan hanya analytics, tetapi menjadi **optimization journal**.

---

# 19. Shopee Data Integration

Untuk MVP, jangan langsung bergantung pada scraping kompleks.

Prioritas:

### MVP

CSV/manual import.

User mengupload data iklan Shopee.

```text
CSV
 ↓
Validation
 ↓
Normalize
 ↓
Supabase
 ↓
Analytics
```

### V1

Chrome Extension atau integration untuk membantu mengambil data dari marketplace.

### Future

Official API/integration jika tersedia dan sesuai dengan ketentuan marketplace.

Semua metode pengambilan data harus mempertimbangkan Terms of Service, privacy, rate limits, dan perubahan struktur marketplace.

---

# 20. Dashboard Structure

Sidebar:

```text
Dashboard

Ads
├── Overview
├── Campaigns
├── Products
├── Keywords
└── Funnel

Analytics
├── Profitability
├── ROAS
├── Wasted Spend
└── Budget

AI Analyst

Reports

Decision Log

Settings
```

---

# 21. Database

Minimal:

```text
users
profiles
stores
products
campaigns
ad_groups
keywords
ad_metrics
product_metrics
keyword_metrics
profit_settings
ai_insights
alerts
reports
decision_logs
subscriptions
```

Relasi utama:

```text
User
 │
 └── Store
      │
      ├── Products
      │
      └── Campaigns
             │
             ├── Keywords
             └── Ad Metrics
```

---

# 22. Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### Backend

* Next.js Route Handlers / Server Actions

### Database

* Supabase PostgreSQL

### Authentication

* Supabase Auth

### AI

* Gemini API

### Deployment

* Vercel

### Data Import

* CSV

### Future

* Chrome Extension

Tidak menggunakan Redis/VPS/microservices pada MVP kecuali ada kebutuhan nyata.

---

# 23. MVP

MVP harus fokus pada **profitability + decision support**.

### P0 — Wajib

1. Authentication
2. Store management
3. CSV import
4. Ads dashboard
5. ROAS calculation
6. Break-even ROAS
7. Profitability analysis
8. Product performance
9. Keyword performance
10. Wasted spend detection
11. Conversion funnel
12. AI analysis
13. Date comparison
14. Decision log

### P1 — Setelah MVP

1. Budget simulator
2. Budget allocation
3. Alerts
4. Saved reports
5. Advanced product comparison
6. Campaign comparison

### P2 — Future

1. Chrome Extension
2. Automated data sync
3. Multi-marketplace
4. Automated alerts
5. Advanced forecasting
6. Team collaboration

---

# 24. MVP User Flow

```text
Register
   ↓
Create Store
   ↓
Set Product Cost & Margin
   ↓
Upload Shopee Ads CSV
   ↓
Data Validation
   ↓
Ads Dashboard
   ↓
Profitability Analysis
   ↓
Product Analysis
   ↓
Keyword Analysis
   ↓
Wasted Spend Detection
   ↓
AI Analyst
   ↓
Decision Log
```

---

# 25. Important Product Principle

Platform tidak boleh menjanjikan:

> "Iklan pasti menghasilkan profit."

atau:

> "AI akan menentukan iklan terbaik."

Produk hanya menyediakan:

**Data → Analysis → Scenario → Insight → Decision Support**

Seller tetap membuat keputusan akhir.

---

# 26. Success Metrics

MVP diukur berdasarkan:

* Number of stores connected
* CSV imports
* Campaigns analyzed
* Products analyzed
* Keywords analyzed
* AI analyses generated
* Decision logs created
* Returning users
* Weekly active users
* Paid conversion

Metric utama:

> **berapa banyak user yang kembali menggunakan platform untuk mengevaluasi dan mengoptimalkan iklannya.**

---

# 27. Development Roadmap

### Phase 1 — Foundation

* Next.js setup
* Supabase
* Auth
* Database
* Dashboard layout

### Phase 2 — Data

* CSV import
* CSV validation
* Data normalization
* Database storage

### Phase 3 — Analytics

* ROAS
* CPC
* CTR
* CVR
* Cost per Order
* Break-even ROAS
* Profitability
* Product analysis
* Keyword analysis

### Phase 4 — Intelligence

* Wasted spend detection
* Funnel analysis
* Alerts
* AI Analyst

### Phase 5 — Optimization

* Budget simulator
* Budget allocation
* Decision log
* Historical comparison

### Phase 6 — Automation

* Chrome Extension
* Automatic data synchronization
* Advanced integrations

---

# 28. Final Product Positioning

Produk ini bukan sekadar:

**"Shopee Ads Dashboard."**

Positioning yang lebih tepat:

> **Ads Intelligence & Decision Support Platform untuk Shopee Seller.**

Core promise:

> **Know where your ad money goes, understand what converts, and make better advertising decisions.**

Core product loop:

```text
          DATA
           ↓
       ANALYZE
           ↓
       DIAGNOSE
           ↓
        SIMULATE
           ↓
        DECIDE
           ↓
        MONITOR
           ↓
        LEARN
           └──────────→ DATA
```

Fokus MVP bukan sebanyak mungkin fitur, tetapi memastikan seller dapat membuka dashboard dan menjawab tiga pertanyaan:

### 1. "Iklan saya menghasilkan atau membakar uang?"

### 2. "Produk/keyword mana yang menyebabkan performa tersebut?"

### 3. "Apa yang perlu saya evaluasi atau ubah berdasarkan data?"

Jika ketiga pertanyaan tersebut dapat dijawab dengan jelas, produk sudah memiliki core value yang kuat.

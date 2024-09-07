
*Bu proje TEKNOFEST 2024 Antalya T3AI Hackathon Yarışması Uygulama Geliştirme Kategorisi için geliştirilmiştir.*

# SismoLink
## Deprem mağdurlarının attığı tweetleri analiz ederek kurtarma ekiplerinin daha hızlı harekete geçmesini hedefliyoruz.

## Takım Adı: 563275
- 👤 Nuh Yiğit AKMAN
- 👤 Selman Dedeakayoğulları

## Uygulamadan Ekran Görüntüleri

SismoLink projesinin bazı görselleri:

### 1. Anasayfa
Anasayfa, son deprem raporlarının genel bir görünümünü sağlar. Kullanıcılar raporları konum ve duruma göre filtreleyebilir.

https://github.com/user-attachments/assets/00eb9fd7-265f-411c-9ae2-a9286561c43f

### 2. Rapor Detayları
Bu sayfa, bir deprem raporunun ayrıntılı bilgilerini, mevcut durumu ve konum detaylarını gösterir.

https://github.com/user-attachments/assets/8ca2aa36-bd7e-4441-bdd5-49692ad0e5d7

### 3. Giriş Sayfası
Giriş sayfası, yetkililerin güvenli bir şekilde giriş yaparak deprem rapor yönetim sistemine erişmesini sağlar. Yalnızca yetkili kullanıcılar yönetim paneline erişebilir.

<img width="1278" alt="giris-ekrani" src="https://github.com/user-attachments/assets/305cd09b-03cf-459a-9834-ff6930cdcde0">

### 4. Geri Bildirim Sayfası
Kullanıcılar, raporların doğruluğu hakkında geri bildirimde bulunabilir ve ek bilgi sağlayabilir.

https://github.com/user-attachments/assets/b01821bb-48e6-43b5-9a3e-1e790cc39f89

## Uygulamayı Lokalde Çalıştırma

Bu projeyi çalıştırmadan önce aşağıdaki araçların sisteminizde kurulu olduğundan emin olun:

- **Node.js** (https://nodejs.org/)
- **MongoDB** (https://www.mongodb.com/)
- **Java 17+** (Spring Boot için)
- **Maven** (https://maven.apache.org/)

### 1. Projeyi Klonlama

Projeyi GitHub'dan klonlayın:

```bash
git clone https://github.com/kullaniciAdi/SismoLink.git
cd SismoLink
```

### 2. Frontend (React) Kurulumu

Frontend klasörüne gidin ve bağımlılıkları yükleyin:

```bash
cd frontend
npm install
```

Ardından frontend'i başlatın:

```bash
npm start
```

Tarayıcınızda frontend'i görmek için `http://localhost:3000` adresini ziyaret edin.

### 3. Backend (Spring Boot) Kurulumu

Backend klasörüne gidin ve Spring Boot uygulamasını başlatın:

```bash
cd backend/earthquake
./mvnw spring-boot:run
```

Backend varsayılan olarak `http://localhost:8080` adresinde çalışacaktır.

### 4. MongoDB'yi Başlatma ve Yedekten Geri Yükleme

Veritabanı klasöründe yer alan yedek dosyalarından MongoDB veritabanını geri yükleyin:

1. MongoDB'yi başlatın:

#### Ubuntu ve MacOS için:
```bash
sudo systemctl start mongodb
```

#### Windows için:
```bash
net start MongoDB
```

2. Veritabanını geri yüklemek için şu komutları kullanın:

```bash
mongoimport --db earthquakeDB --collection reports --file database/earthquakedb.reports.json --jsonArray
mongoimport --db earthquakeDB --collection users --file database/earthquakedb.users.json --jsonArray
```

### 5. Yapay Zeka API'sini Başlatma

AI API dosyalarını başlatmak için aşağıdaki adımları izleyin:

```bash
cd ai-api
pip install -r requirements.txt
python api.py
```

AI API, varsayılan olarak `http://localhost:5000` adresinde çalışacaktır.

### 6. Proje Hazır!

Frontend ve backend sunucuları çalışırken, tarayıcıda `http://localhost:3000` adresine giderek projeyi kullanabilirsiniz.

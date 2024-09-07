
# SismoLink Projesi - Başlangıç Kılavuzu

## Türkçe

### Gerekli Bağımlılıklar

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

---

## English

### Prerequisites

Before running the project, ensure that the following tools are installed on your system:

- **Node.js** (https://nodejs.org/)
- **MongoDB** (https://www.mongodb.com/)
- **Java 17+** (for Spring Boot)
- **Maven** (https://maven.apache.org/)

### 1. Cloning the Project

Clone the project from GitHub:

```bash
git clone https://github.com/username/SismoLink.git
cd SismoLink
```

### 2. Setting Up the Frontend (React)

Navigate to the frontend directory and install the dependencies:

```bash
cd frontend
npm install
```

Then, start the frontend:

```bash
npm start
```

Visit `http://localhost:3000` in your browser to view the frontend.

### 3. Setting Up the Backend (Spring Boot)

Navigate to the backend directory and start the Spring Boot application:

```bash
cd backend/earthquake
./mvnw spring-boot:run
```

The backend will run on `http://localhost:8080` by default.

### 4. Starting MongoDB and Restoring from Backup

Restore the MongoDB database from the backup files located in the database folder:

1. Start MongoDB:

#### For Ubuntu and MacOS:
```bash
sudo systemctl start mongodb
```

#### For Windows:
```bash
net start MongoDB
```

2. Restore the database using the following commands:

```bash
mongoimport --db earthquakeDB --collection reports --file database/earthquakedb.reports.json --jsonArray
mongoimport --db earthquakeDB --collection users --file database/earthquakedb.users.json --jsonArray
```

### 5. Starting the AI API

To start the AI API, follow these steps:

```bash
cd ai-api
pip install -r requirements.txt
python api.py
```

The AI API will run on `http://localhost:5000` by default.

### 6. Project is Ready!

Once both the frontend and backend servers are running, visit `http://localhost:3000` in your browser to use the project.

---

## Working Project

Here are some visuals from the working SismoLink project:

### 1. Homepage
The homepage provides an overview of recent earthquake reports. Users can filter the reports based on location and status.

![Anasayfa](https://github.com/2vall-hackathon-project/media/giris-ekrani.png?raw=true)

### 2. Report Details
This page shows the detailed information of an earthquake report, including its current status and location details.

![Rapor Görüntüleme](https://github.com/2vall-hackathon-project/media/rapor-goruntuleme.mov)

### 3. Login Page
The login page allows officials to securely log in and access the earthquake report management system. Only authorized users can access the dashboard.

![Login Page](https://github.com/2vall-hackathon-project/media/giris-ekrani.png?raw=true)

### 4. Feedback Page
Users can leave feedback on the accuracy of the reports and provide additional information.

![Feedback Page](https://github.com/2vall-hackathon-project/media/geri-bildirim.mov)

---

## Çalışan Proje

SismoLink projesinin bazı görselleri:

### 1. Anasayfa
Anasayfa, son deprem raporlarının genel bir görünümünü sağlar. Kullanıcılar raporları konum ve duruma göre filtreleyebilir.

![Anasayfa](https://github.com/2vall-hackathon-project/media/anasayfa.mov)

### 2. Rapor Detayları
Bu sayfa, bir deprem raporunun ayrıntılı bilgilerini, mevcut durumu ve konum detaylarını gösterir.

![Rapor Detayları](https://github.com/2vall-hackathon-project/media/rapor-goruntuleme.mov)

### 3. Giriş Sayfası
Giriş sayfası, yetkililerin güvenli bir şekilde giriş yaparak deprem rapor yönetim sistemine erişmesini sağlar. Yalnızca yetkili kullanıcılar yönetim paneline erişebilir.

![Giriş Sayfası](https://github.com/2vall-hackathon-project/media/giris-ekrani.png?raw=true)

### 4. Geri Bildirim Sayfası
Kullanıcılar, raporların doğruluğu hakkında geri bildirimde bulunabilir ve ek bilgi sağlayabilir.

![Geri Bildirim Sayfası](https://github.com/2vall-hackathon-project/media/geri-bildirim.mov)

Her iki sunucu da çalışırken projeyi `http://localhost:3000` adresinden ziyaret edebilirsiniz.

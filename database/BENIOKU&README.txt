# MongoDB Setup and Backup Restoration

## English

### 1. Install MongoDB
If MongoDB is not installed, follow these steps to install MongoDB on your system:

#### For Ubuntu:
```bash
sudo apt-get update
sudo apt-get install -y mongodb
```

#### For MacOS (with Homebrew):
```bash
brew tap mongodb/brew
brew install mongodb-community
```

#### For Windows:
1. Go to the official MongoDB website: https://www.mongodb.com/try/download/community
2. Download and install the MongoDB Community Edition.

### 2. Start MongoDB
Once installed, start MongoDB by running the following command:

#### For Ubuntu:
```bash
sudo systemctl start mongodb
```

#### For MacOS:
```bash
brew services start mongodb/brew/mongodb-community
```

#### For Windows:
1. Open Command Prompt or PowerShell as Administrator.
2. Run:
```bash
net start MongoDB
```

### 3. Create a MongoDB Database and Restore Data from Backup
To restore the database from the provided backup:

1. Open a terminal (or Command Prompt/PowerShell for Windows).
2. Navigate to the directory containing the backup files (`earthquakedb.reports.json` and `earthquakedb.users.json`).
3. Run the following commands to restore the data:

```bash
mongoimport --db earthquakeDB --collection reports --file earthquakedb.reports.json --jsonArray
mongoimport --db earthquakeDB --collection users --file earthquakedb.users.json --jsonArray
```

### 4. Verify the Database
To verify that the data was successfully imported:

1. Open the MongoDB shell:
```bash
mongo
```

2. Switch to the `earthquakeDB` database:
```bash
use earthquakeDB
```

3. Verify the collections:
```bash
db.reports.find().pretty()
db.users.find().pretty()
```

---

# MongoDB Kurulumu ve Yedekten Geri Yükleme

## Türkçe

### 1. MongoDB Kurulumu
Eğer MongoDB sisteminizde kurulu değilse, aşağıdaki adımları izleyerek MongoDB'yi kurabilirsiniz:

#### Ubuntu için:
```bash
sudo apt-get update
sudo apt-get install -y mongodb
```

#### MacOS için (Homebrew ile):
```bash
brew tap mongodb/brew
brew install mongodb-community
```

#### Windows için:
1. Resmi MongoDB web sitesine gidin: https://www.mongodb.com/try/download/community
2. MongoDB Community Edition'ı indirin ve kurun.

### 2. MongoDB'yi Başlatma
Kurulumdan sonra MongoDB'yi başlatmak için şu komutları kullanın:

#### Ubuntu için:
```bash
sudo systemctl start mongodb
```

#### MacOS için:
```bash
brew services start mongodb/brew/mongodb-community
```

#### Windows için:
1. Komut İstemcisi'ni (Command Prompt) veya PowerShell'i yönetici olarak açın.
2. Aşağıdaki komutu çalıştırın:
```bash
net start MongoDB
```

### 3. MongoDB Veritabanı Oluşturma ve Yedekten Geri Yükleme
Veritabanını sağlanan yedek dosyalarından geri yüklemek için:

1. Terminali (Windows için Command Prompt/PowerShell) açın.
2. Yedek dosyalarının bulunduğu dizine gidin (`earthquakedb.reports.json` ve `earthquakedb.users.json`).
3. Aşağıdaki komutları çalıştırın:

```bash
mongoimport --db earthquakeDB --collection reports --file earthquakedb.reports.json --jsonArray
mongoimport --db earthquakeDB --collection users --file earthquakedb.users.json --jsonArray
```

### 4. Veritabanını Doğrulama
Verilerin başarıyla içe aktarıldığını doğrulamak için:

1. MongoDB kabuğunu açın:
```bash
mongo
```

2. `earthquakeDB` veritabanına geçiş yapın:
```bash
use earthquakeDB
```

3. Koleksiyonları doğrulayın:
```bash
db.reports.find().pretty()
db.users.find().pretty()
```

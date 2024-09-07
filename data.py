import csv
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
import time
from selenium.webdriver.common.keys import Keys

# İndirilen ChromeDriver yolunu belirleyin
chrome_driver_path = "C:/Users/selma/OneDrive/Masaüstü/Projects/chromedriver.exe"  # ChromeDriver'ın doğru yolu
service = Service(chrome_driver_path)

# ChromeDriver'ı başlatın
driver = webdriver.Chrome(service=service)

# Twitter giriş sayfasına git
url = "https://twitter.com/login"
driver.get(url)

# Sayfanın tamamen yüklenmesini bekleyin
time.sleep(5)

# Kullanıcı adı alanını bul ve kullanıcı adını yazdır
username_input = driver.find_element(By.NAME, "text")
username_input.send_keys("2vallt3ai")

# "İleri" butonunu bul ve tıkla
next_button = driver.find_element(By.XPATH, '//span[text()="İleri"]/ancestor::button')
next_button.click()

# Parola alanının yüklenmesini bekleyin
time.sleep(3)

# Parola alanını bul ve parola yazdır
password_input = driver.find_element(By.NAME, "password")
password_input.send_keys("2vALLAIHackathon")

# Enter tuşuna bas
password_input.send_keys(Keys.ENTER)

# Giriş yaptıktan sonra arama sayfasına git
time.sleep(5)  # Giriş işleminin tamamlanmasını bekleyin
search_url = "https://x.com/search?q=(apartman%20OR%20enkaz%20OR%20sokak%20OR%20mahalle)%20(%23deprem)%20until%3A2023-02-07%20since%3A2023-02-06&src=typed_query&f=live"
driver.get(search_url)

# Arama sonuçlarının yüklenmesini bekleyin
time.sleep(5)

# Tweet'leri kaydetmek için bir liste oluştur
all_tweets = []

# Aşağı kaydırarak tweetleri toplama
scroll_pause_time = 2  # Her kaydırmadan sonra bekleme süresi
max_tweets = 45  # Toplamak istediğiniz maksimum tweet sayısı
collected_tweets = 0

while collected_tweets < max_tweets:
    # Sayfadaki tweet'leri bul
    tweets = driver.find_elements(By.CSS_SELECTOR, 'div[data-testid="tweetText"]')

    # Yeni tweet'leri toplayın
    for tweet in tweets:
        tweet_text = tweet.text
        if tweet_text not in all_tweets:  # Aynı tweet'leri tekrar eklememek için kontrol
            all_tweets.append(tweet_text)
            collected_tweets += 1
            print(f"Toplanan tweet sayısı: {collected_tweets}")
            if collected_tweets >= max_tweets:
                break

    # Sayfayı aşağı kaydır
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")

    # Yeni tweetlerin yüklenmesi için bekle
    time.sleep(scroll_pause_time)

# Tweetleri CSV dosyasına yazma
with open('tweets.csv', mode='w', newline='', encoding='utf-8') as file:
    writer = csv.writer(file)
    writer.writerow(["Tweet Text"])  # CSV dosyasına başlık ekleme

    # Tüm tweetleri teker teker yazma
    for tweet in all_tweets:
        writer.writerow([tweet])

# Tarayıcıyı kapatmadan önce biraz bekleyin
time.sleep(5)

# Tarayıcıyı kapatın
driver.quit()

print("Tweetler CSV dosyasına başarıyla kaydedildi!")

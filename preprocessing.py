import re
import pandas as pd
import os
# Emojileri temizlemek için regex
def remove_emoji(text):
    emoji_pattern = re.compile(
        "["
        u"\U0001F600-\U0001F64F"  # emoticons
        u"\U0001F300-\U0001F5FF"  # symbols & pictographs
        u"\U0001F680-\U0001F6FF"  # transport & map symbols
        u"\U0001F1E0-\U0001F1FF"  # flags (iOS)
        u"\U00002702-\U000027B0"  # dingbats
        u"\U000024C2-\U0001F251" 
        "]+", flags=re.UNICODE
    )
    return emoji_pattern.sub(r'', text)

# "@" ile başlayan kullanıcı adlarını ve fazla boşlukları temizleme
def clean_data(text):
    # Emojileri temizle
    text = remove_emoji(text)

    # "@" ile başlayan kullanıcı adlarını temizle
    text = re.sub(r'@\w+', '', text)

    # Ekstra boşlukları temizle
    text = re.sub(r'\s+', ' ', text).strip()

    return text

# CSV dosyasındaki verileri temizleme fonksiyonu
def preprocess_dataset(csv_file_path):
    if not csv_file_path or not os.path.exists(csv_file_path):
        print("CSV file not found.")
        return None

    # CSV dosyasını okuma
    df = pd.read_csv(csv_file_path)

    if 'Tweets' not in df.columns:
        print("CSV file must contain 'Tweets' column")
        return None

    # 'Tweets' sütunundaki verileri temizleme
    df['Cleaned_Tweets'] = df['Tweets'].apply(clean_data)

    return df

# Pipeline'ı çalıştırma ve temizlenmiş dataset'i kaydetme
csv_file_path = 'dataset.csv'
cleaned_df = preprocess_dataset(csv_file_path)

if cleaned_df is not None:
    cleaned_df.to_csv('cleaned_dataset.csv', index=False)
    print("Temizlenmiş veri seti 'cleaned_dataset.csv' olarak kaydedildi.")

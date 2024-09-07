import re
import requests
import json
from flask import Flask, jsonify, request
import pandas as pd
import os
from bs4 import BeautifulSoup
app = Flask(__name__)

# llm.py dosyasından aldığımız fonksiyon, JSON verisini özel formata çeviriyor
def convert_to_special_format(json_data):
    output = "<|begin_of_text|>"
    for entry in json_data:
        if entry["role"] == "system":
            output += f'<|start_header_id|>system<|end_header_id|>\n\n{entry["content"]}<|eot_id|>'
        elif entry["role"] == "user":
            output += f'\n<|start_header_id|>{entry["role"]}<|end_header_id|>\n\n{entry["content"]}<|eot_id|>'
        elif entry["role"] == "assistant":
            output += f'\n<|start_header_id|>{entry["role"]}<|end_header_id|>\n\n{entry["content"]}<|eot_id|>'
    output += "\n<|start_header_id|>assistant<|end_header_id|>"
    return output

def parse_model_response(response_text):
    address_pattern = r"Adres:(.*?)(\\n|\n|$)"
    victims_pattern = r"Depremzedelerin Sayısı:(.*?(\d+)(.*?)?)(\\n|\n|$)"

    # Adres kısmını ayıklama
    address_match = re.search(address_pattern, response_text)
    address = address_match.group(1).strip() if address_match else "Adres bulunamadı"

    # Depremzede sayısını ayıklama
    victims_match = re.search(victims_pattern, response_text)
    if victims_match:
        victims = victims_match.group(1).strip()
        if re.search(r'\d+', victims):
            victims = re.search(r'En az \d+|\d+', victims).group()
    else:
        victims = "Depremzede sayısı bulunamadı"

    return {"address": address, "victims": victims}

# Adresin koordinatlarını döndüren fonksiyon
def get_coordinates(address):

    base_url = f"https://geocode.maps.co/search?q={address}&api_key=66da6f7162e3e806951271blmef615c"
    
    response = requests.get(base_url)
    
    if response.status_code == 200:
        data = response.json()
        
        if len(data) > 0:
            first_result = data[0]
            lat = first_result.get('lat', 'N/A')
            lon = first_result.get('lon', 'N/A')
            return {"latitude": lat, "longitude": lon}
        else:
            return {"latitude": "N/A", "longitude": "N/A"}
    else:
        return {"latitude": "N/A", "longitude": "N/A"}

def get_location_hierarchy(address):
    url = "https://inference2.t3ai.org/v1/completions"
    
    # İl, ilçe, mahalle ayrıştırması için model prompt'u oluşturuyoruz
    json_data = [
        {
            "role": "system",
            "content": """You are a helpful language model assistant. You will give all your answers in clear and concise Turkish. I will give you an address, and you will list this address as Province, District, Neighborhood. If you have detailed information such as street, building number, or other specifics, add these to the output in the same format.

If you cannot find any valid information for Province, District, or Neighborhood, use '*' for each missing part. Do not invent or create an address if it does not exist.

If the input is "Adres bulunamadı.", respond exactly with "Adres bulunamadı." and do not try to provide any additional information or make up an address. Only answer what is given. Stick strictly to the provided input.

The answer should always follow this format: Province, District, Neighborhood... Do not try to add title's or any indicators redundant. If there is no address information, respond with "Adres bulunamadı."

Example Input:
"Adres bulunamadı."

Example Output:
"Adres bulunamadı."

Example Input:
"Gaziantep'in Islahiye ilçesindeki Kalaycıoğlu Mahallesi'nde bulunan Kalaycıoğlu Sokak'taki No:33."

Example Output:
"Gaziantep, Islahiye, Kalaycıoğlu Mahallesi, Kalaycıoğlu Sokak No:33"
                       """
        },
        {
            "role": "user",
            "content": f"Adres: {address}"
        }
    ]

    special_format_output = convert_to_special_format(json_data)

    # API isteği için veri oluştur
    payload = {
        "model": "/home/ubuntu/hackathon_model_2/",
        "prompt": special_format_output,
        "temperature": 0,
        "top_p": 0.95,
        "max_tokens": 1024,
        "repetition_penalty": 1.1,
        "stop_token_ids": [128001, 128009],
        "skip_special_tokens": True
    }

    headers = {
        'Content-Type': 'application/json',
    }

    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 200:
        response_data = response.json()
        location_hierarchy = response_data["choices"][0]["text"]
        return location_hierarchy
    else:
        return "*, *, *"


# API isteğini yapan fonksiyon
def get_model_response(tweet_content):
    url = "https://inference2.t3ai.org/v1/completions"
    
    # llm.py'deki gibi veriyi özel formata dönüştür
    json_data = [
        {
            "role": "system",
            "content": """Sen yardımcı bir dil modeli asistanısın. Görevin, sana verilen tweetlerden olası adres bilgilerini ve potansiyel depremzede sayısını ayıklamaktır.
                    Tweetlerde yer alan adres bileşenleri genellikle şu unsurları içerebilir: sokak adı, mahalle adı, apartman adı, bina numarası, şehir, ilçe ve posta kodu.
                   Verilen tweetin tamamını dikkatlice analiz et, ancak sadece adres bilgilerini ve depremzede sayısını döndür. Cevabında sadece adres formatındaki bilgileri kısa, net ve tam olarak yaz ve depremzede sayısını istenen formatta belirt. Ayrıca, eğer tweet içerisinde bir adres yoksa, 'Adres bulunamadı' şeklinde bir geri bildirim ver.
                   Eğer spesifik kişi sayısı verilmemiş ve yalnızca "ailesiyle" ya da "çocuklarıyla" gibi bir ibare kullanılmışsa depremzede sayısını sadece "En az 3 kişi" diye cevapla.
                   Eğer kişi sayısı hakkında hiçbir bilgi bulamıyorsan "En az 1 kişi" cevabını ver.
                   Örnek Tweet: Mehmet Koca ve 2 çocuğu, Hatay Antakya Muradiye Mahallesi Mevlana Sokak No:7'de enkaz altında. Kurtarma ekipleri ulaşmadı, yardım edin!
                   Örnek Çıktı: 
                   Adres: Hatay Antakya Muradiye Mahallesi Mevlana Sokak No:7
                   Depremzede sayısı: En az 3
                   
                   
                   Örnek Tweet: Mehmet Koca ve ailesi, Samsun Atakum İstinye Mahallesi Mevlana Sokak No:7'de enkaz altında. Kurtarma ekipleri ulaşmadı, yardım edin!
                   Örnek Çıktı: 
                   Adres: Samsun Atakum İstinye Mahallesi Mevlana Sokak No:7
                   Depremzede sayısı: En az 3"""   
        },
        {
            "role": "user",
            "content": tweet_content
        }
    ]

    special_format_output = convert_to_special_format(json_data)

    # API isteği için veri oluştur
    payload = {
        "model": "/home/ubuntu/hackathon_model_2/",
        "prompt": special_format_output,
        "temperature": 0,
        "top_p": 0.95,
        "max_tokens": 1024,
        "repetition_penalty": 1.1,
        "stop_token_ids": [128001, 128009],
        "skip_special_tokens": True
    }

    headers = {
        'Content-Type': 'application/json',
    }

    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 200:
        response_data = response.json()
        # Modelin yanıtını döndürüyoruz
        
        address = response_data["choices"][0]["text"]
        return parse_model_response(address)
    else:
        return None

    

# CSV'deki tüm tweetlerden adresleri ve koordinatları çıkartan endpoint
@app.route('/get_all_addresses', methods=['GET'])
def get_all_addresses():
    CSV_CLEANED_FILE_PATH = 'cleaned_dataset.csv'
    CSV_ORIGINAL_FILE_PATH = 'dataset.csv'
    
    if not os.path.exists(CSV_CLEANED_FILE_PATH) or not os.path.exists(CSV_ORIGINAL_FILE_PATH):
        return jsonify({"error": "CSV files not found."}), 400

    df_cleaned = pd.read_csv(CSV_CLEANED_FILE_PATH)
    df_original = pd.read_csv(CSV_ORIGINAL_FILE_PATH)

    if 'Tweets' not in df_cleaned.columns or 'Tweets' not in df_original.columns:
        return jsonify({"error": "CSV files must contain 'Tweets' column"}), 400

    all_addresses = []
    for index, tweet in df_cleaned['Tweets'].iteritems():
        result = get_model_response(tweet)
        original_tweet = df_original['Tweets'].iloc[index]

        if result:
            location_hierarchy = get_location_hierarchy(result["address"])
            address_coordinate_format = "+".join(location_hierarchy.split(",")[:2])
            coordinates = get_coordinates(address_coordinate_format)
            all_addresses.append({
                "tweet": original_tweet,
                "address": result["address"],
                "victims": result["victims"],
                "location_hierarchy": location_hierarchy.replace("\n", "").replace(":", ""),
                "coordinates": coordinates
            })
            
    return jsonify({"addresses": all_addresses})


# Belirli bir index'teki tweet'in adresini ve koordinatlarını döndüren endpoint
@app.route('/get_address_by_index', methods=['GET'])
def get_address_by_index():
    index = request.args.get('index', type=int)
    
    CSV_CLEANED_FILE_PATH = 'cleaned_dataset.csv'
    CSV_ORIGINAL_FILE_PATH = 'dataset.csv'
    
    if not os.path.exists(CSV_CLEANED_FILE_PATH) or not os.path.exists(CSV_ORIGINAL_FILE_PATH):
        return jsonify({"error": "CSV files not found."}), 400

    df_cleaned = pd.read_csv(CSV_CLEANED_FILE_PATH)
    df_original = pd.read_csv(CSV_ORIGINAL_FILE_PATH)

    if index < 0 or index >= len(df_cleaned):
        return jsonify({"error": "Index out of bounds."}), 400

    cleaned_tweet = df_cleaned['Tweets'].iloc[index]
    original_tweet = df_original['Tweets'].iloc[index]

    result = get_model_response(cleaned_tweet)

    if result:
        location_hierarchy = get_location_hierarchy(result["address"])
        address_coordinate_format = "+".join(location_hierarchy.split(",")[:2])
        coordinates = get_coordinates(address_coordinate_format)
        important_info = extract_important_info(original_tweet)
        response = {
            "index": index,
            "tweet":original_tweet,
            "address": result["address"],
            "victims": result["victims"],
            "location_hierarchy": location_hierarchy.replace("\n", "").replace(":", ""),
            "important_info": important_info.replace("\n", " "),
            "coordinates": coordinates
        }
        return jsonify(response)
    else:
        return jsonify({"error": "No result from model."}), 500


# LLM'e tweet'i yollayıp sadece telefon numarası ve ihtiyaç listesi çeken fonksiyon
def extract_important_info(tweet_content):
    url = "https://inference2.t3ai.org/v1/completions"
    
    # LLM'e verilecek prompt
    json_data = [
        {
            "role": "system",
            "content": """Sen yardımcı bir dil modeli asistanısın. Görevin, sana verilen tweetlerden olası telefon numarası ve ihtiyaç listesini çıkarmaktır.
            Tweetlerde yer alabilecek opsiyonel unsurlar şunlardır:
            - Telefon numarası
            - İhtiyaç listesi
            
            Eğer bu bilgilerin herhangi biri yoksa, 'Yok' cevabını ver.
            Çıktını tam olarak aşağıdaki formatta vermelisin. "Gereksinimler listesi" gibi eş anlamlı kelimeler kullanma. Sadece benim sana verdiğim formatı kullan.
            Telefon numaralarını da tek bir formatta ver. Herhangi bir cevabı uydurmaya çalışma. 
            Örnek Tweet: Ahmet ve ailesi Hatay'da su ve battaniye bekliyor. Telefon: 0532 123 4567
            Örnek Çıktı:
            Telefon numarası: 0532 123 4567
            İhtiyaç listesi: su, battaniye
            
            Tweet: Mehmet ailesiyle enkaz altında, yardıma ihtiyacı var.
            Örnek Çıktı:
            Telefon numarası: Yok
            İhtiyaç listesi: Yok
            """
        },
        {
            "role": "user",
            "content": tweet_content
        }
    ]

    # Özel formata dönüştürülen prompt
    special_format_output = convert_to_special_format(json_data)

    # API isteği için veri oluşturma
    payload = {
        "model": "/home/ubuntu/hackathon_model_2/",
        "prompt": special_format_output,
        "temperature": 0,
        "top_p": 0.95,
        "max_tokens": 1024,
        "repetition_penalty": 1.1,
        "stop_token_ids": [128001, 128009],
        "skip_special_tokens": True
    }

    headers = {
        'Content-Type': 'application/json',
    }

    # API'ye istek yapma
    response = requests.post(url, headers=headers, json=payload)

    if response.status_code == 200:
        response_data = response.json()
        # Modelin yanıtını parse edip döndürüyoruz
        important_info = response_data["choices"][0]["text"]
        return important_info
    else:
        return None

# CSV'deki tüm tweetlerde önemli bilgileri çeken endpoint
@app.route('/get_all_important_info', methods=['GET'])
def get_all_important_info():
    CSV__CLEANED_FILE_PATH = 'cleaned_dataset.csv'  # CSV dosyasının yolunu belirtiyoruz
    if not CSV__CLEANED_FILE_PATH or not os.path.exists(CSV__CLEANED_FILE_PATH):
        return jsonify({"error": "CSV file not found."}), 400

    df = pd.read_csv(CSV__CLEANED_FILE_PATH)

    if 'Tweets' not in df.columns:
        return jsonify({"error": "CSV file must contain 'Tweets' column"}), 400

    all_important_info = []
    for tweet in df['Tweets']:
        important_info = extract_important_info(tweet)
        
        if important_info:
            all_important_info.append({
                "tweet": tweet,
                "important_info": important_info
            })
            
    return jsonify({"important_info": all_important_info})

@app.route('/check_kandilli', methods=['GET'])
def check_kandilli():
    url = "http://www.koeri.boun.edu.tr/scripts/lst5.asp"

    try:
        response = requests.get(url)
        response.encoding = 'utf-8'  # Ensure correct encoding for Turkish characters
        soup = BeautifulSoup(response.text, 'html.parser')
        
        pre_tag = soup.find('pre')
        earthquake_data = pre_tag.text.strip()
        lines = earthquake_data.splitlines()
        
        for line in lines[6:16]:  # Skip header lines
            columns = line.split()
            if len(columns) > 10:
                try:
                    mw = columns[6]
                    if mw != '-.-' and float(mw) > 5:
                        return jsonify({"kandilli": True})
                except ValueError:
                    continue
        return jsonify({"kandilli": False})
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=80)

import re
import requests
import json
from flask import Flask, jsonify, request
import pandas as pd
import os
from bs4 import BeautifulSoup
import ollama
import yaml

app = Flask(__name__)

with open("prompts.yaml", encoding="utf-8") as f:
    PROMPTS = yaml.safe_load(f)

# CSV dosyasını uygulama başında bir kez yükle
CSV_CLEANED_FILE_PATH = 'cleaned_dataset.csv'
if not os.path.exists(CSV_CLEANED_FILE_PATH):
    df_cleaned = None
else:
    df_cleaned = pd.read_csv(CSV_CLEANED_FILE_PATH)

# Adresin koordinatlarını döndüren fonksiyon
def get_coordinates(address):
    base_url = f"https://geocode.maps.co/search?q={address}&api_key=66da6f7162e3e806951271blmef615c"
    response = requests.get(base_url)
    if response.status_code == 200:
        data = response.json()
        if data:
            first = data[0]
            return {"latitude": first.get('lat', 'N/A'), "longitude": first.get('lon', 'N/A')}
    return {"latitude": "N/A", "longitude": "N/A"}

# Drone doğrulaması
def verify_by_drone(result):
    address = result.get("address", "")
    keywords = ["Kahramanmaraş", "Gaziantep"]
    return any(kw in address for kw in keywords)

# Tweet özetleyen fonksiyon
def get_model_response(tweet_content):
    messages = [
        {'role': 'system', 'content': PROMPTS['summary']['system']},
        {'role': 'user', 'content': PROMPTS['summary']['user_prefix'] + tweet_content}
    ]
    try:
        resp = ollama.chat(model='phi4', messages=messages)
        raw = resp['message']['content']
        match = re.search(r"[Öö]zet\s*[:：]?\s*(.+)", raw)
        return {"summary": match.group(1).strip() if match else "Özet yapılamadı."}
    except Exception as e:
        return {"error": str(e)}

# Önemli bilgileri çıkaran fonksiyon
def extract_important_info(text):
    messages = [
        {'role': 'system', 'content': PROMPTS['extract']['system']},
        {'role': 'user', 'content': text}
    ]
    try:
        resp = ollama.chat(model='phi4', messages=messages)
        content = resp['message']['content']
        phone = re.search(r"Telefon numarası:\s*(.+)", content)
        needs = re.search(r"İhtiyaç listesi:\s*(.+)", content)
        address = re.search(r"Adres:\s*(.+)", content)
        victims = re.search(r"Depremzede sayısı:\s*(.+)", content)
        return {
            "phone": phone.group(1).strip() if phone else "Yok",
            "needs": needs.group(1).strip() if needs else "Yok",
            "address": address.group(1).strip() if address else "Adres bulunamadı",
            "victims": victims.group(1).strip() if victims else "En az 1 kişi"
        }
    except Exception as e:
        return {"error": str(e)}

@app.route('/get_all_addresses', methods=['GET'])
def get_all_addresses():
    if df_cleaned is None:
        return jsonify({"error": "CSV file not found."}), 400

    seen = set()
    all_addresses = []
    for idx, tweet in enumerate(df_cleaned['Cleaned_Tweets']):
        if tweet in seen:
            continue
        seen.add(tweet)

        result = get_model_response(tweet)
        info = extract_important_info(result.get("summary", ""))
        address = info.get("address", "Adres bulunamadı.")
        coord_format = "+".join(address.split(",")[:2])
        coords = get_coordinates(coord_format)

        all_addresses.append({
            "index": idx,
            "tweet": tweet,
            "important_info": info,
            "droneVerified": verify_by_drone(info),
            "coordinates": coords
        })
        if len(all_addresses) >= 3:
            break

    return jsonify({"addresses": all_addresses})

@app.route('/get_address_by_index', methods=['GET'])
def get_address_by_index():
    idx = request.args.get('index', type=int)
    if df_cleaned is None:
        return jsonify({"error": "CSV file not found."}), 400
    if idx is None or idx < 0 or idx >= len(df_cleaned):
        return jsonify({"error": "Index out of bounds or not provided."}), 400

    tweet = df_cleaned['Cleaned_Tweets'].iloc[idx]
    result = get_model_response(tweet)
    info = extract_important_info(result.get("summary", ""))
    address = info.get("address", "Adres bulunamadı.")
    coord_format = "+".join(address.split(",")[:2])
    coords = get_coordinates(coord_format)

    return jsonify({
        "index": idx,
        "tweet": tweet,
        "important_info": info,
        "droneVerified": verify_by_drone(info),
        "coordinates": coords
    })

@app.route('/get_all_important_info', methods=['GET'])
def get_all_important_info():
    if df_cleaned is None:
        return jsonify({"error": "CSV file not found."}), 400
    if 'Tweets' not in df_cleaned.columns:
        return jsonify({"error": "CSV must contain 'Tweets' column"}), 400

    infos = []
    for tweet in df_cleaned['Tweets']:
        infos.append({
            "tweet": tweet,
            "important_info": extract_important_info(tweet)
        })
    return jsonify({"important_info": infos})

@app.route('/check_kandilli', methods=['GET'])
def check_kandilli():
    url = "http://www.koeri.boun.edu.tr/scripts/lst5.asp"
    try:
        resp = requests.get(url)
        resp.encoding = 'utf-8'
        soup = BeautifulSoup(resp.text, 'html.parser')
        data = soup.find('pre').text.splitlines()[6:16]
        for line in data:
            parts = line.split()
            if len(parts) > 6 and parts[6] != '-.-' and float(parts[6]) > 5:
                return jsonify({"kandilli": True})
        return jsonify({"kandilli": False})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=80)

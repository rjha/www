import json


def get_capitalized_synonyms(english_raw_string):
    if not english_raw_string:
        return []
    
    # 1. Split by commas to get each separate synonym
    raw_list = english_raw_string.split(',')
    
    processed_list = []
    for item in raw_list:
        cleaned_item = item.strip()
        if cleaned_item:
            # Use .title() so "gone, past" -> "Gone", "Past"
            # and multi-word terms like "nearby place" -> "Nearby Place"
            processed_list.append(cleaned_item.title())
            
    return processed_list



def parse_file(file_name):   
    game_data = []
    seen_hindi_words = set()  # Set to track and prevent duplicate entries

    with open(file_name, 'r', encoding='utf-8') as file:
        for line in file:
            if not line.strip() or ';' not in line:
                continue

            parts = line.split(';')
            
            # Group 1: Hindi Word (Single string)
            hindi_word = parts[0].strip()
            
            # Group 2: English Synonyms (Converted to Array)
            english_raw = parts[1].strip() if len(parts) > 1 else ""
            english_synonyms = get_capitalized_synonyms(english_raw)
            
            
            # Group 3: Hindi Synonyms (Converted to Array)
            hindi_raw = parts[2].strip() if len(parts) > 2 else ""
            hindi_synonyms = [item.strip() for item in hindi_raw.split(',') if item.strip()] if hindi_raw else []
            
            # 1. Add the primary main Hindi word if it hasn't been processed yet
            if hindi_word and hindi_word not in seen_hindi_words:
                seen_hindi_words.add(hindi_word)
                game_data.append({
                    "hindi": hindi_word,
                    "english_synonyms": english_synonyms,
                    "hindi_synonyms": hindi_synonyms
                })
            
            # 2. Loop through each Hindi synonym and create a standalone object entry
            for synonym in hindi_synonyms:
                if synonym and synonym not in seen_hindi_words:
                    seen_hindi_words.add(synonym)
                    # Convert to a set to easily add/remove items
                    synonym_set = set(hindi_synonyms)
                    synonym_set.discard(synonym)  # Safely remove the word itself if present
                    synonym_set.add(hindi_word)   # Add the original primary word as a synonym
                    
                    game_data.append({
                        "hindi": synonym,
                        "english_synonyms": english_synonyms,  # Inherits same English meanings
                        "hindi_synonyms": list(synonym_set)     
                    })
    
    with open("words.json", 'w', encoding='utf-8') as json_file:
        json.dump(game_data, json_file, ensure_ascii=False, indent=4)

parse_file("words.txt")

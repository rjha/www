import logging
import os 
import json
import psycopg
from config import AppConfig, get_logger_config
from config import DatabaseType, get_database_config


logger = logging.getLogger("main." + __name__)



def _get_database_conn_string():
    logger = logging.getLogger("main." + __name__)
    # 4. Resolve the targeted active runtime environment config block
    env_mode = os.environ.get("XAPI_ENV_MODE", "DEV").upper()
    db_type = DatabaseType.PRODUCTION if env_mode == "PRODUCTION" else DatabaseType.DEV
    db_config = get_database_config(db_type)

    # 5. Build positional format connection credentials
    DB_URI = "postgresql://{0}:{1}@{2}:{3}/{4}".format(
        db_config.db_user,
        db_config.db_password,
        db_config.db_host,
        db_config.db_port,
        db_config.db_name
    )

    logger.info("database URI -> " + DB_URI)
    return DB_URI


def _capitalize_english_word(raw_string):
    if not raw_string:
        return []
    
    # 1. Split by commas to get each separate synonym
    raw_list = raw_string.split(',')
    
    processed_list = []
    for item in raw_list:
        cleaned_item = item.strip()
        if cleaned_item:
            # Use .title() so "gone, past" -> "Gone", "Past"
            # and multi-word terms like "nearby place" -> "Nearby Place"
            processed_list.append(cleaned_item.title())
            
    return processed_list


def _store_root_word(conn: psycopg.Connection, token: str) ->str:
    query = """
            INSERT INTO hindi_master(token)
            VALUES (%s)
            ON CONFLICT(token) 
            DO UPDATE SET token = EXCLUDED.token
            RETURNING hindi_uuid;
        """
    with conn.cursor() as cur:
        cur.execute(query, (token,))
        row = cur.fetchone()
        return row[0] if row else None


def _store_english_word(conn: psycopg.Connection, token: str) ->str:
    query = """
            INSERT INTO english_master(token)
            VALUES (%s)
            ON CONFLICT(token) 
            DO UPDATE SET token = EXCLUDED.token
            RETURNING english_uuid;
        """
    with conn.cursor() as cur:
        cur.execute(query, (token,))
        row = cur.fetchone()
        return row[0] if row else None


def _store_hindi_english_map(conn: psycopg.Connection, hindi_uuid: str, english_uuid):
    query = """
            INSERT INTO hindi_english_map(hindi_uuid, english_uuid)
            VALUES (%s, %s)
            ON CONFLICT(hindi_uuid, english_uuid) 
            DO NOTHING ;
        """
    with conn.cursor() as cur:
        cur.execute(query, (hindi_uuid, english_uuid))


def _store_hindi_hindi_map(conn: psycopg.Connection, source_uuid: str, target_uuid):
    query = """
            INSERT INTO hindi_hindi_map(source_uuid, target_uuid)
            VALUES (%s, %s)
            ON CONFLICT(source_uuid, target_uuid) 
            DO NOTHING ;
        """
    with conn.cursor() as cur:
        cur.execute(query, (source_uuid, target_uuid))


def print_root_words():
    db_conn_string = _get_database_conn_string()
    with psycopg.connect(db_conn_string) as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT token FROM hindi_master ORDER BY token COLLATE "hi-x-icu" ;')
            # Loop through the rows directly and print the words
            for row in cur:
                print(row[0])

         
def store_word_list(word_list):
    db_conn_string = _get_database_conn_string()
    with psycopg.connect(db_conn_string) as conn:
        for item in word_list:
            root_word = item["root"]
            english_words = item["root_english"]
            root_synonyms = item["root_synonyms"]
            try:
                root_uuid = _store_root_word(conn, root_word)
                for english_word in english_words:
                    english_uuid = _store_english_word(conn, english_word)
                    _store_hindi_english_map(conn, root_uuid, english_uuid)

                synonym_set = set()
                synonym_set.add(root_uuid)

                for synonym in root_synonyms:
                    synonym_uuid = _store_root_word(conn, synonym)
                    synonym_set.add(synonym_uuid)

                for item_uuid in synonym_set:
                    map_set = set(synonym_set)
                    map_set.discard(item_uuid)
                    for pair_uuid in map_set:
                        _store_hindi_hindi_map(conn, item_uuid, pair_uuid)

                conn.commit()
            except Exception as e:
                conn.rollback()
                logger.exception(f"error happened. database changes are rolled back.")
                raise e 


def process_file(file_name: str, dump_json=False, store_in_db=False):
    word_list = []
    seen_root_words = set()

    with open(file_name, 'r', encoding='utf-8') as file:
        for line in file:
            if not line.strip() or ';' not in line:
                continue

            parts = line.split(';')
            # Hindi source Word (Single string)
            root_word = parts[0].strip()
            
            # English equivalent words (Converted to Array)
            raw_english = parts[1].strip() if len(parts) > 1 else ""
            root_english = _capitalize_english_word(raw_english)
            
            # Hindi Synonyms (Converted to Array)
            raw_synonyms = parts[2].strip() if len(parts) > 2 else ""
            root_synonyms = [item.strip() for item in raw_synonyms.split(',') if item.strip()] if raw_synonyms else []
            
            # Add the source Hindi word if it hasn't been processed yet
            if root_word and root_word not in seen_root_words:
                seen_root_words.add(root_word)
                word_list.append({
                    "root": root_word,
                    "root_english": root_english,
                    "root_synonyms": root_synonyms
                })
            
            # 2. Loop through each Hindi synonym and create a standalone object entry
            for synonym in root_synonyms:
                if synonym and synonym not in seen_root_words:
                    seen_root_words.add(synonym)
                    # Convert to a set to easily add/remove items
                    synonym_set = set(root_synonyms)
                    synonym_set.discard(synonym)  # Safely remove the word itself if present
                    synonym_set.add(root_word)   # Add the original primary word as a synonym
                    
                    word_list.append({
                        "root": synonym,
                        "root_english": root_english,  # Inherits same English meanings
                        "root_synonyms": list(synonym_set)     
                    })

    print(f"processed file {file_name}")
    if dump_json:
        with open("words.json", 'w', encoding='utf-8') as json_file:
            json.dump(word_list, json_file, ensure_ascii=False, indent=4)
        print(f"wrote to file words.json")

    if store_in_db:
        store_word_list(word_list)



def do_main():

    AppConfig.load()
    log_config = get_logger_config("global")
    AppConfig.init_logging(log_file=log_config.log_file, log_level=log_config.log_level)
    logger.info(f"Hindi words program loaded...")
    process_file("words.txt", store_in_db=True, dump_json=True)
    print_root_words()

if __name__ == "__main__":
    do_main()




    
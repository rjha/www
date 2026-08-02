import logging
import os 
import json
import psycopg
from config import AppConfig, get_logger_config
from config import DatabaseType, get_database_config
from collections import defaultdict


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


def _process_english_words(raw_string):
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


def _store_root_synonym(conn: psycopg.Connection, token: str) ->str:
    query = """
        INSERT INTO hindi_master (token, root_flag)
        VALUES (%s, %s)
        ON CONFLICT (token) 
        DO UPDATE SET token = EXCLUDED.token
        RETURNING hindi_uuid;
        """
    with conn.cursor() as cur:
        cur.execute(query, (token, 0))
        row = cur.fetchone()
        return row[0] if row else None

    
def _store_root_word(conn: psycopg.Connection, token: str) ->str:
    query = """
            INSERT INTO hindi_master(token, root_flag)
            VALUES (%s, %s)
            ON CONFLICT (token) 
            DO UPDATE SET 
                root_flag = EXCLUDED.root_flag
            WHERE hindi_master.root_flag = 0
            RETURNING hindi_uuid;
        """
    with conn.cursor() as cur:
        cur.execute(query, (token, 1))
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


def _store_hindi_english_map(conn: psycopg.Connection, hindi_uuid: str, english_uuid, root_flag=1):
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


def _store_root_word_wrapper(conn, line_no, root_word, english_words, root_synonyms):
    try:
        root_uuid = _store_root_word(conn, root_word)
        # debug 
        print(f" line: {line_no}, root: {root_word}, {root_uuid}")
        english_uuids = []

        for english_word in english_words:
            english_uuid = _store_english_word(conn, english_word)
            # debug 
            print(f"\t [e] {english_word}, english_uuid:{english_uuid}")
            _store_hindi_english_map(conn, root_uuid, english_uuid)
            english_uuids.append(english_uuid)

        synonym_set = set()
        for synonym in root_synonyms:
            synonym_uuid = _store_root_synonym(conn, synonym)
            # debug 
            print(f"\t [s] synonym_uuid:{synonym_uuid}, {synonym}")
            # every synonym inherits the english words      
            for re_uuid in english_uuids:
                _store_hindi_english_map(conn, synonym_uuid, re_uuid)
                print(f" \t [s][e] {synonym_uuid} re_uuid: {re_uuid}")

            synonym_set.add(synonym_uuid)

        # for storing hindi-hindi synonym pairs 
        # we should consider the root word as well
        synonym_set.add(root_uuid)

        for item_uuid in synonym_set:
            map_set = set(synonym_set)
            # remove self pairing for hindi_hindi map
            map_set.discard(item_uuid)
            for pair_uuid in map_set:
                _store_hindi_hindi_map(conn, item_uuid, pair_uuid)

        conn.commit()
        
    except Exception as e:
        conn.rollback()
        logger.exception(f"error happened for {root_word}...")
        raise e 
    
def _get_root_words(db_conn_string):
    words = []
    with psycopg.connect(db_conn_string) as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT hindi_uuid, token, level FROM hindi_master ORDER BY token COLLATE "hi-x-icu" ;')
            for row in cur:
                words.append((row[0], row[1], row[2]))
    return words 


def _get_hindi_english_map(db_conn_string):

    hindi_to_english_map = defaultdict(list)
    with psycopg.connect(db_conn_string) as conn:
        with conn.cursor() as cur:
            query = """
                SELECT m.hindi_uuid, e.token
                FROM hindi_english_map m
                JOIN english_master e ON m.english_uuid = e.english_uuid;
            """
            cur.execute(query)
            
            for hindi_uuid, english_token in cur:
                hindi_to_english_map[hindi_uuid].append(english_token)
    
    return hindi_to_english_map


def _get_hindi_hindi_map(db_conn_string):
    synonym_map = defaultdict(set)
    with psycopg.connect(db_conn_string) as conn:
        with conn.cursor() as cur:
            # Direct simple join
            query = """
                SELECT 
                    m.source_uuid,  t.token AS target_token
                FROM hindi_hindi_map m
                JOIN hindi_master s ON m.source_uuid = s.hindi_uuid
                JOIN hindi_master t ON m.target_uuid = t.hindi_uuid;
            """
            cur.execute(query)
            
            for source_uuid, target_token in cur:
                synonym_map[source_uuid].add(target_token)
                
    return synonym_map



def dump_json():

    word_list = []
    line_no = 0 

    db_conn_string = _get_database_conn_string()
    root_words = _get_root_words(db_conn_string)
    hindi_english_map = _get_hindi_english_map(db_conn_string)
    hindi_hindi_map = _get_hindi_hindi_map(db_conn_string)

    for hindi_uuid, token, level in root_words:
        line_no += 1
        english_tokens = hindi_english_map[hindi_uuid]
        hindi_synonyms = hindi_hindi_map[hindi_uuid]
        print(f"{line_no}: {token}, {english_tokens}, {hindi_synonyms}")

        word_list.append({
            "root": token,
            "level": level,
            "root_english": english_tokens,
            "root_synonyms": sorted(list(hindi_synonyms))
        })

    
    with open("words.json", 'w', encoding='utf-8') as json_file:
        json.dump(word_list, json_file, ensure_ascii=False, indent=4)
    print(f"wrote to file words.json")
    
    

def store_in_database(file_name, skip_lines=0):
    line_no = 0
    db_conn_string = _get_database_conn_string()
    with psycopg.connect(db_conn_string) as conn:
        with open(file_name, 'r', encoding='utf-8') as file:
                for line in file:
                    line_no += 1
                    if not line.strip() or ';' not in line:
                        print(f"skip empty or without ; line {line_no} ...")
                        continue
                    
                    if(skip_lines > 0 and line_no <= skip_lines):
                        print(f"user wants to skip line {line_no} ...")
                        continue

                    if(line.strip().startswith('#')):
                        print(f"skip commented line {line_no} ...")
                        continue
                    
                    parts = line.split(';')
                    # Hindi source Word (Single string)
                    root_word = parts[0].strip()
                    
                    # English equivalent words (Converted to Array)
                    raw_english = parts[1].strip() if len(parts) > 1 else ""
                    english_words = _process_english_words(raw_english)
                    
                    # Hindi Synonyms (Converted to Array)
                    raw_synonyms = parts[2].strip() if len(parts) > 2 else ""
                    root_synonyms = [item.strip() for item in raw_synonyms.split(',') if item.strip()] if raw_synonyms else []
                    _store_root_word_wrapper(conn, line_no, root_word, english_words, root_synonyms)
                    

def do_main():

    AppConfig.load()
    log_config = get_logger_config("global")
    AppConfig.init_logging(log_file=log_config.log_file, log_level=log_config.log_level)
    logger.info(f"Hindi words program loaded...")
    # process_file("words.txt")
    # store_in_database("words.txt", skip_lines=0)
    dump_json()

if __name__ == "__main__":
    do_main()




    
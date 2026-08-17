import sys 
import os 
import logging
import json
import csv
import psycopg
from config import AppConfig, get_logger_config
from config import  get_postgres_conn_string
from collections import defaultdict
import argparse 


logger = logging.getLogger("main." + __name__)


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

def _update_word_level(conn: psycopg.Connection, token: str, int_level):
    query = """
            UPDATE HINDI_MASTER  SET w_level = %s , updated_at = now()
            WHERE token = %s 
        """
    with conn.cursor() as cur:
        cur.execute(query, (int_level, token))


def _get_root_words(db_conn_string):
    words = []
    with psycopg.connect(db_conn_string) as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT hindi_uuid, token, w_level FROM hindi_master ORDER BY token COLLATE "hi-x-icu" ;')
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



def dump_json(output_file_path: str):

    word_list = []
    line_no = 0 

    db_conn_string = get_postgres_conn_string()
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

    
    with open(output_file_path, 'w', encoding='utf-8') as json_file:
        json.dump(word_list, json_file, ensure_ascii=False, indent=4)
    print(f"wrote to file {output_file_path}")



def split_json_file(input_file_path: str):
    """
    Reads a master JSON file once and splits all records into separate
    files based on their 'level' property within the same directory.
    """
    # Resolve paths in the same directory
    directory = os.path.dirname(os.path.abspath(input_file_path))
    
    # Group records by level dynamically using lists
    grouped_data = defaultdict(list)
    
    # Read the master file once to save memory and I/O time
    with open(input_file_path, "r", encoding="utf-8") as file:
        data = json.load(file)
        
        if isinstance(data, list):
            for item in data:
                # Default to 0 if 'level' is missing or null
                level = item.get("level", 0)
                grouped_data[level].append(item)
                
    # 3. Iterate through found levels and write split files
    for level, records in grouped_data.items():
        # Zero-pad the level (e.g., 1 -> 01, 12 -> 12)
        padded_level = f"{level:02d}"
        output_filename = f"words{padded_level}.json"
        full_output_path = os.path.join(directory, output_filename)
        
        # Write individual files out
        with open(full_output_path, "w", encoding="utf-8") as outfile:
            # ensure_ascii=False ensures native Devanagari Hindi text stays readable
            json.dump(records, outfile, ensure_ascii=False, indent=4)
            
        print(f"Generated: {output_filename} ({len(records)} records)")


def set_word_level(file_name, skip_lines=0):
    line_no = 0
    db_conn_string = get_postgres_conn_string()

    with psycopg.connect(db_conn_string) as conn:
        with open(file_name, 'r', encoding='utf-8') as file:
            for line in file:
                line_no += 1
                if not line.strip() or ',' not in line:
                    print(f"skip empty or without comma line {line_no} ...")
                    continue
                
                if(skip_lines > 0 and line_no <= skip_lines):
                    print(f"user wants to skip line {line_no} ...")
                    continue

                if(line.strip().startswith('#')):
                    print(f"skip commented line {line_no} ...")
                    continue

                parts = line.split(',')
                token = parts[0].strip()
                if parts[1].strip():
                    int_level = int(parts[1].strip())
                    _update_word_level(conn, token, int_level)


def dump_word_level(output_file_path: str, w_level:int = -1):
    """
    Fetches token and w_level from hindi_master, sorted by w_level in 
    ascending order, and logs them directly to a CSV file.
    """

    # SQL query to get words in ascending sort order
    if w_level >= 0:
        query = f"SELECT token, w_level FROM hindi_master where w_level = {w_level} ORDER BY w_level ASC;"
    else:
        query = "SELECT token, w_level FROM hindi_master ORDER BY w_level ASC;"


    db_conn_string = get_postgres_conn_string()
    # Open file with UTF-8 to protect Devanagari script strings
    with open(output_file_path, mode="w", encoding="utf-8", newline="") as file:
        writer = csv.writer(file, delimiter=",")
        
        # Write clean, matching CSV column headers
        writer.writerow(["token", "w_level"])
        
        with psycopg.connect(db_conn_string) as conn:
            with conn.cursor() as cur:
                cur.execute(query)
                for row in cur:
                    writer.writerow(row)
                    
    print(f"exported word levels to {output_file_path}")


def _guess_root_token(line):

    if not line:
        return None 
    
    if ';' in line:
        parts = line.split(';')
        return parts[0].strip()

    if ',' in line:
            parts = line.split(',')
            return parts[0].strip()
            
    return line


def print_new_words(file_name, output_file=None):
    line_no = 0
    stored_tokens = []
    new_tokens = []

    db_conn_string = get_postgres_conn_string()
    root_words = _get_root_words(db_conn_string)

    for hindi_uuid, token, level in root_words:
        stored_tokens.append(token.strip()) 

    with open(file_name, 'r', encoding='utf-8') as file:
        for line in file:
            line_no += 1
            line = line.strip() 
            if(line.startswith('#')):
                print(f"{line_no} commented...")
                continue 
            
            token = _guess_root_token(line)
            if not token:
                print(f"{line_no} No token found...")
                continue 

            if token in stored_tokens:
                print(f"{line_no} {token} exists...")
            else:
                print(f"{line_no} new token: {token}")
                new_tokens.append(token)

    if output_file is None:
        for new_token in new_tokens:
            print(new_token)
        return
    
    with open(output_file, "w", encoding="utf-8") as outfile:
        for new_token in new_tokens:
            outfile.write(new_token + "\n")



def store_in_database(file_name, skip_lines=0):
    line_no = 0
    stored_tokens = []

    db_conn_string = get_postgres_conn_string()
    root_words = _get_root_words(db_conn_string)
    for hindi_uuid, token, level in root_words:
        stored_tokens.append(token)
    
    with psycopg.connect(db_conn_string) as conn:
        
        with open(file_name, 'r', encoding='utf-8') as file:
                for line in file:
                    line_no += 1
                    if not line.strip() or ';' not in line:
                        print(f"{line_no} skip empty or without ; line...")
                        continue
                    
                    if(skip_lines > 0 and line_no <= skip_lines):
                        print(f"{line_no} user wants to skip...")
                        continue

                    if(line.strip().startswith('#')):
                        print(f"{line_no} skip commented line...")
                        continue
                    
                    parts = line.split(';')
                    # Hindi source Word (Single string)
                    root_word = parts[0].strip()
                    if root_word in stored_tokens:
                        print(f"{line_no} skip stored word {root_word}...")
                        continue
                    
                    # English equivalent words (Converted to Array)
                    raw_english = parts[1].strip() if len(parts) > 1 else ""
                    english_words = _process_english_words(raw_english)
                    
                    # Hindi Synonyms (Converted to Array)
                    raw_synonyms = parts[2].strip() if len(parts) > 2 else ""
                    root_synonyms = [item.strip() for item in raw_synonyms.split(',') if item.strip()] if raw_synonyms else []
                    _store_root_word_wrapper(conn, line_no, root_word, english_words, root_synonyms)
                    

def setup_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="CLI tool to manage and process Hindi word datasets."
    )
    subparsers = parser.add_subparsers(dest="command", help="Available subcommands")

    # Subcommand: store
    store_parser = subparsers.add_parser("store", help="Store words in the database")
    store_parser.add_argument("file_path", type=str, help="Path to input text file")
    store_parser.add_argument("--skip-lines", type=int, default=0, help="Number of initial lines to skip")

    # Subcommand: set-level
    set_level_parser = subparsers.add_parser("set-level", help="Set word difficulty levels")
    set_level_parser.add_argument("csv_path", type=str, help="Path to the CSV file with levels")

    # Subcommand: dump-json
    dump_json_parser = subparsers.add_parser("dump-json", help="Dump words to JSON format")
    dump_json_parser.add_argument("output_json", type=str, help="Output JSON file path")

    # Subcommand: split-json
    split_parser = subparsers.add_parser("split-json", help="Split a JSON file into smaller chunks")
    split_parser.add_argument("json_file", type=str, help="JSON file path to split")

    # Subcommand: dump-level
    dump_level_parser = subparsers.add_parser("dump-level", help="Dump word levels to CSV")
    dump_level_parser.add_argument("input_file", type=str, help="Input file path")
    dump_level_parser.add_argument("level", type=int, help="Target level (integer)")

    # Subcommand: print-new
    print_new_parser = subparsers.add_parser("print-new", help="Print new words from a file")
    print_new_parser.add_argument("source_file", type=str, help="Path to source text file")
    print_new_parser.add_argument(
        "-o", "--output-file",
        type=str,
        default=None,
        help="Path to output file (optional)"
    )

    return parser


def do_main():

    parser = setup_parser()
    args = parser.parse_args()

    AppConfig.load()
    log_config = get_logger_config("global")
    AppConfig.init_logging(log_file=log_config.log_file, log_level=log_config.log_level)
    logger.info(f"Hindi words program loaded...")
    # Route based on chosen command
    if args.command == "store":
        store_in_database(args.file_path, skip_lines=args.skip_lines)
    elif args.command == "set-level":
        set_word_level(args.csv_path)
    elif args.command == "dump-json":
        dump_json(args.output_json)
    elif args.command == "split-json":
        split_json_file(args.json_file)
    elif args.command == "dump-level":
        dump_word_level(args.input_file, args.level)
    elif args.command == "print-new":
        print_new_words(args.source_file, args.output_file)
    else:
        parser.print_help()
        sys.exit(1)

if __name__ == "__main__":
    do_main()




    
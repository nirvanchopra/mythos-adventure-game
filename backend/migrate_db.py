import sqlite3
import os

db_path = "test.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(stories)")
    existing_cols = [c[1] for c in cursor.fetchall()]
    print("Existing columns in stories:", existing_cols)

    cols_to_add = [
        ("user_id", "INTEGER"),
        ("genre", "VARCHAR(50) DEFAULT 'Fantasy'"),
        ("difficulty", "VARCHAR(50) DEFAULT 'Adventurer'"),
        ("character_name", "VARCHAR(100) DEFAULT 'The Wanderer'"),
        ("character_class", "VARCHAR(100) DEFAULT 'Adventurer'"),
        ("world_setting", "VARCHAR(255)"),
        ("play_count", "INTEGER DEFAULT 0"),
        ("is_public", "BOOLEAN DEFAULT 1")
    ]

    for col_name, col_type in cols_to_add:
        if col_name not in existing_cols:
            cursor.execute(f"ALTER TABLE stories ADD COLUMN {col_name} {col_type}")
            print(f"Added column '{col_name}' to stories table")

    conn.commit()
    conn.close()
    print("Database schema migration complete.")

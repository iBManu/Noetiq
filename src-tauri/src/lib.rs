use aes_gcm::{
    aead::{rand_core::RngCore, Aead, OsRng},
    Aes256Gcm, KeyInit, Nonce,
};
use argon2::Argon2;
use argon2::{Algorithm, Params, Version};
use chrono::{DateTime, Datelike, Local, TimeZone, Utc};
use dirs_next::config_dir;
use serde_json::{json, Value};
use std::fs;
use std::path::PathBuf;
use std::time::UNIX_EPOCH;
use uuid::Uuid;
use std::fs::{File, rename};
use std::io::Write;
use std::path::Path;
use std::ffi::OsStr;

const ARGON2_MEMORY_KIB: u32 = 64 * 1024;
const ARGON2_ITERATIONS: u32 = 3;
const ARGON2_PARALLELISM: u32 = 1;
const SALT_LEN: usize = 16;
const NONCE_LEN: usize = 12;

fn make_argon2() -> Result<Argon2<'static>, String> {
    let params = Params::new(
        ARGON2_MEMORY_KIB,
        ARGON2_ITERATIONS,
        ARGON2_PARALLELISM,
        None,
    )
    .map_err(|e| e.to_string())?;
    Ok(Argon2::new(Algorithm::Argon2id, Version::V0x13, params))
}

const MIN_DATA_LEN: usize = 44;
const VAULTS_FOLDER: &str = "noetiq-vaults";

#[derive(serde::Serialize, serde::Deserialize, Clone)]
struct VaultEntry {
    icon: String,
    name: String,
    description: String,
}

#[derive(serde::Serialize, serde::Deserialize)]
struct IdVaultEntry {
    icon: String,
    name: String,
    description: String,
    folder_id: String,
}

#[tauri::command]
fn read_public() -> Result<String, String> {
    let base_dir = config_dir().ok_or("No config directory found")?;
    let vault_file = base_dir.join(VAULTS_FOLDER).join("public.json");

    fs::read_to_string(&vault_file).map_err(|e| format!("Failed to read vaults"))
}

#[tauri::command]
fn set_password(password: String, hint: &str) -> Result<(), String> {
    let base_dir = config_dir().ok_or("No config directory found")?;
    let vault_dir = base_dir.join(VAULTS_FOLDER);
    fs::create_dir_all(&vault_dir).map_err(|e| e.to_string())?;

    let public_path = vault_dir.join("public.json");
    let public_json = serde_json::json!({ "hint": hint });
    fs::write(
        &public_path,
        serde_json::to_vec_pretty(&public_json).unwrap(),
    )
    .map_err(|e| e.to_string())?;

    let index_data: &[u8] = b"[]";

    let mut salt = [0u8; SALT_LEN];
    OsRng.fill_bytes(&mut salt);

    let cipher = derive_cipher(&password, &salt)?;

    let (nonce_bytes, ciphertext) = encrypt_data(&cipher, index_data)?;

    let mut output_data = Vec::new();
    output_data.extend_from_slice(&salt);
    output_data.extend_from_slice(&nonce_bytes);
    output_data.extend_from_slice(&ciphertext);

    let index_path = vault_dir.join("index.json");
    fs::write(&index_path, &output_data).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn get_vaults(password: &str) -> Result<String, String> {
    let base_dir = config_dir().ok_or("No config directory found")?;
    let vault_dir = base_dir.join(VAULTS_FOLDER);
    let index_path = vault_dir.join("index.json");

    let data = fs::read(&index_path).map_err(|e| e.to_string())?;

    if data.len() < MIN_DATA_LEN {
        return Err("Corrupted vault file".into());
    }

    let salt_bytes = &data[0..SALT_LEN];
    let nonce_bytes = &data[SALT_LEN..SALT_LEN + NONCE_LEN];
    let ciphertext = &data[SALT_LEN + NONCE_LEN..];

    let cipher = derive_cipher(password, salt_bytes)?;
    let decrypted_data = decrypt_data(&cipher, nonce_bytes, ciphertext)?;

    let json_str = String::from_utf8(decrypted_data).map_err(|e| e.to_string())?;
    Ok(json_str)
}

#[tauri::command]
fn create_vault(password: &str, new_vault: VaultEntry) -> Result<(), String> {
    let base_dir = config_dir().ok_or("No config directory found")?;
    let vault_dir = base_dir.join(VAULTS_FOLDER);
    let index_path = vault_dir.join("index.json");

    let data = fs::read(&index_path).map_err(|e| e.to_string())?;
    if data.len() < MIN_DATA_LEN {
        return Err("Corrupted vault file".into());
    }

    let salt_bytes = &data[0..SALT_LEN];
    let nonce_bytes = &data[SALT_LEN..SALT_LEN + NONCE_LEN];
    let ciphertext = &data[SALT_LEN + NONCE_LEN..];

    let cipher = derive_cipher(password, salt_bytes)?;
    let decrypted_data = decrypt_data(&cipher, nonce_bytes, ciphertext)?;

    let mut vaults: Vec<IdVaultEntry> =
        serde_json::from_slice(&decrypted_data).map_err(|e| format!("Invalid vault JSON"))?;

    let folder_id = gen_id(&vault_dir)?;
    let new_entry = IdVaultEntry {
        icon: new_vault.icon,
        name: new_vault.name,
        description: new_vault.description,
        folder_id: folder_id.clone(),
    };
    vaults.push(new_entry);

    let plaintext = serde_json::to_vec_pretty(&vaults).map_err(|e| e.to_string())?;
    let (new_nonce_bytes, new_ciphertext) = encrypt_data(&cipher, &plaintext)?;

    let mut output_data = Vec::new();
    output_data.extend_from_slice(salt_bytes);
    output_data.extend_from_slice(&new_nonce_bytes);
    output_data.extend_from_slice(&new_ciphertext);
    fs::write(&index_path, &output_data).map_err(|e| e.to_string())?;

    let new_vault_path = vault_dir.join(&folder_id);
    fs::create_dir_all(&new_vault_path).map_err(|e| format!("Failed to create vault folder"))?;

    let notes_json_data: Vec<serde_json::Value> = Vec::new(); // []
    let notes_json = serde_json::to_vec_pretty(&notes_json_data)
        .map_err(|e| format!("Failed to serialize index.json"))?;

    let (notes_nonce_bytes, encrypted_notes) = encrypt_data(&cipher, &notes_json)?;

    let mut notes_index_data = Vec::new();
    notes_index_data.extend_from_slice(&notes_nonce_bytes);
    notes_index_data.extend_from_slice(&encrypted_notes);

    let notes_index_path = new_vault_path.join("index.json");
    fs::write(&notes_index_path, notes_index_data)
        .map_err(|e| format!("Failed to write index.json"))?;

    Ok(())
}

#[tauri::command]
fn update_vault(
    password: &str,
    id: &str,
    name: String,
    description: String,
    icon: String,
) -> Result<(), String> {
    let base_dir = config_dir().ok_or("No config directory found")?;
    let vault_dir = base_dir.join(VAULTS_FOLDER);
    let index_path = vault_dir.join("index.json");

    let data = fs::read(&index_path).map_err(|e| e.to_string())?;
    if data.len() < MIN_DATA_LEN {
        return Err("Corrupted vault file".into());
    }

    let salt_bytes = &data[0..SALT_LEN];
    let nonce_bytes = &data[SALT_LEN..SALT_LEN + NONCE_LEN];
    let ciphertext = &data[SALT_LEN + NONCE_LEN..];

    let cipher = derive_cipher(password, salt_bytes)?;
    let decrypted_data = decrypt_data(&cipher, nonce_bytes, ciphertext)?;

    let mut vaults: Vec<IdVaultEntry> =
        serde_json::from_slice(&decrypted_data).map_err(|e| format!("Invalid vault JSON"))?;

    let mut updated = false;
    for vault in &mut vaults {
        if vault.folder_id == id {
            vault.name = name;
            vault.description = description;
            vault.icon = icon;
            updated = true;
            break;
        }
    }
    if !updated {
        return Err("Vault not found".into());
    }

    let plaintext = serde_json::to_vec_pretty(&vaults).map_err(|e| e.to_string())?;
    let (new_nonce_bytes, new_ciphertext) = encrypt_data(&cipher, &plaintext)?;

    let mut output_data = Vec::new();
    output_data.extend_from_slice(salt_bytes);
    output_data.extend_from_slice(&new_nonce_bytes);
    output_data.extend_from_slice(&new_ciphertext);
    fs::write(&index_path, &output_data).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn delete_vault(password: &str, folder_id: &str) -> Result<(), String> {
    let base_dir = config_dir().ok_or("No config directory found")?;
    let vault_dir = base_dir.join(VAULTS_FOLDER);
    let index_path = vault_dir.join("index.json");

    let data = fs::read(&index_path).map_err(|e| e.to_string())?;
    if data.len() < MIN_DATA_LEN {
        return Err("Corrupted vault index file".into());
    }

    let salt_bytes = &data[0..SALT_LEN];
    let nonce_bytes = &data[SALT_LEN..SALT_LEN + NONCE_LEN];
    let ciphertext = &data[SALT_LEN + NONCE_LEN..];

    let cipher = derive_cipher(password, salt_bytes)?;
    let decrypted_data = decrypt_data(&cipher, nonce_bytes, ciphertext)?;

    let mut vaults: Vec<IdVaultEntry> =
        serde_json::from_slice(&decrypted_data).map_err(|e| format!("Invalid vault JSON"))?;

    let initial_len = vaults.len();
    vaults.retain(|v| v.folder_id != folder_id);

    if vaults.len() == initial_len {
        return Err("Vault not found in index".into());
    }

    let plaintext = serde_json::to_vec_pretty(&vaults).map_err(|e| e.to_string())?;
    let (new_nonce_bytes, new_ciphertext) = encrypt_data(&cipher, &plaintext)?;

    let mut output_data = Vec::new();
    output_data.extend_from_slice(salt_bytes);
    output_data.extend_from_slice(&new_nonce_bytes);
    output_data.extend_from_slice(&new_ciphertext);
    fs::write(&index_path, &output_data).map_err(|e| e.to_string())?;

    let vault_path = vault_dir.join(&folder_id);
    if vault_path.exists() {
        fs::remove_dir_all(vault_path).map_err(|e| format!("Failed to delete vault folder"))?;
    }

    Ok(())
}

#[tauri::command]
fn get_vault_notes_number(foldername: &str) -> Result<usize, String> {
    let base_dir = config_dir()
        .ok_or("No config directory found")?
        .join(VAULTS_FOLDER)
        .join(foldername);

    if !base_dir.exists() || !base_dir.is_dir() {
        return Err("Folder does not exist or is not a directory".into());
    }

    let count = fs::read_dir(&base_dir)
        .map_err(|e| format!("Failed to read directory"))?
        .filter_map(|entry| entry.ok())
        .filter(|entry| {
            let path = entry.path();
            path.is_file()
                && path.extension().map(|ext| ext == "json").unwrap_or(false)
                && path
                    .file_name()
                    .map(|name| name != "index.json")
                    .unwrap_or(true)
        })
        .count();

    Ok(count)
}

fn gen_id(base_dir: &PathBuf) -> Result<String, String> {
    loop {
        let uuid = Uuid::new_v4().to_string();
        let candidate_path = base_dir.join(&uuid);

        if !candidate_path.exists() {
            return Ok(uuid);
        }
    }
}

#[tauri::command]
fn create_note(password: &str, vaultfolder: &str, icon: &str) -> Result<String, String> {
    let base_dir = config_dir().ok_or("No config directory found")?;
    let vault_dir = base_dir.join(VAULTS_FOLDER).join(vaultfolder);
    let notes_index_path = vault_dir.join("index.json");

    let encrypted_data = fs::read(&notes_index_path).map_err(|e| e.to_string())?;
    if encrypted_data.len() < NONCE_LEN {
        return Err("Corrupted index.json".into());
    }

    let root_index_path = base_dir.join(VAULTS_FOLDER).join("index.json");
    let root_data = fs::read(&root_index_path).map_err(|e| e.to_string())?;
    if root_data.len() < SALT_LEN {
        return Err("Corrupted global vault index".into());
    }
    let salt_bytes = &root_data[0..SALT_LEN];

    let cipher = derive_cipher(password, salt_bytes)?;

    let nonce_bytes = &encrypted_data[0..NONCE_LEN];
    let ciphertext = &encrypted_data[NONCE_LEN..];
    let decrypted = decrypt_data(&cipher, nonce_bytes, ciphertext)?;

    let mut notes_list: Vec<Value> = if decrypted.is_empty() {
        vec![]
    } else {
        serde_json::from_slice(&decrypted).map_err(|e| format!("Invalid JSON data"))?
    };

    let note_id = gen_id(&vault_dir)?;
    let note_filename = format!("{}.json", note_id);
    let note_path = vault_dir.join(&note_filename);
    let note_content = b"{}";

    let (note_nonce_bytes, encrypted_note) = encrypt_data(&cipher, note_content)?;

    let mut output_note = Vec::new();
    output_note.extend_from_slice(&note_nonce_bytes);
    output_note.extend_from_slice(&encrypted_note);
    fs::write(note_path, output_note).map_err(|e| format!("Failed to write note file"))?;

    let note_entry = json!({
        "notetitle": "",
        "filename": note_filename,
        "icon": icon
    });
    notes_list.push(note_entry);

    let updated_json = serde_json::to_vec(&notes_list).map_err(|e| e.to_string())?;
    let (new_nonce_bytes, new_encrypted_index) = encrypt_data(&cipher, &updated_json)?;

    let mut final_output = Vec::new();
    final_output.extend_from_slice(&new_nonce_bytes);
    final_output.extend_from_slice(&new_encrypted_index);
    fs::write(notes_index_path, final_output).map_err(|e| format!("Failed to write index.json"))?;

    Ok(note_filename)
}

#[tauri::command]
fn get_notes_index(password: &str, vaultfolder: &str) -> Result<String, String> {
    let base_dir = config_dir().ok_or("No config directory found")?;
    let vault_dir = base_dir.join(VAULTS_FOLDER).join(vaultfolder);
    let notes_index_path = vault_dir.join("index.json");

    let data = fs::read(&notes_index_path).map_err(|e| format!("Error reading index.json"))?;
    if data.len() < NONCE_LEN {
        return Err("Corrupted index.json".into());
    }

    let root_index_path = base_dir.join(VAULTS_FOLDER).join("index.json");
    let root_data = fs::read(&root_index_path).map_err(|e| e.to_string())?;
    if root_data.len() < SALT_LEN {
        return Err("Corrupted index.json".into());
    }
    let salt_bytes = &root_data[0..SALT_LEN];

    let cipher = derive_cipher(password, salt_bytes)?;

    let nonce_bytes = &data[0..NONCE_LEN];
    let ciphertext = &data[NONCE_LEN..];
    let decrypted = decrypt_data(&cipher, nonce_bytes, ciphertext)?;

    let json_str = String::from_utf8(decrypted).map_err(|e| format!("UTF-8 error."))?;

    Ok(json_str)
}

#[tauri::command]
fn save_note_data(
    password: &str,
    vaultfolder: &str,
    filename: &str,
    content: &str,
) -> Result<(), String> {
    let base_dir = config_dir().ok_or("No config directory found")?;
    let file_path: PathBuf = base_dir
        .join(VAULTS_FOLDER)
        .join(vaultfolder)
        .join(filename);

    let root_index_path = base_dir.join(VAULTS_FOLDER).join("index.json");
    let root_data = fs::read(&root_index_path).map_err(|e| e.to_string())?;
    if root_data.len() < SALT_LEN {
        return Err("Corrupted index.json".into());
    }
    let salt_bytes = &root_data[0..SALT_LEN];

    let cipher = derive_cipher(password, salt_bytes)?;

    let plaintext = content.as_bytes();
    let (nonce_bytes, encrypted) = encrypt_data(&cipher, plaintext)?;

    let mut output = Vec::new();
    output.extend_from_slice(&nonce_bytes);
    output.extend_from_slice(&encrypted);

    fs::write(&file_path, output).map_err(|e| format!("Error writing file"))?;

    Ok(())
}

#[tauri::command]
fn get_note_data(password: &str, vaultfolder: &str, filename: &str) -> Result<String, String> {
    let base_dir = config_dir().ok_or("No config directory found")?;
    let file_path: PathBuf = base_dir
        .join(VAULTS_FOLDER)
        .join(vaultfolder)
        .join(filename);

    let data = fs::read(&file_path).map_err(|e| format!("Error reading note"))?;
    if data.len() < NONCE_LEN {
        return Err("Corrupted file".into());
    }

    let root_index_path = base_dir.join(VAULTS_FOLDER).join("index.json");
    let root_data = fs::read(&root_index_path).map_err(|e| e.to_string())?;
    if root_data.len() < SALT_LEN {
        return Err("Corrupted index.json".into());
    }
    let salt_bytes = &root_data[0..SALT_LEN];

    let cipher = derive_cipher(password, salt_bytes)?;

    let nonce_bytes = &data[0..NONCE_LEN];
    let ciphertext = &data[NONCE_LEN..];
    let decrypted = decrypt_data(&cipher, nonce_bytes, ciphertext)?;

    String::from_utf8(decrypted).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_note_icon(
    password: &str,
    vaultfolder: &str,
    filename: &str,
    new_icon: &str,
) -> Result<(), String> {
    let base_dir = config_dir().ok_or("No config directory found")?;
    let vault_dir = base_dir.join(VAULTS_FOLDER).join(vaultfolder);
    let notes_index_path = vault_dir.join("index.json");

    let encrypted_data = fs::read(&notes_index_path).map_err(|e| e.to_string())?;
    if encrypted_data.len() < NONCE_LEN {
        return Err("Corrupted index.json".into());
    }

    let root_index_path = base_dir.join(VAULTS_FOLDER).join("index.json");
    let root_data = fs::read(&root_index_path).map_err(|e| e.to_string())?;
    if root_data.len() < SALT_LEN {
        return Err("Corrupted index.json".into());
    }
    let salt_bytes = &root_data[0..SALT_LEN];

    let cipher = derive_cipher(password, salt_bytes)?;

    let nonce_bytes = &encrypted_data[0..NONCE_LEN];
    let ciphertext = &encrypted_data[NONCE_LEN..];
    let decrypted = decrypt_data(&cipher, nonce_bytes, ciphertext)?;

    let mut notes_list: Vec<Value> = if decrypted.is_empty() {
        vec![]
    } else {
        serde_json::from_slice(&decrypted).map_err(|e| format!("Invalid JSON data"))?
    };

    let mut found = false;
    for note in notes_list.iter_mut() {
        if note.get("filename").and_then(|f| f.as_str()) == Some(filename) {
            note["icon"] = Value::String(new_icon.to_string());
            found = true;
            break;
        }
    }

    if !found {
        return Err(format!("Note not found"));
    }

    let updated_json = serde_json::to_vec(&notes_list).map_err(|e| e.to_string())?;
    let (new_nonce_bytes, new_encrypted_index) = encrypt_data(&cipher, &updated_json)?;

    let mut final_output = Vec::new();
    final_output.extend_from_slice(&new_nonce_bytes);
    final_output.extend_from_slice(&new_encrypted_index);
    fs::write(notes_index_path, final_output).map_err(|e| format!("Failed to write index.json"))?;

    Ok(())
}

#[tauri::command]
fn update_note_title(
    password: String,
    vaultfolder: &str,
    filename: &str,
    new_title: &str,
) -> Result<(), String> {
    let base_dir = config_dir().ok_or("No config directory found")?;
    let vault_dir = base_dir.join(VAULTS_FOLDER).join(vaultfolder);
    let notes_index_path = vault_dir.join("index.json");

    let encrypted_data = fs::read(&notes_index_path).map_err(|e| e.to_string())?;
    if encrypted_data.len() < NONCE_LEN {
        return Err("Corrupted index.json".into());
    }

    let root_index_path = base_dir.join(VAULTS_FOLDER).join("index.json");
    let root_data = fs::read(&root_index_path).map_err(|e| e.to_string())?;
    if root_data.len() < SALT_LEN {
        return Err("Corrupted index.json".into());
    }
    let salt_bytes = &root_data[0..SALT_LEN];

    let cipher = derive_cipher(&password, salt_bytes)?;
    let nonce_bytes = &encrypted_data[0..NONCE_LEN];
    let ciphertext = &encrypted_data[NONCE_LEN..];
    let decrypted = decrypt_data(&cipher, nonce_bytes, ciphertext)?;

    let mut notes_list: Vec<Value> = if decrypted.is_empty() {
        vec![]
    } else {
        serde_json::from_slice(&decrypted).map_err(|e| format!("Invalid JSON data"))?
    };

    let mut found = false;
    for note in notes_list.iter_mut() {
        if note.get("filename").and_then(|f| f.as_str()) == Some(filename) {
            note["notetitle"] = Value::String(new_title.to_string());
            found = true;
            break;
        }
    }
    if !found {
        return Err(format!("Note not found."));
    }

    let updated_json = serde_json::to_vec(&notes_list).map_err(|e| e.to_string())?;
    let (new_nonce_bytes, new_encrypted_index) = encrypt_data(&cipher, &updated_json)?;

    let mut final_output = Vec::new();
    final_output.extend_from_slice(&new_nonce_bytes);
    final_output.extend_from_slice(&new_encrypted_index);
    fs::write(notes_index_path, final_output).map_err(|e| format!("Failed to write index.json"))?;

    Ok(())
}

#[tauri::command]
fn delete_note(password: String, note_id: String, vault_folder: String) -> Result<(), String> {
    let base_dir = config_dir().ok_or("No config directory found")?;
    let vault_dir = base_dir.join(VAULTS_FOLDER).join(&vault_folder);
    let notes_index_path = vault_dir.join("index.json");

    let encrypted_data = fs::read(&notes_index_path).map_err(|e| e.to_string())?;
    if encrypted_data.len() < NONCE_LEN {
        return Err("Corrupted index.json".into());
    }

    let root_index_path = base_dir.join(VAULTS_FOLDER).join("index.json");
    let root_data = fs::read(&root_index_path).map_err(|e| e.to_string())?;
    if root_data.len() < MIN_DATA_LEN {
        return Err("Corrupted index.json".into());
    }
    let salt_bytes = &root_data[0..SALT_LEN];

    let cipher = derive_cipher(&password, salt_bytes)?;
    let nonce_bytes = &encrypted_data[0..NONCE_LEN];
    let ciphertext = &encrypted_data[NONCE_LEN..];
    let decrypted = decrypt_data(&cipher, nonce_bytes, ciphertext)?;

    let mut notes_list: Vec<Value> =
        serde_json::from_slice(&decrypted).map_err(|e| format!("Invalid index.json"))?;

    let initial_len = notes_list.len();
    notes_list.retain(|entry| entry["filename"] != note_id);
    if notes_list.len() == initial_len {
        return Err("Note not found in index.json".into());
    }

    let updated_json = serde_json::to_vec(&notes_list).map_err(|e| e.to_string())?;
    let (new_nonce_bytes, new_encrypted_index) = encrypt_data(&cipher, &updated_json)?;

    let mut final_output = Vec::new();
    final_output.extend_from_slice(&new_nonce_bytes);
    final_output.extend_from_slice(&new_encrypted_index);
    fs::write(&notes_index_path, final_output).map_err(|e| format!("Error writing index.json"))?;

    let note_path = vault_dir.join(&note_id);
    if note_path.exists() {
        fs::remove_file(&note_path).map_err(|e| format!("Error deleting note"))?;
    } else {
        return Err("Note not found".into());
    }

    Ok(())
}

#[tauri::command]
fn get_note_edit_date(vaultfolder: &str, filename: &str) -> Result<String, String> {
    let base_dir = config_dir().ok_or("No config directory found")?;
    let file_path: PathBuf = base_dir
        .join(VAULTS_FOLDER)
        .join(vaultfolder)
        .join(filename);

    let metadata = fs::metadata(&file_path).map_err(|e| format!("Error getting metadata"))?;
    let modified_time = metadata
        .modified()
        .map_err(|e| format!("Error getting date"))?;

    let duration = modified_time
        .duration_since(UNIX_EPOCH)
        .map_err(|e| e.to_string())?;
    let datetime: DateTime<Utc> = Utc.timestamp_opt(duration.as_secs() as i64, 0).unwrap();
    let datetime_local = datetime.with_timezone(&Local);

    let now = Local::now();

    let formatted = if datetime_local.date_naive() == now.date_naive() {
        "today".to_string()
    } else if datetime_local.year() == now.year() {
        format!(
            "on {} {}",
            datetime_local.format("%B"),
            datetime_local.day()
        )
    } else {
        format!(
            "on {} {} of {}",
            datetime_local.format("%B"),
            datetime_local.day(),
            datetime_local.year()
        )
    };

    Ok(formatted)
}

#[tauri::command]
fn reencrypt_data(
    old_password: &str,
    new_password: &str,
    new_hint: &str,
) -> Result<(), String> {
    use std::fs::{self, rename};
    use std::path::Path;

    let base_dir = config_dir().ok_or("No config directory found")?;
    let vaults_dir = base_dir.join(VAULTS_FOLDER);
    let tmp_vaults_dir = base_dir.join(format!("{}.tmp", VAULTS_FOLDER));
    let public_path = vaults_dir.join("public.json");

    if tmp_vaults_dir.exists() {
        fs::remove_dir_all(&tmp_vaults_dir).map_err(|e| e.to_string())?;
    }

    fs_extra::dir::copy(&vaults_dir, &tmp_vaults_dir, &fs_extra::dir::CopyOptions::new().content_only(true))
        .map_err(|e| format!("Failed to copy vault dir to tmp: {}", e))?;

    let tmp_index_path = tmp_vaults_dir.join("index.json");

    let data = fs::read(&tmp_index_path).map_err(|e| format!("Failed to read tmp index.json: {}", e))?;
    if data.len() < SALT_LEN + NONCE_LEN + 1 {
        return Err("Corrupted global index.json (too small)".into());
    }
    let old_salt = &data[0..SALT_LEN];
    let old_nonce = &data[SALT_LEN..SALT_LEN + NONCE_LEN];
    let old_ciphertext = &data[SALT_LEN + NONCE_LEN..];

    let old_cipher = derive_cipher(old_password, old_salt)?;
    let decrypted_data = decrypt_data(&old_cipher, old_nonce, old_ciphertext)
        .map_err(|e| format!("Failed decrypting global index with old password: {}", e))?;
    let vaults: Vec<IdVaultEntry> =
        serde_json::from_slice(&decrypted_data).map_err(|_| "Invalid global vault JSON".to_string())?;

    let mut new_salt = [0u8; SALT_LEN];
    OsRng.fill_bytes(&mut new_salt);
    let new_salt_slice = &new_salt[..];

    let new_cipher = derive_cipher(new_password, new_salt_slice)?;

    let process_file = |path: &Path, nonce_offset: usize| -> Result<(), String> {
        let file_data = fs::read(path).map_err(|e| format!("Failed to read file {}: {}", path.display(), e))?;
        if file_data.len() <= nonce_offset {
            return Ok(());
        }
        let nonce_bytes = &file_data[0..nonce_offset];
        let ciphertext = &file_data[nonce_offset..];

        let decrypted = decrypt_data(&old_cipher, nonce_bytes, ciphertext)
            .map_err(|e| format!("Decrypt failed for {}: {}", path.display(), e))?;

        let (new_nonce, new_ciphertext) = encrypt_data(&new_cipher, &decrypted)?;
        let mut new_file_data = Vec::with_capacity(new_nonce.len() + new_ciphertext.len());
        new_file_data.extend_from_slice(&new_nonce);
        new_file_data.extend_from_slice(&new_ciphertext);

        atomic_write(path, &new_file_data)
    };

    let plaintext = serde_json::to_vec_pretty(&vaults).map_err(|e| e.to_string())?;
    let (index_nonce, index_ciphertext) = encrypt_data(&new_cipher, &plaintext)?;
    let mut new_index_bytes = Vec::with_capacity(SALT_LEN + index_nonce.len() + index_ciphertext.len());
    new_index_bytes.extend_from_slice(new_salt_slice);
    new_index_bytes.extend_from_slice(&index_nonce);
    new_index_bytes.extend_from_slice(&index_ciphertext);

    atomic_write(&tmp_index_path, &new_index_bytes)?;

    for vault in &vaults {
        let vault_path = tmp_vaults_dir.join(&vault.folder_id);
        let vault_index_path = vault_path.join("index.json");

        if vault_index_path.exists() {
            process_file(&vault_index_path, NONCE_LEN)?;
        }

        for entry in fs::read_dir(&vault_path).map_err(|e| format!("Failed to read vault folder {}: {}", vault_path.display(), e))? {
            let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
            let path = entry.path();
            if path.is_file()
                && path.extension().and_then(OsStr::to_str).map(|ext| ext == "json").unwrap_or(false)
                && path.file_name().and_then(OsStr::to_str) != Some("index.json")
            {
                process_file(&path, NONCE_LEN)?;
            }
        }
    }

    let tmp_public_path = tmp_vaults_dir.join("public.json");
    if tmp_public_path.exists() {
        let mut public_data: serde_json::Value =
            serde_json::from_slice(&fs::read(&tmp_public_path).map_err(|e| format!("Failed to read tmp public.json: {}", e))?)
                .map_err(|e| format!("Failed to parse tmp public.json: {}", e))?;
        public_data["hint"] = serde_json::Value::String(new_hint.to_string());
        let new_public_json = serde_json::to_vec_pretty(&public_data).map_err(|e| format!("Failed to serialize public.json: {}", e))?;
        atomic_write(&tmp_public_path, &new_public_json)?;
    }

    let backup_dir = base_dir.join(format!("{}.bak", VAULTS_FOLDER));
    if backup_dir.exists() {
        fs::remove_dir_all(&backup_dir).map_err(|e| format!("Failed to remove existing backup: {}", e))?;
    }

    rename(&vaults_dir, &backup_dir).map_err(|e| format!("Failed to rename vaults to backup: {}", e))?;

    if let Err(e) = rename(&tmp_vaults_dir, &vaults_dir) {
        let _ = rename(&backup_dir, &vaults_dir);
        return Err(format!("Failed to move tmp into place: {}. Reverted.", e));
    }

    fs::remove_dir_all(&backup_dir).map_err(|e| format!("Failed to remove backup dir: {}", e))?;

    Ok(())
}



fn derive_cipher(password: &str, salt_bytes: &[u8]) -> Result<Aes256Gcm, String> {
    let mut key_bytes = [0u8; 32];
    make_argon2()?
        .hash_password_into(password.as_bytes(), salt_bytes, &mut key_bytes)
        .map_err(|e| e.to_string())?;
    Ok(Aes256Gcm::new_from_slice(&key_bytes).map_err(|e| e.to_string())?)
}

fn decrypt_data(
    cipher: &Aes256Gcm,
    nonce_bytes: &[u8],
    ciphertext: &[u8],
) -> Result<Vec<u8>, String> {
    let nonce = Nonce::from_slice(nonce_bytes);
    cipher
        .decrypt(nonce, ciphertext)
        .map_err(|_| "Decrypt failed".to_string())
}

fn encrypt_data(cipher: &Aes256Gcm, plaintext: &[u8]) -> Result<(Vec<u8>, Vec<u8>), String> {
    let mut nonce_bytes = [0u8; NONCE_LEN];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|e| e.to_string())?;
    Ok((nonce_bytes.to_vec(), ciphertext))
}


fn atomic_write(path: &Path, data: &[u8]) -> Result<(), String> {
    let tmp_path = path.with_extension("tmp");

    let mut f = File::create(&tmp_path).map_err(|e| e.to_string())?;
    f.write_all(data).map_err(|e| e.to_string())?;
    f.sync_all().map_err(|e| e.to_string())?;

    rename(&tmp_path, path).map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            read_public,
            set_password,
            get_vaults,
            create_vault,
            update_vault,
            delete_vault,
            get_vault_notes_number,
            create_note,
            get_notes_index,
            save_note_data,
            get_note_data,
            update_note_icon,
            update_note_title,
            delete_note,
            get_note_edit_date,
            reencrypt_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
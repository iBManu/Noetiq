import { useState, useEffect } from "react";
import MainView from "./components/MainView";
import VaultOpen from "./components/VaultOpen";
import "./styles/editor.css";
import LoginView from "./components/LoginView";
import SetPasswordView from "./components/SetPasswordView";
import { invoke } from '@tauri-apps/api/core';

interface PublicProps {
    hint: string,
}

function App() {
  const [vaultPath, setVaultPath] = useState<string | null>(null);
  const [vaultName, setVaultName] = useState<string>("");
  const [vaultId, setVaultId] = useState<string>("");

  const [hint, setHint] = useState<string>("");
  const [fileExist, setFileExist] = useState<boolean>(false);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
      invoke<string>("read_public")
      .then((result) => {
          const parsed = JSON.parse(result) as PublicProps;
          setFileExist(true);
          setHint(parsed.hint);
      })
      .catch((err) => {
          console.error("Error loading public.json:", err);
      });
  }, []);

  const onVaultClose = () => {
    setVaultPath(null);
    };

    useEffect(() => {
      const elements = document.querySelectorAll('input, textarea, [contenteditable]');
      elements.forEach(el => {
        el.setAttribute('spellcheck', 'false');
      });
    }, []);

  return (
    <>
      {vaultPath ? (
        <VaultOpen path={vaultPath} name={vaultName} id={vaultId} onVaultClose={onVaultClose} />
      ) : isLoggedIn ? (
        <MainView onVaultSelect={(path) => setVaultPath(path)} onVaultNameSet={setVaultName} onVaultIdSet={setVaultId} />
      ) : fileExist ? (
        <LoginView hint={hint} onLoginSuccess={() => setIsLoggedIn(true)} />
      ) : (
        <SetPasswordView />
      )}
    </>
  );  
}

export default App;


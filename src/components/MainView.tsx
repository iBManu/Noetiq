import { useState, useEffect } from "react";
import VaultAddIcon from "../../public/vault-add.svg?react"
import SettingsIcon from "../../public/settings.svg?react"
import VaultItem from "./VaultItem";
import CustomDialog from "./CustomDialog";
import NewVaultDialog from "./NewVaultDialog";
import VaultOptionsDialog from "./VaultOptionsDialog";
import OptionsDialog from "./OptionsDialog";
import { invoke } from '@tauri-apps/api/core';
import { join } from '@tauri-apps/api/path';
import { configDir } from '@tauri-apps/api/path';
import { usePassword } from "./PasswordContext";

interface Props {
  onVaultSelect: (path: string | null) => void;
  onVaultNameSet: (name: string) => void;
  onVaultIdSet: (id: string) => void;
}

interface VaultProps {
  icon: string;
  name: string;
  description: string;
  folder_id: string;
}

const MainView: React.FC<Props> = ({ onVaultSelect, onVaultNameSet, onVaultIdSet }) => {

  // REFACTOR THIS, PATHS SHOULDNT BE MANAGED IN FRONTEND
  const getVaultFolderPath = async (name: string) => {
    const baseDir = await configDir();
    return await join(baseDir, 'noetiq-vaults/' + name);
  };

  function addVault() {
    setIsNewVaultModalOpen(true);
  }

  function openOptions() {
    setIsOptionsModalOpen(true);
  }

  function vaultOptions(vault: VaultProps) {
    setSelectedVault(vault);
    setIsVaultOptionsModalOpen(true);
  }


  const [vaults, setVaults] = useState<VaultProps[]>([]);
  const [isNewVaultModalOpen, setIsNewVaultModalOpen] = useState(false);
  const [isVaultOptionsModalOpen, setIsVaultOptionsModalOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [selectedVault, setSelectedVault] = useState<VaultProps | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { password } = usePassword();

  const refreshVaults = () => {
    invoke<string>("get_vaults", { password })
      .then((result) => {
        const parsed = JSON.parse(result) as VaultProps[];
        setVaults(parsed);
      })
      .catch((err) => {
        console.error("Error loading vaults:", err);
      });
  };

  useEffect(() => {
    refreshVaults();
  }, []);

  const query = searchTerm.trim().toLowerCase();
  const filteredVaults = vaults.filter((vault) =>
    vault.name.toLowerCase().includes(query) ||
    vault.description.toLowerCase().includes(query)
  );

  const handleCloseNewVaultDialog = () => {
    setIsNewVaultModalOpen(false);
  }

  const handleCloseVaultOptionstDialog = () => {
    setIsVaultOptionsModalOpen(false);
  }

  return (
    <div className="App">
      <div id="mainview-container">
        <div id="mainview-topbar">
          <VaultAddIcon id="mainview-vaultadd-icon" className="icon" onClick={addVault} />
          <input type="text" placeholder="Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <SettingsIcon id="mainview-settings-icon" className="icon" onClick={openOptions} />
        </div>
        <div id="mainview-vaultgrid">
          {vaults.length === 0 ? (
            <p className="mainview-vaultgrid-infotext">
              📂 You don't have any vaults. Create one to get started.
            </p>

          ) : filteredVaults.length === 0 ? (
            <p className="mainview-vaultgrid-infotext">
              🔍 No results were found for your search.
            </p>
          ) : (
            filteredVaults.map((vault, index) => (
              <VaultItem
                key={index}
                {...vault}
                onClick={async () => {
                  const path = await getVaultFolderPath(vault.folder_id);
                  onVaultSelect(path);
                  onVaultNameSet(vault.name);
                  onVaultIdSet(vault.folder_id);
                }}
                vaultOptions={() => vaultOptions(vault)}
              />
            ))
          )}
        </div>

      </div>

      <CustomDialog isOpen={isNewVaultModalOpen} onClose={handleCloseNewVaultDialog}>
        <NewVaultDialog
          refreshVaults={refreshVaults}
          handleCloseDialog={handleCloseNewVaultDialog}
        />
      </CustomDialog>

      <CustomDialog isOpen={isVaultOptionsModalOpen} onClose={handleCloseVaultOptionstDialog}>
        {selectedVault && (
          <VaultOptionsDialog
            name={selectedVault.name}
            description={selectedVault.description}
            icon={selectedVault.icon}
            id={selectedVault.folder_id}
            refreshVaults={refreshVaults}
            handleCloseDialog={handleCloseVaultOptionstDialog}
          />
        )}
      </CustomDialog>

      <CustomDialog isOpen={isOptionsModalOpen} onClose={() => setIsOptionsModalOpen(false)}>
        <OptionsDialog />
      </CustomDialog>



    </div>
  );
};

export default MainView;

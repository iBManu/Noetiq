![Noetiq banner](banner.svg)


<h3 align="center"> Multi-platform encrypted note-taking app with block-style editor </h3>

> [!IMPORTANT]
> **Noetiq** is under active development. The app is fully functional, but some features are incomplete and you may encounter occasional bugs. Feel free to report any issues you find—it helps me improve!

## Features

**Noetiq** is a note-taking app that encrypts all the data to maintain a private and secure space to store your thoughts and ideas. 
  
Key features include:

  * **Vault management** – Create, edit and delete vaults, the containers of your notes.
  * **Notion-like editor** – Flexible block-based note editor for rich content.
  * **Local & encrypted storage** – All data is stored locally and encrypted using AES-256-GCM. Notes are decrypted only while being edited, then automatically re-encrypted for maximum security.
  * **Password-protected access** – Your password derives the encryption key, so only you can decrypt your notes.
  * **Lightweight & fast** – Built with Tauri for minimal resource usage and high performance.
  * **Clean and intuitive UI** – Polished interface for a smooth writing experience.

## Getting Started

You can download the app directly from the [Releases](https://github.com/iBManu/Noetiq/releases) section.

You can also build the app following the guide below.

### Prerequisites

You will need the following programs installed:

* **Node.js**
* **Rust** with **Cargo**

Check if they are installed by running: 

```
node -v
npm -v
rustc --version
cargo --version
```

You will also need to install **Tauri CLI** globally.

```
cargo install tauri-cli
```

#### System Dependencies

Platform-specific dependencies are also required.

##### Windows

* **Visual Studio with C++ Desktop Development workload** or **Build Tools for Visual Studio.**

##### Linux

```
sudo apt update
sudo apt install -y \
    libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev

```

##### macOS (not tested)

```
xcode-select --install
```

### Installation

Clone the repository and navigate into it.
```
git clone https://github.com/iBManu/Noetiq.git
cd ./Noetiq
```

Install project dependencies.

```
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install
```

Build the frontend.

```
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build
```

Build the Tauri app.

```
cargo tauri build
```

The executable files will be generated in:

* `src-tauri/target/release` → portable executable.

* `src-tauri/target/release/bundle` → installers.
  
### Development Mode

To run the app without building installers:
```
npm run tauri dev
```

## Roadmap

Looking ahead to version 1.0, the idea for **Noetiq** is to include the following features:

- [ ] Integration of more editor tools.
- [ ] Recycle Bin functionality to recover deleted notes.
- [ ] Export notes to HTML and PDF.
- [ ] Multilanguage support.
- [ ] UI improvements.
- [ ] Note sorting and search options.
- [ ] Automatic app block after inactivity.
- [ ] Keyboard shortcuts for faster navigation and editing
- [ ] General quality-of-life improvements.
- [ ] macOS support.
- [ ] Mobile support.
- [ ] Additional app themes.
- [ ] General code cleanup and refactoring.

And other ideas I come up with that fit the project.

## Contact

* Mail: [manu.camachoc@gmail.com](mailto:manu.camachoc@gmail.com)
* LinkedIn: [Manuel Camacho Campos](https://www.linkedin.com/in/manuel-camacho-campos-752678213/)

## License
This project is licensed under the terms of the **GNU GPLv3** license.

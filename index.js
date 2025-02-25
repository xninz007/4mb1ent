require("dotenv").config();
const fs = require("fs");
const { ethers } = require("ethers");
const { swapMonadToToken } = require("./ambientMONADToToken");
const moment = require("moment-timezone");

const RPC_URL = process.env.RPC_URL;
const provider = new ethers.JsonRpcProvider(RPC_URL);


const WALLET_FILE = "wallets.json";
const MIN_DELAY = 60 * 1000; // 1 menit dalam milidetik
const MAX_DELAY = 300 * 1000; // 5 menit dalam milidetik
const TOKENS = ["USDC", "WETH", "WBTC", "USDT", "ETH"]; // Token yang dipilih secara acak

// **📌 Fungsi untuk Memuat Wallets dari File JSON**
function loadWallets() {
    if (!fs.existsSync(WALLET_FILE)) {
        console.error("⚠️ File wallets.json tidak ditemukan!");
        process.exit(1);
    }

    const data = fs.readFileSync(WALLET_FILE, "utf8");
    try {
        const parsedData = JSON.parse(data);
        if (!Array.isArray(parsedData.wallets)) throw new Error("Format wallets.json tidak valid!");

        return parsedData.wallets.map(pk => String(pk)); // ✅ Konversi semua private key ke string
    } catch (error) {
        console.error("❌ Gagal membaca wallets.json:", error.message);
        process.exit(1);
    }
}


// **🔄 Fungsi Swap per Wallet dengan Delay**
async function processWallets(wallets, index = 0) {
    if (index >= wallets.length) {
        console.log("🔄 Semua wallet selesai, kembali ke wallet pertama...");
        index = 0; // Restart dari wallet pertama
    }

    const privateKey = String(wallets[index]).trim();
    if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey)) { // ✅ Validasi private key
        console.error(`❌ Private key invalid: ${privateKey}`);
        process.exit(1);
    }

    const wallet = new ethers.Wallet(privateKey, provider); // ✅ Gunakan wallet yang benar
    console.log(`🔄 Menggunakan wallet: ${wallet.address}`);

    const wibTime = moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss");
    const TARGET_TOKEN = TOKENS[Math.floor(Math.random() * TOKENS.length)]; // Pilih token acak

    console.log(`[${wibTime} WIB] 🔄 Running swap for wallet: ${wallet.address}`);

    try {
        const amountMonad = (Math.random() * (0.1 - 0.01) + 0.01).toFixed(4);
        console.log(`[${wibTime} WIB] 🔄 Swapping ${amountMonad} MONAD to ${TARGET_TOKEN} for ${wallet.address}`);

        // ✅ Pastikan swapMonadToToken menggunakan wallet yang benar
        await swapMonadToToken(TARGET_TOKEN, amountMonad, wallet);
        
        console.log(`[${wibTime} WIB] ✅ Swap berhasil untuk ${wallet.address}`);
    } catch (error) {
        console.error(`[${wibTime} WIB] ❌ Error swap untuk ${wallet.address}:`, error.message);
    }

    const delay = Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY) + MIN_DELAY);
    console.log(`⏳ Menunggu ${Math.round(delay / 1000)} detik sebelum lanjut ke wallet berikutnya...`);

    setTimeout(() => processWallets(wallets, index + 1), delay);
}


// **🛠️ Jalankan Bot**
async function runBot() {
    const wallets = loadWallets();
    console.log(`🚀 Memulai bot dengan ${wallets.length} wallet...`);
    processWallets(wallets);
}

runBot();

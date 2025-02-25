require("dotenv").config();
const { ethers } = require("ethers");
const moment = require("moment-timezone");

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// **📌 Mapping Token Address & Decimals**
const TOKEN_INFO = {
    "USDT": { address: "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D", decimals: 6 },
    "USDC": { address: "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea", decimals: 6 },
    "WETH": { address: "0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37", decimals: 18 },
    "ETH": { address: "0x836047a99e11F376522B447bffb6e3495Dd0637c", decimals: 18 },
    "WBTC": { address: "0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d", decimals: 8 },
};

const ROUTER_ADDRESS = "0x88b96af200c8a9c35442c8ac6cd3d22695aae4f0";
const CROC_IMPACT_ADDRESS = "0x70a6a0C905af5737aD73Ceba4e6158e995031d4B";
const POOL_IDX = 36000;
const MONAD_ADDRESS = ethers.ZeroAddress;

const CROC_IMPACT_ABI = [
    "function calcImpact(address base, address quote, uint256 poolIdx, bool isBuy, bool inBaseQty, uint128 qty, uint16 tip, uint128 limitPrice) view returns (int128 baseFlow, int128 quoteFlow, uint128 finalPrice)"
];

const ROUTER_ABI = [
    "function userCmd(uint16 callpath, bytes calldata cmd) public payable returns (bytes memory)"
];

const crocImpact = new ethers.Contract(CROC_IMPACT_ADDRESS, CROC_IMPACT_ABI, provider);
const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, wallet);

// **🔄 Fungsi Menghitung Estimasi Swap**
async function getSwapEstimate(base, quote, qty, decimals) {
    const wibTime = moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss");
    console.log(`[${wibTime} WIB] 🔍 Menghitung estimasi swap di pool ${POOL_IDX}...`);

    try {
        base = ethers.getAddress(base);
        quote = ethers.getAddress(quote);

        if (base.toLowerCase() > quote.toLowerCase()) {
            console.log(`[${wibTime} WIB] ⚠️ Urutan base & quote salah, menukar posisi.`);
            [base, quote] = [quote, base];
        }

        const tip = 0;
        let limitPrice = ethers.parseUnits("10", 18); // Limit awal

        const [baseFlow, quoteFlow, finalPrice] = await crocImpact.calcImpact(
            base, quote, POOL_IDX, true, true, qty, tip, limitPrice
        );

        console.log(`[${wibTime} WIB] ✅ Estimasi Berhasil!`);
        const estimatedOutput = ethers.formatUnits(quoteFlow, decimals);

        return { baseFlow, quoteFlow, finalPrice, estimatedOutput };
    } catch (error) {
        console.error(`[${wibTime} WIB] ❌ Gagal mendapatkan estimasi swap`);
        console.error(`[${wibTime} WIB] 🔥 Error:`, error.message);
        return null;
    }
}

// **🔄 Fungsi Swap MONAD ke Token Tujuan**
async function swapMonadToToken(tokenSymbol, amountMonad, wallet) {
    const provider = wallet.provider;
    const wibTime = moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss");

    if (!TOKEN_INFO[tokenSymbol]) {
        console.log(`[${wibTime} WIB] ❌ Token tidak valid!`);
        return;
    }

    const { address: outputToken, decimals } = TOKEN_INFO[tokenSymbol];
    console.log(`[${wibTime} WIB] 🔄 Menghitung estimasi swap ${amountMonad} MONAD ke ${tokenSymbol}...`);

    const qty = ethers.parseUnits(amountMonad.toString(), 18);
    const estimation = await getSwapEstimate(MONAD_ADDRESS, outputToken, qty, decimals);

    if (!estimation) {
        console.log(`[${wibTime} WIB] ❌ Swap dibatalkan karena gagal mendapatkan estimasi.`);
        return;
    }

    const { baseFlow, quoteFlow, finalPrice, estimatedOutput } = estimation;
    const limitPrice = finalPrice * 11n / 10n;
    const minOut = quoteFlow;

    const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, wallet.connect(provider));

    try {
        const tx = await router.userCmd(
            1, 
            ethers.AbiCoder.defaultAbiCoder().encode(
                ["address", "address", "uint256", "bool", "bool", "uint128", "uint16", "uint128", "uint128", "uint8"],
                [
                    MONAD_ADDRESS, outputToken, POOL_IDX,
                    true, true, qty, 0,
                    limitPrice, minOut, 0
                ]
            ),
            { value: qty, gasLimit: 750000, gasPrice: ethers.parseUnits("52", "gwei") }
        );

        console.log(`[${wibTime} WIB] ✅ Swap Transaction Sent: ${tx.hash}`);
        await tx.wait();
        console.log(`[${wibTime} WIB] 🎉 Swap Monad ke ${tokenSymbol} di Ambience Berhasil!`);
    } catch (error) {
        console.error(`[${wibTime} WIB] ❌ Swap Gagal!`);
        console.error(`🔥 Error:`, error.message);
    }
}

module.exports = { swapMonadToToken, getSwapEstimate };

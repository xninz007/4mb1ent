# Project Setup

## **1. Edit Configuration Files**

### **.env File**
Edit file `.env` dan masukkan private key wallet kamu. **Private key harus sama dengan private key pertama di `wallets.json`**.

```
PRIVATE_KEY=0xPK1.....
```

### **wallets.json File**
Edit file `wallets.json` dan masukkan private key wallet kamu dalam format berikut:

```json
{
  "wallets": [
    "0xPK1",
    "0xPK2"
  ]
}
```

## **2. Install Dependencies**
Jalankan perintah berikut untuk menginstal semua dependency yang dibutuhkan:


```sh
git clone https://github.com/xninz007/4mb1ent.git
cd 4mb1ent
npm install
```

## **3. Jalankan Program**
Setelah konfigurasi selesai, jalankan program dengan perintah berikut:

```sh
node index.js
```

## **Troubleshooting**
- Pastikan private key di `.env` sama dengan private key pertama di `wallets.json`.

  
## License

This project is licensed under the MIT License - see the LICENSE file for [details](https://github.com/xninz007/4mb1ent/blob/main/LICENSE).

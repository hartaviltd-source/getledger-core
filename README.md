# GetLedger Core

VPS Muhasebe Sistemi - Modern, güvenli ve kullanıcı dostu fatura yönetim sistemi.

## Özellikler

- 📊 **Dashboard** - Gelir, gider ve bakiye takibi
- 📄 **Fatura Yönetimi** - Satış ve alış faturaları
- 📱 **Mobil Uyumlu** - Responsive tasarım
- 📥 **Excel İçe/Dışa Aktarma** - Toplu veri işleme
- 🔒 **Güvenli** - JWT authentication, bcrypt şifreleme
- 💾 **SQLite Veritabanı** - Hafif ve hızlı

## Kurulum

### Gereksinimler
- Node.js 18+
- npm veya yarn

### Yerel Kurulum

```bash
# Bağımlılıkları yükle
npm install

# .env dosyası oluştur
echo "PORT=3000" > .env
echo "JWT_SECRET=your-secret-key-here" >> .env
echo "DB_PATH=./database.sqlite" >> .env

# Uygulamayı başlat
npm start
```

Uygulama http://localhost:3000 adresinde çalışacaktır.

### Varsayılan Giriş Bilgileri
- **Email:** admin@getledgercore.pro
- **Şifre:** admin123

⚠️ **Önemli:** İlk girişten sonra şifrenizi değiştirin!

## Deployment

### Render.com'a Deploy

1. GitHub'da yeni bir repository oluşturun
2. Bu kodu GitHub'a push edin:
```bash
git remote add origin https://github.com/KULLANICI_ADINIZ/getledger-core.git
git push -u origin main
```

3. [Render.com](https://render.com) hesabınıza giriş yapın
4. "New +" → "Web Service" seçin
5. GitHub repository'nizi bağlayın
6. Ayarlar:
   - **Name:** getledger-core
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:**
     - `JWT_SECRET`: (güçlü bir secret key)
     - `NODE_ENV`: production

### VPS'e Deploy

VPS deployment için `DEPLOYMENT.md` dosyasına bakın.

## Teknolojiler

### Backend
- Express.js
- SQLite3
- JWT Authentication
- bcryptjs
- Helmet (Security)
- Compression

### Frontend
- Vanilla JavaScript
- Tailwind CSS
- Chart.js
- XLSX.js

## API Endpoints

### Authentication
- `POST /api/auth/login` - Giriş yap

### Invoices
- `GET /api/invoices` - Tüm faturaları listele
- `GET /api/invoices?status=pending` - Duruma göre filtrele
- `POST /api/invoices` - Yeni fatura oluştur
- `DELETE /api/invoices/:id` - Fatura sil

### Stats
- `GET /api/stats` - Dashboard istatistikleri

### Import/Export
- `POST /api/import` - Excel'den içe aktar
- `GET /api/export?type=invoices` - Excel'e dışa aktar
- `GET /api/export?type=all` - Tam yedekleme (JSON)

## Lisans

MIT License

## Destek

Sorularınız için: admin@getledgercore.pro

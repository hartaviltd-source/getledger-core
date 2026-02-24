# GetLedger Core - Next Steps

## ✅ Completed Setup

Your GetLedger Core application is ready! Here's what has been set up:

### Local Development (C:\Users\enesk\)
- ✅ Backend server (server.js)
- ✅ Frontend (public/index.html)
- ✅ Dependencies installed (243 packages)
- ✅ PM2 process manager configured
- ✅ Application running on http://localhost:3000
- ✅ Database created (database.sqlite)

### Desktop Repository (C:\Users\enesk\Desktop\getledger-core\)
- ✅ Git repository initialized
- ✅ All files committed to 'main' branch
- ✅ .gitignore configured
- ✅ README.md created
- ✅ Ready for GitHub push

## 📋 Next Steps to Deploy

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `getledger-core`
3. Description: "VPS Muhasebe Sistemi - GetLedger Core"
4. Keep it **Public** or **Private** (your choice)
5. **DO NOT** initialize with README (we already have one)
6. Click "Create repository"

### Step 2: Push to GitHub

After creating the repository, run these commands in the terminal (already in the correct directory):

```bash
# Add your GitHub repository as remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/getledger-core.git

# Push to GitHub
git push -u origin main
```

**Note:** You may need to authenticate with GitHub. Use a Personal Access Token if prompted.

### Step 3: Deploy to Render.com (Free Hosting)

1. Go to https://render.com and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub account
4. Select the `getledger-core` repository
5. Configure:
   - **Name:** getledger-core
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

6. Add Environment Variables:
   - `JWT_SECRET`: Create a strong random string (e.g., use https://randomkeygen.com/)
   - `NODE_ENV`: production
   - `PORT`: 3000

7. Click "Create Web Service"

Your app will be live at: `https://getledger-core.onrender.com` (or similar)

### Step 4: Alternative - Deploy to VPS

If you prefer deploying to your own VPS, see the `DEPLOYMENT.md` file in C:\Users\enesk\ for complete instructions including:
- Nginx configuration
- SSL certificate setup
- Firewall configuration
- PM2 auto-startup

## 🔐 Security Reminders

1. **Change default password** after first login
2. **Use strong JWT_SECRET** in production
3. **Enable HTTPS** (automatic on Render, manual on VPS)
4. **Regular backups** of database.sqlite
5. **Keep dependencies updated**: `npm update`

## 📱 Access Your Application

### Local (Current)
- URL: http://localhost:3000
- Login: admin@getledgercore.pro / admin123

### After Deployment
- URL: Your Render URL or VPS domain
- Login: Same credentials (change password immediately!)

## 🛠️ Useful Commands

### Local Development
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs getledger

# Restart application
pm2 restart getledger

# Stop application
pm2 stop getledger
```

### Git Commands
```bash
# Check status
git status

# Add changes
git add .

# Commit changes
git commit -m "Your message"

# Push to GitHub
git push origin main
```

## 📚 Documentation

- **README.md** - Project overview and setup
- **DEPLOYMENT.md** - VPS deployment guide (in C:\Users\enesk\)
- **API Documentation** - See README.md for endpoints

## 🆘 Troubleshooting

### Application won't start
```bash
cd C:\Users\enesk
pm2 logs getledger
```

### Port already in use
```bash
pm2 stop getledger
pm2 start server.js --name "getledger"
```

### Database issues
Delete `database.sqlite` and restart - it will recreate with default admin user.

## 📞 Support

For questions or issues:
- Email: admin@getledgercore.pro
- Check logs: `pm2 logs getledger`

---

**Ready to deploy?** Follow Step 1 above to create your GitHub repository!

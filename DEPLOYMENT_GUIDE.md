# BiteAlert Deployment Guide for Render

## Prerequisites
1. GitHub account with your BiteAlert repository
2. Render account (free tier available)
3. MongoDB Atlas account (free tier available)

## Step 1: Prepare Your Repository

### 1.1 Environment Variables
Create a `.env` file in your project root with the following variables:

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.8xqjq.mongodb.net/bitealert?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
GOOGLE_AI_API_KEY=your-google-ai-api-key
```

### 1.2 Update server.js
Make sure your server.js serves the React build files in production:

```javascript
// Add this to your server.js
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}
```

## Step 2: Deploy to Render

### 2.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Connect your GitHub repository

### 2.2 Deploy Backend Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `bitealert-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free

4. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `MONGODB_URI` = Your MongoDB connection string
   - `JWT_SECRET` = Generate a random string
   - `EMAIL_USER` = Your Gmail address
   - `EMAIL_PASS` = Your Gmail app password
   - `GOOGLE_MAPS_API_KEY` = Your Google Maps API key
   - `GOOGLE_AI_API_KEY` = Your Google AI API key

5. Click "Create Web Service"

### 2.3 Deploy Frontend Service
1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `bitealert-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
   - **Plan**: Free

4. Add Environment Variables:
   - `REACT_APP_API_URL` = `https://bitealert-backend.onrender.com`

5. Click "Create Static Site"

## Step 3: Configure MongoDB Atlas

### 3.1 Create Database
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster (free tier)
3. Create a database named `bitealert`
4. Create collections as needed

### 3.2 Network Access
1. Go to Network Access
2. Add IP Address: `0.0.0.0/0` (allow all IPs)
3. Or add Render's IP ranges

### 3.3 Database User
1. Go to Database Access
2. Create a new user with read/write permissions
3. Use this user in your connection string

## Step 4: Update Frontend API URLs

Update your frontend code to use the production API URL:

```javascript
// In your API calls, use:
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
```

## Step 5: Test Deployment

1. Wait for both services to deploy (5-10 minutes)
2. Test the frontend URL
3. Test API endpoints
4. Check logs for any errors

## Troubleshooting

### Common Issues:
1. **Build Failures**: Check build logs for missing dependencies
2. **API Connection Issues**: Verify environment variables
3. **Database Connection**: Check MongoDB connection string
4. **CORS Issues**: Ensure CORS is configured for production domain

### Render Free Tier Limitations:
- Services sleep after 15 minutes of inactivity
- Cold start takes 30-60 seconds
- 750 hours per month limit

## Custom Domain (Optional)
1. Go to your service settings
2. Add custom domain
3. Update DNS records
4. Enable SSL certificate

## Monitoring
- Check Render dashboard for service status
- Monitor logs for errors
- Set up uptime monitoring

## Backup Strategy
- Regular MongoDB Atlas backups
- Code repository backups on GitHub
- Environment variables documentation

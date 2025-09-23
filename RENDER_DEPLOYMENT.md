# Render Deployment Guide for BiteAlert

This guide will help you deploy your BiteAlert application on Render with separate backend and frontend services.

## Prerequisites

1. A GitHub account with your code repository
2. A Render account (free tier available)
3. MongoDB Atlas database (or your preferred MongoDB hosting)
4. Google API key for Gemini AI features
5. Email service credentials (for notifications)

## Step 1: Prepare Your Repository

Make sure your repository is pushed to GitHub with all the changes from this guide.

## Step 2: Deploy Backend Service

1. **Go to Render Dashboard**
   - Visit [render.com](https://render.com)
   - Sign in to your account

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repository

3. **Configure Backend Service**
   - **Name**: `bitealert-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free (or choose based on your needs)

4. **Environment Variables for Backend**
   Add these environment variables in Render dashboard:
   ```
   NODE_ENV=production
   API_PORT=10000
   MONGODB_URI=your_mongodb_connection_string
   GOOGLE_API_KEY=your_google_api_key
   EMAIL_USER=your_email_username
   EMAIL_PASS=your_email_password
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note your backend URL (e.g., `https://bitealert-backend.onrender.com`)

## Step 3: Deploy Frontend Service

1. **Create New Static Site**
   - Click "New +" → "Static Site"
   - Connect your GitHub repository

2. **Configure Frontend Service**
   - **Name**: `bitealert-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`

3. **Environment Variables for Frontend**
   Add this environment variable:
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com
   ```
   Replace `your-backend-url.onrender.com` with your actual backend URL from Step 2.

4. **Deploy**
   - Click "Create Static Site"
   - Wait for deployment to complete

## Step 4: Update API Configuration (Optional)

If you want to update more components to use the centralized API configuration, you can:

1. Import the API configuration in your components:
   ```javascript
   import { apiFetch, apiConfig } from '../config/api';
   ```

2. Replace direct fetch calls:
   ```javascript
   // Before
   const res = await fetch('/api/endpoint');
   
   // After
   const res = await apiFetch(apiConfig.endpoints.endpointName);
   ```

## Step 5: Environment Variables Reference

### Backend Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | Yes | `production` |
| `API_PORT` | Port for backend service | Yes | `10000` |
| `MONGODB_URI` | MongoDB connection string | Yes | `mongodb+srv://...` |
| `GOOGLE_API_KEY` | Google Gemini API key | No* | `AIza...` |
| `EMAIL_USER` | Email service username | No* | `your-email@domain.com` |
| `EMAIL_PASS` | Email service password | No* | `your-password` |

*Required for specific features

### Frontend Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `REACT_APP_API_URL` | Backend API URL | Yes | `https://bitealert-backend.onrender.com` |

## Step 6: Custom Domain (Optional)

1. **Backend Custom Domain**
   - Go to your backend service settings
   - Add your custom domain (e.g., `api.yourdomain.com`)
   - Update DNS records as instructed

2. **Frontend Custom Domain**
   - Go to your frontend service settings
   - Add your custom domain (e.g., `app.yourdomain.com`)
   - Update DNS records as instructed

## Step 7: SSL and Security

Render automatically provides SSL certificates for all services. Your applications will be accessible via HTTPS.

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all dependencies are in `package.json`
   - Verify build commands are correct
   - Check Render build logs for specific errors

2. **Backend Connection Issues**
   - Verify MongoDB URI is correct
   - Check that all environment variables are set
   - Ensure backend is accessible via HTTPS

3. **Frontend API Issues**
   - Verify `REACT_APP_API_URL` is set correctly
   - Check that backend URL is accessible
   - Look for CORS issues in browser console

### Render Free Tier Limitations

- Services may sleep after 15 minutes of inactivity
- Cold starts can take 30-60 seconds
- Limited to 750 hours per month
- Consider upgrading for production use

## Monitoring and Maintenance

1. **Health Checks**
   - Backend health endpoint: `https://your-backend.onrender.com/api/health`
   - Monitor service status in Render dashboard

2. **Logs**
   - Access logs in Render dashboard
   - Set up alerts for errors

3. **Updates**
   - Push changes to GitHub
   - Render will automatically redeploy

## Cost Optimization

1. **Free Tier Usage**
   - Monitor usage in Render dashboard
   - Optimize for cold start times

2. **Upgrading**
   - Consider paid plans for production
   - Better performance and reliability

## Support

- Render Documentation: [render.com/docs](https://render.com/docs)
- Render Support: Available in dashboard
- GitHub Issues: For code-related problems

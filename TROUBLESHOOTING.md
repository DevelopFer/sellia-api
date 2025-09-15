# Digital Ocean Deployment Troubleshooting

## Issue Fixed: "Cannot find module '/usr/src/app/dist/main.js'"

### Root Cause:
The NestJS build process creates the main.js file at `dist/src/main.js`, not `dist/main.js`.

### Solution Applied:
1. **Updated Dockerfile CMD**: Changed from `node dist/main.js` to `node dist/src/main.js`
2. **Updated package.json**: Fixed `start:prod` script to use correct path
3. **Updated app.yaml**: Corrected repository name and branch

### For Digital Ocean Deployment:

#### Option 1: Use the updated production Dockerfile
- Main Dockerfile now uses correct path: `dist/src/main.js`
- Multi-stage build for optimized production image

#### Option 2: Use the simpler Dockerfile.production
- Single-stage build (easier to debug)
- Use this in Digital Ocean by specifying `dockerfile_path: api/Dockerfile.production`

### Environment Variables Required:
```
NODE_ENV=production
PORT=3000
DATABASE_URL=mongodb+srv://your-connection-string
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
```

### Deployment Steps:
1. Push changes to your main branch
2. In Digital Ocean Apps dashboard:
   - Select your app
   - Go to Settings → App Spec
   - Ensure source points to correct repository and branch
   - Set required environment variables
   - Deploy

### If build still fails:
1. Check build logs for missing dependencies
2. Verify all environment variables are set
3. Ensure MongoDB connection string is accessible from Digital Ocean
4. Check that OpenAI API key has sufficient credits/permissions

### Local Testing:
```bash
# Test build
npm run build

# Test production start (after build)
npm run start:prod

# Verify output file exists
ls -la dist/src/main.js
```
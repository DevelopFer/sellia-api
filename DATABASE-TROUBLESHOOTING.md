# MongoDB Database Connection Troubleshooting

## Current Setup Analysis ✅

Your configuration is mostly correct:
- ✅ Prisma schema configured for MongoDB
- ✅ Environment variable (`DATABASE_URL`) properly referenced
- ✅ Digital Ocean managed MongoDB database defined in app.yaml

## Potential Issues and Solutions

### Issue 1: Database URL Not Populated

**Check this in Digital Ocean Dashboard:**

1. **Go to your API app in Digital Ocean**
2. **Navigate to Settings → Environment Variables**
3. **Look for `DATABASE_URL`** - it should be automatically populated

**If `DATABASE_URL` is missing or empty:**

1. **Go to your app's Settings → App Spec**
2. **Check the database connection:**
   ```yaml
   databases:
   - name: sellia-mongodb
     engine: MONGODB
     version: "6"
   ```
3. **Verify the database is actually created and running**

### Issue 2: Database Not Initialized

**Even if connected, your database might be empty. You need to:**

1. **Push your Prisma schema to the database:**
   ```bash
   npx prisma db push
   ```

2. **Or in production, this should happen automatically during deployment**

### Issue 3: MongoDB Connection String Format

**Digital Ocean MongoDB URLs typically look like:**
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

**If you're using external MongoDB (like Atlas), set it manually:**
```
DATABASE_URL="mongodb+srv://username:password@your-cluster.mongodb.net/sellia?retryWrites=true&w=majority"
```

## Debugging Steps

### Step 1: Check Database Connection in Logs

**In Digital Ocean:**
1. Go to your API app
2. Check **Runtime Logs**
3. Look for database connection errors

**Common error messages:**
- `MongoServerError: Authentication failed`
- `MongoNetworkError: failed to connect`
- `ENOTFOUND` - DNS resolution issues

### Step 2: Test Database Connection

**Add this temporary endpoint to test connection:**

Create `src/health/health.controller.ts`:
```typescript
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get('db')
  async checkDatabase() {
    try {
      // Try to connect and count users
      const userCount = await this.prisma.user.count();
      return {
        status: 'connected',
        userCount,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
```

**Then visit:** `https://your-api-url.ondigitalocean.app/api/health/db`

### Step 3: Manual Database Setup (If Needed)

**If using external MongoDB:**

1. **Create MongoDB Atlas cluster** (free tier available)
2. **Get connection string**
3. **Set in Digital Ocean environment variables:**
   ```
   DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/sellia
   ```

## Current Config Validation

**Your setup should work if:**
- ✅ MongoDB database is created and running in Digital Ocean
- ✅ `DATABASE_URL` environment variable is populated
- ✅ Prisma schema has been pushed to database

## Next Steps

1. **Check Digital Ocean logs** for connection errors
2. **Verify `DATABASE_URL` is set** in environment variables
3. **Test the health endpoint** to confirm connection
4. **Push schema to database** if needed

## Alternative: Use MongoDB Atlas

**If Digital Ocean MongoDB is causing issues:**

1. **Create free MongoDB Atlas cluster**
2. **Get connection string**
3. **Update environment variable in Digital Ocean**
4. **More reliable and feature-rich**

Would you like me to help you implement any of these solutions?
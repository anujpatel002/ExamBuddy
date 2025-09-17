# Free Domain Setup for ExamBuddy

## Option 1: Freenom (Completely Free)

### Step 1: Get Free Domain
1. Visit [Freenom](https://www.freenom.com)
2. Search for your desired domain name
3. Select from free extensions: `.tk`, `.ml`, `.ga`, `.cf`
4. Register for free (up to 12 months)

### Step 2: Configure DNS
1. Go to Freenom dashboard → Manage Domain → Management Tools → Nameservers
2. Use Google Cloud DNS:
   - Create DNS zone in Google Cloud Console
   - Copy the nameserver addresses
   - Update Freenom nameservers

### Step 3: Set up Custom Domain in Cloud Run
```bash
# Map domain to Cloud Run service
gcloud run domain-mappings create \
  --service exambuddy-frontend \
  --domain yourdomain.tk \
  --region us-central1
```

## Option 2: GitHub Pages + Custom Domain

### Step 1: Deploy to GitHub Pages
1. Push your frontend build to GitHub repository
2. Enable GitHub Pages in repository settings
3. Use `username.github.io/repository-name`

### Step 2: Get Free Subdomain
- Use services like:
  - `js.org` (for JavaScript projects)
  - `is-a.dev` (for developers)
  - `thedev.id` (for developers)

## Option 3: Netlify (Free Tier)

### Step 1: Deploy to Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy frontend
cd frontend
npm run build
netlify deploy --prod --dir=.next
```

### Step 2: Custom Domain
1. Get free domain from Freenom
2. Configure DNS in Netlify dashboard
3. Enable HTTPS (automatic)

## Option 4: Vercel (Free Tier)

### Step 1: Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
cd frontend
vercel --prod
```

### Step 2: Custom Domain
1. Add custom domain in Vercel dashboard
2. Configure DNS records
3. SSL is automatic

## Recommended Setup

For **ExamBuddy**, I recommend:

1. **Backend**: Google Cloud Run (pay-as-you-go)
2. **Frontend**: Vercel (free tier)
3. **Domain**: Freenom free domain (.tk, .ml, .ga, .cf)

### Why This Combination?
- ✅ Completely free for small traffic
- ✅ Automatic SSL certificates
- ✅ Global CDN for frontend
- ✅ Serverless scaling
- ✅ Easy deployment and updates

## DNS Configuration Example

For domain `exambuddy.tk`:

```
Type    Name    Value
A       @       [Vercel IP]
CNAME   www     exambuddy.tk
CNAME   api     exambuddy-backend-xxx.a.run.app
```

## Environment Variables

Update your frontend environment:

```bash
# .env.production
NEXT_PUBLIC_API_URL=https://api.exambuddy.tk
```

## SSL Certificate

All recommended platforms provide automatic SSL:
- Vercel: Automatic Let's Encrypt
- Netlify: Automatic Let's Encrypt  
- Cloud Run: Google-managed certificates
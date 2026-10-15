# ReplyDesk - setup (all free tiers to start)

## 1. Accounts
- GitHub (host code), Vercel (hosting), Upstash (free Redis database), Anthropic Console (API key), Gumroad (selling).

## 2. Gumroad product
- Create a product with a **membership/subscription** ($29/month). Enable **license keys** on it.
- In the product's "Content" add text: "Open https://YOUR-SITE/dashboard and enter your license key."
- Copy the product's ID (Gumroad > product > Settings/API area) and its public URL.
- In index.html replace `GUMROAD_PRODUCT_URL` with your product URL.

## 3. Deploy
1. Push this folder to a GitHub repo, import it in Vercel, Deploy.
2. In Vercel > Settings > Environment Variables add:
   - ANTHROPIC_API_KEY  (console.anthropic.com)
   - UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN  (Upstash database > REST API; or add Upstash from Vercel Marketplace)
   - GUMROAD_PRODUCT_ID
   - DEV_LICENSE_KEY  (optional: any 8+ char secret so you can test the dashboard without buying)
   - MONTHLY_CAP  (optional, default 1500 messages per customer per month)
3. Redeploy.

## 4. Test before selling
- Open /dashboard, sign in with your DEV_LICENSE_KEY, fill in a business, open the link /c/your-name, chat with it.
- Then buy your own product once on Gumroad and sign in with the real key. REMOVE DEV_LICENSE_KEY before launch.

## Notes
- The license is re-checked every 10 minutes; cancelled/refunded subscriptions stop working.
- Each customer's license key is stored in your private Redis database to re-check the subscription. Keep your Upstash token secret.
- Add a privacy policy and terms page before selling. WhatsApp integration is not included yet.

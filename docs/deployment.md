# Deployment Guide — twaalfprovincies.run
**Clever Cloud (Paris) + TransIP DNS**

---

## Step 1 — Create a Clever Cloud account

1. Go to **console.clever-cloud.com**
2. Sign up — easiest to use your GitHub account so linking your repo later is seamless
3. Verify your email

---

## Step 2 — Create a Node.js application

1. In the console, click **"Create" → "An application"**
2. Select **Node.js** as the runtime
3. Choose **region: Paris (par1)**
4. Name it `twaalfprovincies`
5. On the add-ons screen — skip everything, you're using Supabase for data
6. On the environment variables screen — skip for now, you'll fill these in next
7. Finish the wizard

---

## Step 3 — Set environment variables

In your app dashboard go to **"Environment variables"** and add:

| Key | Value |
|---|---|
| `CC_NODE_BUILD_TOOL` | `pnpm` |
| `CC_POST_BUILD_HOOK` | `pnpm build` |
| `CC_RUN_COMMAND` | `node .output/server/index.mjs` |
| `CC_NODE_VERSION` | `22` |
| `NODE_ENV` | `production` |
| `SUPABASE_URL` | *(your Supabase project URL)* |
| `SUPABASE_KEY` | *(your Supabase anon key)* |

---

## Step 4 — Connect your GitHub repo

1. In the app dashboard go to **"Deployment" → "Git"**
2. Click **"Connect to GitHub"** — authorise Clever Cloud if prompted
3. Select the `detwaalf` repository and branch `master`
4. Clever Cloud sets up a webhook — every push to `master` triggers a new deployment automatically

---

## Step 5 — Set the instance size

Nuxt builds are memory-hungry. In **"Scalability"**, set vertical scaling to **S** (2 GiB RAM). If the build fails with out-of-memory errors, bump it to **M** (4 GiB).

Once you've had a successful build, you can scale down to XS for cheaper runtime costs — just remember to scale back up before the next deploy.

---

## Step 6 — First deploy

Either push a commit to `master`, or click **"Re-deploy"** in the dashboard. Watch the build logs under **"Activity"**. First build takes a few minutes. You're looking for:

```
Build succeeded
Application started
```

Test the app on the Clever Cloud subdomain (e.g. `https://app-xxxx.cleverapps.io`) before touching DNS.

---

## Step 7 — Add your domain in Clever Cloud

1. In the app dashboard go to **"Domain names"**
2. Add `twaalfprovincies.run`
3. Add `www.twaalfprovincies.run`
4. Clever Cloud shows you a DNS target — looks like `twaalfprovincies.run.par.clever-cloud.com` — copy this
5. SSL certificates are issued automatically via Let's Encrypt within ~10 minutes of DNS propagating

---

## Step 8 — Configure DNS in TransIP

Log into **transip.nl → Mijn Domeinen → twaalfprovincies.run → DNS beheer**.

Lower the TTL on all existing records to **60 seconds** first — makes propagation faster.

Delete any existing A records or placeholder records for `@` and `www`, then add:

| Type | Naam | Waarde | TTL |
|---|---|---|---|
| CNAME | `@` | `twaalfprovincies.run.par.clever-cloud.com.` | 60 |
| CNAME | `www` | `twaalfprovincies.run.par.clever-cloud.com.` | 60 |

> TransIP supports CNAME on the root (`@`) via CNAME flattening — no A record workaround needed.

---

## Step 9 — Wait and verify

DNS propagation takes anywhere from a few minutes to a few hours. Check with:

```bash
nslookup twaalfprovincies.run
nslookup www.twaalfprovincies.run
```

Both should resolve to Clever Cloud's servers. Once they do, HTTPS kicks in automatically.

---

## Step 10 — Force HTTPS

In Clever Cloud dashboard → **"Domain names"** → enable **"Force HTTPS"**.

---

## Step 11 — Add production URL to Supabase

In **Supabase dashboard → Authentication → URL Configuration**:

| Setting | Value |
|---|---|
| Site URL | `https://twaalfprovincies.run` |
| Redirect URLs | `https://twaalfprovincies.run/confirm` |
| | `https://www.twaalfprovincies.run/confirm` |

Without this, email confirmation links won't work in production.

---

## Checklist

- [ ] Clever Cloud account created
- [ ] Node.js app created in Paris region
- [ ] Environment variables set (including `SUPABASE_URL` + `SUPABASE_KEY`)
- [ ] GitHub repo connected to `master` branch
- [ ] Instance size set to S or M (for builds)
- [ ] First build successful on `*.cleverapps.io`
- [ ] Both domains added in Clever Cloud domain names
- [ ] DNS CNAME records set in TransIP for `@` and `www`
- [ ] HTTPS working on `twaalfprovincies.run`
- [ ] Force HTTPS enabled
- [ ] Production URL + redirect URLs added in Supabase dashboard

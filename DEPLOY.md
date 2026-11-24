# Hosting the Inventory app on AWS: a beginner's guide

This guide puts the app on the internet with **one AWS server**. After setup, every push to `main` updates the website automatically.

---

## Part A: The big picture

```
 You (laptop)                 GitHub                          AWS EC2 server (Ubuntu Linux)
 ────────────                 ──────                          ─────────────────────────────
 git push  ───────────►  repo "hosting"
                         │
                         └─► GitHub Actions  ── SSH ──►  runs deploy/deploy.sh:
                             (the CI/CD robot)              1. git pull the new code
                                                            2. npm ci (install packages)
                                                            3. npm run build (React → frontend/dist)
                                                            4. systemctl restart inventory
                                                                        │
 Visitors ── http://<server-ip> ──────────────────────────►  Node/Express on port 80
                                                             ├── /product   → API ──► MongoDB Atlas
                                                             ├── /uploads   → pictures (on the server disk)
                                                             └── everything else → the React website
```

There is **one server and one program**. Express serves the API, the pictures and the built React website, all from the same address. So there is no separate frontend hosting, no nginx and no pm2.

---

## Part B: Concepts you need (read once, come back any time)

| Concept | What it means here |
|---|---|
| **Cloud / AWS** | Renting computers from Amazon instead of owning them. You pay for what you use. |
| **Region** | The city where your server lives, for example *Asia Pacific (Mumbai)*. Choose one near your users. Everything you create lives in that region, so always check the region selector (top right) in the AWS console. |
| **EC2** | "Elastic Compute Cloud", the AWS service for renting virtual computers. |
| **Instance** | One rented computer, your server. |
| **AMI** | The operating system image the instance starts from. We use **Ubuntu Server 24.04 LTS**. |
| **Instance type** | The size of the computer (CPU and RAM). `t3.micro` (or `t2.micro`) is small and is free-tier eligible. |
| **Key pair (.pem file)** | Your password for the server, as a file. AWS keeps the lock (the public key) and you download the key (the private key). Lose it and you can't SSH in. Never share it or commit it. |
| **SSH** | "Secure Shell". It lets you type commands on the server from your laptop: `ssh -i key.pem ubuntu@IP`. |
| **Security group** | The server's firewall: a list of which ports are open to the internet. We open **22** (SSH) and **80** (website). |
| **Port** | A numbered "door" on a computer. 80 is the default for websites (`http://`), and 22 is for SSH. Locally your backend uses 8000; on the server it uses 80. |
| **Public IP** | The internet address of your server, for example `13.233.10.20`. **It changes if you Stop and Start the instance** (see Part E). |
| **Linux basics** | `sudo` means "run as admin", `apt` is the app installer, and `nano` is a simple text editor (Ctrl+O saves, Enter confirms, Ctrl+X exits). |
| **systemd service** | Linux's built-in way to keep a program running. It starts your app at boot and restarts it if it crashes. It replaces pm2, and our file is `deploy/inventory.service`. |
| **Build** | `npm run build` turns the React source code into plain HTML, CSS and JS files in `frontend/dist`, and Express serves those files. |
| **.env / secrets** | Passwords (like your MongoDB URL) never go into Git. You type them into a `.env` file **on the server** once. |
| **MongoDB Atlas IP access list** | Atlas only lets in addresses you allow. You must add your server's IP. |
| **Deploy key** | Your repo is private, so the server needs permission to `git pull`. A deploy key is a read-only SSH key for **one** repo. |
| **CI/CD** | *Continuous Integration / Continuous Deployment*: a robot automatically does the deploy steps every time you push. |
| **GitHub Actions** | GitHub's robot. You describe the job in a **workflow** file (`.github/workflows/deploy.yml`). A workflow has **jobs**, a job has **steps**, and they run on a temporary GitHub computer called a **runner**. |
| **GitHub Secrets** | A safe place in GitHub settings for passwords that workflows need. We store the server IP and the `.pem` key there. |
| **Free tier / billing** | New accounts get free usage or credits for a limited time. Anything beyond that costs money, so **set a budget alert first** (Step 0). |

### The files in this repo that make deployment work

| File | Job |
|---|---|
| `.github/workflows/deploy.yml` | GitHub Actions: on every push to `main`, SSH into the server and run `deploy.sh`. |
| `deploy/deploy.sh` | Runs on the server: pull code, install packages, build React, restart the app. |
| `deploy/inventory.service` | Tells systemd how to run the app (`node index.js` on port 80, auto-restart). |
| `Backend/index.js` | Uses `PORT` from the environment and serves `frontend/dist` (the built website). |
| `frontend/vite.config.js` | Only for local development: forwards `/product` and `/uploads` from Vite (5173) to the backend (8000). |

---

## Part C: Step by step

> **Tip:** Write down your **server IP** when you get it. You'll use it many times. Below, `YOUR_IP` means that IP.

### Step 0: Safety first (5 minutes)
1. Log in to the AWS console as the root user, or as an admin user if you have one.
2. Turn on **MFA** (two-factor login): top right, your name, **Security credentials**, **Assign MFA device**.
3. Create a **budget alert**: search **Budgets**, **Create budget**, **Use a template**, **Zero spend budget** (it emails you as soon as anything costs money), then enter your email and create it.
4. Choose your **region** (top right), for example *Asia Pacific (Mumbai) ap-south-1*. Stay in it.

### Step 1: Launch the server (EC2 instance)
1. Search **EC2**, then click **Launch instance**.
2. **Name:** `inventory-server`
3. **AMI:** **Ubuntu**, then *Ubuntu Server 24.04 LTS* (it should say *Free tier eligible*).
4. **Instance type:** `t3.micro` or `t2.micro`, whichever says *Free tier eligible*.
5. **Key pair:** **Create new key pair**, name `inventory-key`, type **RSA**, format **.pem**. It downloads `inventory-key.pem`. Keep it safe.
6. **Network settings**, then **Edit** (or the checkboxes):
   - ✅ Allow SSH traffic from **Anywhere 0.0.0.0/0**. GitHub Actions connects from changing addresses; the server still only accepts your `.pem` key, never a password.
   - ✅ Allow HTTP traffic from the internet (port 80).
7. **Storage:** 8 to 10 GB is fine.
8. Click **Launch instance**, then **View all instances**. Wait until *Instance state* shows **Running**.
9. Click the instance and copy its **Public IPv4 address**. That is `YOUR_IP`.

### Step 2: Connect to the server with SSH (from Windows PowerShell)
1. Move the key to a safe folder and lock its permissions, because SSH refuses keys that other users can read:
   ```powershell
   mkdir $HOME\.ssh -Force; Move-Item $HOME\Downloads\inventory-key.pem $HOME\.ssh\
   icacls $HOME\.ssh\inventory-key.pem /inheritance:r /grant:r "$($env:USERNAME):(R)"
   ```
2. Connect. Type `yes` the first time, when it asks about the fingerprint:
   ```powershell
   ssh -i $HOME\.ssh\inventory-key.pem ubuntu@YOUR_IP
   ```
   Your prompt changes to `ubuntu@ip-...:~$`. **You are now typing on the server.** Type `exit` to come back.

   *(Alternative: in the EC2 console, select the instance, click **Connect**, then **EC2 Instance Connect**, then **Connect**. That opens a terminal in the browser.)*

### Step 3: Install Node.js and Git on the server
Run these **on the server**:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # should print v24.x
npm -v
```

### Step 4: Let the server download your private repo (deploy key)
1. On the server, make a key. Press Enter if it asks anything:
   ```bash
   ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519
   cat ~/.ssh/id_ed25519.pub
   ```
2. Copy the whole line it prints (it starts with `ssh-ed25519`).
3. On GitHub, go to **nirjal-thapa/hosting**, then **Settings**, **Deploy keys**, **Add deploy key**. Title: `aws-server`. Paste the line. Leave *Allow write access* **unticked**, then click **Add key**.
4. Back on the server, download the code and type `yes` when asked:
   ```bash
   git clone git@github.com:nirjal-thapa/hosting.git ~/hosting
   ls ~/hosting   # you should see Backend, frontend, deploy ...
   ```

### Step 5: Database access and the .env file
1. **MongoDB Atlas:** open your project, go to **Network Access**, click **Add IP Address**, enter `YOUR_IP`, and click **Confirm**.
2. On the server, create the secrets file:
   ```bash
   nano ~/hosting/Backend/.env
   ```
   Paste **the same contents as your local `Backend/.env`** (open it in VS Code and copy). Save with Ctrl+O, then Enter, then Ctrl+X.
   This file stays on the server only. Git ignores it, and `deploy.sh` never deletes it.

### Step 6: Install the service and do the first deploy (by hand)
On the server:
```bash
sudo cp ~/hosting/deploy/inventory.service /etc/systemd/system/
sudo systemctl daemon-reload            # make systemd read the new file
sudo systemctl enable inventory         # start automatically when the server boots
bash ~/hosting/deploy/deploy.sh         # pull, install, build, start
sudo systemctl status inventory         # should say "active (running)". Press q to exit
```
🎉 Open **http://YOUR_IP** in your browser. You should see the Products page.

If it doesn't work, look at the app's logs:
```bash
journalctl -u inventory -n 50          # last 50 lines
journalctl -u inventory -f             # live logs (Ctrl+C to stop)
```
You want to see `listening at 80` and `Connected to db`.

### Step 7: Turn on auto-deploy (GitHub Actions)
1. On GitHub, open **hosting**, then **Settings**, **Secrets and variables**, **Actions**, and click **New repository secret**. Add two secrets:
   - Name `EC2_HOST`. Value: `YOUR_IP`.
   - Name `EC2_SSH_KEY`. Value: the **entire** contents of `inventory-key.pem`. Open it with `notepad $HOME\.ssh\inventory-key.pem` and copy everything, including the `-----BEGIN` and `-----END` lines.
2. Go to the **Actions** tab, then **Deploy to AWS**, then **Run workflow**. Watch it turn green ✅. Click into it to see the deploy log.
3. **Test the real thing:** change some text in the app on your laptop, then:
   ```powershell
   git add .
   git commit -m "Test auto deploy"
   git push hosting main
   ```
   Watch the **Actions** tab, then refresh `http://YOUR_IP`. Your change is live. **That is CI/CD.**

### Step 8 (optional): Copy your existing pictures to the server
Pictures are stored on the server's disk, not in Git, so the ones on your laptop aren't there yet. From **Windows PowerShell** in the project folder:
```powershell
scp -i $HOME\.ssh\inventory-key.pem Backend\uploads\* ubuntu@YOUR_IP:~/hosting/Backend/uploads/
```
New pictures uploaded on the live site are saved on the server automatically.

---

## Part D: Command cheat sheet (on the server)

| I want to… | Command |
|---|---|
| Connect from my laptop | `ssh -i $HOME\.ssh\inventory-key.pem ubuntu@YOUR_IP` |
| Is the app running? | `sudo systemctl status inventory` |
| See logs | `journalctl -u inventory -f` |
| Restart the app | `sudo systemctl restart inventory` |
| Stop / start the app | `sudo systemctl stop inventory` / `sudo systemctl start inventory` |
| Deploy by hand | `bash ~/hosting/deploy/deploy.sh` |
| Edit secrets | `nano ~/hosting/Backend/.env`, then `sudo systemctl restart inventory` |
| Disk space | `df -h` |

---

## Part E: Common problems

| Problem | Fix |
|---|---|
| `ssh: Permission denied (publickey)` | Wrong key or user. The user must be `ubuntu`; run the `icacls` line from Step 2 again. |
| `UNPROTECTED PRIVATE KEY FILE` | Run the `icacls` line from Step 2. |
| SSH just hangs / times out | Port 22 isn't open in the security group, or the instance isn't running. |
| Site doesn't open in the browser | Use `http://`, not `https://`. Check that port 80 is open in the security group and that `systemctl status inventory` is running. |
| Logs show a MongoDB timeout / `querySrv` error | The server IP isn't in Atlas **Network Access**, or `.env` is wrong. |
| `git clone` says *Permission denied* | The deploy key wasn't added to the repo (Step 4). |
| `npm run build` ends with `Killed` | The server ran out of memory. Add swap once: `sudo fallocate -l 1G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`, then deploy again. |
| GitHub Action fails at `ssh` | Check that the `EC2_HOST` and `EC2_SSH_KEY` secrets are exact and the server is running. |
| **The IP changed** after Stop and Start | Update the `EC2_HOST` secret and the Atlas Network Access entry. To keep a fixed IP, use **EC2, Elastic IPs, Allocate**, then **Associate** it with the instance. Elastic IPs cost money while the instance is stopped. |

---

## Part F: Costs and cleaning up
- A small instance is covered by the free tier or credits for a limited time. After that it costs a few dollars a month. A public IPv4 address is also billed hourly once free usage ends.
- **Stop** the instance: the server pauses, the disk is kept, the IP changes, and you pay a little for storage.
- **Terminate** the instance: the server is deleted forever, along with uploaded pictures. Billing stops.
- Your Zero spend budget emails you if anything starts costing money.

## Part G: What to learn next (when you're comfortable)
1. A **domain name** (e.g. `myshop.com`) pointing to an Elastic IP.
2. **HTTPS** (the padlock) with a free Let's Encrypt certificate, usually via nginx or Caddy.
3. Storing pictures in **S3** instead of the server disk, so they survive if the server is replaced.
4. Running lint or tests in GitHub Actions **before** deploying (the "CI" part of CI/CD).

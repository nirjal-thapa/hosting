# Hosting the Inventory app on AWS (Amazon Linux + Nginx + PM2)

Simple plan:
1. Launch a server on AWS and connect to it with SSH.
2. Clone the repo.
3. Install Nginx, then open the IP in the browser to see the Nginx page.
4. Run the backend with **PM2**.
5. Build the frontend with `npm run build`.
6. Point Nginx at the frontend and the backend. Done.

```
Browser ── http://YOUR_IP ──► Nginx (port 80)
                                ├── /            → frontend/dist  (built React files)
                                ├── /product     → backend on port 8000 (PM2)
                                └── /uploads     → backend on port 8000 (pictures)
```

---

## Part 1: In the AWS website (console)

1. **Safety first:** search **Budgets**, then **Create budget**, **Use a template**, **Zero spend budget**, and enter your email. AWS now emails you if anything costs money.
2. Pick a **region** in the top-right corner, for example *Asia Pacific (Mumbai)*, and stay in it.
3. Go to **EC2**, then click **Launch instance**:
   - **Name:** `inventory-server`
   - **AMI:** **Amazon Linux 2023** (Free tier eligible)
   - **Instance type:** `t3.micro` or `t2.micro` (Free tier eligible)
   - **Key pair:** **Create new key pair**, name `inventory-key`, type **RSA**, format **.pem**. It downloads `inventory-key.pem`.
   - **Network settings:** ✅ Allow SSH traffic from Anywhere, and ✅ Allow HTTP traffic from the internet.
   - Click **Launch instance**.
4. Open **Instances** and wait for **Running**. Click your instance and copy its **Public IPv4 address**.

> Below, replace `YOUR_IP` with that address everywhere.

---

## Part 2: In your terminal

### Step 1: Connect with SSH (Git Bash, on your laptop)
Open **Git Bash**: Start menu, then *Git Bash*. It was installed together with Git. These are the same commands AWS shows under **Instance**, **Connect**, **SSH client**.

Go to the folder where the key was downloaded:
```bash
cd ~/Downloads
```
Lock the key so only you can read it. SSH refuses keys that other users can read.
```bash
chmod 400 inventory-key.pem
```
Connect. On Amazon Linux the user is **`ec2-user`**.
```bash
ssh -i inventory-key.pem ec2-user@YOUR_IP
```
Type `yes` the first time. The prompt changes to `[ec2-user@ip-... ~]$`, which means **you're on the server now**. Everything below runs there. Type `exit` to leave.

### Step 2: Install Git, Node.js and PM2
```bash
sudo dnf update -y
sudo dnf install -y git
curl -fsSL https://rpm.nodesource.com/setup_24.x | sudo bash -
sudo dnf install -y nodejs
sudo npm install -g pm2
```
Check:
```bash
git --version
node -v      # v24.x
pm2 -v
```

### Step 3: Clone the repository
Your repo is private, so first give the server a read-only key for it (a **deploy key**):
```bash
ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519
cat ~/.ssh/id_ed25519.pub
```
Copy the line it prints. On GitHub, go to **nirjal-thapa/hosting**, then **Settings**, **Deploy keys**, **Add deploy key**. Paste it and click **Add key**.

Then clone (type `yes` when asked):
```bash
cd ~
git clone git@github.com:nirjal-thapa/hosting.git
ls hosting       # Backend  frontend  DEPLOY.md ...
```

### Step 4: Install Nginx and test it with your IP
```bash
sudo dnf install -y nginx
sudo nginx            # start Nginx
```
Open **http://YOUR_IP** in your browser. You should see the **Welcome to nginx** page. ✅ The web server works.

### Step 5: Run the backend with PM2
1. In **MongoDB Atlas**, go to **Network Access**, **Add IP Address**, enter `YOUR_IP`, and click **Confirm**.
2. Create the `.env` file. Paste the same contents as your local `Backend/.env`, then save with Ctrl+O, Enter, Ctrl+X:
   ```bash
   nano ~/hosting/Backend/.env
   ```
3. Install the packages and start the backend:
   ```bash
   cd ~/hosting/Backend
   npm ci
   pm2 start index.js --name backend
   pm2 logs backend --lines 20        # look for "listening at 8000" and "Connected to db" (Ctrl+C to exit)
   curl http://localhost:8000/product # should print your products as JSON
   ```
4. Make PM2 start the backend again after a reboot:
   ```bash
   pm2 save
   pm2 startup
   ```
   `pm2 startup` prints a `sudo env PATH=...` command. **Copy it, paste it and press Enter.**

### Step 6: Build the frontend
```bash
cd ~/hosting/frontend
npm ci
npm run build                 # creates ~/hosting/frontend/dist (plain HTML/CSS/JS files)
chmod 755 /home/ec2-user      # let Nginx read files in your home folder
```
You don't need `npm start` or PM2 for the frontend. After `npm run build` it's just files, and Nginx serves them.

### Step 7: Configure Nginx
Create a config file for the site:
```bash
sudo nano /etc/nginx/conf.d/inventory.conf
```
Paste this, and change `YOUR_IP` to your real IP:
```nginx
server {
    listen 80;
    server_name YOUR_IP;

    # Frontend: the built React files
    root /home/ec2-user/hosting/frontend/dist;
    index index.html;

    # Allow picture uploads up to 5 MB (Nginx allows only 1 MB by default)
    client_max_body_size 6M;

    location / {
        try_files $uri /index.html;   # pages like /read and /create load the React app
    }

    # Backend API
    location /product {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
    }

    # Product pictures (stored by the backend)
    location /uploads {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
    }
}
```
Save with Ctrl+O, Enter, Ctrl+X. Then test and reload:
```bash
sudo nginx -t              # must say "syntax is ok" and "test is successful"
sudo nginx -s reload       # apply the new config
```
🎉 Open **http://YOUR_IP**. Your Products page is live.

### Step 8 (optional): Copy your existing pictures
Run this in Git Bash **on your laptop**:
```bash
cd ~/Documents/Mern
scp -i ~/Downloads/inventory-key.pem Backend/uploads/* ec2-user@YOUR_IP:~/hosting/Backend/uploads/
```

---

## Part 3: Updating the site

After you push new code to GitHub, SSH into the server and run:
```bash
cd ~/hosting && git pull
cd ~/hosting/Backend && npm ci && pm2 restart backend
cd ~/hosting/frontend && npm ci && npm run build
```

---

## Cheat sheet (on the server)

| I want to… | Command |
|---|---|
| Is the backend running? | `pm2 status` |
| Backend logs | `pm2 logs backend` |
| Restart the backend (e.g. after editing `.env`) | `pm2 restart backend` |
| Check / reload Nginx | `sudo nginx -t` then `sudo nginx -s reload` |
| Stop / start Nginx | `sudo nginx -s stop` / `sudo nginx` |
| **After the server reboots** | `sudo nginx` (the backend comes back by itself, thanks to `pm2 startup`) |
| Nginx error log | `sudo tail -n 30 /var/log/nginx/error.log` |

## If something goes wrong

| What you see | Fix |
|---|---|
| SSH `Permission denied` / `UNPROTECTED PRIVATE KEY FILE` | Use the user `ec2-user`, and run `chmod 400 inventory-key.pem` again in Git Bash. |
| SSH hangs | Port 22 isn't allowed in the security group, or the instance is stopped. |
| Still the "Welcome to nginx" page | Check that `server_name` is exactly your IP, then run `sudo nginx -s reload`. |
| Site doesn't open at all after a reboot | Nginx isn't running. Run `sudo nginx`. |
| **403 Forbidden** | Run `chmod 755 /home/ec2-user` and check that `frontend/dist` exists. |
| **502 Bad Gateway** | The backend isn't running. Check `pm2 status` and `pm2 logs backend`. |
| **404** when refreshing `/read` | The `try_files $uri /index.html;` line is missing. |
| **413** when uploading a picture | The `client_max_body_size 6M;` line is missing. |
| MongoDB timeout / IP not whitelisted | Add the server IP in Atlas Network Access. |
| `npm run build` ends with `Killed` | Out of memory. Add swap once: `sudo dd if=/dev/zero of=/swapfile bs=1M count=1024 && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile` |
| IP changed after Stop and Start | Update `server_name` and Atlas Network Access, or use an **Elastic IP** so the address never changes. |

**Costs:** *Stop* pauses the server (and changes its IP). *Terminate* deletes it and stops billing.

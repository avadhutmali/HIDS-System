# AEGIS HIDS SERVER — AWS DEPLOYMENT GUIDE (FREE TIER + ECR)
# Stack: Spring Boot 3.4.5 · PostgreSQL 16 · RabbitMQ 3.13 · Redis 7
# Image Registry: Amazon ECR (no Docker Hub)
# EC2: t2.micro (free tier) + 2 GB swap

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  HOW IT WORKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  git push → GitHub Actions → build JAR → build Docker image
           → push to Amazon ECR → SSH into EC2 → docker compose up

  ECR (Elastic Container Registry) replaces Docker Hub.
  Free tier: 500 MB storage/month — more than enough.
  EC2 pulls images from ECR using an IAM Role (no passwords).


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  FILES IN YOUR REPO (already created)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  aegis-server/aegis-server/Dockerfile    ← multi-stage Docker build
  docker-compose.yml                       ← all 4 services
  .github/workflows/deploy.yml             ← CI/CD pipeline (uses ECR)
  .env.example                             ← secrets template


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 1 — CREATE AN AWS IAM USER (for GitHub Actions)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  GitHub Actions needs AWS credentials to push images to ECR.
  We create a dedicated IAM user with MINIMUM permissions.

  1. Go to: AWS Console → IAM → Users → Create User
     Username: aegis-github-actions
     Access type: Programmatic access (Access Key)

  2. Click "Next: Permissions"
     Choose: Attach policies directly
     Search and attach these 2 policies:
       - AmazonEC2ContainerRegistryPowerUser
         (allows push/pull to ECR)

  3. Click through to "Create User"

  4. IMPORTANT: On the final screen, click "Download .csv" or
     copy both values:
       - Access Key ID     (looks like: AKIAIOSFODNN7EXAMPLE)
       - Secret Access Key (looks like: wJalrXUtnFEMI/K7MDENG...)

     You CANNOT see the Secret Access Key again after this screen.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 2 — CREATE AN ECR REPOSITORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. AWS Console → Elastic Container Registry → Create Repository

  2. Settings:
       Visibility:  Private
       Name:        aegis-server
       Region:      ap-south-1  (Mumbai — closest to India)

  3. Click "Create repository"

  4. Click on the repository → copy the URI. It looks like:
       123456789012.dkr.ecr.ap-south-1.amazonaws.com/aegis-server

     Save this — it is your ECR_REGISTRY value.
     The part before /aegis-server is just:
       123456789012.dkr.ecr.ap-south-1.amazonaws.com


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 3 — LAUNCH EC2 (FREE TIER)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. AWS Console → EC2 → Launch Instance

  2. Settings:
       Name:          aegis-hids-server
       AMI:           Ubuntu Server 24.04 LTS (Free tier eligible)
       Instance type: t2.micro  ← FREE TIER (750 hrs/month)
       Storage:       20 GB gp2 ← FREE TIER (30 GB total free)

  3. Key Pair:
       Click "Create new key pair"
       Name:   aegis-key
       Type:   RSA
       Format: .pem
       → Download saved automatically as aegis-key.pem
       → KEEP THIS FILE SAFE. Cannot be re-downloaded.

  4. Security Group — add inbound rules:
       SSH        port 22    → My IP only
       Custom TCP port 8081  → 0.0.0.0/0  (Spring Boot API)
       Custom TCP port 15672 → My IP only (RabbitMQ UI)

  5. Click Launch Instance.
     After launch, note the Public IPv4 address (e.g. 13.235.45.67)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 4 — ATTACH IAM ROLE TO EC2 (so it can pull from ECR)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  This lets the EC2 pull Docker images from ECR without
  any passwords or access keys stored on the server.

  A. Create the IAM Role:
     IAM → Roles → Create Role
     Trusted entity type: AWS Service
     Use case: EC2
     Click Next

     Attach policy: AmazonEC2ContainerRegistryReadOnly
     Click Next → Name the role: aegis-ec2-ecr-role → Create

  B. Attach the role to your EC2:
     EC2 → Instances → select aegis-hids-server
     Actions → Security → Modify IAM Role
     Select: aegis-ec2-ecr-role
     Click Update IAM Role


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 5 — INSTALL DOCKER ON EC2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  FROM WINDOWS POWERSHELL — fix key permissions first:

    icacls "C:\path\to\aegis-key.pem" /inheritance:r
    icacls "C:\path\to\aegis-key.pem" /grant:r "%username%:R"

  SSH into EC2:

    ssh -i "C:\path\to\aegis-key.pem" ubuntu@<YOUR_EC2_PUBLIC_IP>

  Once inside EC2, run ALL of the following:

    # Update system
    sudo apt-get update && sudo apt-get upgrade -y

    # Install Docker
    curl -fsSL https://get.docker.com | sudo sh

    # Add user to docker group
    sudo usermod -aG docker ubuntu
    newgrp docker

    # Install AWS CLI (needed to authenticate ECR)
    sudo apt-get install -y awscli

    # Verify
    docker --version && docker compose version && aws --version


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 6 — ADD SWAP SPACE (CRITICAL for t2.micro with 1GB RAM)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  t2.micro has only 1 GB RAM. Running 4 containers needs ~1.5 GB.
  Swap prevents out-of-memory crashes.

  Run on EC2:

    # Create 2 GB swap file
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile

    # Make swap permanent across reboots
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Verify swap is active
    free -h
    # Should show 2.0G under Swap


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 7 — CREATE .env FILE AND COPY COMPOSE FILE TO EC2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  A. Create the deployment folder on EC2:

    sudo mkdir -p /opt/aegis
    sudo chown ubuntu:ubuntu /opt/aegis

  B. From WINDOWS POWERSHELL — copy docker-compose.yml to EC2:

    scp -i "C:\path\to\aegis-key.pem" `
      "d:\Notes\TY\SEM 6\MIni Project 2\HIDS-System\docker-compose.yml" `
      ubuntu@<YOUR_EC2_PUBLIC_IP>:/opt/aegis/

  C. Back on EC2 — create the .env file:

    nano /opt/aegis/.env

    Paste this (replace ALL placeholder values):
    ──────────────────────────────────────────────
    ECR_REGISTRY=123456789012.dkr.ecr.ap-south-1.amazonaws.com
    IMAGE_TAG=latest

    DB_USER=aegis
    DB_PASSWORD=StrongPassword123!

    RABBIT_USER=aegis
    RABBIT_PASSWORD=AnotherStrong456!

    JWT_SECRET=AtLeast32RandomCharsForYourJWTSecretKey!!
    CORS_ORIGINS=http://<YOUR_EC2_PUBLIC_IP>:5173
    ──────────────────────────────────────────────

    Save: Ctrl+X → Y → Enter

    # Secure the file
    chmod 600 /opt/aegis/.env

  D. Update docker-compose.yml to use ECR image path.
     On EC2, edit the image line for aegis-server:

    nano /opt/aegis/docker-compose.yml

    Find the aegis-server service image line:
      image: ${DOCKER_HUB_USERNAME}/aegis-server:${IMAGE_TAG:-latest}

    Change it to:
      image: ${ECR_REGISTRY}/aegis-server:${IMAGE_TAG:-latest}

    Save: Ctrl+X → Y → Enter


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 8 — ADD GITHUB SECRETS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Go to:
  https://github.com/avadhutmali/HIDS-System/settings/secrets/actions

  Click "New repository secret" — add ALL 6:

  ┌───────────────────────┬──────────────────────────────────────────┐
  │ Secret Name           │ Value                                    │
  ├───────────────────────┼──────────────────────────────────────────┤
  │ AWS_ACCESS_KEY_ID     │ From Step 1 (IAM user access key)        │
  │ AWS_SECRET_ACCESS_KEY │ From Step 1 (IAM user secret key)        │
  │ ECR_REGISTRY          │ 123456789012.dkr.ecr.ap-south-1.         │
  │                       │ amazonaws.com  (your ECR registry URL)   │
  │ EC2_HOST              │ Your EC2 public IP (e.g. 13.235.45.67)  │
  │ EC2_USER              │ ubuntu                                   │
  │ EC2_SSH_KEY           │ Full contents of aegis-key.pem           │
  └───────────────────────┴──────────────────────────────────────────┘

  For EC2_SSH_KEY — copy entire .pem file on PowerShell:
    Get-Content "C:\path\to\aegis-key.pem" | Set-Clipboard
  Then paste into the secret box. Must include:
    -----BEGIN RSA PRIVATE KEY-----
    ...
    -----END RSA PRIVATE KEY-----


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 9 — FIRST MANUAL DEPLOY (build and push image once)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Before CI/CD can work, there must be an image in ECR.
  Do this ONCE from your Windows PC.

  Install AWS CLI on Windows:
    Download from: https://aws.amazon.com/cli/
    Run the installer (AWS CLI for Windows MSI)

  Configure AWS CLI with the IAM user credentials from Step 1:

    aws configure
    → AWS Access Key ID:     paste your key
    → AWS Secret Access Key: paste your secret
    → Default region:        ap-south-1
    → Default output format: json

  Authenticate Docker to ECR:

    aws ecr get-login-password --region ap-south-1 | `
      docker login --username AWS --password-stdin `
      123456789012.dkr.ecr.ap-south-1.amazonaws.com

    (Replace 123456789012 with your actual AWS account ID)

  Build and push the image:

    cd "d:\Notes\TY\SEM 6\MIni Project 2\HIDS-System\aegis-server\aegis-server"

    docker build -t 123456789012.dkr.ecr.ap-south-1.amazonaws.com/aegis-server:latest .

    docker push 123456789012.dkr.ecr.ap-south-1.amazonaws.com/aegis-server:latest

  This takes 3-5 minutes the first time.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 10 — START ALL SERVICES ON EC2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  SSH into EC2 and run:

    cd /opt/aegis

    # Authenticate Docker to ECR (EC2 uses its IAM role, no keys needed)
    aws ecr get-login-password --region ap-south-1 | \
      docker login --username AWS --password-stdin \
      $(grep ECR_REGISTRY .env | cut -d= -f2)

    # Start all 4 containers
    docker compose --env-file .env up -d

    # Watch Spring Boot logs (wait ~30 seconds)
    docker compose logs -f aegis-server

    # Check all are healthy
    docker compose ps

  EXPECTED:
    aegis-postgres   Up (healthy)
    aegis-rabbitmq   Up (healthy)
    aegis-redis      Up (healthy)
    aegis-server     Up

  Test API:
    curl http://localhost:8081/api/admin/auth/login \
      -H "Content-Type: application/json" \
      -d '{"username":"admin","password":"admin123"}'

  From browser/Postman (outside EC2):
    http://<YOUR_EC2_PUBLIC_IP>:8081/api/admin/auth/login


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 11 — TEST THE CI/CD PIPELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Make any change to the server code, then:

    git add .
    git commit -m "test: CI/CD pipeline"
    git push origin main

  Watch it at:
    https://github.com/avadhutmali/HIDS-System/actions

  Pipeline stages (takes ~4-6 minutes total):
    1. Checkout code
    2. Setup Java 17
    3. mvn verify (build + test)
    4. Configure AWS credentials
    5. Login to ECR
    6. Build + push Docker image (2 tags: latest + commit SHA)
    7. SSH into EC2 → pull new image → restart aegis-server only
    8. Prune old images

  After pipeline succeeds, verify on EC2:
    docker compose logs --tail=30 aegis-server


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  AUTO-START ON REBOOT (Highly Recommended)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Run on EC2 — creates a systemd service so containers restart
  automatically if EC2 reboots:

    sudo nano /etc/systemd/system/aegis.service

  Paste:
  ──────────────────────────────────────────────────────────
  [Unit]
  Description=Aegis HIDS Docker Compose
  Requires=docker.service
  After=docker.service

  [Service]
  Type=oneshot
  RemainAfterExit=yes
  WorkingDirectory=/opt/aegis
  EnvironmentFile=/opt/aegis/.env
  ExecStartPre=/bin/bash -c 'aws ecr get-login-password \
    --region ap-south-1 | docker login --username AWS \
    --password-stdin ${ECR_REGISTRY}'
  ExecStart=/usr/bin/docker compose --env-file /opt/aegis/.env up -d
  ExecStop=/usr/bin/docker compose down
  TimeoutStartSec=120

  [Install]
  WantedBy=multi-user.target
  ──────────────────────────────────────────────────────────

    sudo systemctl daemon-reload
    sudo systemctl enable aegis.service
    sudo systemctl start aegis.service


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ROLLBACK TO PREVIOUS VERSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Every deploy pushes 2 tags: 'latest' and '<commit-sha>'.
  To rollback on EC2:

    nano /opt/aegis/.env
    # Change IMAGE_TAG=latest  to  IMAGE_TAG=<old-commit-sha>

    aws ecr get-login-password --region ap-south-1 | \
      docker login --username AWS --password-stdin \
      $(grep ECR_REGISTRY .env | cut -d= -f2)

    docker compose up -d --no-deps aegis-server


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  USEFUL COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  # Live logs
  docker compose logs -f aegis-server

  # Check container status
  docker compose ps

  # Restart app only
  docker compose restart aegis-server

  # Stop all (data preserved in volumes)
  docker compose down

  # DANGER: Stop + delete all data!
  docker compose down -v

  # Clean old images (do this if disk is full)
  docker image prune -f

  # Open PostgreSQL shell
  docker exec -it aegis-postgres psql -U aegis -d aegis

  # Check RAM usage (important on t2.micro)
  free -h


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  AWS FREE TIER LIMITS (Stay Within These)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  EC2 t2.micro:   750 hours/month FREE (12 months)
  EBS Storage:    30 GB FREE
  ECR Storage:    500 MB FREE/month
  Data Transfer:  15 GB outbound FREE/month

  NOTE: If you run t2.micro 24/7, that is 720 hours/month
  which is under the 750-hour limit. You're safe.

  ECR: Each Docker image push is ~200-300 MB.
  Old images accumulate. Clean them up monthly:
    AWS Console → ECR → aegis-server → delete old untagged images


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TROUBLESHOOTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  PROBLEM: aegis-server keeps OOM-crashing (out of memory)
  FIX:     Make sure swap is enabled: free -h
           If not, redo Step 6.

  PROBLEM: "no basic auth credentials" when pulling from ECR
  FIX:     On EC2, re-run the docker login command:
             aws ecr get-login-password --region ap-south-1 | \
               docker login --username AWS --password-stdin \
               $(grep ECR_REGISTRY /opt/aegis/.env | cut -d= -f2)

  PROBLEM: GitHub Actions fails at ECR login
  FIX:     Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
           secrets in GitHub. Make sure the IAM user has
           AmazonEC2ContainerRegistryPowerUser policy.

  PROBLEM: SSH fails in GitHub Actions
  FIX:     Verify EC2_SSH_KEY contains the ENTIRE .pem file.
           Verify EC2_HOST is the correct public IP.
           Verify port 22 is open in Security Group for
           GitHub Actions IPs (set source to 0.0.0.0/0 for SSH
           if your IP changes, then restrict later).

  PROBLEM: API returns 500 after deploy
  FIX:     docker compose logs aegis-server | grep -i error
           Likely a Flyway migration issue or wrong .env value.

  PROBLEM: Can't access API from outside EC2
  FIX:     Check Security Group has port 8081 open to 0.0.0.0/0


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  COMPLETE CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [ ] STEP 1: Created IAM user (aegis-github-actions) with
              AmazonEC2ContainerRegistryPowerUser policy
              Saved Access Key ID and Secret Access Key

  [ ] STEP 2: Created ECR private repository (aegis-server)
              in ap-south-1 (Mumbai), copied registry URI

  [ ] STEP 3: Launched t2.micro EC2, Ubuntu 24.04
              Downloaded aegis-key.pem
              Opened ports 22, 8081, 15672 in Security Group

  [ ] STEP 4: Created IAM Role (aegis-ec2-ecr-role) with
              AmazonEC2ContainerRegistryReadOnly
              Attached role to EC2 instance

  [ ] STEP 5: Installed Docker + AWS CLI on EC2
              Added ubuntu to docker group

  [ ] STEP 6: Added 2 GB swap space on EC2

  [ ] STEP 7: Created /opt/aegis/.env with real values
              Copied docker-compose.yml to EC2
              Updated image line to use ECR_REGISTRY

  [ ] STEP 8: Added all 6 GitHub secrets

  [ ] STEP 9: Built and pushed first Docker image to ECR
              (manual, one-time from your PC)

  [ ] STEP 10: Started all 4 containers — all healthy
               Tested API responds correctly

  [ ] STEP 11: Pushed a commit → pipeline ran → deployed

  [ ] BONUS:   Set up systemd auto-start on reboot

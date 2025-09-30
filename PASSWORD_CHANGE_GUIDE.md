# How to Change Admin Password

After deploying your Beasiswa ITB Status Checker, you should change the default admin password for security.

## Quick Method

```bash
# Navigate to your application directory
cd /path/to/beasiswa-checker

# Change password interactively (recommended)
./deploy.sh password

# Or use the dedicated script
./change-password.sh
```

## Step-by-Step Instructions

### 1. Interactive Password Change (Recommended)

```bash
# Run the password change command
./deploy.sh password

# You'll be prompted:
# Enter new admin password: [type your new password]
# Confirm new admin password: [type it again]
# Are you sure? (y/N): y

# Success message will appear
```

### 2. Direct Password Change (Less Secure)

```bash
# Change password directly (password visible in command history)
./change-password.sh "your-new-strong-password"

# Confirm when prompted
# Are you sure? (y/N): y
```

### 3. Via Deploy Script

```bash
# Using deploy script with password parameter
./deploy.sh password "your-new-strong-password"
```

## Password Requirements

- **Minimum**: 6 characters
- **Recommended**: 8+ characters
- **Include**: Letters, numbers, and special characters
- **Avoid**: Common passwords, dictionary words, personal info

## Examples of Strong Passwords

✅ **Good passwords:**
- `MyApp2024!Secure`
- `Beasiswa#ITB@2024`
- `AdminPass!123$`

❌ **Weak passwords:**
- `123456`
- `password`
- `admin`
- `beasiswa`

## Verification

After changing the password:

1. Go to: https://cek.itbuntuksemua.com/admin
2. Login with:
   - **Username**: admin
   - **Password**: [your new password]

## Troubleshooting

### If password change fails:

1. **Check MongoDB is running:**
   ```bash
   sudo systemctl status mongod
   sudo systemctl start mongod  # if not running
   ```

2. **Check application is running:**
   ```bash
   ./deploy.sh status
   ```

3. **View application logs:**
   ```bash
   ./deploy.sh logs
   ```

4. **Manual database update:**
   ```bash
   # If MongoDB CLI is available
   mongosh
   use beasiswa_production
   db.admins.findOne({username: "admin"})  # Check admin exists
   ```

### If you forgot your new password:

You can reset it back to the default or set a new one:

```bash
./change-password.sh "admin123"  # Reset to default
# Or
./change-password.sh "your-new-password"  # Set new password
```

## Security Best Practices

1. **Change immediately** after deployment
2. **Use unique passwords** (don't reuse from other services)
3. **Store securely** (use a password manager)
4. **Change regularly** (every 3-6 months)
5. **Don't share** the password with unauthorized users

## Files Involved

- `/path/to/beasiswa-checker/change-password.sh` - Password change script
- `/path/to/beasiswa-checker/deploy.sh` - Main deployment script
- `/path/to/beasiswa-checker/backend/.env` - Environment configuration
- MongoDB database - Where the hashed password is stored

Your admin password is hashed using SHA-256 before being stored in the database for security.
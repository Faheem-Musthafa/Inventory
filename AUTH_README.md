# Role-Based Authentication System

This application now includes a role-based authentication system with two user types: **Managers** and **Staff**.

## User Roles

### Manager
- Full access to all features
- Can manage products, orders, settings, and reports
- Icon: Shield (🛡️)
- Badge Color: Blue

### Staff
- Limited access based on business requirements
- Can take orders and manage day-to-day operations
- Icon: Users (👥)
- Badge Color: Green

## Environment Configuration

### Setup Instructions

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Update `.env` with your credentials:**
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
   VITE_FIREBASE_PROJECT_ID=your_project_id_here
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
   VITE_FIREBASE_APP_ID=your_app_id_here

   # Manager Credentials
   VITE_MANAGER_EMAIL=manager@afonex.com
   VITE_MANAGER_PASSWORD=manager123

   # Staff Credentials (Multiple staff can be added separated by comma)
   VITE_STAFF_EMAILS=staff1@afonex.com,staff2@afonex.com
   VITE_STAFF_PASSWORDS=staff123,staff456
   ```

### Adding Multiple Staff Members

To add multiple staff accounts, use comma-separated values:

```env
VITE_STAFF_EMAILS=staff1@afonex.com,staff2@afonex.com,staff3@afonex.com
VITE_STAFF_PASSWORDS=password1,password2,password3
```

**Important:** The order must match - the first email corresponds to the first password, etc.

## Login Credentials

### Default Manager Account
- **Email:** manager@afonex.com
- **Password:** manager123

### Default Staff Accounts
- **Staff 1:**
  - Email: staff1@afonex.com
  - Password: staff123
  
- **Staff 2:**
  - Email: staff2@afonex.com
  - Password: staff456

## Features

### Login Page
- Clean, modern login interface
- Role badges showing available user types (Manager & Staff)
- Password visibility toggle
- Form validation with error messages
- Welcome message with user role upon successful login

### Header Component
- Displays logged-in user's name
- Shows user role with appropriate icon
- Role badge in dropdown menu
- User email displayed in profile dropdown

### Authentication
- Secure credential validation
- localStorage-based session management
- Automatic authentication check on app load
- Role-based access control ready for implementation

## Security Notes

⚠️ **Important Security Considerations:**

1. **Environment Variables:** Never commit your `.env` file to version control. It's already in `.gitignore`.

2. **Production Deployment:** 
   - Store credentials securely in your hosting platform's environment variables
   - For Vercel: Use the Environment Variables section in project settings
   - For other platforms: Follow their environment variable configuration

3. **Password Security:**
   - Change default passwords before production deployment
   - Use strong, unique passwords
   - Consider implementing password hashing for production

4. **Future Enhancements:**
   - Integrate with Firebase Authentication for production use
   - Implement JWT tokens for API security
   - Add password reset functionality
   - Implement session timeout

## Development

### Running the Application

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Project Structure

```
src/
├── lib/
│   ├── auth.ts          # Authentication utilities
│   └── firebase.ts      # Firebase config & user interfaces
├── pages/
│   └── Login.tsx        # Login page component
├── components/
│   └── Header.tsx       # Header with user info display
└── App.tsx              # Main app with auth routing
```

## API Reference

### Auth Utilities (`src/lib/auth.ts`)

```typescript
// Validate user credentials
validateCredentials(email: string, password: string): User | null

// Check if user is a manager
isManager(user: User | null): boolean

// Check if user is staff
isStaff(user: User | null): boolean

// Get current logged-in user
getCurrentUser(): User | null

// Save user session
saveCurrentUser(user: User): void

// Clear user session (logout)
clearCurrentUser(): void

// Check authentication status
isAuthenticated(): boolean
```

## Troubleshooting

### Login Not Working
1. Check that `.env` file exists and is properly formatted
2. Verify credentials match exactly (case-sensitive)
3. Check browser console for errors
4. Clear browser localStorage and try again

### Role Not Displaying
1. Verify user logged in successfully
2. Check that `getCurrentUser()` returns valid user object
3. Inspect localStorage for `currentUser` key

## Future Enhancements

- [ ] Role-based route protection
- [ ] Staff permission levels
- [ ] Activity logging per user
- [ ] Password change functionality
- [ ] Two-factor authentication
- [ ] Session timeout handling
- [ ] Remember me functionality
- [ ] User management interface for managers

---

**Version:** 1.0.0  
**Last Updated:** November 1, 2025  
**Maintained by:** Afonex Development Team

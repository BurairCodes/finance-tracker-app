# Admin Dashboard Setup Guide

## Overview
The admin dashboard provides comprehensive management capabilities for your finance tracker app, including user management, system monitoring, and data administration.

## Features Implemented

### ✅ **Real Data Integration**
- **User Statistics**: Real user counts, transaction volumes, and activity metrics
- **Transaction Analytics**: Actual transaction data with currency conversion
- **User Management**: Real user profiles with transaction counts and volumes
- **Admin Actions**: Complete audit trail of all admin activities

### ✅ **User Management**
- **Promote/Demote Users**: Change user roles between 'user' and 'admin'
- **Ban/Unban Users**: Deactivate or reactivate user accounts
- **User Search & Filtering**: Find users by name, email, role, or status
- **Real-time Updates**: Immediate UI updates after admin actions

### ✅ **System Administration**
- **Data Export**: Export all application data (logs admin action)
- **Database Backup**: Initiate database backups (logs admin action)
- **Data Cleanup**: Remove old transactions (older than 2 years)
- **Admin Action Logging**: Complete audit trail of all admin activities

### ✅ **Security & Access Control**
- **Admin-only Access**: Only users with 'admin' or 'super_admin' roles can access
- **Action Logging**: All admin actions are logged with timestamps and details
- **Database Security**: Row Level Security (RLS) policies protect admin data

## Setup Instructions

### 1. Database Setup
Run the SQL script in your Supabase SQL editor:

```sql
-- Copy and paste the contents of admin_setup.sql
```

This will:
- Add `user_role` and `is_active` columns to the `profiles` table
- Create the `admin_actions` table for logging
- Set up proper indexes and security policies
- Create helper functions for admin operations

### 2. Set Up Admin Users
After running the SQL script:

1. **First User**: The first user in your system will automatically be set as `super_admin`
2. **Additional Admins**: You can manually update user roles in the Supabase dashboard:
   ```sql
   UPDATE profiles 
   SET user_role = 'admin' 
   WHERE email = 'admin@example.com';
   ```

### 3. Access the Admin Dashboard
1. **Navigate**: Go to `/admin` in your app
2. **Authentication**: Only users with `admin` or `super_admin` roles can access
3. **Features**: Use the tabs to manage users, view system stats, and perform admin actions

## Database Schema

### Profiles Table (Updated)
```sql
ALTER TABLE profiles ADD COLUMN user_role TEXT DEFAULT 'user';
ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
```

### Admin Actions Table (New)
```sql
CREATE TABLE admin_actions (
  id UUID PRIMARY KEY,
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  admin_user TEXT NOT NULL,
  target_user TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Admin Roles

### User Roles
- **`user`**: Regular app user (default)
- **`admin`**: Can access admin dashboard and perform admin actions
- **`super_admin`**: Full admin privileges (same as admin for now)

### Action Types
- **`user_role_change`**: When user roles are modified
- **`user_ban`**: When users are banned
- **`user_unban`**: When users are unbanned
- **`system_config`**: System configuration changes
- **`data_export`**: Data export operations

## Security Features

### Row Level Security (RLS)
- Admin actions are only visible to admin users
- Proper authentication checks before any admin operation
- Audit trail of all admin activities

### Access Control
- Admin dashboard access is restricted to admin users only
- All admin actions require authentication
- Failed access attempts are logged

## Usage Examples

### Promoting a User to Admin
1. Go to Admin Dashboard → Users tab
2. Find the user you want to promote
3. Click the promote button (checkmark icon)
4. Confirm the action
5. User role will be updated and action logged

### Cleaning Old Data
1. Go to Admin Dashboard → System tab
2. Click "Clean Old Data"
3. Confirm the action
4. Transactions older than 2 years will be removed
5. Action will be logged in admin actions

### Viewing Admin Activity
1. Go to Admin Dashboard → Actions tab
2. View all recent admin activities
3. See who performed what action and when

## Troubleshooting

### Common Issues

**"Access Denied" Error**
- Ensure your user has `admin` or `super_admin` role
- Check that the SQL setup script was run successfully

**Admin Actions Not Logging**
- Verify the `admin_actions` table exists
- Check RLS policies are properly configured

**User Management Not Working**
- Ensure the `profiles` table has `user_role` and `is_active` columns
- Check that you have proper permissions to update profiles

### Database Verification
Run these queries to verify setup:

```sql
-- Check if admin_actions table exists
SELECT * FROM admin_actions LIMIT 1;

-- Check if profiles has required columns
SELECT user_role, is_active FROM profiles LIMIT 1;

-- Check your admin status
SELECT user_role FROM profiles WHERE id = auth.uid();
```

## Next Steps

### Potential Enhancements
1. **Email Notifications**: Send emails when admin actions are performed
2. **Advanced Analytics**: More detailed financial analytics
3. **Bulk Operations**: Perform actions on multiple users at once
4. **System Monitoring**: Real-time system health monitoring
5. **API Rate Limiting**: Implement rate limiting for admin actions

### Integration Ideas
1. **Webhook Notifications**: Send webhooks for admin actions
2. **Audit Reports**: Generate PDF reports of admin activities
3. **User Activity Tracking**: Track user login patterns and activity
4. **Automated Backups**: Schedule automatic database backups

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify the database setup was completed correctly
3. Ensure your user has proper admin permissions
4. Check the Supabase logs for any database errors

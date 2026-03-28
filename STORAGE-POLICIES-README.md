# Supabase Storage Policies Setup

## 📁 Storage Policies (Create via Dashboard)

Since storage policies cannot be created via SQL directly, you need to create them through the Supabase Dashboard:

### Step 1: Go to Storage
1. Supabase Dashboard → Storage
2. Select the `uploads` bucket

### Step 2: Create Policies

#### Policy 1: Allow Public Read Access
```sql
-- Allow everyone to view files
bucket_id = 'uploads'
```

#### Policy 2: Allow Users to Upload to Their Folder
```sql
-- Allow authenticated users to upload
bucket_id = 'uploads'
AND auth.role() = 'authenticated'
AND (storage.foldername(name))[1] = auth.uid()::text
```

#### Policy 3: Allow Users to Update Their Files
```sql
-- Allow users to update their own files
bucket_id = 'uploads'
AND auth.role() = 'authenticated'
AND (storage.foldername(name))[1] = auth.uid()::text
```

#### Policy 4: Allow Users to Delete Their Files
```sql
-- Allow users to delete their own files
bucket_id = 'uploads'
AND auth.role() = 'authenticated'
AND (storage.foldername(name))[1] = auth.uid()::text
```

#### Policy 5: Admin Full Access
```sql
-- Allow admin full access
bucket_id = 'uploads'
AND (SELECT email FROM auth.users WHERE id = auth.uid()) = 'jigs.vanani@gmail.com'
```

## 🔧 How to Create Policies in Dashboard

1. **Storage** → **uploads bucket** → **Policies** tab
2. Click **"New Policy"**
3. Choose the operation (SELECT, INSERT, UPDATE, DELETE)
4. Add the policy expression
5. Save

## 📋 Policy Types Needed:

| Operation | Who | Condition |
|-----------|-----|-----------|
| **SELECT** | Everyone | `bucket_id = 'uploads'` |
| **INSERT** | Authenticated Users | `bucket_id = 'uploads' AND (storage.foldername(name))[1] = auth.uid()::text` |
| **UPDATE** | Own Files | `bucket_id = 'uploads' AND (storage.foldername(name))[1] = auth.uid()::text` |
| **DELETE** | Own Files | `bucket_id = 'uploads' AND (storage.foldername(name))[1] = auth.uid()::text` |
| **ALL** | Admin | `bucket_id = 'uploads' AND admin email check` |

## ⚠️ Important Notes

- Storage policies are created per bucket
- The `uploads` bucket must exist first
- Policies are checked before file operations
- Use the exact policy expressions shown above
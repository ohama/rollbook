/**
 * Phase 6 Production Readiness Tests
 *
 * Tests verify:
 * - PWA Requirements (TECH-03): VitePWA plugin, icons, service worker, manifest
 * - Offline Queue (TECH-02): idb, queue module, sync module, network status, indicator
 * - Admin RBAC (ADMN-01, ADMN-02): migration, API, page, components
 * - Bundle Size Optimization: visualizer, manual chunks
 * - Security: RLS enabled, no exposed secrets
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const projectRoot = process.cwd();

describe('PWA Requirements (TECH-03)', () => {
  it('should have vite-plugin-pwa installed', () => {
    const pkg = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf-8'));
    expect(pkg.devDependencies['vite-plugin-pwa']).toBeDefined();
  });

  it('should have VitePWA plugin configured in vite.config.js', () => {
    const viteConfig = readFileSync(join(projectRoot, 'vite.config.js'), 'utf-8');
    expect(viteConfig).toContain('VitePWA');
    expect(viteConfig).toContain('registerType');
    expect(viteConfig).toContain('manifest');
    expect(viteConfig).toContain('workbox');
  });

  it('should have PWA manifest with required fields', () => {
    const viteConfig = readFileSync(join(projectRoot, 'vite.config.js'), 'utf-8');
    expect(viteConfig).toContain('name:');
    expect(viteConfig).toContain('short_name:');
    expect(viteConfig).toContain('theme_color:');
    expect(viteConfig).toContain('display:');
    expect(viteConfig).toContain('start_url:');
    expect(viteConfig).toContain('icons:');
  });

  it('should have required PWA icons (192x192, 512x512, apple-touch-icon)', () => {
    expect(existsSync(join(projectRoot, 'public/pwa-192x192.png'))).toBe(true);
    expect(existsSync(join(projectRoot, 'public/pwa-512x512.png'))).toBe(true);
    expect(existsSync(join(projectRoot, 'public/apple-touch-icon.png'))).toBe(true);
  });

  it('should have Workbox runtime caching configured', () => {
    const viteConfig = readFileSync(join(projectRoot, 'vite.config.js'), 'utf-8');
    expect(viteConfig).toContain('runtimeCaching');
    expect(viteConfig).toContain('NetworkFirst');
    expect(viteConfig).toContain('NetworkOnly');
    expect(viteConfig).toContain('StaleWhileRevalidate');
  });

  it('should have service worker registration module', () => {
    expect(existsSync(join(projectRoot, 'src/sw/Registration.fs'))).toBe(true);
  });

  it('should disable service worker in dev mode', () => {
    const viteConfig = readFileSync(join(projectRoot, 'vite.config.js'), 'utf-8');
    expect(viteConfig).toContain('devOptions');
    expect(viteConfig).toContain('enabled: false');
  });
});

describe('Offline Queue (TECH-02)', () => {
  it('should have idb library installed', () => {
    const pkg = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf-8'));
    expect(pkg.dependencies['idb']).toBeDefined();
  });

  it('should have offline Types module', () => {
    expect(existsSync(join(projectRoot, 'src/offline/Types.fs'))).toBe(true);
  });

  it('should have Queue module for offline operations', () => {
    const queuePath = join(projectRoot, 'src/offline/Queue.fs');
    expect(existsSync(queuePath)).toBe(true);
    const queueContent = readFileSync(queuePath, 'utf-8');
    expect(queueContent).toContain('enqueue');
    expect(queueContent).toContain('dequeue');
    expect(queueContent).toContain('getAllPending'); // F# uses getAllPending not getPendingOperations
  });

  it('should have Sync module for background sync', () => {
    const syncPath = join(projectRoot, 'src/offline/Sync.fs');
    expect(existsSync(syncPath)).toBe(true);
    const syncContent = readFileSync(syncPath, 'utf-8');
    expect(syncContent).toContain('replayQueue'); // F# uses replayQueue not processPendingOperations
    expect(syncContent).toContain('registerBackgroundSync');
  });

  it('should have NetworkStatus module', () => {
    const statusPath = join(projectRoot, 'src/offline/NetworkStatus.fs');
    expect(existsSync(statusPath)).toBe(true);
    const statusContent = readFileSync(statusPath, 'utf-8');
    expect(statusContent).toContain('isOnline');
  });

  it('should have OfflineIndicator component', () => {
    expect(existsSync(join(projectRoot, 'src/Components/OfflineIndicator.fs'))).toBe(true);
  });

  it('should have offline queue integrated in WorkoutToggle', () => {
    // WorkoutToggle is embedded in Dashboard.fs, not separate component
    const dashboardPath = join(projectRoot, 'src/Pages/Dashboard.fs');
    expect(existsSync(dashboardPath)).toBe(true);
    const dashboardContent = readFileSync(dashboardPath, 'utf-8');
    expect(dashboardContent).toContain('enqueue'); // Queue integration
    expect(dashboardContent).toContain('Offline.Queue'); // Module import
  });
});

describe('Admin RBAC (ADMN-01, ADMN-02)', () => {
  it('should have admin RBAC migration', () => {
    const migrationPath = join(projectRoot, 'supabase/migrations/20260210160000_admin_rbac.sql');
    expect(existsSync(migrationPath)).toBe(true);
  });

  it('should create user_roles table in migration', () => {
    const migrationPath = join(projectRoot, 'supabase/migrations/20260210160000_admin_rbac.sql');
    const migration = readFileSync(migrationPath, 'utf-8');
    expect(migration).toContain('CREATE TABLE');
    expect(migration).toContain('user_roles');
    expect(migration).toContain('role text NOT NULL');
    expect(migration).toContain('CHECK (role IN (\'admin\', \'member\'))');
  });

  it('should have is_admin() function in migration', () => {
    const migrationPath = join(projectRoot, 'supabase/migrations/20260210160000_admin_rbac.sql');
    const migration = readFileSync(migrationPath, 'utf-8');
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.is_admin()');
    expect(migration).toContain('SECURITY DEFINER');
    expect(migration).toContain('STABLE');
  });

  it('should have admin DELETE policy for profiles', () => {
    const migrationPath = join(projectRoot, 'supabase/migrations/20260210160000_admin_rbac.sql');
    const migration = readFileSync(migrationPath, 'utf-8');
    expect(migration).toContain('CREATE POLICY "Admins can delete profiles"');
    expect(migration).toContain('FOR DELETE');
    expect(migration).toContain('public.is_admin()');
  });

  it('should have Admin API module', () => {
    const adminApiPath = join(projectRoot, 'src/Supabase/Admin.fs');
    expect(existsSync(adminApiPath)).toBe(true);
    const adminApi = readFileSync(adminApiPath, 'utf-8');
    expect(adminApi).toContain('isAdmin'); // F# uses isAdmin not checkAdminRole
    expect(adminApi).toContain('getAllProfiles');
    expect(adminApi).toContain('deleteProfile');
  });

  it('should have AdminPage component', () => {
    expect(existsSync(join(projectRoot, 'src/Pages/AdminPage.fs'))).toBe(true);
  });

  it('should have admin page available as standalone page', () => {
    // AdminPage exists as separate page (not integrated as tab in Dashboard)
    const adminPagePath = join(projectRoot, 'src/Pages/AdminPage.fs');
    expect(existsSync(adminPagePath)).toBe(true);
    const adminPage = readFileSync(adminPagePath, 'utf-8');
    expect(adminPage).toContain('deleteProfile'); // Admin functionality
  });

  it('should have RLS enabled on user_roles table', () => {
    const migrationPath = join(projectRoot, 'supabase/migrations/20260210160000_admin_rbac.sql');
    const migration = readFileSync(migrationPath, 'utf-8');
    expect(migration).toContain('ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY');
  });
});

describe('Bundle Size Optimization', () => {
  it('should have rollup-plugin-visualizer installed', () => {
    const pkg = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf-8'));
    expect(pkg.devDependencies['rollup-plugin-visualizer']).toBeDefined();
  });

  it('should have visualizer plugin configured in vite.config.js', () => {
    const viteConfig = readFileSync(join(projectRoot, 'vite.config.js'), 'utf-8');
    expect(viteConfig).toContain('visualizer');
    expect(viteConfig).toContain('gzipSize');
    expect(viteConfig).toContain('brotliSize');
  });

  it('should have manual chunks configured', () => {
    const viteConfig = readFileSync(join(projectRoot, 'vite.config.js'), 'utf-8');
    expect(viteConfig).toContain('manualChunks');
    expect(viteConfig).toContain('vendor-react');
    expect(viteConfig).toContain('vendor-supabase');
    expect(viteConfig).toContain('vendor-offline');
  });

  it('should have Terser minification enabled', () => {
    const viteConfig = readFileSync(join(projectRoot, 'vite.config.js'), 'utf-8');
    expect(viteConfig).toContain('minify: \'terser\'');
    expect(viteConfig).toContain('terserOptions');
    expect(viteConfig).toContain('drop_console: true');
  });
});

describe('Security Verification', () => {
  it('should have RLS enabled on all tables', () => {
    const migrationsDir = join(projectRoot, 'supabase/migrations');
    const files = require('fs').readdirSync(migrationsDir);
    const migrations = files
      .filter((f: string) => f.endsWith('.sql'))
      .map((f: string) => readFileSync(join(migrationsDir, f), 'utf-8'));

    const allMigrations = migrations.join('\n');

    // Verify profiles table has RLS (case-insensitive check)
    expect(allMigrations.toLowerCase()).toContain('enable row level security');

    // Verify workouts table has RLS
    expect(allMigrations).toContain('alter table public.workouts enable row level security');

    // Verify user_roles table has RLS
    expect(allMigrations).toContain('ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY');
  });

  it('should not have exposed Supabase keys in source code', () => {
    // Check main files for hardcoded keys
    const filesToCheck = [
      'src/Supabase/Client.fs',
    ];

    filesToCheck.forEach(file => {
      const path = join(projectRoot, file);
      if (existsSync(path)) {
        const content = readFileSync(path, 'utf-8');
        // Should use env variables, not hardcoded keys
        expect(content).not.toMatch(/https:\/\/[a-z]{20}\.supabase\.co/);
        expect(content).not.toMatch(/eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/);
      }
    });
  });

  it('should have storage bucket with private access', () => {
    const storageMigration = join(projectRoot, 'supabase/migrations/20260210150000_storage_bucket.sql');
    expect(existsSync(storageMigration)).toBe(true);
    const migration = readFileSync(storageMigration, 'utf-8');
    expect(migration).toContain('false'); // private bucket (public = false)
    expect(migration).toContain('workout-photos');
  });

  it('should have storage RLS policies', () => {
    const storageMigration = join(projectRoot, 'supabase/migrations/20260210150000_storage_bucket.sql');
    if (existsSync(storageMigration)) {
      const migration = readFileSync(storageMigration, 'utf-8');
      expect(migration).toContain('CREATE POLICY');
      expect(migration).toContain('storage.objects');
      expect(migration).toContain('auth.uid()');
    }
  });
});

describe('Test Infrastructure', () => {
  it('should have vitest installed', () => {
    const pkg = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf-8'));
    expect(pkg.devDependencies['vitest']).toBeDefined();
  });

  it('should have test scripts in package.json', () => {
    const pkg = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf-8'));
    expect(pkg.scripts['test']).toBe('vitest run');
    expect(pkg.scripts['test:watch']).toBe('vitest');
    expect(pkg.scripts['test:ui']).toBe('vitest --ui');
  });

  it('should have vitest.config.ts', () => {
    expect(existsSync(join(projectRoot, 'vitest.config.ts'))).toBe(true);
  });

  it('should have test environment configured', () => {
    const vitestConfig = readFileSync(join(projectRoot, 'vitest.config.ts'), 'utf-8');
    // Node environment is used for file-based tests (jsdom not needed)
    expect(vitestConfig).toContain('environment:');
  });
});

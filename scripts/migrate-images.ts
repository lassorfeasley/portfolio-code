/**
 * One-time migration: copy Supabase Storage objects to Vercel Blob and rewrite
 * image URLs in the database to point at Blob.
 *
 * Usage (from the repo root, with production env vars in .env.local):
 *   node --env-file=.env.local scripts/migrate-images.ts --dry-run
 *   node --env-file=.env.local scripts/migrate-images.ts
 *
 * Required env vars:
 *   SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   BLOB_READ_WRITE_TOKEN (optional for --dry-run)
 *
 * Safety properties:
 *   - Never deletes anything from Supabase Storage or Vercel Blob.
 *   - Idempotent: objects already in Blob are reused, and rows with no Supabase
 *     URLs are left untouched, so re-running after a partial failure is safe.
 *   - Only rewrites exact Supabase Storage public URLs for this project, and only
 *     after the corresponding object has been copied successfully.
 */
import { createClient } from '@supabase/supabase-js';
import { BlobNotFoundError, head, put } from '@vercel/blob';

type Row = Record<string, unknown> & { id: string };
type ObjectRef = { bucket: string; path: string };
type FieldChange = { table: string; id: string; column: string; before: unknown; after: unknown; urls: number };

const TABLES = ['projects', 'articles', 'project_types', 'hero_content', 'folder_links'];
const COPY_CONCURRENCY = 4;

const dryRun = process.argv.includes('--dry-run');
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

if (!supabaseUrl || !serviceKey) {
  fail('Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.');
}
if (!dryRun && !blobToken) {
  fail('Set BLOB_READ_WRITE_TOKEN (create a Blob store in Vercel, then run `vercel env pull`).');
}

const supabase = createClient(supabaseUrl!, serviceKey!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const supabaseHost = new URL(supabaseUrl!).host;
const storageUrlPattern = new RegExp(
  `https://${escapeRegExp(supabaseHost)}/storage/v1/(?:object|render/image)/public/[^\\s"'<>()]+`,
  'g'
);
const anySupabaseStoragePattern = /https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/[^\s"'<>()]+/g;

function fail(message: string): never {
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function keyOf(ref: ObjectRef): string {
  return `${ref.bucket}/${ref.path}`;
}

function parseStorageUrl(rawUrl: string): ObjectRef | null {
  const url = new URL(rawUrl);
  const match = url.pathname.match(/^\/storage\/v1\/(?:object|render\/image)\/public\/([^/]+)\/(.+)$/);
  if (!match) return null;
  const path = match[2].split('/').map((segment) => decodeURIComponent(segment)).join('/');
  return { bucket: decodeURIComponent(match[1]), path };
}

async function listBucketObjects(bucket: string, prefix = ''): Promise<string[]> {
  const paths: string[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(prefix, { limit: pageSize, offset, sortBy: { column: 'name', order: 'asc' } });
    if (error) fail(`Could not list ${bucket}/${prefix}: ${error.message}`);
    for (const entry of data ?? []) {
      const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null) {
        paths.push(...(await listBucketObjects(bucket, fullPath)));
      } else if (entry.name !== '.emptyFolderPlaceholder') {
        paths.push(fullPath);
      }
    }
    if (!data || data.length < pageSize) break;
  }
  return paths;
}

async function listAllStorageObjects(): Promise<ObjectRef[]> {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) fail(`Could not list buckets: ${error.message}`);
  const refs: ObjectRef[] = [];
  for (const bucket of buckets ?? []) {
    const paths = await listBucketObjects(bucket.name);
    console.log(`  bucket "${bucket.name}" (${bucket.public ? 'public' : 'private'}): ${paths.length} objects`);
    refs.push(...paths.map((path) => ({ bucket: bucket.name, path })));
  }
  return refs;
}

async function loadRows(table: string): Promise<Row[]> {
  const { data, error } = await supabase.from(table).select('*');
  if (error) fail(`Could not read table ${table}: ${error.message}`);
  return (data ?? []) as Row[];
}

function findUrls(value: unknown, pattern: RegExp): string[] {
  if (typeof value === 'string') return value.match(pattern) ?? [];
  if (Array.isArray(value)) return value.flatMap((item) => findUrls(item, pattern));
  return [];
}

function rewriteValue(value: unknown, mapping: Map<string, string>): { value: unknown; count: number } {
  if (typeof value === 'string') {
    let count = 0;
    const next = value.replace(storageUrlPattern, (url) => {
      const ref = parseStorageUrl(url);
      const target = ref ? mapping.get(keyOf(ref)) : undefined;
      if (!target) return url;
      count += 1;
      return target;
    });
    return { value: next, count };
  }
  if (Array.isArray(value)) {
    let count = 0;
    const next = value.map((item) => {
      const result = rewriteValue(item, mapping);
      count += result.count;
      return result.value;
    });
    return { value: next, count };
  }
  return { value, count: 0 };
}

async function findExistingBlobUrl(pathname: string): Promise<string | null> {
  if (!blobToken) return null;
  try {
    const existing = await head(pathname, { token: blobToken });
    return existing.url;
  } catch (error) {
    if (error instanceof BlobNotFoundError) return null;
    throw error;
  }
}

async function copyObject(ref: ObjectRef): Promise<string> {
  const pathname = keyOf(ref);
  const { data, error } = await supabase.storage.from(ref.bucket).download(ref.path);
  if (error || !data) throw new Error(`download failed: ${error?.message ?? 'no data'}`);

  const uploaded = await put(pathname, data, {
    access: 'public',
    addRandomSuffix: false,
    contentType: data.type || undefined,
    token: blobToken,
  });
  return uploaded.url;
}

async function runWithConcurrency<T>(items: T[], limit: number, worker: (item: T, index: number) => Promise<void>) {
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      await worker(items[index], index);
    }
  });
  await Promise.all(runners);
}

async function main() {
  console.log(dryRun ? '\nDRY RUN — nothing will be uploaded or written.\n' : '\nLIVE RUN\n');
  console.log(`Supabase project: ${supabaseHost}`);

  console.log('\n1. Listing Supabase Storage objects');
  const storageObjects = await listAllStorageObjects();
  const storageKeys = new Set(storageObjects.map(keyOf));

  console.log('\n2. Scanning database for Supabase Storage URLs');
  const rowsByTable = new Map<string, Row[]>();
  const referenced = new Map<string, ObjectRef>();
  const foreignUrls = new Set<string>();
  for (const table of TABLES) {
    const rows = await loadRows(table);
    rowsByTable.set(table, rows);
    const columnCounts = new Map<string, number>();
    for (const row of rows) {
      for (const [column, value] of Object.entries(row)) {
        const urls = findUrls(value, storageUrlPattern);
        for (const url of urls) {
          const ref = parseStorageUrl(url);
          if (ref) referenced.set(keyOf(ref), ref);
        }
        if (urls.length) columnCounts.set(column, (columnCounts.get(column) ?? 0) + urls.length);
        for (const url of findUrls(value, anySupabaseStoragePattern)) {
          if (!url.startsWith(`https://${supabaseHost}/storage/v1/object/public/`) &&
              !url.startsWith(`https://${supabaseHost}/storage/v1/render/image/public/`)) {
            foreignUrls.add(`${table}.${column} (id ${row.id}): ${url}`);
          }
        }
      }
    }
    const summary = [...columnCounts].map(([column, count]) => `${column}=${count}`).join(', ') || 'none';
    console.log(`  ${table}: ${rows.length} rows, Supabase URLs: ${summary}`);
  }

  const missing = [...referenced.keys()].filter((key) => !storageKeys.has(key));
  const toCopy = new Map<string, ObjectRef>(storageObjects.map((ref) => [keyOf(ref), ref]));

  console.log('\n3. Copying objects to Vercel Blob');
  console.log(`  ${toCopy.size} objects in Storage, ${referenced.size} referenced by the database`);
  const mapping = new Map<string, string>();
  const copyFailures: string[] = [];
  let reused = 0;
  let uploaded = 0;
  const refs = [...toCopy.values()];
  await runWithConcurrency(refs, COPY_CONCURRENCY, async (ref, index) => {
    const key = keyOf(ref);
    try {
      const existingUrl = await findExistingBlobUrl(key);
      if (existingUrl) {
        reused += 1;
        mapping.set(key, existingUrl);
      } else if (dryRun) {
        mapping.set(key, `<blob>/${key}`);
      } else {
        mapping.set(key, await copyObject(ref));
        uploaded += 1;
      }
      if ((index + 1) % 25 === 0) console.log(`  …${index + 1}/${refs.length}`);
    } catch (error) {
      copyFailures.push(`${key}: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  if (dryRun) {
    console.log(`  would upload ${refs.length - reused}, already in Blob ${reused}${blobToken ? '' : ' (no BLOB_READ_WRITE_TOKEN, so existence was not checked)'}`);
  } else {
    console.log(`  uploaded ${uploaded}, already in Blob ${reused}, failed ${copyFailures.length}`);
  }

  console.log('\n4. Rewriting database URLs');
  const changes: FieldChange[] = [];
  for (const [table, rows] of rowsByTable) {
    for (const row of rows) {
      for (const [column, value] of Object.entries(row)) {
        const result = rewriteValue(value, mapping);
        if (result.count > 0) {
          changes.push({ table, id: row.id, column, before: value, after: result.value, urls: result.count });
        }
      }
    }
  }

  const changesByRow = new Map<string, FieldChange[]>();
  for (const change of changes) {
    const key = `${change.table}:${change.id}`;
    changesByRow.set(key, [...(changesByRow.get(key) ?? []), change]);
  }

  let rowsWritten = 0;
  const writeFailures: string[] = [];
  for (const rowChanges of changesByRow.values()) {
    const { table, id } = rowChanges[0];
    const description = rowChanges.map((change) => `${change.column} (${change.urls})`).join(', ');
    if (dryRun) {
      console.log(`  would update ${table} ${id}: ${description}`);
      continue;
    }
    const update = Object.fromEntries(rowChanges.map((change) => [change.column, change.after]));
    const { error } = await supabase.from(table).update(update).eq('id', id);
    if (error) {
      writeFailures.push(`${table} ${id}: ${error.message}`);
    } else {
      rowsWritten += 1;
    }
  }
  const totalUrls = changes.reduce((sum, change) => sum + change.urls, 0);
  console.log(`  ${dryRun ? 'would rewrite' : 'rewrote'} ${totalUrls} URLs across ${changesByRow.size} rows${dryRun ? '' : ` (${rowsWritten} rows written)`}`);

  const sample = changes.find((change) => typeof change.before === 'string');
  if (sample) {
    console.log('\n  Example rewrite:');
    console.log(`    before: ${sample.before}`);
    console.log(`    after:  ${sample.after}`);
  }

  if (!dryRun) {
    console.log('\n5. Verifying');
    let remaining = 0;
    for (const table of TABLES) {
      const rows = await loadRows(table);
      for (const row of rows) {
        for (const [column, value] of Object.entries(row)) {
          const urls = findUrls(value, anySupabaseStoragePattern);
          if (urls.length) {
            remaining += urls.length;
            console.log(`  still on Supabase: ${table}.${column} (id ${row.id}): ${urls.length} URL(s)`);
          }
        }
      }
    }
    console.log(remaining === 0 ? '  ✔ No Supabase Storage URLs remain in the database.' : `  ✖ ${remaining} Supabase Storage URLs remain.`);
  }

  const warnings = [
    ...missing.map((key) => `referenced in the database but not found in Storage (URL left unchanged): ${key}`),
    ...[...foreignUrls].map((entry) => `URL from a different Supabase project or a non-public endpoint (left unchanged): ${entry}`),
    ...copyFailures.map((entry) => `copy failed (URL left unchanged, re-run to retry): ${entry}`),
    ...writeFailures.map((entry) => `database update failed (re-run to retry): ${entry}`),
  ];
  if (warnings.length) {
    console.log(`\nWarnings (${warnings.length}):`);
    for (const warning of warnings) console.log(`  - ${warning}`);
  }
  console.log('\nSupabase Storage was not modified.\n');
  if (copyFailures.length || writeFailures.length) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

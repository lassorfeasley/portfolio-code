import type { Database } from '@/lib/supabase/types';

type PublicTables = Database['public']['Tables'];

export type ProjectRecord = PublicTables['projects']['Row'];
export type ProjectWritePayload = PublicTables['projects']['Insert'];
export type ProjectPayload = ProjectWritePayload & { id?: string };

export type ProjectTypeRecord = PublicTables['project_types']['Row'];
export type ProjectTypeWritePayload = PublicTables['project_types']['Insert'];
export type ProjectTypePayload = ProjectTypeWritePayload & { id?: string };


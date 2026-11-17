import { beforeEach, describe, expect, it } from 'vitest'
import { clearDraft, loadDraft, saveDraft } from '../src/lib/persistence'
import { sampleDocument } from '../src/lib/document'
describe('draft persistence',()=>{ beforeEach(()=>localStorage.clear()); it('round trips versioned documents',()=>{ const doc=sampleDocument(); saveDraft(doc); expect(loadDraft()?.rows).toHaveLength(8); clearDraft(); expect(loadDraft()).toBeNull() }); it('recovers from corruption and schema mismatch',()=>{ localStorage.setItem('light-bill:draft:v1','{nope'); expect(loadDraft()).toBeNull(); localStorage.setItem('light-bill:draft:v1',JSON.stringify({version:2,rows:[]})); expect(loadDraft()).toBeNull() }) })


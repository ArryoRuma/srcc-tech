<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import {
  UPDATE_CATEGORIES,
  UPDATE_TAGS,
  type UpdateCategory,
  type UpdateTag,
  categoryLabel,
  tagLabel
} from '~~/utils/updateTaxonomy'

const toast = useToast()

// ─── Section config ─────────────────────────────────────────────────────────

const sectionOptions = [
  { label: 'SOPs', value: 'sops', icon: 'i-lucide-book-check' },
  { label: 'Runbooks', value: 'runbooks', icon: 'i-lucide-activity' },
  { label: 'References', value: 'references', icon: 'i-lucide-library' },
  { label: 'Vendor docs', value: 'vendor-docs', icon: 'i-lucide-file-stack' },
  { label: 'Diagrams', value: 'diagrams', icon: 'i-lucide-workflow' },
  { label: 'Handoff', value: 'handoff', icon: 'i-lucide-briefcase' },
  { label: 'Archive', value: 'archive', icon: 'i-lucide-archive' }
]

// ─── Tabs ────────────────────────────────────────────────────────────────────

const tabs = [{
  label: 'Resource files',
  slot: 'files' as const,
  icon: 'i-lucide-folder-open'
}, {
  label: 'New update',
  slot: 'update' as const,
  icon: 'i-lucide-pencil-line'
}]

// ─── File list ───────────────────────────────────────────────────────────────

interface ResourceFile {
  name: string
  relativePath: string
  extension: string
  modifiedAt: string
  sizeBytes: number
}

const selectedSection = ref('sops')

const { data: fileData, pending: listPending, refresh: refreshList } = await useFetch('/api/resources/list', {
  query: computed(() => ({ section: selectedSection.value })),
  key: computed(() => `manage-list-${selectedSection.value}`)
})

const files = computed<ResourceFile[]>(() => (fileData.value as { files?: ResourceFile[] } | null)?.files ?? [])

const formatBytes = (value: number) => {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Upload ──────────────────────────────────────────────────────────────────

const fileInputRef = ref<HTMLInputElement | null>(null)
const pickedFile = ref<File | null>(null)
const customName = ref('')
const uploading = ref(false)
const uploadSection = ref('sops')

function onFilePick(event: Event) {
  const input = event.target as HTMLInputElement
  pickedFile.value = input.files?.[0] ?? null
  if (pickedFile.value && !customName.value) {
    customName.value = pickedFile.value.name
  }
}

function triggerFilePick() {
  fileInputRef.value?.click()
}

async function handleUpload() {
  if (!pickedFile.value) {
    toast.add({ title: 'No file selected', description: 'Choose a file before uploading.', color: 'warning' })
    return
  }

  uploading.value = true
  try {
    const form = new FormData()
    form.append('section', uploadSection.value)
    form.append('file', pickedFile.value)
    if (customName.value.trim()) {
      form.append('customName', customName.value.trim())
    }

    const result = await $fetch('/api/resources/upload', { method: 'POST', body: form })

    toast.add({
      title: 'File uploaded',
      description: `${(result as { name: string }).name} was added to ${uploadSection.value}.`,
      color: 'success'
    })

    pickedFile.value = null
    customName.value = ''
    if (fileInputRef.value) fileInputRef.value.value = ''

    if (selectedSection.value === uploadSection.value) {
      await refreshList()
    }
  } catch (err: unknown) {
    const e = err as { statusMessage?: string }
    toast.add({ title: 'Upload failed', description: e?.statusMessage ?? 'An error occurred.', color: 'error' })
  } finally {
    uploading.value = false
  }
}

// ─── Delete ──────────────────────────────────────────────────────────────────

const deleteTarget = ref<string | null>(null)
const deleteOpen = ref(false)
const deleting = ref(false)

function openDelete(name: string) {
  deleteTarget.value = name
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await $fetch('/api/resources/delete', {
      method: 'DELETE',
      query: { section: selectedSection.value, name: deleteTarget.value }
    })
    toast.add({ title: 'File deleted', description: `${deleteTarget.value} was removed.`, color: 'success' })
    deleteOpen.value = false
    deleteTarget.value = null
    await refreshList()
  } catch (err: unknown) {
    const e = err as { statusMessage?: string }
    toast.add({ title: 'Delete failed', description: e?.statusMessage ?? 'An error occurred.', color: 'error' })
  } finally {
    deleting.value = false
  }
}

// ─── Rename ──────────────────────────────────────────────────────────────────

const renameTarget = ref<string | null>(null)
const renameNewName = ref('')
const renameOpen = ref(false)
const renaming = ref(false)

function openRename(name: string) {
  renameTarget.value = name
  renameNewName.value = name
  renameOpen.value = true
}

async function confirmRename() {
  if (!renameTarget.value || !renameNewName.value.trim()) return
  renaming.value = true
  try {
    await $fetch('/api/resources/rename', {
      method: 'PATCH',
      body: {
        section: selectedSection.value,
        oldName: renameTarget.value,
        newName: renameNewName.value.trim()
      }
    })
    toast.add({ title: 'File renamed', description: `Renamed to ${renameNewName.value.trim()}.`, color: 'success' })
    renameOpen.value = false
    renameTarget.value = null
    renameNewName.value = ''
    await refreshList()
  } catch (err: unknown) {
    const e = err as { statusMessage?: string }
    toast.add({ title: 'Rename failed', description: e?.statusMessage ?? 'An error occurred.', color: 'error' })
  } finally {
    renaming.value = false
  }
}

// ─── New update form ─────────────────────────────────────────────────────────

const updateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  category: z.enum(UPDATE_CATEGORIES).optional(),
  tags: z.array(z.enum(UPDATE_TAGS)).optional(),
  published: z.boolean(),
  body: z.string().min(1, 'Body content is required')
})

type UpdateSchema = z.output<typeof updateSchema>

const today = new Date().toISOString().slice(0, 10)

const updateState = reactive<Partial<UpdateSchema>>({
  title: '',
  date: today,
  category: undefined,
  tags: [],
  published: true,
  body: ''
})

const updateCategoryOptions = UPDATE_CATEGORIES.map((category: UpdateCategory) => ({
  label: categoryLabel(category),
  value: category
}))

const updateTagOptions = UPDATE_TAGS.map((tag: UpdateTag) => ({
  label: tagLabel(tag),
  value: tag
}))

interface RelatedFile {
  section: string
  name: string
}

const relatedFiles = ref<RelatedFile[]>([])

function addRelatedFile() {
  relatedFiles.value.push({ section: 'sops', name: '' })
}

function removeRelatedFile(index: number) {
  relatedFiles.value.splice(index, 1)
}

const submittingUpdate = ref(false)

async function onUpdateSubmit(event: FormSubmitEvent<UpdateSchema>) {
  submittingUpdate.value = true
  try {
    const result = await $fetch('/api/updates/create', {
      method: 'POST',
      body: {
        title: event.data.title,
        date: event.data.date,
        category: event.data.category || undefined,
        tags: event.data.tags ?? [],
        published: event.data.published,
        relatedFiles: relatedFiles.value.filter(f => f.name.trim()),
        body: event.data.body
      }
    })

    toast.add({
      title: 'Update created',
      description: `${(result as { filename: string }).filename} was saved.`,
      color: 'success'
    })

    // Reset form
    Object.assign(updateState, {
      title: '',
      date: today,
      category: undefined,
      tags: [],
      published: true,
      body: ''
    })
    relatedFiles.value = []
  } catch (err: unknown) {
    const e = err as { statusMessage?: string }
    toast.add({ title: 'Failed to save update', description: e?.statusMessage ?? 'An error occurred.', color: 'error' })
  } finally {
    submittingUpdate.value = false
  }
}

// ─── SEO ─────────────────────────────────────────────────────────────────────

useSeoMeta({
  title: 'Manage — SRCC Tech',
  description: 'Upload and manage resource files, and author new update entries.'
})
</script>

<template>
  <main class="space-y-8 lg:space-y-10">
    <!-- Header -->
    <section class="hero-panel rounded-[2rem] p-6 sm:p-8 lg:p-10">
      <div class="flex flex-wrap items-start justify-between gap-5">
        <div class="max-w-3xl space-y-4">
          <p class="eyebrow-label text-dimmed">
            Management
          </p>
          <div class="flex items-center gap-3">
            <UIcon
              name="i-lucide-settings-2"
              class="size-5 text-primary"
            />
            <h1 class="text-3xl font-semibold tracking-tight text-highlighted sm:text-4xl">
              Manage
            </h1>
          </div>
          <p class="max-w-2xl text-base leading-7 text-muted">
            Upload resource files, rename and delete existing files, and author new update entries.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <UButton
            to="/resources"
            icon="i-lucide-folder-tree"
            label="Resources"
            color="neutral"
            variant="outline"
          />
          <UButton
            to="/updates"
            icon="i-lucide-scroll-text"
            label="Updates"
            color="neutral"
            variant="subtle"
          />
        </div>
      </div>
    </section>

    <!-- Tabbed workspace -->
    <UTabs
      :items="tabs"
      variant="pill"
      class="w-full"
    >
      <!-- ── Files tab ──────────────────────────────────────────── -->
      <template #files>
        <div class="mt-6 space-y-6">
          <!-- Upload card -->
          <section class="hero-panel rounded-[2rem] p-6 sm:p-8">
            <h2 class="mb-5 text-lg font-semibold text-highlighted">
              Upload a file
            </h2>

            <div class="space-y-4">
              <!-- Section select -->
              <div class="grid gap-4 sm:grid-cols-2">
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-default">
                    Section
                  </label>
                  <USelect
                    v-model="uploadSection"
                    :items="sectionOptions"
                    value-key="value"
                    label-key="label"
                    placeholder="Choose section"
                    class="w-full"
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-default">
                    Filename override
                    <span class="ml-1 font-normal text-dimmed">(optional)</span>
                  </label>
                  <UInput
                    v-model="customName"
                    placeholder="e.g. my-document.pdf"
                    class="w-full"
                  />
                  <p class="text-xs text-dimmed">
                    Today's date will be auto-prepended if missing.
                  </p>
                </div>
              </div>

              <!-- File picker -->
              <div class="space-y-1.5">
                <label class="text-sm font-medium text-default">
                  File
                </label>
                <div
                  class="dashboard-chip flex min-h-24 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl p-6 transition-colors hover:bg-elevated"
                  @click="triggerFilePick"
                >
                  <UIcon
                    name="i-lucide-upload-cloud"
                    class="size-7 text-dimmed"
                  />
                  <p
                    v-if="pickedFile"
                    class="text-sm font-medium text-highlighted"
                  >
                    {{ pickedFile.name }}
                    <span class="ml-2 font-normal text-dimmed">
                      ({{ formatBytes(pickedFile.size) }})
                    </span>
                  </p>
                  <p
                    v-else
                    class="text-sm text-muted"
                  >
                    Click to pick a file
                    <span class="mx-1 text-dimmed">·</span>
                    .md .pdf .docx .xlsx .png .jpg .drawio .vsdx
                  </p>
                </div>
                <input
                  ref="fileInputRef"
                  type="file"
                  accept=".md,.pdf,.docx,.xlsx,.png,.jpg,.jpeg,.drawio,.vsdx,.txt,.csv"
                  class="sr-only"
                  @change="onFilePick"
                >
              </div>

              <UButton
                :loading="uploading"
                :disabled="!pickedFile"
                icon="i-lucide-upload"
                label="Upload file"
                color="primary"
                @click="handleUpload"
              />
            </div>
          </section>

          <!-- File list -->
          <section class="hero-panel rounded-[2rem] p-6 sm:p-8">
            <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 class="text-lg font-semibold text-highlighted">
                Browse &amp; manage files
              </h2>
              <USelect
                v-model="selectedSection"
                :items="sectionOptions"
                value-key="value"
                label-key="label"
                class="w-44"
              />
            </div>

            <!-- Loading -->
            <div
              v-if="listPending"
              class="grid gap-3"
            >
              <USkeleton
                v-for="i in 4"
                :key="i"
                class="h-16 rounded-2xl"
              />
            </div>

            <!-- Empty -->
            <div
              v-else-if="files.length === 0"
              class="py-10 text-center"
            >
              <UIcon
                name="i-lucide-folder-open"
                class="mx-auto mb-3 size-8 text-dimmed"
              />
              <p class="text-sm text-muted">
                No files in this section yet.
              </p>
            </div>

            <!-- File rows -->
            <div
              v-else
              class="divide-y divide-default"
            >
              <div
                v-for="file in files"
                :key="file.name"
                class="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div class="min-w-0 flex-1 space-y-0.5">
                  <p class="truncate text-sm font-medium text-highlighted">
                    {{ file.name }}
                  </p>
                  <p class="font-mono text-xs text-dimmed">
                    {{ formatBytes(file.sizeBytes) }}
                    <span class="mx-1">·</span>
                    {{ new Date(file.modifiedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}
                  </p>
                </div>

                <div class="flex shrink-0 flex-wrap items-center gap-2">
                  <UBadge
                    :label="file.extension"
                    variant="subtle"
                    color="neutral"
                    size="sm"
                  />
                  <UButton
                    :to="`/resources/${selectedSection}/${encodeURIComponent(file.name)}`"
                    icon="i-lucide-eye"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    title="View file"
                  />
                  <UButton
                    icon="i-lucide-pencil"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    title="Rename file"
                    @click="openRename(file.name)"
                  />
                  <UButton
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="sm"
                    title="Delete file"
                    @click="openDelete(file.name)"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </template>

      <!-- ── New update tab ────────────────────────────────────── -->
      <template #update>
        <div class="mt-6">
          <section class="hero-panel rounded-[2rem] p-6 sm:p-8 lg:p-10">
            <h2 class="mb-6 text-lg font-semibold text-highlighted">
              New update entry
            </h2>

            <UForm
              :schema="updateSchema"
              :state="updateState"
              class="space-y-5"
              @submit="onUpdateSubmit"
            >
              <div class="grid gap-5 sm:grid-cols-2">
                <UFormField
                  name="title"
                  label="Title"
                  required
                  class="sm:col-span-2"
                >
                  <UInput
                    v-model="updateState.title"
                    placeholder="e.g. AV System Update"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  name="date"
                  label="Date"
                  required
                >
                  <UInput
                    v-model="updateState.date"
                    type="date"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  name="category"
                  label="Category"
                  hint="Optional"
                >
                  <USelect
                    v-model="updateState.category"
                    :items="updateCategoryOptions"
                    value-key="value"
                    label-key="label"
                    placeholder="Choose category"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  name="tags"
                  label="Tags"
                  description="Select one or more tags"
                  hint="Optional"
                  class="sm:col-span-2"
                >
                  <USelectMenu
                    v-model="updateState.tags"
                    :items="updateTagOptions"
                    value-key="value"
                    label-key="label"
                    placeholder="Choose tags"
                    multiple
                    searchable
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  name="published"
                  label="Published"
                  class="sm:col-span-2"
                >
                  <USwitch
                    v-model="updateState.published"
                    label="Publish immediately"
                  />
                </UFormField>
              </div>

              <!-- Related files -->
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-default">
                    Related files
                    <span class="ml-1 font-normal text-dimmed">(optional)</span>
                  </p>
                  <UButton
                    icon="i-lucide-plus"
                    label="Add file"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    @click="addRelatedFile"
                  />
                </div>

                <div
                  v-if="relatedFiles.length > 0"
                  class="space-y-2"
                >
                  <div
                    v-for="(rf, idx) in relatedFiles"
                    :key="idx"
                    class="dashboard-chip flex flex-wrap items-center gap-2 rounded-xl p-3"
                  >
                    <USelect
                      v-model="rf.section"
                      :items="sectionOptions"
                      value-key="value"
                      label-key="label"
                      class="w-36 shrink-0"
                      size="sm"
                    />
                    <UInput
                      v-model="rf.name"
                      placeholder="filename.md"
                      class="min-w-0 flex-1"
                      size="sm"
                    />
                    <UButton
                      icon="i-lucide-x"
                      color="neutral"
                      variant="ghost"
                      size="sm"
                      @click="removeRelatedFile(idx)"
                    />
                  </div>
                </div>
              </div>

              <!-- Body -->
              <UFormField
                name="body"
                label="Content"
                description="Markdown is supported"
                required
              >
                <UTextarea
                  v-model="updateState.body"
                  placeholder="Write your update in Markdown…"
                  :rows="14"
                  class="w-full font-mono text-sm"
                  resize
                />
              </UFormField>

              <div class="flex justify-end gap-3 pt-2">
                <UButton
                  type="button"
                  label="Clear"
                  color="neutral"
                  variant="ghost"
                  @click="Object.assign(updateState, { title: '', date: today, category: undefined, tags: [], published: true, body: '' }); relatedFiles = []"
                />
                <UButton
                  type="submit"
                  :loading="submittingUpdate"
                  icon="i-lucide-save"
                  label="Save update"
                  color="primary"
                />
              </div>
            </UForm>
          </section>
        </div>
      </template>
    </UTabs>

    <!-- Delete confirmation modal -->
    <UModal
      v-model:open="deleteOpen"
      title="Delete file"
      :description="`Remove ${deleteTarget} from ${selectedSection}? This cannot be undone.`"
      :ui="{ footer: 'justify-end' }"
    >
      <template #footer="{ close }">
        <UButton
          label="Cancel"
          color="neutral"
          variant="outline"
          @click="close"
        />
        <UButton
          :loading="deleting"
          label="Delete"
          color="error"
          @click="confirmDelete"
        />
      </template>
    </UModal>

    <!-- Rename modal -->
    <UModal
      v-model:open="renameOpen"
      title="Rename file"
      :ui="{ footer: 'justify-end' }"
    >
      <template #body>
        <UInput
          v-model="renameNewName"
          placeholder="New filename"
          class="w-full"
          autofocus
        />
      </template>
      <template #footer="{ close }">
        <UButton
          label="Cancel"
          color="neutral"
          variant="outline"
          @click="close"
        />
        <UButton
          :loading="renaming"
          label="Rename"
          color="primary"
          :disabled="!renameNewName.trim() || renameNewName.trim() === renameTarget"
          @click="confirmRename"
        />
      </template>
    </UModal>
  </main>
</template>

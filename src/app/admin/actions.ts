'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { runPrintfulSync } from '@/server/printful/sync'
import { getSessionUser } from '@/lib/auth/session'
import { isWhitelistedAdmin } from '@/lib/auth/adminWhitelist'
import type { Role } from '@/lib/auth/types'

async function requireAdmin() {
  const user = await getSessionUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const normalizedRole: Role = user.role === 'admin' ? 'admin' : 'user'

  const dbUser = await prisma.user.upsert({
    where: { sub: user.sub },
    update: {},
    create: {
      sub: user.sub,
      email: user.email,
      name: user.name,
      role: normalizedRole,
    },
    select: { sub: true, role: true },
  })

  if (dbUser?.role === 'admin') {
    return { ...user, role: 'admin' as Role }
  }

  if (isWhitelistedAdmin(user.email)) {
    await prisma.user.update({
      where: { sub: user.sub },
      data: { role: 'admin' },
    })
    return { ...user, role: 'admin' as Role }
  }

  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'admin' },
    select: { sub: true },
  })

  if (!existingAdmin) {
    await prisma.user.update({
      where: { sub: user.sub },
      data: { role: 'admin' },
    })
    return { ...user, role: 'admin' as Role }
  }

  throw new Error('Unauthorized')
}

export async function createProductImageAction(formData: FormData) {
  await requireAdmin()
  const productId = Number(formData.get('productId'))
  const variantIdRaw = formData.get('variantId')
  const key = String(formData.get('key') ?? '').trim()
  const kind = String(formData.get('kind') ?? 'mockup').trim()
  const sortIndex = Number(formData.get('sortIndex') ?? 0)
  const placementRaw = formData.get('placement')
  const selected = formData.get('selected') === 'on'

  if (!productId || !key) {
    throw new Error('Missing productId or key')
  }

  let variantId: number | null = null
  if (variantIdRaw !== null && typeof variantIdRaw !== 'undefined') {
    const raw = String(variantIdRaw).trim()
    if (raw !== '') {
      const parsed = Number(raw)
      if (!Number.isFinite(parsed)) {
        throw new Error('Invalid variant id')
      }
      variantId = parsed
    }
  }

  const placement =
    placementRaw !== null && typeof placementRaw !== 'undefined'
      ? String(placementRaw).trim() || null
      : null

  await prisma.productImage.create({
    data: {
      productId,
      variantId,
      url: key,
      kind,
      sortIndex: Number.isFinite(sortIndex) ? sortIndex : 0,
      selected,
      placement,
      source: 'manual',
    },
  })

  revalidatePath('/admin/products')
}

export async function updateProductImageAction(formData: FormData) {
  await requireAdmin()
  const id = Number(formData.get('id'))
  const kind = String(formData.get('kind') ?? '').trim()
  const sortIndex = Number(formData.get('sortIndex') ?? 0)
  const selected = formData.get('selected') === 'on'
  const variantIdRaw = formData.get('variantId')
  const placementRaw = formData.get('placement')

  if (!id) throw new Error('Missing image id')

  let variantId: number | null | undefined
  if (variantIdRaw !== null && typeof variantIdRaw !== 'undefined') {
    const raw = String(variantIdRaw).trim()
    if (raw === '') {
      variantId = null
    } else {
      const parsed = Number(raw)
      if (!Number.isFinite(parsed)) {
        throw new Error('Invalid variant id')
      }
      variantId = parsed
    }
  }

  const placement =
    placementRaw !== null && typeof placementRaw !== 'undefined'
      ? String(placementRaw).trim() || null
      : undefined

  await prisma.productImage.update({
    where: { id },
    data: {
      kind: kind || undefined,
      sortIndex: Number.isFinite(sortIndex) ? sortIndex : undefined,
      selected,
      variantId: typeof variantId !== 'undefined' ? variantId : undefined,
      placement,
    },
  })

  revalidatePath('/admin/products')
}

export async function deleteProductImageAction(formData: FormData) {
  await requireAdmin()
  const id = Number(formData.get('id'))
  if (!id) throw new Error('Missing image id')
  await prisma.productImage.delete({ where: { id } })
  revalidatePath('/admin/products')
}

export async function triggerPrintfulSyncAction(formData: FormData) {
  const user = await requireAdmin()
  const mode = String(formData.get('mode') ?? 'append')
  const clear = mode === 'replace'
  await runPrintfulSync({
    clear,
    actor: user.email ?? user.sub ?? 'admin',
    source: 'admin-ui',
  })
  revalidatePath('/admin')
  revalidatePath('/admin/products')
}

function parsePriceToCents(input: FormDataEntryValue | null): number | null {
  if (input === null || typeof input === 'undefined') return null
  const raw = String(input).trim()
  if (!raw) return null
  const normalized = raw.replace(/,/g, '.').replace(/[^0-9.]/g, '')
  if (!normalized) throw new Error('Invalid price')
  const value = Number(normalized)
  if (!Number.isFinite(value)) throw new Error('Invalid price')
  return Math.round(value * 100)
}

export async function updateProductDetailsAction(formData: FormData) {
  await requireAdmin()
  const productId = Number(formData.get('productId'))
  if (!Number.isFinite(productId)) throw new Error('Missing product id')

  const priceCents = parsePriceToCents(formData.get('price'))
  const imageInput = formData.get('imageKey')
  const imageKey = typeof imageInput === 'string' ? imageInput.trim() : ''
  const titleInput = formData.get('title')
  const title = typeof titleInput === 'string' ? titleInput.trim() : ''
  const descriptionInput = formData.get('description')
  const description = typeof descriptionInput === 'string' ? descriptionInput.trim() : ''
  const deleted = formData.get('deleted') === 'on'

  const data: Record<string, unknown> = { deleted }
  if (priceCents !== null) data.price = priceCents
  if (imageInput !== null) data.imageUrl = imageKey || null
  if (titleInput !== null && title) data.title = title
  if (descriptionInput !== null) data.description = description

  await prisma.product.update({
    where: { id: productId },
    data,
  })

  revalidatePath('/admin/products')
}

export async function updateVariantDetailsAction(formData: FormData) {
  await requireAdmin()
  const variantId = Number(formData.get('variantId'))
  if (!Number.isFinite(variantId)) throw new Error('Missing variant id')

  const priceCents = parsePriceToCents(formData.get('price'))
  const colorInput = formData.get('color')
  const sizeInput = formData.get('size')
  const imageInput = formData.get('imageUrl')
  const previewInput = formData.get('previewUrl')
  const deleted = formData.get('deleted') === 'on'

  const data: Record<string, unknown> = { deleted }
  if (priceCents !== null) data.price = priceCents
  if (colorInput !== null) data.color = typeof colorInput === 'string' ? colorInput.trim() : null
  if (sizeInput !== null) data.size = typeof sizeInput === 'string' ? sizeInput.trim() : null
  if (imageInput !== null) {
    const value = typeof imageInput === 'string' ? imageInput.trim() : ''
    data.imageUrl = value || null
  }
  if (previewInput !== null) {
    const value = typeof previewInput === 'string' ? previewInput.trim() : ''
    data.previewUrl = value || null
  }

  await prisma.variant.update({
    where: { id: variantId },
    data,
  })

  revalidatePath('/admin/products')
}

export async function updateUserRoleAction(formData: FormData) {
  await requireAdmin()
  const sub = String(formData.get('sub') ?? '')
  const role = String(formData.get('role') ?? 'user') as 'user' | 'admin'
  if (!sub) throw new Error('Missing user sub')

  await prisma.user.update({
    where: { sub },
    data: { role },
  })

  revalidatePath('/admin/permissions')
}

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth/session'

async function requireAdmin() {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return user
}

export async function createProductImageAction(formData: FormData) {
  await requireAdmin()
  const productId = Number(formData.get('productId'))
  const variantIdRaw = formData.get('variantId')
  const key = String(formData.get('key') ?? '').trim()
  const kind = String(formData.get('kind') ?? 'mockup').trim()
  const sortIndex = Number(formData.get('sortIndex') ?? 0)

  if (!productId || !key) {
    throw new Error('Missing productId or key')
  }

  await prisma.productImage.create({
    data: {
      productId,
      variantId: variantIdRaw ? Number(variantIdRaw) : null,
      url: key,
      kind,
      sortIndex: Number.isFinite(sortIndex) ? sortIndex : 0,
      selected: true,
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

  if (!id) throw new Error('Missing image id')

  await prisma.productImage.update({
    where: { id },
    data: {
      kind: kind || undefined,
      sortIndex: Number.isFinite(sortIndex) ? sortIndex : undefined,
      selected,
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

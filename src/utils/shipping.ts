import fetch from 'node-fetch'

const SHIPPO_TOKEN = process.env.SHIPPO_TOKEN

export interface Address {
  name?: string
  street1: string
  city: string
  state: string
  zip: string
  country: string
}

export interface Parcel {
  length: number
  width: number
  height: number
  weight: number
}

export async function getShippingRates(from: Address, to: Address, parcel: Parcel) {
  const res = await fetch('https://api.goshippo.com/shipments/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `ShippoToken ${SHIPPO_TOKEN}`,
    },
    body: JSON.stringify({ address_from: from, address_to: to, parcels: [parcel], async: false }),
  })
  if (!res.ok) throw new Error('Failed to fetch rates')
  return res.json()
}

export async function purchaseLabel(rateId: string) {
  const res = await fetch('https://api.goshippo.com/transactions/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `ShippoToken ${SHIPPO_TOKEN}`,
    },
    body: JSON.stringify({ rate: rateId, label_file_type: 'PDF' }),
  })
  if (!res.ok) throw new Error('Failed to purchase label')
  return res.json()
}
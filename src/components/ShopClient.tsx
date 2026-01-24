// src/components/ShopClient.tsx
"use client"

import { useState, useMemo, useEffect } from "react"
import ProductCard, { Product } from "./ProductCard"
import { motion } from "framer-motion"
import { List, Sliders } from "lucide-react"
import useSWR from "swr"
import algoliasearch from "algoliasearch/lite"

interface ShopClientProps {
  initialProducts: Product[]
}

const fetcher = (url: string) =>
  fetch(url).then((res) => res.json() as Promise<Product[]>)

type SortOption = "price-asc" | "price-desc" | "name-asc" | "name-desc"

export default function ShopClient({ initialProducts }: ShopClientProps) {
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("price-asc")
  const [category, setCategory] = useState<string>("All")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const client = useMemo(
    () =>
      algoliasearch(
        process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
        process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY!
      ).initIndex("products"),
    []
  )

  const { data: products = initialProducts } = useSWR<Product[]>("/api/products", fetcher, {
    fallbackData: initialProducts,
  })

  const [results, setResults] = useState<Product[]>(initialProducts)

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.title.split(" ")[0]))
    return ["All", ...Array.from(cats)]
  }, [products])

  // Query Algolia whenever search or category change
  useEffect(() => {
    const facetFilters = category !== "All" ? [`category:${category}`] : []
    if (!search && facetFilters.length === 0) {
      setResults(products)
      return
    }
    client
      .search<Product>(search, { facetFilters })
      .then(({ hits }) => setResults(hits as unknown as Product[]))
      .catch(() => setResults(products))
  }, [search, category, products, client])

  const filtered = useMemo(() => {
    return [...results].sort((a, b) => {
      switch (sortBy) {
        case "price-asc": return a.price - b.price
        case "price-desc": return b.price - a.price
        case "name-asc": return a.title.localeCompare(b.title)
        case "name-desc": return b.title.localeCompare(a.title)
      }
    })
  }, [results, sortBy])

  return (
    <div className="flex gap-10">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-24 space-y-8">
          <div>
            <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-slate-500">filters</h2>
            <div className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`block w-full rounded-xl px-4 py-2 text-left text-sm transition ${category === cat
                    ? "bg-emerald-400/10 font-medium text-emerald-300"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile Controls & Search */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search drops..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-black/60 px-5 py-3 text-sm text-white placeholder-slate-500 transition focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-2xl border border-slate-800 bg-black/60 px-4 py-3 text-sm text-slate-300 focus:border-emerald-400 focus:outline-none"
            >
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A→Z</option>
              <option value="name-desc">Name: Z→A</option>
            </select>
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-slate-300 lg:hidden"
              aria-label="Toggle filters"
            >
              {sidebarOpen ? <List size={20} /> : <Sliders size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <aside
              className="absolute left-0 top-0 h-full w-3/4 max-w-xs border-r border-slate-800 bg-black p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-6 text-xs uppercase tracking-[0.2em] text-slate-500">Categories</h2>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setCategory(cat); setSidebarOpen(false) }}
                    className={`block w-full rounded-xl px-4 py-3 text-left text-sm transition ${category === cat
                      ? "bg-emerald-400/10 font-medium text-emerald-300"
                      : "text-slate-400 hover:text-white"
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </aside>
          </motion.div>
        )}

        {/* Product Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {filtered.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>

        {!filtered.length && (
          <div className="py-20 text-center">
            <p className="text-slate-500">No drops found matching specific queries.</p>
            <button onClick={() => { setSearch(''); setCategory('All') }} className="mt-4 text-emerald-400 hover:text-emerald-300 hover:underline">Clear filters</button>
          </div>
        )}
      </div>
    </div>
  )
}
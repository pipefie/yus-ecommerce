// src/components/ShopClient.tsx
"use client"

import { useState, useMemo, useEffect } from "react"
import ProductCard, { Product } from "./ProductCard"
import { AnimatePresence, motion } from "framer-motion"
import { List, Sliders } from "lucide-react"
import useSWR from "swr"
import algoliasearch from "algoliasearch/lite"

interface ShopClientProps {
  initialProducts: Product[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json() as Promise<Product[]>)

type SortOption = "price-asc" | "price-desc" | "name-asc" | "name-desc"

export default function ShopClient({ initialProducts }: ShopClientProps) {
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("price-asc")
  const [category, setCategory] = useState<string>("All")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const algoliaIndex = useMemo(() => {
    const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID
    const searchKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY
    if (!appId || !searchKey) return null
    return algoliasearch(appId, searchKey).initIndex("products")
  }, [])

  const { data: products = initialProducts } = useSWR<Product[]>("/api/products", fetcher, {
    fallbackData: initialProducts,
  })

  const [results, setResults] = useState<Product[]>(initialProducts)

  const categories = useMemo(() => {
    const cats = new Set(
      products
        .map((product) => product.title?.split(" ")?.[0]?.trim())
        .filter((value): value is string => Boolean(value))
    )
    return ["All", ...Array.from(cats)]
  }, [products])

  useEffect(() => {
    const facetFilters = category !== "All" ? [`category:${category}`] : []
    if (!search && facetFilters.length === 0) {
      setResults(products)
      return
    }

    if (!algoliaIndex) {
      const normalizedCategory = category.toLowerCase()
      const query = search.toLowerCase()
      const fallbackFiltered = products.filter((product) => {
        const matchesCategory =
          category === "All" ||
          product.title.toLowerCase().startsWith(normalizedCategory)
        const matchesSearch =
          !search ||
          product.title.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query)
        return matchesCategory && matchesSearch
      })
      setResults(fallbackFiltered)
      return
    }

    algoliaIndex
      .search<Product>(search, { facetFilters })
      .then(({ hits }) => setResults((hits as unknown as Product[]) ?? []))
      .catch(() => setResults(products))
  }, [search, category, products, algoliaIndex])

  const filtered = useMemo(() => {
    return [...results].sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.price - b.price
        case "price-desc":
          return b.price - a.price
        case "name-asc":
          return a.title.localeCompare(b.title)
        case "name-desc":
          return b.title.localeCompare(a.title)
        default:
          return 0
      }
    })
  }, [results, sortBy])

  return (
    <div className="flex flex-col gap-10 lg:flex-row">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-32 space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Categories</p>
          <div className="space-y-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`w-full rounded-2xl px-4 py-2 text-left text-sm font-medium transition ${
                  category === cat
                    ? "border border-neon/60 bg-neon/10 text-neon"
                    : "border border-white/10 text-slate-200 hover:border-neon/40 hover:text-neon"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex-1 space-y-8">
        <div className="glass-panel rounded-3xl p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <input
              type="text"
              placeholder="Search the chaos…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-neon focus:outline-none"
            />
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-neon focus:outline-none"
              >
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="name-asc">Name: A → Z</option>
                <option value="name-desc">Name: Z → A</option>
              </select>
              <button
                onClick={() => setSidebarOpen((openState) => !openState)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-neon lg:hidden"
                aria-label="Toggle filters"
              >
                {sidebarOpen ? <List size={18} /> : <Sliders size={18} />}
                Filters
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="rounded-full border border-white/10 px-3 py-1">
              {filtered.length} {filtered.length === 1 ? "tee" : "tees"}
            </span>
            <span className="hidden text-slate-500 sm:inline">•</span>
            <span className="text-slate-400">{category === "All" ? "All capsules" : `Capsule: ${category}`}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 lg:hidden">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-full border px-4 py-1 text-xs font-semibold transition ${
                  category === cat
                    ? "border-neon/80 bg-neon/20 text-neon"
                    : "border-white/15 text-slate-300 hover:border-neon/60"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              className="absolute left-0 top-0 h-full w-72 border-r border-white/10 bg-[#050b1c]/95 p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Filters</p>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-sm text-slate-300 hover:text-neon"
                >
                  Close
                </button>
              </div>
              <div className="space-y-3">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategory(cat)
                      setSidebarOpen(false)
                    }}
                    className={`w-full rounded-2xl px-4 py-2 text-left text-sm ${
                      category === cat
                        ? "border border-neon/60 bg-neon/10 text-neon"
                        : "border border-white/10 text-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

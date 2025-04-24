// src/components/ShopClient.tsx
"use client"

import { useState, useMemo } from "react"
import ProductCard, { Product } from "./ProductCard"
import { motion } from "framer-motion"
import { List, Sliders } from "lucide-react"
import useSWR from "swr"

interface ShopClientProps {
    initialProducts: Product[]
  }
  
  const fetcher = (url: string) =>
    fetch(url).then((res) => res.json() as Promise<Product[]>)
  
  export default function ShopClient({ initialProducts }: ShopClientProps) {
    const [search, setSearch] = useState("")
    const [sortBy, setSortBy] = useState<"price-asc"|"price-desc"|"name-asc"|"name-desc">("price-asc")
    const [category, setCategory] = useState<string>("All")
    const [sidebarOpen, setSidebarOpen] = useState(false)
  
    const { data: products = initialProducts } = useSWR<Product[]>("/api/products", fetcher, {
      fallbackData: initialProducts,
    })
  
    const categories = useMemo(() => {
      const cats = new Set(products.map((p) => p.title.split(" ")[0]))
      return ["All", ...Array.from(cats)]
    }, [products])
  
    const filtered = useMemo(() => {
      let list = products
      if (category !== "All") {
        list = list.filter((p) => p.title.startsWith(category))
      }
      if (search) {
        list = list.filter((p) =>
          p.title.toLowerCase().includes(search.toLowerCase())
        )
      }
      return [...list].sort((a, b) => {
        switch (sortBy) {
          case "price-asc":  return a.price - b.price
          case "price-desc": return b.price - a.price
          case "name-asc":   return a.title.localeCompare(b.title)
          case "name-desc":  return b.title.localeCompare(a.title)
        }
      })
    }, [products, category, search, sortBy])
  
    return (
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 pr-6">
          <div className="sticky top-24 space-y-4">
            <h2 className="font-medium mb-2">Categories</h2>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`block w-full text-left px-3 py-2 rounded ${
                  category === cat ? "bg-gray-200" : "hover:bg-gray-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </aside>
  
        <div className="flex-1">
          {/* Mobile Controls & Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A→Z</option>
                <option value="name-desc">Name: Z→A</option>
              </select>
              <button
                onClick={() => setSidebarOpen((o) => !o)}
                className="lg:hidden p-2 bg-gray-200 rounded-lg"
                aria-label="Toggle filters"
              >
                {sidebarOpen ? <List size={24} /> : <Sliders size={24} />}
              </button>
            </div>
          </div>
  
          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-20"
              onClick={() => setSidebarOpen(false)}
            >
              <aside
                className="absolute left-0 top-0 w-64 bg-white h-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="font-medium mb-4">Categories</h2>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setCategory(cat); setSidebarOpen(false) }}
                    className={`block w-full text-left px-3 py-2 rounded mb-2 ${
                      category === cat ? "bg-gray-200" : "hover:bg-gray-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </aside>
            </motion.div>
          )}
  
          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      </div>
    )
  }
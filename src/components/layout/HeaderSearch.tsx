"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, Loader2, ArrowRight, Sprout, Home, Layers, ShoppingBag } from "lucide-react";

interface SearchResult {
  type: string;
  title: string;
  subtitle: string;
  href: string;
}

export function HeaderSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (!val || val.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        if (data.success) {
          setResults(data.results || []);
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "FARM":
        return <Home className="w-3.5 h-3.5 text-emerald-600" />;
      case "HARVEST_LOT":
        return <Layers className="w-3.5 h-3.5 text-sky-600" />;
      case "ORDER":
        return <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />;
      case "CROP":
        return <Sprout className="w-3.5 h-3.5 text-teal-600" />;
      default:
        return <Search className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Search farm codes, lots, orders, or crops..."
          className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B532D]/30 focus:bg-white transition-all text-[#0F1D2F]"
        />
        {loading && (
          <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-[#E2E8E0] rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-slate-100 max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              No matching records found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            results.map((r, i) => (
              <Link
                key={i}
                href={r.href}
                onClick={() => {
                  setIsOpen(false);
                  setQuery("");
                }}
                className="flex items-center justify-between p-2.5 hover:bg-slate-50 transition-colors text-xs group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-md bg-slate-50 border border-slate-200 group-hover:bg-white">
                    {getIcon(r.type)}
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-[#0F1D2F] truncate">{r.title}</p>
                    <p className="text-[11px] text-slate-500 truncate">{r.subtitle}</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 transition-colors shrink-0 ml-2" />
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

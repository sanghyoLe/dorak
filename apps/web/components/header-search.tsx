"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

export function HeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/r?q=${encodeURIComponent(value)}` : "/r");
  }

  return (
    <form className="header-search" role="search" onSubmit={submit}>
      <label className="header-search__field" htmlFor="header-search">
        <Search aria-hidden="true" size={16} strokeWidth={2} />
        <span className="sr-only">식당 검색</span>
        <input
          id="header-search"
          name="q"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="식당·동네·메뉴 검색…"
          autoComplete="off"
        />
      </label>
      <button type="submit">검색</button>
    </form>
  );
}

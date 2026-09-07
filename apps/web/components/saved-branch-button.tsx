"use client";

import { Bookmark, Check } from "lucide-react";
import { useEffect, useState } from "react";

const SAVED_STORAGE_KEY = "dorak:saved-branches:v1";

type SaveSource = "loading" | "server" | "local";
type SaveState = "idle" | "loading" | "error";

function readLocalSaved(): Set<string> {
  try {
    const stored = window.localStorage.getItem(SAVED_STORAGE_KEY);
    const values = stored ? (JSON.parse(stored) as unknown) : [];
    return new Set(
      Array.isArray(values)
        ? values.filter(
            (value): value is string =>
              typeof value === "string" && value.length > 0,
          )
        : [],
    );
  } catch {
    return new Set();
  }
}

function writeLocalSaved(saved: ReadonlySet<string>): void {
  window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify([...saved]));
}

export function SavedBranchButton({
  publicId,
  initialSaved,
}: Readonly<{
  publicId: string;
  initialSaved?: boolean;
}>) {
  const [saved, setSaved] = useState(initialSaved ?? false);
  const [source, setSource] = useState<SaveSource>(
    initialSaved === undefined ? "loading" : "server",
  );
  const [state, setState] = useState<SaveState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialSaved !== undefined) return;

    let cancelled = false;
    const localSaved = readLocalSaved();

    async function loadSavedState() {
      try {
        const response = await fetch("/api/v1/saved", {
          cache: "no-store",
        });
        if (response.status === 401) {
          if (!cancelled) {
            setSaved(localSaved.has(publicId));
            setSource("local");
          }
          return;
        }
        if (!response.ok) throw new Error("saved.list");

        const payload = (await response.json()) as {
          data?: Array<{ publicId: string }>;
        };
        const serverSaved = new Set(
          (payload.data ?? []).map((branch) => branch.publicId),
        );

        if (localSaved.size > 0) {
          const mergeResponse = await fetch("/api/v1/saved", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ publicIds: [...localSaved] }),
          });
          if (mergeResponse.ok) {
            const merged = (await mergeResponse.json()) as {
              data?: Array<{ publicId: string }>;
            };
            serverSaved.clear();
            for (const branch of merged.data ?? [])
              serverSaved.add(branch.publicId);
            window.localStorage.removeItem(SAVED_STORAGE_KEY);
          }
        }

        if (!cancelled) {
          setSaved(serverSaved.has(publicId));
          setSource("server");
        }
      } catch {
        if (!cancelled) {
          setSaved(localSaved.has(publicId));
          setSource("local");
        }
      }
    }

    void loadSavedState();
    return () => {
      cancelled = true;
    };
  }, [initialSaved, publicId]);

  async function toggleSaved() {
    if (state === "loading" || source === "loading") return;

    const nextSaved = !saved;
    setSaved(nextSaved);
    setState("loading");
    setMessage(null);

    if (source === "local") {
      const next = readLocalSaved();
      if (nextSaved) next.add(publicId);
      else next.delete(publicId);
      writeLocalSaved(next);
      setState("idle");
      return;
    }

    try {
      const response = await fetch(`/api/v1/branches/${publicId}/saved`, {
        method: nextSaved ? "PUT" : "DELETE",
      });
      if (response.status === 401) {
        const next = readLocalSaved();
        if (nextSaved) next.add(publicId);
        else next.delete(publicId);
        writeLocalSaved(next);
        setSource("local");
        setMessage("이 기기에 저장했습니다. 로그인하면 계정에 이어집니다.");
        setState("idle");
        return;
      }
      if (!response.ok) throw new Error("saved.toggle");
      setState("idle");
    } catch {
      setSaved(!nextSaved);
      setMessage("저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      setState("error");
    }
  }

  return (
    <div className="save-control">
      <button
        type="button"
        className="save-button"
        aria-pressed={saved}
        aria-busy={state === "loading" || source === "loading"}
        data-state={state}
        disabled={state === "loading" || source === "loading"}
        onClick={() => void toggleSaved()}
      >
        {saved ? (
          <Check aria-hidden="true" size={16} strokeWidth={2.5} />
        ) : (
          <Bookmark aria-hidden="true" size={16} strokeWidth={2} />
        )}
        {source === "loading"
          ? "확인 중…"
          : state === "loading"
            ? "저장 중…"
            : saved
              ? "저장됨"
              : "저장"}
      </button>
      {message ? (
        <p className="save-feedback" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}

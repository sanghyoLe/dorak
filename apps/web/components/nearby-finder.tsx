"use client";

import type { NearbyBranch } from "@dorak/domain-types";
import { LocateFixed, MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type FinderState = "idle" | "locating" | "loading" | "success" | "error";
type Position = Readonly<{ latitude: number; longitude: number }>;

const RADIUS_OPTIONS = [1_000, 3_000, 5_000, 10_000] as const;

function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 10) return "10m 미만";
  if (distanceMeters < 1_000) {
    return `${Math.max(10, Math.round(distanceMeters / 10) * 10)}m`;
  }
  return `${(distanceMeters / 1_000).toFixed(1)}km`;
}

function geolocationErrorMessage(error: GeolocationPositionError): string {
  if (error.code === error.PERMISSION_DENIED) {
    return "위치 권한이 꺼져 있습니다. 브라우저 설정에서 위치 권한을 허용해 주세요.";
  }
  if (error.code === error.TIMEOUT) {
    return "위치를 확인하는 데 시간이 오래 걸렸습니다. 다시 시도해 주세요.";
  }
  return "현재 위치를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

export function NearbyFinder() {
  const [state, setState] = useState<FinderState>("idle");
  const [position, setPosition] = useState<Position | null>(null);
  const [radiusMeters, setRadiusMeters] = useState(3_000);
  const [branches, setBranches] = useState<NearbyBranch[]>([]);
  const [message, setMessage] = useState(
    "위치는 가까운 식당을 찾는 동안에만 사용하며 저장하지 않습니다.",
  );

  async function fetchNearby(nextPosition: Position, nextRadius: number) {
    setState("loading");
    setMessage("가까운 식당을 찾고 있습니다.");

    try {
      const response = await fetch("/api/v1/branches/nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
        body: JSON.stringify({ ...nextPosition, radiusMeters: nextRadius }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        data?: NearbyBranch[];
        error?: { message?: string };
      };
      if (!response.ok) {
        throw new Error(
          payload.error?.message ?? "가까운 식당을 찾지 못했습니다.",
        );
      }

      const nextBranches = payload.data ?? [];
      setBranches(nextBranches);
      setState("success");
      setMessage(
        nextBranches.length
          ? `${nextRadius / 1_000}km 안의 식당 ${nextBranches.length}곳을 거리순으로 보여드립니다.`
          : `${nextRadius / 1_000}km 안에서 위치가 확인된 식당을 찾지 못했습니다.`,
      );
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error && error.name === "TimeoutError"
          ? "식당을 찾는 데 시간이 오래 걸렸습니다. 다시 시도해 주세요."
          : error instanceof Error
            ? error.message
            : "가까운 식당을 찾지 못했습니다.",
      );
    }
  }

  function locate() {
    if (!("geolocation" in navigator)) {
      setState("error");
      setMessage("이 브라우저에서는 현재 위치를 확인할 수 없습니다.");
      return;
    }

    setState("locating");
    setMessage("현재 위치를 확인하고 있습니다.");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextPosition = {
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
        setPosition(nextPosition);
        void fetchNearby(nextPosition, radiusMeters);
      },
      (error) => {
        setState("error");
        setMessage(geolocationErrorMessage(error));
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  function changeRadius(nextRadius: number) {
    setRadiusMeters(nextRadius);
    if (position) void fetchNearby(position, nextRadius);
  }

  const pending = state === "locating" || state === "loading";

  return (
    <section className="nearby-finder" aria-labelledby="nearby-title">
      <header className="nearby-finder__heading">
        <h1 id="nearby-title">내 주변 식당</h1>
        <p>가까운 식당 최대 20곳을 찾습니다. 거리는 직선 기준입니다.</p>
      </header>

      <div className="nearby-finder__controls">
        <button
          type="button"
          className="nearby-locate-button"
          data-state={state}
          disabled={pending}
          aria-busy={pending}
          onClick={locate}
        >
          <LocateFixed aria-hidden="true" size={18} strokeWidth={2} />
          {state === "locating"
            ? "위치 확인 중"
            : state === "loading"
              ? "식당 찾는 중"
              : position
                ? "위치 다시 확인"
                : "현재 위치 확인"}
        </button>

        {position ? (
          <fieldset className="nearby-radius">
            <legend>검색 범위</legend>
            <div>
              {RADIUS_OPTIONS.map((radius) => (
                <button
                  key={radius}
                  type="button"
                  aria-pressed={radiusMeters === radius}
                  disabled={pending}
                  onClick={() => changeRadius(radius)}
                >
                  {radius / 1_000}km
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}
      </div>

      <p
        className="nearby-finder__message"
        data-state={state}
        role={state === "error" ? "alert" : "status"}
        aria-live="polite"
      >
        {message}
      </p>

      {state === "success" && branches.length > 0 ? (
        <ol className="nearby-list">
          {branches.map((branch) => (
            <li key={branch.publicId}>
              <Link href={`/restaurants/${branch.publicId}`}>
                <span className="nearby-list__main">
                  <strong>{branch.name}</strong>
                  <small>
                    {branch.district} · {branch.neighborhood} ·{" "}
                    {branch.cuisineLabel}
                  </small>
                </span>
                <span className="nearby-list__distance">
                  <MapPin aria-hidden="true" size={16} strokeWidth={2} />
                  <strong>{formatDistance(branch.distanceMeters)}</strong>
                  <small>
                    {branch.rating === null
                      ? `리뷰 ${branch.reviewCount}건`
                      : `${branch.rating.toFixed(1)} · 리뷰 ${branch.reviewCount}건`}
                  </small>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : null}

      {state === "error" ? (
        <div className="nearby-finder__empty">
          {position ? (
            <button
              type="button"
              onClick={() => fetchNearby(position, radiusMeters)}
            >
              다시 찾기
            </button>
          ) : null}
          <Link href="/r">지역·음식으로 찾기</Link>
        </div>
      ) : null}

      {state === "success" && branches.length === 0 ? (
        <div className="nearby-finder__empty">
          <p>범위를 넓히거나 지역·음식 이름으로 찾아보세요.</p>
          {radiusMeters < 10_000 ? (
            <button type="button" onClick={() => changeRadius(10_000)}>
              10km까지 보기
            </button>
          ) : (
            <Link href="/r">서울 식당 둘러보기</Link>
          )}
        </div>
      ) : null}
    </section>
  );
}

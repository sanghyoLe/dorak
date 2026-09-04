"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type KakaoMapProps = Readonly<{
  name: string;
  address: string;
  latitude?: number | null | undefined;
  longitude?: number | null | undefined;
  isSynthetic?: boolean;
}>;

type KakaoMapState = "idle" | "loading" | "ready" | "error";

type KakaoMapsApi = {
  LatLng: new (latitude: number, longitude: number) => unknown;
  Map: new (
    element: HTMLElement,
    options: { center: unknown; level: number },
  ) => {
    setCenter: (center: unknown) => void;
  };
  Marker: new (options: { map: unknown; position: unknown }) => unknown;
  load: (callback: () => void) => void;
};

declare global {
  interface Window {
    kakao?: { maps: KakaoMapsApi };
  }
}

const kakaoMapAppKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ?? "";

function externalMapUrl(name: string, address: string): string {
  return `https://map.kakao.com/?q=${encodeURIComponent(`${name} ${address}`)}`;
}

export function KakaoMap({
  name,
  address,
  latitude,
  longitude,
  isSynthetic = false,
}: KakaoMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<KakaoMapState>("idle");
  const hasCoordinates =
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude);

  const drawMap = () => {
    if (!hasCoordinates || !mapElement.current || !window.kakao?.maps) {
      setState("error");
      return;
    }

    window.kakao.maps.load(() => {
      if (!mapElement.current || !window.kakao?.maps) return;

      try {
        const center = new window.kakao.maps.LatLng(latitude, longitude);
        const map = new window.kakao.maps.Map(mapElement.current, {
          center,
          level: 3,
        });
        new window.kakao.maps.Marker({ map, position: center });
        setState("ready");
      } catch {
        setState("error");
      }
    });
  };

  useEffect(() => {
    if (!kakaoMapAppKey || !hasCoordinates) return;
    setState("loading");
    if (window.kakao?.maps) drawMap();
    // The Kakao SDK calls this component's onLoad when it is ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCoordinates, latitude, longitude]);

  if (!kakaoMapAppKey || !hasCoordinates) {
    return (
      <div className="kakao-map kakao-map--fallback">
        <div>
          <strong>{isSynthetic ? "예시 위치" : "주소 위치"}</strong>
          <p>{address}</p>
          <a
            href={externalMapUrl(name, address)}
            target="_blank"
            rel="noreferrer"
          >
            카카오맵에서 주소 열기 <span aria-hidden="true">↗</span>
          </a>
        </div>
        {!kakaoMapAppKey ? (
          <small>지도 키를 설정하면 이곳에 지도가 표시됩니다.</small>
        ) : null}
      </div>
    );
  }

  return (
    <div className="kakao-map" aria-label={`${name} 지도`}>
      <div ref={mapElement} className="kakao-map__canvas" />
      {state !== "ready" ? (
        <div className="kakao-map__status" role="status">
          {state === "error"
            ? "지도를 불러오지 못했습니다. 아래 링크에서 위치를 확인하세요."
            : "지도를 불러오는 중입니다."}
          {state === "error" ? (
            <a
              href={externalMapUrl(name, address)}
              target="_blank"
              rel="noreferrer"
            >
              카카오맵 열기 <span aria-hidden="true">↗</span>
            </a>
          ) : null}
        </div>
      ) : null}
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(kakaoMapAppKey)}&autoload=false`}
        strategy="afterInteractive"
        onLoad={drawMap}
        onError={() => setState("error")}
      />
    </div>
  );
}

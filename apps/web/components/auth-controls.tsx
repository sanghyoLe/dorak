"use client";

import { LogIn, LogOut } from "lucide-react";
import { useState } from "react";

import { authClient } from "../lib/auth-client";

export function GoogleSignInButton({
  callbackURL,
}: Readonly<{ callbackURL: string }>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function signIn() {
    setPending(true);
    setError("");
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });
      if (result?.error) throw new Error("sign-in failed");
    } catch {
      setPending(false);
      setError("로그인을 시작하지 못했습니다. 다시 시도해 주세요.");
    }
  }

  return (
    <div>
      <button
        className="auth-button auth-button--google"
        type="button"
        disabled={pending}
        onClick={() => void signIn()}
      >
        <LogIn aria-hidden="true" size={17} strokeWidth={2} />
        {pending ? "Google로 이동 중" : "Google 계정으로 계속"}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}

export function SignOutButton() {
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await authClient.signOut();
    window.location.assign("/");
  }

  return (
    <button
      className="auth-button auth-button--plain"
      type="button"
      disabled={pending}
      onClick={() => void signOut()}
    >
      <LogOut aria-hidden="true" size={16} strokeWidth={2} />
      {pending ? "로그아웃 중" : "로그아웃"}
    </button>
  );
}

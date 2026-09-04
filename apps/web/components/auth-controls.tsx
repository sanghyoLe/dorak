"use client";

import { LogIn, LogOut } from "lucide-react";
import { useState } from "react";

import { authClient } from "../lib/auth-client";

export function GoogleSignInButton({
  callbackURL,
}: Readonly<{ callbackURL: string }>) {
  const [pending, setPending] = useState(false);

  async function signIn() {
    setPending(true);
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL,
    });
    if (result?.error) setPending(false);
  }

  return (
    <button
      className="auth-button auth-button--google"
      type="button"
      disabled={pending}
      onClick={() => void signIn()}
    >
      <LogIn aria-hidden="true" size={17} strokeWidth={2} />
      {pending ? "Google로 이동 중" : "Google 계정으로 계속"}
    </button>
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

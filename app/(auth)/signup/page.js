"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import "@/styles/tokens.css";
import styles from "./signup.module.css";

async function ensureUserDoc(user, displayName) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email,
      displayName: displayName ?? user.displayName ?? "",
      role: "public",
      createdAt: new Date().toISOString(),
    });
  }
}

export default function SignUpPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);
    try {
      const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
      await ensureUserDoc(user);
      router.push("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSignUp(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(user, { displayName });
      }
      await ensureUserDoc(user, displayName);
      router.push("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      {/* Hero area */}
      <div className={styles.hero}>
        <Image
          src="/images/city2.png"
          alt="City skyline"
          fill
          priority
          className={styles.heroImage}
        />
        <Image
          src="/pp-logo.png"
          alt="PinPoint"
          width={110}
          height={40}
          className={styles.logo}
        />
        <Image
          src="/images/sachi-ok.png"
          alt="Sachi giving a thumbs up"
          width={100}
          height={100}
          className={styles.mascot}
        />
      </div>

      {/* Card */}
      <div className={styles.card}>
        <h2 className={styles.title}>Create your account</h2>
        <p className={styles.subtitle}>
          Join PinPoint and help keep your community safe.
        </p>

        {error && <p className={styles.error}>{error}</p>}

        <form onSubmit={handleEmailSignUp} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Display Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Confirm Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={styles.input}
            />
            <p className={styles.hint}>
              Use at least 8 characters with a mix of letters, numbers, and symbols.
            </p>
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className={styles.divider}>
          <div className={styles.dividerLine} />
          <span className={styles.dividerText}>or sign in with</span>
          <div className={styles.dividerLine} />
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className={styles.googleBtn}
        >
          <svg
            viewBox="0 0 24 24"
            className={styles.googleIcon}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        <p className={styles.loginText}>
          Already have an account?{" "}
          <Link href="/login" className={styles.loginLink}>
            Log in
          </Link>
        </p>
      </div>

      <div className={styles.footer}>
        <svg
          className={styles.footerIcon}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2l7 3v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V5l7-3z"
            fill="currentColor"
          />
          <path
            d="M9 12l2 2 4-4"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className={styles.footerText}>
          Your information is secure with us.
          <span>We value your privacy and safety.</span>
        </p>
      </div>
    </div>
  );
}
import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { ThemeToggle } from "../../components/ThemeToggle";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight text-[var(--fg-base)]">
            Proquote
          </span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        <SignIn signUpUrl="/sign-up" />
      </main>
    </div>
  );
}

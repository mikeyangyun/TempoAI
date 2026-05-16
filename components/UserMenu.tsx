'use client';

import { Show, SignInButton, UserButton } from '@clerk/nextjs';

export function UserMenu() {
  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button className="inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            Sign in
          </button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'h-8 w-8',
            },
          }}
        />
      </Show>
    </>
  );
}

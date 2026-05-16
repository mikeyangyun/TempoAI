'use client';

import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';

export function UserMenu() {
  return (
    <>
      <Show when="signed-out">
        <div className="flex items-center gap-1.5">
          <SignInButton mode="modal">
            <button className="inline-flex h-8 items-center rounded-md px-3 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="inline-flex h-8 items-center rounded-md bg-foreground px-3 text-xs font-medium text-background hover:opacity-90 transition-opacity">
              Sign Up
            </button>
          </SignUpButton>
        </div>
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

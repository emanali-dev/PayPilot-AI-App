"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card className="mx-auto max-w-xl p-6">
      <h1 className="font-display text-2xl font-semibold">This page could not be loaded</h1>
      <p className="mt-2 text-sm text-muted-foreground">Something went wrong while loading this demo data. Try again.</p>
      <Button className="mt-5" onClick={() => reset()}>Retry</Button>
    </Card>
  );
}

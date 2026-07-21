import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PublishedFreeMock } from "@/dal/public/get-free-mocks";

export function FreeMocksList({ mocks }: { mocks: PublishedFreeMock[] }) {
  if (mocks.length === 0) {
    return (
      <div className="border border-dashed bg-card px-6 py-16 text-center">
        <h2 className="text-lg font-medium">No free mocks yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Published free mock tests will show up here when they are ready.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-px border bg-border md:grid-cols-2">
      {mocks.map((mock) => (
        <article
          key={mock.id}
          className="flex min-h-52 flex-col justify-between bg-card p-6"
        >
          <div className="space-y-3">
            <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {mock.facultyName}
            </p>
            <h2 className="font-display text-2xl tracking-tight">{mock.title}</h2>
            {mock.description ? (
              <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                {mock.description}
              </p>
            ) : null}
            <p className="text-sm text-muted-foreground">
              {mock.durationMinutes} min · {mock.attemptCount}{" "}
              {mock.attemptCount === 1 ? "completed attempt" : "completed attempts"}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="rounded-none">
              <Link href={mock.takeHref}>
                Take mock
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-none">
              <Link href={mock.leaderboardHref}>
                <Trophy className="size-4" />
                Leaderboard
              </Link>
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}

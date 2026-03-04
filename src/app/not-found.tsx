import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function NotFound() {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-6">
      <Card className="w-full max-w-md bg-[var(--night-light)]">
        <CardHeader>
          <CardTitle className="text-[var(--lavender)]">Page not found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[var(--lavender-muted)]">
            The page you are looking for does not exist or has been moved.
          </p>
          <Link href="/">
            <Button variant="primary" className="w-full">
              Return to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

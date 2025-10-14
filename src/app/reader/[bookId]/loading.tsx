import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="grid md:grid-cols-[1fr_350px] gap-4 p-4 h-[calc(100vh-3.5rem)]">
      <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg p-4">
        <Skeleton className="h-12 w-1/2 mb-4" />
        <Skeleton className="w-full aspect-[8.5/11] max-h-[80%]" />
        <div className="flex items-center gap-4 mt-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <div className="hidden md:flex flex-col gap-4">
        <div className="flex flex-col h-full bg-muted/50 rounded-lg p-4">
            <Skeleton className="h-8 w-1/3 mb-4" />
            <Skeleton className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}

interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

export default function AppSkeleton({ width = '100%', height = '20px', className = '' }: SkeletonProps) {
  return <div className={`skeleton-pulse ${className}`} style={{ width, height }} />;
}

import { cn } from "../../libs/cn";

type AvatarProps = {
  src?: string;
  fallback?: string;
  className?: string;
};
function Avatar({
  src = "https://avatars.githubusercontent.com/u/107019128?v=4",
  fallback,
  className,
}: AvatarProps) {
  return (
    <div
      className={cn(
        "aspect-square shrink-0 size-8 overflow-hidden rounded-full",
        className,
      )}
    >
      <img src={src} className="object-cover size-full" />
    </div>
  );
}
export default Avatar;

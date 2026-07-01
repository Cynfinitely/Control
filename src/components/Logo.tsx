import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

type LogoProps = {
  className?: string;
  href?: string;
  onClick?: () => void;
  variant?: "full" | "mark";
};

export default function Logo({ className, href, onClick, variant = "full" }: LogoProps) {
  const isMark = variant === "mark";
  const image = (
    <Image
      src={isMark ? "/logo-mark.png" : "/logo.png"}
      alt="Control"
      width={isMark ? 128 : 800}
      height={isMark ? 128 : 267}
      priority
      className={clsx(isMark ? "h-10 w-10" : "h-8 w-auto", className)}
    />
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className="inline-flex">
        {image}
      </Link>
    );
  }

  return image;
}

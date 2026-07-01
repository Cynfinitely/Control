import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

type LogoProps = {
  className?: string;
  href?: string;
  onClick?: () => void;
};

export default function Logo({ className, href, onClick }: LogoProps) {
  const image = (
    <Image
      src="/logo.png"
      alt="Control"
      width={2172}
      height={724}
      priority
      className={clsx("h-8 w-auto", className)}
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

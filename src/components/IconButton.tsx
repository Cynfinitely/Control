import { forwardRef } from "react";
import clsx from "clsx";
import Icon from "@/components/Icon";

type Props = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> & {
  icon: string;
  /** Required: icon-only buttons need an accessible name. */
  "aria-label": string;
  tone?: "default" | "danger";
  iconClassName?: string;
};

/** Icon-only button with a 44px hit area and a mandatory accessible name. */
const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton(
  { icon, tone = "default", className, iconClassName, type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      title={props.title ?? props["aria-label"]}
      className={clsx(tone === "danger" ? "btn-icon-danger" : "btn-icon", className)}
      {...props}
    >
      <Icon name={icon} className={iconClassName ?? "h-4 w-4"} />
    </button>
  );
});

export default IconButton;

import { LogoIcon } from "../brand/LogoIcon";

type LogoMarkProps = {
  showText?: boolean;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
};

export function LogoMark({
  showText = true,
  className = "",
  iconClassName = "h-10 w-10",
  textClassName = "",
}: LogoMarkProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoIcon className={iconClassName} />

      {showText && (
        <div className={`leading-tight ${textClassName}`}>
          <div className="text-sm font-semibold text-(--text-primary)">
            Life Terminal
          </div>

          <div className="text-xs font-medium text-(--text-secondary)">
            OS
          </div>
        </div>
      )}
    </div>
  );
}
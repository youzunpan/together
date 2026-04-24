import Image from "next/image";

type Props = {
  letter: string;
  color: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
};

export default function Avatar({ letter, color, avatarUrl, size = 36, className = "" }: Props) {
  if (avatarUrl) {
    return (
      <div
        className={`rounded-full overflow-hidden flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={avatarUrl}
          alt={letter}
          width={size}
          height={size}
          className="object-cover w-full h-full"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={`avatar-${color} rounded-full flex items-center justify-center flex-shrink-0 font-medium ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {letter}
    </div>
  );
}

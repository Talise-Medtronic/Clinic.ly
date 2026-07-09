import mascotSrc from "../../assets/koala-mascot.png"

type MascotMood = "idle" | "happy"

export default function LogMascot({ mood }: { mood: MascotMood }) {
  const isHappy = mood === "happy"

  return (
    <div
      style={{
        position: "relative",
        width: 120,
        height: 120,
        flexShrink: 0,
        transform: isHappy ? "translateY(-2px) scale(1.04)" : "translateY(0) scale(1)",
        transition: "transform 0.25s ease",
      }}
      aria-label="Daily logging mascot"
    >
      <img
        src={mascotSrc}
        alt="Koala mascot"
        width={120}
        height={120}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
        }}
      />
    </div>
  )
}

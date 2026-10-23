"use client";
import type { CSSProperties, ReactNode } from "react";
import type { Actor, Anim, Camera, Fx, Setting } from "@/lib/content/stories-bn";
import { useReducedMotion } from "@/lib/motion";

// Animated picture-book stage for the Bengali stories: sky → parallax far layer → ground → actors → fx,
// all inside a 16:10 card that slowly zooms or pans like a camera. A page `video` or `image` replaces the drawing.
// Sizes use cqw (the stage is an inline-size container), so the same scene works as a small shelf cover.

type Far = "hills" | "trees" | "none";
type Ground = "grass" | "dirt" | "water" | "pond" | "sand" | "floor" | "none";
const SETTINGS: Record<Setting, { day: [string, string]; night: [string, string]; far: Far; farFill: string; ground: Ground; groundFill: string; deco: Actor[] }> = {
  sky: { day: ["#6cc4ff", "#dff3ff"], night: ["#0d1840", "#2a3a7a"], far: "none", farFill: "", ground: "none", groundFill: "", deco: [] },
  village: { day: ["#7fcfff", "#e8f7ff"], night: ["#0d1840", "#2a3a7a"], far: "hills", farFill: "#86cc6a", ground: "dirt", groundFill: "#d6b47a", deco: [{ emoji: "🏠", x: 86, y: 18, size: 9 }, { emoji: "🌳", x: 10, y: 18, size: 12 }] },
  river: { day: ["#7fcfff", "#e8f7ff"], night: ["#0d1840", "#2a3a7a"], far: "hills", farFill: "#7fc464", ground: "water", groundFill: "#3f9ee0", deco: [{ emoji: "🌾", x: 6, y: 22, size: 9 }, { emoji: "🌾", x: 94, y: 22, size: 9 }] },
  pond: { day: ["#7fcfff", "#e8f7ff"], night: ["#0d1840", "#2a3a7a"], far: "trees", farFill: "#4f9e4a", ground: "pond", groundFill: "#7cc56b", deco: [{ emoji: "🪷", x: 44, y: 6, size: 7 }] },
  field: { day: ["#7fcfff", "#eefaff"], night: ["#0d1840", "#2a3a7a"], far: "hills", farFill: "#a6d97a", ground: "grass", groundFill: "#8fcb5e", deco: [] },
  forest: { day: ["#9fdcff", "#ecfbe4"], night: ["#0b1638", "#22356a"], far: "trees", farFill: "#3f8f45", ground: "grass", groundFill: "#6db456", deco: [{ emoji: "🌲", x: 6, y: 14, size: 16 }, { emoji: "🌲", x: 94, y: 14, size: 14 }] },
  home: { day: ["#ffe2b8", "#fff4e2"], night: ["#3a3468", "#5a4f8e"], far: "none", farFill: "", ground: "floor", groundFill: "#c98f5c", deco: [] },
  underwater: { day: ["#5cc0ee", "#1468aa"], night: ["#123a6a", "#061c3a"], far: "none", farFill: "", ground: "sand", groundFill: "#e7cf92", deco: [{ emoji: "🌿", x: 8, y: 4, size: 12, anim: "sway" }, { emoji: "🪸", x: 90, y: 4, size: 12 }, { emoji: "🌿", x: 72, y: 3, size: 9, anim: "sway", delay: 0.8 }] },
};

const CAMERA: Record<Camera, string> = {
  "zoom-in": "animate-camIn",
  "zoom-out": "animate-camOut",
  "pan-left": "animate-camL",
  "pan-right": "animate-camR",
  still: "",
};

const ANIM: Record<Anim, string> = {
  walk: "animate-walk",
  hop: "animate-hop",
  fly: "animate-flyAround",
  sway: "animate-sway",
  swim: "animate-swim",
  bob: "animate-float",
  roll: "animate-roll",
  cross: "animate-cross",
  none: "",
};

/** Deterministic 0..1 noise so particles sit in the same places on every render (no hydration drift). */
const rnd = (i: number, seed: number) => {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export function StoryScene({
  setting,
  night,
  actors,
  fx = [],
  camera = "still",
  image,
  video,
  enter = true,
  className = "",
}: {
  setting: Setting;
  night?: boolean;
  actors: Actor[];
  fx?: Fx[];
  camera?: Camera;
  image?: string;
  video?: string;
  /** Actors bounce in on mount (pages); off for shelf covers. */
  enter?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const s = SETTINGS[setting];
  const [top, bottom] = night ? s.night : s.day;
  const cam = reduced ? "" : CAMERA[camera];
  const allFx: Fx[] = night && !fx.includes("stars") && setting !== "underwater" && setting !== "home" ? [...fx, "stars"] : fx;

  const stage = `relative w-full aspect-[16/10] overflow-hidden rounded-card border-4 border-ink shadow-tile ${className}`;
  const container: CSSProperties = { containerType: "inline-size" };

  if (video)
    return (
      <div className={stage} style={container}>
        <video src={video} poster={image} autoPlay={!reduced} muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
      </div>
    );
  if (image)
    return (
      <div className={stage} style={container}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" className={`absolute inset-0 w-full h-full object-cover ${cam || (reduced ? "" : "animate-camIn")}`} />
      </div>
    );

  return (
    <div className={stage} style={{ ...container, background: `linear-gradient(${top}, ${bottom})` }} aria-hidden>
      <div className={`absolute inset-0 origin-center ${cam}`}>
        {setting === "home" && <Window night={night} />}
        {setting === "underwater" && <LightRays still={reduced} />}
        {allFx.includes("sun") && !night && <Sun still={reduced} />}
        {allFx.includes("rainbow") && <Rainbow />}
        {allFx.includes("stars") && <Stars still={reduced} />}
        {allFx.includes("clouds") && <Clouds still={reduced} />}
        {s.far !== "none" && <FarLayer kind={s.far} fill={s.farFill} night={night} still={reduced} />}
        {s.ground !== "none" && <GroundLayer kind={s.ground} fill={s.groundFill} night={night} />}
        {s.deco.map((a, i) => (
          <ActorView key={`d${i}`} a={a} still={reduced} enter={false} dim={night} />
        ))}
        {actors.map((a, i) => (
          <ActorView key={i} a={a} still={reduced} enter={enter} index={i} />
        ))}
        {allFx.includes("rain") && <Rain still={reduced} />}
        {allFx.includes("leaves") && <Leaves still={reduced} />}
        {allFx.includes("bubbles") && <Bubbles still={reduced} />}
        {allFx.includes("fireflies") && <Fireflies still={reduced} />}
      </div>
    </div>
  );
}

function ActorView({ a, still, enter, index = 0, dim }: { a: Actor; still: boolean; enter: boolean; index?: number; dim?: boolean }) {
  const loop = still ? "" : ANIM[a.anim ?? "none"];
  const origin = a.anim === "sway" ? "origin-bottom" : "origin-center";
  return (
    <span
      className="absolute leading-none select-none"
      style={{ left: `${a.x}%`, bottom: `${a.y}%`, fontSize: `${a.size ?? 14}cqw`, transform: "translateX(-50%)", filter: dim ? "brightness(.7)" : undefined }}
    >
      <span
        className={`block ${enter && !still ? "animate-bounceIn" : ""}`}
        style={enter && !still ? { animationDelay: `${0.15 + index * 0.12}s` } : undefined}
      >
        <span className={`block ${loop} ${origin}`} style={loop ? { animationDelay: `${a.delay ?? 0}s` } : undefined}>
          <span className="block" style={a.flip ? { transform: "scaleX(-1)" } : undefined}>
            {a.emoji}
          </span>
        </span>
      </span>
    </span>
  );
}

// ---- layers -----------------------------------------------------------------
function Layer({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 160 100" preserveAspectRatio="none" className={`absolute inset-0 w-full h-full ${className}`} style={style}>
      {children}
    </svg>
  );
}

function FarLayer({ kind, fill, night, still }: { kind: Far; fill: string; night?: boolean; still: boolean }) {
  return (
    <Layer className={`!-left-[3%] !w-[106%] ${still ? "" : "animate-parallax"}`} style={night ? { filter: "brightness(.45) saturate(.7)" } : undefined}>
      {kind === "hills" ? (
        <path d="M0 66 Q18 50 36 62 T76 58 T116 60 T160 54 V100 H0Z" fill={fill} />
      ) : (
        <g fill={fill}>
          <rect x="0" y="62" width="160" height="38" />
          {Array.from({ length: 12 }, (_, i) => (
            <circle key={i} cx={i * 14 + 4} cy={60 - rnd(i, 3) * 8} r={9 + rnd(i, 4) * 5} />
          ))}
        </g>
      )}
    </Layer>
  );
}

function GroundLayer({ kind, fill, night }: { kind: Ground; fill: string; night?: boolean }) {
  const dark = night ? { filter: "brightness(.5) saturate(.75)" } : undefined;
  if (kind === "floor")
    return (
      <Layer style={dark}>
        <rect x="0" y="80" width="160" height="20" fill={fill} />
        <path d="M0 80 H160" stroke="#8a5a34" strokeWidth="1.2" />
        {[20, 50, 80, 110, 140].map((x) => (
          <path key={x} d={`M${x} 80 L${x - 10} 100`} stroke="#a8713f" strokeWidth=".6" />
        ))}
      </Layer>
    );
  if (kind === "water")
    return (
      <Layer style={dark}>
        <path d="M0 70 Q40 66 80 70 T160 68 V100 H0Z" fill={fill} />
        {[78, 86, 94].map((y, i) => (
          <path key={y} d={`M${10 + i * 18} ${y} q6 -2 12 0 M${70 + i * 14} ${y + 2} q6 -2 12 0`} stroke="#ffffff" strokeOpacity=".55" strokeWidth=".8" fill="none" />
        ))}
      </Layer>
    );
  if (kind === "pond")
    return (
      <Layer style={dark}>
        <path d="M0 76 Q40 70 80 74 T160 72 V100 H0Z" fill={fill} />
        <ellipse cx="80" cy="90" rx="52" ry="9" fill="#5bb2e8" />
        <ellipse cx="66" cy="88" rx="14" ry="1.6" fill="#ffffff" fillOpacity=".45" />
      </Layer>
    );
  if (kind === "sand")
    return (
      <Layer style={dark}>
        <path d="M0 88 Q30 82 70 86 T160 84 V100 H0Z" fill={fill} />
      </Layer>
    );
  return (
    <Layer style={dark}>
      <path d="M0 80 Q40 74 80 78 T160 76 V100 H0Z" fill={fill} />
    </Layer>
  );
}

function Window({ night }: { night?: boolean }) {
  return (
    <Layer>
      <rect x="18" y="12" width="42" height="34" rx="2" fill={night ? "#16224e" : "#9fdcff"} stroke="#7a4b2a" strokeWidth="2.5" />
      <path d="M39 12 V46 M18 29 H60" stroke="#7a4b2a" strokeWidth="1.6" />
      {night && [[26, 18], [50, 20], [32, 38], [54, 40], [44, 33]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r=".7" fill="#fff6c4" />)}
      <rect x="104" y="20" width="36" height="3" rx="1" fill="#a8713f" />
    </Layer>
  );
}

// ---- fx -----------------------------------------------------------------------
function Sun({ still }: { still: boolean }) {
  return (
    <span className="absolute right-[5%] top-[5%] leading-none" style={{ fontSize: "13cqw" }}>
      <span className="absolute inset-[-30%] rounded-full" style={{ background: "radial-gradient(#fff6b0 0%, transparent 65%)" }} />
      <span className={`relative block ${still ? "" : "animate-spinSlow"}`}>☀️</span>
    </span>
  );
}

function Rainbow() {
  return (
    <Layer className="animate-pop">
      {["#ff6b6b", "#ffb347", "#ffe066", "#6cd47a", "#5bb2e8", "#9b7fe0"].map((c, i) => (
        <path key={c} d={`M${30 + i * 3} 70 A${50 - i * 3} ${46 - i * 3} 0 0 1 ${130 - i * 3} 70`} stroke={c} strokeWidth="3" fill="none" opacity=".85" />
      ))}
    </Layer>
  );
}

function Stars({ still }: { still: boolean }) {
  return (
    <>
      {Array.from({ length: 18 }, (_, i) => (
        <span
          key={i}
          className={`absolute rounded-full bg-[#fff6c4] ${still ? "" : "animate-twinkle"}`}
          style={{ left: `${rnd(i, 1) * 96 + 2}%`, top: `${rnd(i, 2) * 50 + 2}%`, width: `${0.5 + rnd(i, 5) * 0.8}cqw`, height: `${0.5 + rnd(i, 5) * 0.8}cqw`, animationDelay: `${rnd(i, 6) * 2}s` }}
        />
      ))}
    </>
  );
}

function Clouds({ still }: { still: boolean }) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`absolute leading-none opacity-90 ${still ? "" : "animate-cloud"}`}
          style={{ top: `${6 + i * 12}%`, left: still ? `${15 + i * 30}%` : 0, fontSize: `${10 - i * 2}cqw`, animationDelay: `${-i * 14}s`, animationDuration: `${36 + i * 10}s` }}
        >
          ☁️
        </span>
      ))}
    </>
  );
}

function Rain({ still }: { still: boolean }) {
  return (
    <>
      {Array.from({ length: 30 }, (_, i) => (
        <span
          key={i}
          className={`absolute w-[0.5cqw] h-[4cqw] rounded-full bg-white/75 ${still ? "" : "animate-rain"}`}
          style={{ left: `${rnd(i, 7) * 100}%`, top: still ? `${rnd(i, 8) * 80}%` : "-8cqw", animationDelay: `${rnd(i, 8) * 0.9}s`, animationDuration: `${0.7 + rnd(i, 9) * 0.4}s` }}
        />
      ))}
    </>
  );
}

function Leaves({ still }: { still: boolean }) {
  if (still) return null;
  return (
    <>
      {Array.from({ length: 6 }, (_, i) => (
        <span
          key={i}
          className="absolute leading-none animate-leaf"
          style={{ left: `${rnd(i, 10) * 85}%`, top: "-6cqw", fontSize: "4cqw", animationDelay: `${i * 1.2}s` }}
        >
          🍃
        </span>
      ))}
    </>
  );
}

function Bubbles({ still }: { still: boolean }) {
  return (
    <>
      {Array.from({ length: 14 }, (_, i) => (
        <span
          key={i}
          className={`absolute rounded-full border-[0.3cqw] border-white/80 bg-white/20 ${still ? "" : "animate-bubble"}`}
          style={{ left: `${rnd(i, 11) * 96}%`, bottom: still ? `${rnd(i, 12) * 70 + 10}%` : "2%", width: `${1.2 + rnd(i, 13) * 2}cqw`, height: `${1.2 + rnd(i, 13) * 2}cqw`, animationDelay: `${rnd(i, 14) * 5}s`, animationDuration: `${4 + rnd(i, 15) * 3}s` }}
        />
      ))}
    </>
  );
}

function Fireflies({ still }: { still: boolean }) {
  return (
    <>
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={`absolute rounded-full bg-[#fff59a] ${still ? "" : "animate-firefly"}`}
          style={{ left: `${rnd(i, 16) * 92 + 4}%`, top: `${rnd(i, 17) * 55 + 25}%`, width: "1.1cqw", height: "1.1cqw", boxShadow: "0 0 1.6cqw 0.6cqw #fff59a", animationDelay: `${rnd(i, 18) * 4}s` }}
        />
      ))}
    </>
  );
}

function LightRays({ still }: { still: boolean }) {
  return (
    <Layer className={still ? "" : "animate-parallax"}>
      {[20, 60, 100, 140].map((x) => (
        <path key={x} d={`M${x} 0 L${x + 14} 0 L${x - 6} 100 L${x - 22} 100Z`} fill="#ffffff" fillOpacity=".08" />
      ))}
    </Layer>
  );
}

import { cn } from "@/lib/utils";

const colors = {
  background: "#050505",
  surface: "#111111",
  card: "#161616",
  foreground: "#f5f3ef",
  muted: "#9a9a9a",
  border: "#2a2a2a",
};

export function ThemePreviewMockup({
  themeId,
  primary,
  viewport = "web",
  className,
}: {
  themeId: string;
  primary: string;
  viewport?: "web" | "phone";
  className?: string;
}) {
  const v2 = themeId === "v2-design";
  const label = `${v2 ? "V2 Design" : "Legacy Classic"} ${viewport} landing page preview`;

  return (
    <svg
      viewBox={viewport === "phone" ? "0 0 360 780" : "0 0 960 720"}
      role="img"
      aria-label={label}
      className={cn("block h-auto w-full", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{label}</title>
      {v2 ? (
        viewport === "phone" ? (
          <V2Phone primary={primary} />
        ) : (
          <V2Web primary={primary} />
        )
      ) : viewport === "phone" ? (
        <LegacyPhone primary={primary} />
      ) : (
        <LegacyWeb primary={primary} />
      )}
    </svg>
  );
}

function ProductCard({
  x,
  y,
  width,
  primary,
  index,
}: {
  x: number;
  y: number;
  width: number;
  primary: string;
  index: number;
}) {
  return (
    <g>
      <rect x={x} y={y} width={width} height="108" rx="8" fill={colors.card} />
      <rect
        x={x + 8}
        y={y + 8}
        width={width - 16}
        height="67"
        rx="6"
        fill={index % 2 ? "#202020" : "#252525"}
      />
      <circle
        cx={x + width / 2}
        cy={y + 41}
        r="22"
        fill={index === 1 ? primary : "#343434"}
        opacity={index === 1 ? 0.8 : 1}
      />
      <rect
        x={x + 9}
        y={y + 84}
        width={width * 0.55}
        height="5"
        rx="2.5"
        fill={colors.foreground}
      />
      <rect
        x={x + 9}
        y={y + 96}
        width={width * 0.28}
        height="5"
        rx="2.5"
        fill={primary}
      />
    </g>
  );
}

function FooterMock({
  primary,
  compact = false,
}: {
  primary: string;
  compact?: boolean;
}) {
  return (
    <g>
      <rect
        y={compact ? 658 : 632}
        width="960"
        height={compact ? 62 : 88}
        fill={colors.surface}
      />
      <rect
        x="30"
        y={compact ? 678 : 654}
        width="72"
        height="14"
        rx="3"
        fill={colors.foreground}
      />
      <circle cx="94" cy={compact ? 685 : 661} r="3.5" fill={primary} />
      {[0, 1, 2].map((item) => (
        <g key={item}>
          <rect
            x={480 + item * 138}
            y={compact ? 676 : 652}
            width="62"
            height="5"
            rx="2.5"
            fill={colors.foreground}
          />
          <rect
            x={480 + item * 138}
            y={compact ? 691 : 670}
            width="82"
            height="4"
            rx="2"
            fill={colors.muted}
          />
          {!compact ? (
            <rect
              x={480 + item * 138}
              y="684"
              width="69"
              height="4"
              rx="2"
              fill={colors.muted}
            />
          ) : null}
        </g>
      ))}
    </g>
  );
}

function LegacyWeb({ primary }: { primary: string }) {
  return (
    <>
      <rect width="960" height="720" fill={colors.background} />
      <rect width="960" height="48" fill={colors.surface} />
      <rect
        x="30"
        y="16"
        width="72"
        height="16"
        rx="3"
        fill={colors.foreground}
      />
      <circle cx="94" cy="24" r="4" fill={primary} />
      {[0, 1, 2, 3].map((item) => (
        <rect
          key={item}
          x={354 + item * 72}
          y="22"
          width="42"
          height="5"
          rx="2.5"
          fill={colors.muted}
        />
      ))}
      <rect
        x="824"
        y="14"
        width="104"
        height="20"
        rx="10"
        fill={colors.card}
        stroke={colors.border}
      />
      <rect y="48" width="960" height="208" fill="#090909" />
      <circle cx="790" cy="127" r="102" fill={primary} opacity="0.18" />
      <rect x="38" y="76" width="94" height="16" rx="8" fill={primary} />
      <text
        x="46"
        y="87"
        fill={colors.background}
        fontSize="8"
        fontWeight="700"
      >
        NEW COLLECTION
      </text>
      <text
        x="38"
        y="132"
        fill={colors.foreground}
        fontSize="34"
        fontWeight="800"
      >
        BUILT FOR EVERYDAY.
      </text>
      <text
        x="38"
        y="169"
        fill={colors.foreground}
        fontSize="34"
        fontWeight="800"
      >
        MADE TO STAND OUT.
      </text>
      <rect x="38" y="187" width="252" height="6" rx="3" fill={colors.muted} />
      <rect x="38" y="202" width="190" height="6" rx="3" fill="#666666" />
      <rect x="38" y="223" width="106" height="25" rx="4" fill={primary} />
      <rect x="598" y="68" width="286" height="168" rx="9" fill={colors.card} />
      <path d="M676 107h111l28 105H646z" fill="#292929" />
      <path
        d="M699 108q31-50 63 0"
        fill="none"
        stroke={primary}
        strokeWidth="8"
      />
      <rect y="256" width="960" height="32" fill={colors.surface} />
      {[0, 1, 2, 3].map((item) => (
        <g key={item}>
          <circle cx={45 + item * 235} cy="272" r="3" fill={primary} />
          <rect
            x={56 + item * 235}
            y="269"
            width="136"
            height="5"
            rx="2.5"
            fill={colors.muted}
          />
        </g>
      ))}
      <text
        x="30"
        y="322"
        fill={colors.foreground}
        fontSize="17"
        fontWeight="700"
      >
        Featured products
      </text>
      {[0, 1, 2, 3].map((item) => (
        <ProductCard
          key={item}
          x={30 + item * 232}
          y={338}
          width={210}
          primary={primary}
          index={item}
        />
      ))}
      <rect
        x="30"
        y="470"
        width="438"
        height="92"
        rx="10"
        fill={colors.surface}
        stroke={colors.border}
      />
      <rect
        x="492"
        y="470"
        width="438"
        height="92"
        rx="10"
        fill={colors.card}
      />
      <text
        x="54"
        y="505"
        fill={colors.foreground}
        fontSize="22"
        fontWeight="700"
      >
        Thoughtful design.
      </text>
      <text x="54" y="533" fill={primary} fontSize="22" fontWeight="700">
        Reliable quality.
      </text>
      <circle cx="851" cy="516" r="34" fill={primary} opacity="0.8" />
      <rect y="582" width="960" height="50" fill={primary} opacity="0.85" />
      <text
        x="30"
        y="613"
        fill={colors.background}
        fontSize="20"
        fontWeight="800"
      >
        A LIMITED COLLECTION MADE FOR YOU
      </text>
      <FooterMock primary={primary} />
    </>
  );
}

function LegacyPhone({ primary }: { primary: string }) {
  return (
    <>
      <rect width="360" height="780" fill={colors.background} />
      <rect width="360" height="48" fill={colors.surface} />
      <rect
        x="16"
        y="16"
        width="68"
        height="16"
        rx="3"
        fill={colors.foreground}
      />
      <circle cx="76" cy="24" r="4" fill={primary} />
      <rect
        x="316"
        y="17"
        width="20"
        height="14"
        rx="3"
        fill={colors.foreground}
      />
      <rect y="48" width="360" height="224" fill="#090909" />
      <circle cx="312" cy="93" r="66" fill={primary} opacity="0.18" />
      <rect x="18" y="73" width="91" height="16" rx="8" fill={primary} />
      <text
        x="26"
        y="84"
        fill={colors.background}
        fontSize="8"
        fontWeight="700"
      >
        NEW COLLECTION
      </text>
      <text
        x="18"
        y="126"
        fill={colors.foreground}
        fontSize="27"
        fontWeight="800"
      >
        BUILT FOR
      </text>
      <text
        x="18"
        y="157"
        fill={colors.foreground}
        fontSize="27"
        fontWeight="800"
      >
        EVERYDAY.
      </text>
      <rect x="18" y="175" width="202" height="6" rx="3" fill={colors.muted} />
      <rect x="18" y="189" width="153" height="6" rx="3" fill="#666666" />
      <rect x="18" y="211" width="95" height="27" rx="4" fill={primary} />
      <path d="M245 176h72l17 72h-108z" fill="#292929" />
      <path
        d="M258 177q21-34 43 0"
        fill="none"
        stroke={primary}
        strokeWidth="6"
      />
      <rect y="272" width="360" height="32" fill={colors.surface} />
      <text x="18" y="294" fill={colors.muted} fontSize="8" fontWeight="700">
        QUALITY · DESIGN · SERVICE · COLLECTION
      </text>
      <text
        x="18"
        y="337"
        fill={colors.foreground}
        fontSize="17"
        fontWeight="700"
      >
        Featured products
      </text>
      <ProductCard x={18} y={353} width={153} primary={primary} index={0} />
      <ProductCard x={189} y={353} width={153} primary={primary} index={1} />
      <rect
        x="18"
        y="483"
        width="324"
        height="86"
        rx="10"
        fill={colors.surface}
        stroke={colors.border}
      />
      <text
        x="38"
        y="518"
        fill={colors.foreground}
        fontSize="20"
        fontWeight="700"
      >
        Thoughtful design.
      </text>
      <text x="38" y="544" fill={primary} fontSize="20" fontWeight="700">
        Reliable quality.
      </text>
      <rect y="590" width="360" height="84" fill={primary} opacity="0.85" />
      <text
        x="18"
        y="624"
        fill={colors.background}
        fontSize="18"
        fontWeight="800"
      >
        LIMITED COLLECTION
      </text>
      <rect
        x="18"
        y="640"
        width="178"
        height="6"
        rx="3"
        fill={colors.background}
        opacity="0.6"
      />
      <rect y="674" width="360" height="106" fill={colors.surface} />
      <rect
        x="18"
        y="697"
        width="68"
        height="16"
        rx="3"
        fill={colors.foreground}
      />
      <circle cx="78" cy="705" r="4" fill={primary} />
      <rect
        x="18"
        y="730"
        width="128"
        height="5"
        rx="2.5"
        fill={colors.muted}
      />
      <rect
        x="212"
        y="698"
        width="56"
        height="6"
        rx="3"
        fill={colors.foreground}
      />
      <rect
        x="212"
        y="718"
        width="82"
        height="5"
        rx="2.5"
        fill={colors.muted}
      />
      <rect
        x="212"
        y="734"
        width="68"
        height="5"
        rx="2.5"
        fill={colors.muted}
      />
    </>
  );
}

function V2Web({ primary }: { primary: string }) {
  return (
    <>
      <rect width="960" height="720" fill={colors.background} />
      <rect width="960" height="66" fill={colors.surface} />
      <text
        x="30"
        y="34"
        fill={colors.foreground}
        fontSize="18"
        fontWeight="900"
        letterSpacing="3"
      >
        REVERB
      </text>
      <circle cx="902" cy="27" r="12" fill={primary} />
      <rect
        x="393"
        y="18"
        width="72"
        height="6"
        rx="3"
        fill={colors.foreground}
      />
      <rect x="373" y="43" width="44" height="4" rx="2" fill={colors.muted} />
      <rect x="438" y="43" width="51" height="4" rx="2" fill={colors.muted} />
      <rect x="510" y="43" width="43" height="4" rx="2" fill={colors.muted} />
      <rect y="66" width="960" height="226" fill="#080808" />
      <circle cx="770" cy="165" r="108" fill={primary} opacity="0.9" />
      <circle cx="770" cy="165" r="72" fill={colors.card} />
      <path d="M718 110l106 24-25 108-106-24z" fill={colors.foreground} />
      <path d="M741 138h59l12 61h-83z" fill="#242424" />
      <path
        d="M750 138q18-38 37 0"
        fill="none"
        stroke={primary}
        strokeWidth="8"
      />
      <text
        x="28"
        y="111"
        fill={primary}
        fontSize="10"
        fontWeight="800"
        letterSpacing="3"
      >
        COLLECTION / 2026
      </text>
      <text
        x="24"
        y="174"
        fill={colors.foreground}
        fontSize="62"
        fontWeight="900"
        letterSpacing="-3"
      >
        MAKE IT
      </text>
      <text
        x="24"
        y="232"
        fill={colors.foreground}
        fontSize="62"
        fontWeight="900"
        letterSpacing="-3"
      >
        UNMISTAKABLE.
      </text>
      <rect x="28" y="252" width="126" height="25" rx="12.5" fill={primary} />
      <rect y="292" width="960" height="29" fill={primary} />
      <text
        x="28"
        y="311"
        fill={colors.background}
        fontSize="9"
        fontWeight="800"
        letterSpacing="2"
      >
        NEW ENERGY · DISTINCT DETAILS · CURATED ESSENTIALS · NEW ENERGY
      </text>
      <text
        x="28"
        y="358"
        fill={colors.foreground}
        fontSize="24"
        fontWeight="900"
      >
        CURRENT OBSESSIONS
      </text>
      {[0, 1, 2, 3].map((item) => (
        <ProductCard
          key={item}
          x={28 + item * 232}
          y={375}
          width={210}
          primary={primary}
          index={item}
        />
      ))}
      <rect
        x="28"
        y="507"
        width="548"
        height="105"
        rx="24"
        fill={colors.surface}
        stroke={colors.border}
      />
      <text
        x="55"
        y="550"
        fill={colors.foreground}
        fontSize="28"
        fontWeight="900"
      >
        SMALL DETAILS.
      </text>
      <text x="55" y="585" fill={primary} fontSize="28" fontWeight="900">
        BIG ENERGY.
      </text>
      <rect x="600" y="507" width="332" height="105" rx="52" fill={primary} />
      <circle cx="654" cy="559" r="37" fill={colors.background} />
      <circle cx="876" cy="559" r="37" fill={colors.foreground} />
      <FooterMock primary={primary} compact />
    </>
  );
}

function V2Phone({ primary }: { primary: string }) {
  return (
    <>
      <rect width="360" height="780" fill={colors.background} />
      <rect width="360" height="58" fill={colors.surface} />
      <text
        x="16"
        y="31"
        fill={colors.foreground}
        fontSize="17"
        fontWeight="900"
        letterSpacing="2"
      >
        REVERB
      </text>
      <circle cx="306" cy="24" r="12" fill={primary} />
      <rect
        x="328"
        y="18"
        width="16"
        height="13"
        rx="3"
        fill={colors.foreground}
      />
      <rect x="141" y="43" width="78" height="4" rx="2" fill={colors.muted} />
      <rect y="58" width="360" height="251" fill="#080808" />
      <text
        x="17"
        y="92"
        fill={primary}
        fontSize="9"
        fontWeight="800"
        letterSpacing="2"
      >
        COLLECTION / 2026
      </text>
      <text
        x="15"
        y="138"
        fill={colors.foreground}
        fontSize="42"
        fontWeight="900"
        letterSpacing="-2"
      >
        MAKE IT
      </text>
      <text
        x="15"
        y="179"
        fill={colors.foreground}
        fontSize="42"
        fontWeight="900"
        letterSpacing="-2"
      >
        UNMISTAKABLE.
      </text>
      <rect x="17" y="198" width="120" height="26" rx="13" fill={primary} />
      <circle cx="277" cy="229" r="67" fill={primary} />
      <circle cx="277" cy="229" r="45" fill={colors.card} />
      <path d="M246 194l64 15-15 67-64-15z" fill={colors.foreground} />
      <path d="M258 212h37l8 39h-53z" fill="#242424" />
      <path
        d="M264 212q11-24 23 0"
        fill="none"
        stroke={primary}
        strokeWidth="5"
      />
      <rect y="309" width="360" height="30" fill={primary} />
      <text
        x="17"
        y="329"
        fill={colors.background}
        fontSize="8"
        fontWeight="800"
        letterSpacing="1.5"
      >
        NEW ENERGY · DISTINCT DETAILS
      </text>
      <text
        x="17"
        y="375"
        fill={colors.foreground}
        fontSize="21"
        fontWeight="900"
      >
        CURRENT OBSESSIONS
      </text>
      <ProductCard x={17} y={392} width={155} primary={primary} index={0} />
      <ProductCard x={188} y={392} width={155} primary={primary} index={1} />
      <rect
        x="17"
        y="523"
        width="326"
        height="101"
        rx="22"
        fill={colors.surface}
        stroke={colors.border}
      />
      <text
        x="38"
        y="563"
        fill={colors.foreground}
        fontSize="22"
        fontWeight="900"
      >
        SMALL DETAILS.
      </text>
      <text x="38" y="591" fill={primary} fontSize="22" fontWeight="900">
        BIG ENERGY.
      </text>
      <circle cx="307" cy="574" r="27" fill={primary} />
      <rect y="646" width="360" height="134" fill={colors.surface} />
      <text
        x="17"
        y="689"
        fill={colors.foreground}
        fontSize="21"
        fontWeight="900"
        letterSpacing="2"
      >
        REVERB
      </text>
      <text x="17" y="711" fill={primary} fontSize="8" fontWeight="800">
        MAKE EVERYDAY LOUDER.
      </text>
      <rect
        x="224"
        y="679"
        width="53"
        height="6"
        rx="3"
        fill={colors.foreground}
      />
      <rect
        x="224"
        y="700"
        width="81"
        height="5"
        rx="2.5"
        fill={colors.muted}
      />
      <rect
        x="224"
        y="716"
        width="67"
        height="5"
        rx="2.5"
        fill={colors.muted}
      />
    </>
  );
}

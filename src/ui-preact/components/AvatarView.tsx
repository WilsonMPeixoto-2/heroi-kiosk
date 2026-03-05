import { ACCESSORIES, EYE_COLORS, HAIR_COLORS, OUTFIT_COLORS, SKIN_COLORS } from '../../core/types';

export type AvatarMood = 'neutral' | 'confident' | 'smile';

interface AvatarViewProps {
  skinTone: number;
  hairStyle: number;
  eyeStyle: number;
  outfitStyle: number;
  accessoryId: number;
  mood?: AvatarMood;
}

export function AvatarView({
  skinTone,
  hairStyle,
  eyeStyle,
  outfitStyle,
  accessoryId,
  mood = 'neutral'
}: AvatarViewProps) {
  const skin = SKIN_COLORS[skinTone] ?? SKIN_COLORS[0];
  const hair = HAIR_COLORS[hairStyle] ?? HAIR_COLORS[0];
  const eyes = EYE_COLORS[eyeStyle] ?? EYE_COLORS[0];
  const outfit = OUTFIT_COLORS[outfitStyle] ?? OUTFIT_COLORS[0];
  const blinkDelay = `${(skinTone + hairStyle * 2 + eyeStyle * 3 + outfitStyle * 4 + accessoryId * 5) % 4}s`;

  return (
    <svg viewBox="0 0 220 260" class="avatar-svg avatar-premium" role="img" aria-label="Avatar personalizável">
      <defs>
        <linearGradient id="avatarSuitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color={outfit} />
          <stop offset="100%" stop-color="#0b1f35" />
        </linearGradient>
        <radialGradient id="avatarAura" cx="50%" cy="42%" r="65%">
          <stop offset="0%" stop-color="rgba(45,226,230,.34)" />
          <stop offset="100%" stop-color="rgba(45,226,230,.02)" />
        </radialGradient>
      </defs>

      <g class="avatar-bob avatar-tilt">
        <ellipse cx="110" cy="238" rx="56" ry="13" fill="rgba(0,0,0,.3)" />
        <circle cx="110" cy="124" r="90" fill="url(#avatarAura)" />

        <g id="outfit">
          <g class="avatar-legs">
            <rect x="86" y="186" width="18" height="42" rx="7" fill="url(#avatarSuitGrad)" />
            <rect x="116" y="186" width="18" height="42" rx="7" fill="url(#avatarSuitGrad)" />
            <rect x="82" y="225" width="26" height="10" rx="5" fill="#141d2c" />
            <rect x="112" y="225" width="26" height="10" rx="5" fill="#141d2c" />
          </g>
          <g class="avatar-arms">
            <rect x="55" y="132" width="22" height="56" rx="10" fill="url(#avatarSuitGrad)" transform="rotate(8 55 132)" />
            <rect x="143" y="132" width="22" height="56" rx="10" fill="url(#avatarSuitGrad)" transform="rotate(-8 143 132)" />
            <circle cx="68" cy="188" r="9" fill={skin} />
            <circle cx="152" cy="188" r="9" fill={skin} />
          </g>
          <g class="avatar-body">
            <rect x="74" y="104" width="72" height="90" rx="22" fill="url(#avatarSuitGrad)" stroke="rgba(0,0,0,.34)" stroke-width="2" />
            <path d="M87 120 L110 142 L133 120" fill="none" stroke="rgba(255,255,255,.42)" stroke-width="3.2" stroke-linecap="round" />
            <circle cx="110" cy="144" r="10" fill="rgba(255,255,255,.16)" stroke="rgba(255,255,255,.35)" />
          </g>
        </g>

        <g id="skin">
          <g class="avatar-head">
            <rect x="72" y="42" width="76" height="76" rx="26" fill={skin} stroke="rgba(0,0,0,.38)" stroke-width="2.4" />
            <circle cx="82" cy="96" r="4" fill="rgba(255,130,130,.3)" />
            <circle cx="138" cy="96" r="4" fill="rgba(255,130,130,.3)" />
          </g>
        </g>

        <g id="hair">
          <path d="M66 56 Q110 18 154 56 L154 78 L66 78 Z" fill={hair} stroke="rgba(0,0,0,.3)" stroke-width="2" />
          <path d="M72 63 Q110 35 148 63" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="1.2" />
        </g>

        <g id="face">
          <g class="avatar-eye-group" style={{ animationDelay: blinkDelay }}>
            <ellipse cx="91" cy="84" rx="11" ry="8.2" fill="white" />
            <ellipse cx="129" cy="84" rx="11" ry="8.2" fill="white" />
            <circle cx="91" cy="84" r="4.6" fill={eyes} />
            <circle cx="129" cy="84" r="4.6" fill={eyes} />
            <circle cx="92.2" cy="82.6" r="1.4" fill="rgba(255,255,255,.66)" />
            <circle cx="130.2" cy="82.6" r="1.4" fill="rgba(255,255,255,.66)" />
          </g>
          <path d={mouthByMood(mood)} fill="none" stroke="rgba(36,24,24,.62)" stroke-width="3" stroke-linecap="round" />
        </g>

        <g id="accessory">{accessorySvg(accessoryId, outfit)}</g>
      </g>
      <text x="110" y="254" text-anchor="middle" fill="rgba(234,246,255,.92)" font-size="11.5" font-weight="700">
        {ACCESSORIES[accessoryId] ?? ACCESSORIES[0]}
      </text>
    </svg>
  );
}

function mouthByMood(mood: AvatarMood): string {
  if (mood === 'smile') {
    return 'M92 102 Q110 122 128 102';
  }
  if (mood === 'confident') {
    return 'M94 106 Q110 114 126 106';
  }
  return 'M96 105 Q110 111 124 105';
}

function accessorySvg(accessoryId: number, outfit: string) {
  switch (accessoryId) {
    case 1:
      return (
        <g class="avatar-accessory">
          <rect x="74" y="70" width="72" height="20" rx="8" fill="rgba(20,30,44,.92)" />
          <rect x="82" y="74" width="56" height="12" rx="6" fill="rgba(45,226,230,.72)" />
        </g>
      );
    case 2:
      return (
        <g class="avatar-accessory">
          <rect x="147" y="170" width="16" height="10" rx="5" fill="#1a2635" />
          <circle cx="155" cy="176" r="7.5" fill={outfit} stroke="#dff7ff" stroke-width="1.6" />
        </g>
      );
    case 3:
      return (
        <g class="avatar-accessory">
          <path d="M66 112 Q110 146 154 112 L154 168 Q110 210 66 168 Z" fill="rgba(255,90,140,.18)" stroke="rgba(255,130,180,.55)" />
        </g>
      );
    case 4:
      return (
        <g class="avatar-accessory">
          <rect x="78" y="76" width="24" height="12" rx="6" fill="#0e1726" />
          <rect x="118" y="76" width="24" height="12" rx="6" fill="#0e1726" />
          <rect x="102" y="80" width="16" height="4" rx="2" fill="#0e1726" />
          <rect x="80" y="78" width="20" height="8" rx="4" fill="rgba(80,240,255,.6)" />
          <rect x="120" y="78" width="20" height="8" rx="4" fill="rgba(80,240,255,.6)" />
        </g>
      );
    case 5:
      return (
        <g class="avatar-accessory">
          <circle cx="110" cy="158" r="10" fill="#ffd767" stroke="#12223a" stroke-width="2" />
          <path d="M110 145 L113 153 L122 153 L115 158 L118 166 L110 161 L102 166 L105 158 L98 153 L107 153 Z" fill="#ff8e35" />
        </g>
      );
    default:
      return null;
  }
}


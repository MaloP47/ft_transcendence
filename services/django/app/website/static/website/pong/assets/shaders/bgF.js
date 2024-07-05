export default `

struct Bonus {
	float on;
	float end;
	float time;
};

struct AllBonus {
	Bonus big;
	Bonus small;
	Bonus line;
	Bonus frozen;
	Bonus reversed;
};

struct Infos {
	vec2 p1Pos;
	vec2 p2Pos;
	float time;
	AllBonus p1Bonus;
	AllBonus p2Bonus;
};

uniform Infos uInfos;
varying vec3 vPosition;
varying vec2 vUv;

vec3 sidesColor() {
	float vSides = 1.0;
	vSides *= abs(vPosition.x / 7.1);
	vSides = clamp(vSides, 0.0, 1.0);
	vSides = pow(vSides, 40.0);
	float tSide = 1.0;
	tSide *= vPosition.y / 10.3;
	tSide = clamp(tSide, 0.0, 1.0);
	tSide = pow(tSide, 40.0);
	float bSide = 1.0;
	bSide *= vPosition.y / -10.3;
	bSide = clamp(bSide, 0.0, 1.0);
	bSide = pow(bSide, 40.0);
	return (vec3(1.0, 2.0, 3.0) * vSides + vec3(1.5, 2.0, 1.0) * tSide + vec3(2.0, 1.2, 1.0) * bSide);
}

float fadeBg() {
	float bSideBg = 1.0;
	bSideBg *= vPosition.y / -10.6;
	bSideBg = clamp(bSideBg, 0.0, 1.0);
	bSideBg = 1.0 - pow(bSideBg, 40.0);
	float tSideBg = 1.0;
	tSideBg *= vPosition.y / 10.6;
	tSideBg = clamp(tSideBg, 0.0, 1.0);
	tSideBg = 1.0 - pow(tSideBg, 40.0);
	float vSidesBg = 1.0;
	vSidesBg *= abs(vPosition.x / 7.3);
	vSidesBg = clamp(vSidesBg, 0.0, 1.0);
	vSidesBg = 1.0 - pow(vSidesBg, 40.0);
	return (bSideBg * tSideBg * vSidesBg);
}

float random (vec2 p) {
	return fract(sin(dot(p.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float noise (vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	float a = random(i);
	float b = random(i + vec2(1.0, 0.0));
	float c = random(i + vec2(0.0, 1.0));
	float d = random(i + vec2(1.0, 1.0));
	vec2 u = f*f*(3.0-2.0*f);
	return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

vec3 frozen (vec2 noiseFrost) {
	float bSide = 1.0;
	bSide *= noiseFrost.y / -10.3;
	bSide = clamp(bSide, 0.0, 1.0);
	bSide = pow(bSide, 6.0);
	float bSideH = 1.0;
	bSideH *= noiseFrost.y / -10.3;
	bSideH = clamp(bSideH, 0.0, 1.0);
	bSideH = pow(bSideH, 20.0);
	vec3 bFrozen = vec3(0.2, 0.8, 1.2) * clamp(bSide - bSideH, 0.0, 1.0);

	float tSide = 1.0;
	tSide *= noiseFrost.y / 10.3;
	tSide = clamp(tSide, 0.0, 1.0);
	tSide = pow(tSide, 6.0);
	float tSideH = 1.0;
	tSideH *= noiseFrost.y / 10.3;
	tSideH = clamp(tSideH, 0.0, 1.0);
	tSideH = pow(tSideH, 20.0);
	vec3 tFrozen = vec3(0.2, 0.8, 1.2) * clamp(tSide - tSideH, 0.0, 1.0);
	return (bFrozen * uInfos.p1Bonus.frozen.time + tFrozen * uInfos.p2Bonus.frozen.time);
}

void main() {
	vec2 p = vPosition.xy;

	// Dashed line
	float line = 1.0 - step(0.05, length(p.y));
	float dash = step(length(fract(p.x + 0.35)), 0.7);
	float dashedLine = clamp(line - dash, 0.0, 1.0);

	// Noised pos
	vec2 nP = p + noise(p + uInfos.time / 200.0) / 10.0;

	gl_FragColor = vec4((sidesColor() * 0.2 + dashedLine + frozen(nP)) * fadeBg() + vec3(25.0 / 255.0, 30.0 / 255.0, 47.0 / 255.0) * (1.0 - fadeBg()), 1.0);
}`;

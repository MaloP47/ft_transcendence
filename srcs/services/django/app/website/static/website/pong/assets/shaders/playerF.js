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

vec3 palette(float t) {
	vec3 a = vec3(0.5, 0.5, 0.5);
	vec3 b = vec3(0.5, 0.5, 0.5);
	vec3 c = vec3(1.0, 1.0, 1.0);
	vec3 d = vec3(0.263, 0.416, 0.557);
	return (a + b * cos(6.28318 * (c * t + d)));
}

vec3 sidesColor(vec2 pos) {
	float vSides = 1.0;
	vSides *= abs((pos.x - 0.07) / 7.1);
	vSides = clamp(vSides, 0.0, 1.0);
	vSides = pow(vSides, 60.0);
	float tSide = 1.0;
	tSide *= (pos.y - 0.07) / 10.3;
	tSide = clamp(tSide, 0.0, 1.0);
	tSide = pow(tSide, 60.0);
	float bSide = 1.0;
	bSide *= pos.y / -10.3;
	bSide = clamp(bSide, 0.0, 1.0);
	bSide = pow(bSide, 60.0);
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

float sdBox(vec2 p, vec2 b) {
	vec2 d = abs(p) - b;
	return (length(max(d, 0.0)) + min(max(d.x, d.y), 0.0));
}

float ndot(vec2 a, vec2 b ) {
	return (a.x*b.x - a.y*b.y);
}

float sdRhombus(vec2 p, vec2 b) 
{
	p = abs(p);
	float h = clamp(ndot(b - 2.0 * p, b) / dot(b, b), -1.0, 1.0 );
	float d = length(p - 0.5 * b * vec2(1.0 - h, 1.0 + h));
	return (d * sign(p.x * b.y + p.y * b.x - b.x * b.y));
}

vec3 bgPlayer(vec2 p) {
	vec3 bgColor = vec3(0.0);
	vec2 p0;
	vec2 p1;
	vec2 pR;

	p0.x = cos(uInfos.time / 5000.0) * p.x - sin(uInfos.time / 5000.0) * p.y;
	p0.y = sin(uInfos.time / 5000.0) * p.x + cos(uInfos.time / 5000.0) * p.y;
	for (float i = 0.0; i < 7.0; i++) {
		vec3 col = palette(length(p0) / 5.0 + i * 1.3 + uInfos.time / 700.0);
		p1 = fract(p0 / (0.14 + i * 1.3)) - 0.5;
		pR.x = cos(uInfos.time / 2000.0 + i) * p1.x - sin(uInfos.time / 2000.0 + i) * p1.y;
		pR.y = sin(uInfos.time / 2000.0 + i) * p1.x + cos(uInfos.time / 2000.0 + i) * p1.y;
		float rhombus = abs(sdRhombus(pR * 3.0, vec2((sin(uInfos.time / 200.0) + 2.0) / 2.0, (cos(uInfos.time / 300.0) + 2.0) / 2.0))) - 0.1;
		rhombus = smoothstep(rhombus, 0.0, 0.01 + i * 0.07);
		rhombus = pow(1.0 - rhombus, 50.0);
		float d = rhombus * exp(rhombus / 30.0);
		bgColor += (d * (i / 10.0))  * col;
	}

	return (bgColor);
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

vec3 playerShape(vec2 pPos, AllBonus bonuses, vec3 pBg, vec3 clr, float offset) {
	pPos = pPos - vPosition.xy;
	pPos.y += offset;
	if (bonuses.reversed.on == 1.0)
		clr = clr + vec3(0.0, 0.0, 1.0) * (bonuses.reversed.time);
	float p = smoothstep(clamp(sdBox(pPos, vec2(0.9 + bonuses.big.time - bonuses.small.time / 2.0, 0.1)), 0.0, 1.0), 0.0, 0.1);
	p = pow(0.9 - p, 1.3);
	p -= 0.05;
	p = clamp(p, 0.0, 1.0);
	vec3 pFull = pBg * vec3(p) + vec3(p) * clr;
	return (pFull);
}

vec3 bonusLine(vec2 p, vec2 nP, vec2 offset, vec3 clr, AllBonus bonus) {
	vec2 nPp = nP + offset;
	float lineCenter = (pow(1.0 - smoothstep(0.0, 0.1, length(nPp.y)), 10.0));
	float lineCenterSmooth = (pow(1.0 - smoothstep(0.0, 0.3, length(nPp.y)), 5.0)) * 0.25;
	vec3 line = (lineCenter + lineCenterSmooth) * clr * bonus.line.on;
	line *= clamp(1.0 - length(p.x) / bonus.line.time, 0.0, 1.0);
	return (line);
}

void main() {
	vec2 p = vPosition.xy;

	// Players
	vec3 pBg = bgPlayer(p);
	vec3 p1Full = playerShape(uInfos.p1Pos, uInfos.p1Bonus, pBg, vec3(1.0, 0.2, 0.2), -0.15);
	vec3 p2Full = playerShape(uInfos.p2Pos, uInfos.p2Bonus, pBg, vec3(0.2, 1.0, 0.2), 0.15);

	// Noised pos
	vec2 nP = p + noise(p + uInfos.time / 200.0) / 10.0;
	vec2 nP2 = nP + noise(nP * 10.0 + uInfos.time / 50.0) / 30.0;
	vec2 nP3 = nP + noise(nP * 3.0 + uInfos.time / 300.0) / 20.0;

	// Line bonus
	vec3 lineP1 = bonusLine(p, nP2, vec2(0.0, 8.5), vec3(3.0, 1.5, 1.0), uInfos.p1Bonus);
	vec3 lineP2 = bonusLine(p, nP2, vec2(0.0, -8.5), vec3(1.5, 3.0, 1.0), uInfos.p2Bonus);

	gl_FragColor = vec4((sidesColor(nP3) + p1Full + p2Full + lineP1 + lineP2) * fadeBg(), 1.0);
}`;

export default `

varying vec2 vUv;
varying vec2 vPosition;
uniform float uTime;
uniform float uType;

vec3 palette(float t) {
	vec3 a = vec3(0.358, 1.078, 1.258);
	vec3 b = vec3(1.041, 0.737, -1.151);
	vec3 c = vec3(1.152, 0.740, 0.369);
	vec3 d = vec3(-0.043, 0.317, 0.087);
	return (a + b * cos(6.28318 * (c * t + d)));
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


void main() {
	vec2 cUv = vUv - 0.5;
	vec2 nUv = cUv + noise(cUv * 20.0 + uTime / 200.0) / 100.0;
	vec2 iUv = cUv + noise(cUv * 20.0 + uTime / 300.0) / 50.0;
	vec3 circles = vec3(0.0);
	for (float i = 0.0; i < 16.0; i++) {
		float cIn = 1.0 - smoothstep(fract(-uTime / 4000.0 + i / 9.0), fract(-uTime / 4000.0 + 0.025 + i / 9.0), length(nUv));
		float cExt = 1.0 - smoothstep(fract(-uTime / 4000.0 + 0.025 + i / 9.0), fract(-uTime / 4000.0 + 0.05 + i / 9.0), length(nUv));
		circles += palette(uTime / 1000.0 + i * 0.3) * pow(clamp(cExt - cIn, 0.0, 1.0), 2.0);
	}
	circles = clamp(circles, 0.0, 1.0) * pow(1.0 - smoothstep(0.0, 0.5, length(cUv)), 2.0);
	float item = clamp(1.0 - smoothstep(0.09, 0.1, length(iUv)), 0.0, 1.0);
	float itemSmooth = pow(1.0 - clamp(1.0 - smoothstep(0.00, 0.1, length(iUv)), 0.0, 1.0), 2.0) * item;
	circles -= item;
	circles = clamp(circles, 0.0, 1.0);
	vec3 itemClr = vec3(0.0, 0.7, 0.2);
	if (uType == 1.0)
		itemClr = vec3(1.5, 0.0, 0.0);
	else if (uType == 2.0)
		itemClr = vec3(1.0, 0.5, 0.0);
	else if (uType == 3.0)
		itemClr = vec3(0.0, 0.5, 1.5);
	else if (uType == 4.0)
		itemClr = vec3(1.5, 0.5, 1.0);
	gl_FragColor = vec4(vec3(circles) + item * itemClr + itemSmooth, 1.0);

}`;

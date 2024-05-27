export default `

varying float vAge;
uniform float uTime;

vec3 palette(float t) {
	vec3 a = vec3(1.058, 0.628, 0.848);
	vec3 b = vec3(-0.541, 0.011, -0.909);
	vec3 c = vec3(-1.772, 0.618, 0.868);
	vec3 d = vec3(-0.353, -0.323, 0.897);
	return (a + b * cos(6.28318 * (c * t + d)));
}

float sdEquilateralTriangle(vec2 p, float r)
{
    const float k = sqrt(3.0);
    p.x = abs(p.x) - r;
    p.y = p.y + r / k;
    if (p.x + k * p.y > 0.0)
		p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
    p.x -= clamp(p.x, -2.0 * r, 0.0);
    return (-length(p) * sign(p.y));
}

void main() {
	vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y) - 0.5;
	vec2 rot;
	rot.x = cos(-(uTime / 1000.0 + vAge * -5.0)) * uv.x - sin(-(uTime / 1000.0 + vAge * -5.0)) * uv.y;
	rot.y = sin(-(uTime / 1000.0 + vAge * -5.0)) * uv.x + cos(-(uTime / 1000.0 + vAge * -5.0)) * uv.y;
	float d = sdEquilateralTriangle(rot, 0.3) - 0.04;
	float i = 1.0 - smoothstep(0.0, 0.03, d);
	float o = 1.0 - smoothstep(0.0, 0.04, d + 0.05);
	gl_FragColor = vec4(palette(uTime / 2000.0 + vAge / 2.0) * (i - o), 1.0 - vAge);
}`;

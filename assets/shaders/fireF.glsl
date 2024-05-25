export default `

varying float vAge;

vec3 palette(float t) {
	vec3 a = vec3(0.358, 1.078, 1.258);
	vec3 b = vec3(1.041, 0.737, -1.151);
	vec3 c = vec3(1.152, 0.740, 0.369);
	vec3 d = vec3(-0.043, 0.317, 0.087);
	return (a + b * cos(6.28318 * (c * t + d)));
}

void main() {
	vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
	float d = 1.0 - smoothstep(length(uv - 0.5), 0.0, 0.1);
	d = pow(d, 2.0) * (0.5 + vAge / 2.0);
	d = clamp(d, 0.0, 0.2);
	gl_FragColor = vec4(palette(vAge), d);
}`;

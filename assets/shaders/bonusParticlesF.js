export default `

varying float vAge;
uniform vec3 uCenter;
varying vec3 vPosition;
uniform float uType;

vec3 palette(float t) {
	vec3 a = vec3(0.0, 0.5, 0.5);
	vec3 b = vec3(0.0, 0.5, 0.5);
	vec3 c = vec3(0.0, 0.5, 0.333);
	vec3 d = vec3(0.0, 0.5, 0.667);
	return (a + b * cos(6.28318 * (c * t + d)));
}
void main() {
	vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y) - 0.5;
	float d = smoothstep(0.5, 0.75, 1.0 - length(vPosition.xy - uCenter.xy) / 5.0);
	d = clamp(d, 0.0, 1.0);
	vec3 itemClr = vec3(0.0, 0.7, 0.2);
	if (uType == 1.0)
		itemClr = vec3(1.5, 0.0, 0.0);
	else if (uType == 2.0)
		itemClr = vec3(1.0, 0.5, 0.0);
	else if (uType == 3.0)
		itemClr = vec3(0.0, 0.5, 1.5);
	else if (uType == 4.0)
		itemClr = vec3(1.5, 0.5, 1.0);
	gl_FragColor = vec4(itemClr * (1.0 - smoothstep(0.1, 0.2, length(uv))), d * (vAge * 2.0));
}`;

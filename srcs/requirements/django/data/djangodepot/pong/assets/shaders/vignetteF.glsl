export default `

uniform sampler2D tDiffuse;
uniform float lines;
uniform float time;
uniform float amount;

varying vec2 vUv;

void main() {
	vec3 vignette = vec3(1.0 - smoothstep(0.4, 0.8, length(vUv - 0.5)));
	vec3 lineMult = vec3(step(fract((vUv.y + time / 50000.0) * lines), 0.5));
	gl_FragColor = vec4(texture2D(tDiffuse, vUv).rgb * vignette * clamp(lineMult, 0.9, 1.0) * amount + (1.0 - amount) * texture2D(tDiffuse, vUv).rgb, 1.0);
}`;

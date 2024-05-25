export default `

uniform sampler2D tDiffuse;
uniform float amount;

varying vec2 vUv;

void main() {
	gl_FragColor = vec4(clamp(texture2D(tDiffuse, vUv).rgb, 0.0, 1.0) * amount, 1.0);
}`;

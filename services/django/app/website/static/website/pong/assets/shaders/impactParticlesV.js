export default `

attribute float size;
attribute float age;

varying float vAge;
varying vec3 vPosition;

void main() {
	vAge = age;
	vPosition = position;
	gl_PointSize = size;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;

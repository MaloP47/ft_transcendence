export default `

attribute float size;
attribute float age;

varying float vAge;

void main() {
	vAge = age;
	gl_PointSize = size;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;

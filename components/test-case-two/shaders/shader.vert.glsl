precision highp float;

    attribute vec4 position;
    attribute vec3 normal;
    
    uniform mat4 uMVPMatrix;
    
    varying vec3 vNormal;
    
    void main() {
        gl_Position = uMVPMatrix * position;
        vNormal = normal;
    }
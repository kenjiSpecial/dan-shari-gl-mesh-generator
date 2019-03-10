import {
        bindBuffer,
        createBufferWithLocation,
        createIndex,
        createProgram,
        getSphere,
        getUniformLocations,
        Camera
    } from 'dan-shari-gl';
    
    import { mat4 } from 'gl-matrix';
    
    import fragmentShaderSrc from './shaders/shader.frag.glsl';
    import vertexShaderSrc from './shaders/shader.vert.glsl';
    
    export class TestCaseTwo {
        private gl: WebGLRenderingContext;
        private program: WebGLProgram;
        private buffers: {
            position: { buffer: WebGLBuffer; location: number };
            normal: { buffer: WebGLBuffer; location: number };
            index: { buffer: WebGLBuffer; cnt: number };
        };
        private uniforms: { uMVPMatrix: WebGLUniformLocation };
        private matrix: { model: mat4; mv: mat4; mvp: mat4 };
    
        constructor(gl: WebGLRenderingContext) {
            this.gl = gl;
            this.program = createProgram(gl, vertexShaderSrc, fragmentShaderSrc);
            const { vertices, normals, indices } = getSphere(5, 32, 32);
    
            this.buffers = {
                position: createBufferWithLocation(
                    gl,
                    this.program,
                    new Float32Array(vertices),
                    'position'
                ),
                normal: createBufferWithLocation(gl, this.program, new Float32Array(normals), 'normal'),
                index: createIndex(gl, new Uint16Array(indices))
            };
    
            this.matrix = {
                model: mat4.create(),
                mv: mat4.create(),
                mvp: mat4.create()
            };
    
            this.uniforms = getUniformLocations(gl, this.program, ['uMVPMatrix']) as {
                uMVPMatrix: WebGLUniformLocation;
            };
        }
    
        public update(camera: Camera) {
            const { model, mv, mvp } = this.matrix;
            mat4.multiply(mv, camera.viewMatrix, model);
            mat4.multiply(mvp, camera.projectionMatrix, mv);
        }
    
        public render(camera: Camera) {
            const { position, normal, index } = this.buffers;
            const { uMVPMatrix } = this.uniforms;
            const { mvp } = this.matrix;
    
            this.gl.useProgram(this.program);
            bindBuffer(this.gl, position.buffer, position.location, 3);
            bindBuffer(this.gl, normal.buffer, normal.location, 3);
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, index.buffer);
            this.gl.uniformMatrix4fv(uMVPMatrix, false, mvp);
    
            this.gl.drawElements(this.gl.TRIANGLES, index.cnt, this.gl.UNSIGNED_SHORT, 0);
        }
    }
    
#!/usr/bin/env node

const fs = require('fs');
const chalk = require('chalk');
const inquirer = require('inquirer');

const currentPath = process.cwd();
console.log(currentPath);

function init() {
	console.log(`${chalk.red('WARN')}: mesh name example: tomato-sauce`);
}

function askQuestions() {
	const questions = [
		{
			name: 'MESHNAME',
			type: 'input',
			message: 'What is the name of the mesh name?'
		}
	];
	return inquirer.prompt(questions);
}
function createDirectory(meshName) {
	const componentUrl = `${currentPath}/src/components`;
	const isStatus0 = fs.existsSync(componentUrl);

	if (!isStatus0) {
		fs.mkdirSync(componentUrl);
	} else {
		console.log(`${chalk.bgGreen('components directory is there')}`);
	}

	const meshDirectory = `${componentUrl}/${meshName}`;
	const isStatus1 = fs.existsSync(meshDirectory);

	if (!isStatus1) {
		fs.mkdirSync(meshDirectory);
	} else {
		console.log(`${chalk.bgGreen('mesh directory is there')}`);
	}

	return meshDirectory;
}

async function run() {
	init();

	const answers = await askQuestions();
	const MESHNAME = answers.MESHNAME;

	const meshDirectory = await createDirectory(MESHNAME);
	let fileName = '';
	const words = MESHNAME.split('-'); //.join()
	for (let ii = 0; ii < words.length; ii++) {
		const word = words[ii];
		fileName += word.charAt(0).toUpperCase() + word.slice(1);
	}
	// console.log(text);

	const fileDirectory = `${meshDirectory}/${fileName}.ts`;

	const contents = createTs(fileName);
	fs.writeFileSync(fileDirectory, contents, 'utf8');

	const shaderDirectory = `${meshDirectory}/shaders`;
	const isShaderStatus = fs.existsSync(shaderDirectory);

	if (!isShaderStatus) {
		fs.mkdirSync(shaderDirectory);
	} else {
		console.log(`${chalk.bgGreen('shaders directory is there')}`);
	}

	const fragContents = createFrag();
    fs.writeFileSync(`${shaderDirectory}/shader.frag.glsl`, fragContents, 'utf8');
    
    const vertContents = createVert();
    fs.writeFileSync(`${shaderDirectory}/shader.vert.glsl`, vertContents, 'utf8');

	// console.log(MESHNAME);
	console.log(
		`${chalk.bgRed('DONE')}: ${chalk.red(MESHNAME)} has been created at ${chalk.red(
			meshDirectory
		)}`
	);
}

run();

function createFrag() {
    return `precision highp float;

varying vec3 vNormal;
void main(){
    gl_FragColor = vec4(vNormal, 1.0);
}`
}

function createVert() {
    return `precision highp float;

attribute vec4 position;
attribute vec3 normal;

uniform mat4 uMVPMatrix;

varying vec3 vNormal;

void main() {
    gl_Position = uMVPMatrix * position;
    vNormal = normal;
}`
}

function createTs(className) {
	return `import {
    bindBuffer,
    Camera,
    createBufferWithLocation,
    createIndex,
    createProgram,
    getSphere,
    getUniformLocations
} from 'dan-shari-gl';

import { mat4 } from 'gl-matrix';

import fragmentShaderSrc from './shaders/shader.frag.glsl';
import vertexShaderSrc from './shaders/shader.vert.glsl';

export class ${className} {
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
}`;

}

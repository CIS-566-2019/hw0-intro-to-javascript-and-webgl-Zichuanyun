import {vec3} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import Cube from './geometry/Cube';
import {vec4, mat4} from 'gl-matrix';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,
  'Load Scene': loadScene, // A function pointer, essentially
  color: "#ffae23", // CSS string
  shader: 'modified lambert',
};

// geoms
let icosphere: Icosphere;
let icosphere_model_mat = mat4.create();
let square: Square;
let square_model_mat = mat4.create();
let cube: Cube;
let cube_model_mat = mat4.create();
let prevTesselations: number = 5;
let startTime: number = Date.now();

// helpers
let identity_mat = mat4.create();
mat4.identity(identity_mat);
let t_vec3 = vec3.create();

function hexToRgb(hex: string) {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
      r: parseInt(result[1], 16) / 256,
      g: parseInt(result[2], 16) / 256,
      b: parseInt(result[3], 16) / 256
  } : null;
}

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(-1, -1, -1), 1, controls.tesselations);
  icosphere.create();
  square = new Square(vec3.fromValues(1, 1, 1));
  square.create();
  cube = new Cube(vec3.fromValues(1, -1, 1));
  cube.create();
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '20px';
  stats.domElement.style.top = '10px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'tesselations', 0, 8).step(1);
  gui.add(controls, 'Load Scene');
  gui.addColor(controls, 'color');
  gui.add(controls, 'shader', ['lambert', 'modified lambert']);

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }

  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  const lambert_modified = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert-modified.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag-modified.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    if(controls.tesselations != prevTesselations)
    {
      prevTesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevTesselations);
      icosphere.create();
    }
    
    // update model locations
    t_vec3 = vec3.fromValues(
      icosphere.center[0],
      icosphere.center[1],
      icosphere.center[2]);
    mat4.translate(icosphere_model_mat, identity_mat, t_vec3);

    t_vec3 = vec3.fromValues(
      square.center[0],
      square.center[1],
      square.center[2]);
    mat4.translate(square_model_mat, identity_mat, t_vec3);

    t_vec3 = vec3.fromValues(
      cube.center[0],
      cube.center[1],
      cube.center[2]);
    mat4.translate(cube_model_mat, identity_mat, t_vec3);
    
    // get color value from gui
    let color_in = hexToRgb(controls.color);

    // get shader from gui
    let cur_shader: ShaderProgram;
    if (controls.shader == 'lambert') {
      cur_shader = lambert;
    } else if (controls.shader == 'modified lambert') {
      cur_shader = lambert_modified;
    }
    let time_helper = Date.now() - startTime;
    renderer.render(camera, cur_shader,
      [icosphere, square, cube], [icosphere_model_mat, square_model_mat,
        cube_model_mat],
    vec4.fromValues(color_in.r, color_in.g, color_in.b, 1),
    time_helper / 1000);
    console.log(time_helper / 1000);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();

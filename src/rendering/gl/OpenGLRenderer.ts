import {mat4, vec4} from 'gl-matrix';
import Drawable from './Drawable';
import Camera from '../../Camera';
import {gl} from '../../globals';
import ShaderProgram from './ShaderProgram';

// In this file, `gl` is accessible because it is imported above
class OpenGLRenderer {
  constructor(public canvas: HTMLCanvasElement) {
  }

  setClearColor(r: number, g: number, b: number, a: number) {
    gl.clearColor(r, g, b, a);
  }

  setSize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  clear() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  render(camera: Camera, prog: ShaderProgram, drawables: Array<Drawable>,
    modelMats: Array<mat4>, color: vec4) {
    
    let viewProj = mat4.create();

    mat4.multiply(viewProj, camera.projectionMatrix, camera.viewMatrix);
    prog.setViewProjMatrix(viewProj);
    prog.setGeometryColor(color);

    let i = 0;
    for (i = 0; i < drawables.length; ++i) {
      let drawable = drawables[i];
      let model = modelMats[i];
      prog.setModelMatrix(model);
      prog.draw(drawable);
    }
    
    /*
    for (let drawable of drawables) {
      let model = mat4.create();
      mat4.identity(model);
      prog.setModelMatrix(model);
      prog.draw(drawable);
    }
    */
  }
};

export default OpenGLRenderer;

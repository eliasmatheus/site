/**
 * WebGL drawn by the CPU (no GPU, or a blocked one). Building a heavy scene there stalls the
 * page for seconds, scroll included, so scenes show a still picture instead.
 */
export const softwareGl = (): boolean => {
  const gl = document.createElement('canvas').getContext('webgl');
  if (!gl) return false;
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /swiftshader|llvmpipe|softpipe|software/i.test(name);
};

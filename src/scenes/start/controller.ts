/**
 * Start controller. The code loads when the camera gets near, but the painting, the traveller
 * and the WebGL setup wait until the layer is on screen and the page has settled: setting it
 * up stalls the main thread for a moment, and a machine that draws WebGL on the CPU without
 * saying so (WebKit on Linux) would freeze the scroll and the next scene while it does. The
 * render loop runs only while the layer is visible. Start the journey and he walks out, the
 * screen goes dark and the journey jumps to Saturn (the Horizon scene). Without WebGL, or with
 * one drawn by the CPU, the painted plate stands still behind the words.
 */
import type { SceneController } from '../registry';
import type { StartScreen } from '../../start/main';
import { softwareGl } from '../software-gl';

/** How long the layer waits on screen before it builds the painting (ms). */
const SETTLE = 1200;

const startScene: SceneController = ({ el }) => {
  let screen: StartScreen | null = null;
  let module: Promise<typeof import('../../start/main')> | null = null;
  let mounted = false;
  let visible = false;
  let timer = 0;
  const toHorizon = (): void => {
    window.location.hash = 'horizon';
  };
  const mount = (): void => {
    if (mounted || !visible || !module) return;
    mounted = true;
    if (softwareGl()) {
      el.setAttribute('data-still', '');
      return;
    }
    void module.then(({ mountStart }) => {
      screen = mountStart(el, toHorizon);
      if (!screen) el.setAttribute('data-still', '');
      else if (!visible) screen.hide();
    });
  };
  return {
    onNear() {
      module ??= import('../../start/main');
    },
    onShow() {
      visible = true;
      if (screen) screen.show();
      else if (!mounted) {
        clearTimeout(timer);
        timer = window.setTimeout(mount, SETTLE);
      }
    },
    onHide() {
      visible = false;
      clearTimeout(timer);
      screen?.hide();
    },
  };
};

export default startScene;

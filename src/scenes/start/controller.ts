/**
 * Start controller. The painting, the traveller and three.js load when the camera gets near;
 * the render loop runs only while the layer is visible. Start the journey and he walks out,
 * the screen goes dark and the journey jumps to Saturn (the Horizon scene). Without WebGL, or
 * with one drawn by the CPU, the painted plate stands still behind the words.
 */
import type { SceneController } from '../registry';
import type { StartScreen } from '../../start/main';
import { softwareGl } from '../software-gl';

const startScene: SceneController = ({ el }) => {
  let screen: StartScreen | null = null;
  let loading = false;
  let visible = false;
  const toHorizon = (): void => {
    window.location.hash = 'horizon';
  };
  return {
    onNear() {
      if (loading) return;
      loading = true;
      if (softwareGl()) {
        el.setAttribute('data-still', '');
        return;
      }
      void import('../../start/main').then(({ mountStart }) => {
        screen = mountStart(el, toHorizon);
        if (!screen) el.setAttribute('data-still', '');
        if (!visible) screen?.hide();
      });
    },
    onShow() {
      visible = true;
      screen?.show();
    },
    onHide() {
      visible = false;
      screen?.hide();
    },
  };
};

export default startScene;

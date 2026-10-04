import * as Tone from "tone";
import { createScore } from "@client-audio/score";
import { THEMES } from "@client-audio/themes";
import {
  DEFAULT_MUSIC_VOLUME, MASTER_VOLUME_DB, MUSIC_OUTPUT_GAIN, SCORE_VOLUME,
} from "@client-audio/levels";

export function createMusic(context: AudioContext) {
  Tone.setContext(context, true);
  const toneContext = Tone.getContext();
  Tone.getDestination().volume.value = MASTER_VOLUME_DB;
  const volume = DEFAULT_MUSIC_VOLUME * MUSIC_OUTPUT_GAIN;
  const output = new Tone.Gain(0).toDestination();
  const score = createScore(Tone, THEMES.Main, "map", output);
  const transport = Tone.getTransport();
  score.fade(SCORE_VOLUME, 1);

  return {
    play() {
      transport.start();
      output.gain.rampTo(volume, 0.1);
    },
    pause() {
      transport.pause();
      output.gain.rampTo(0, 0.1);
    },
    dispose() {
      transport.stop();
      score.dispose();
      output.dispose();
      toneContext.dispose();
    },
  };
}

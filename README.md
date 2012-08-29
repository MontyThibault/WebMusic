# JavaScript Customizable Audio Playback
This is an experiment with the new [Web Audio API](http://www.html5rocks.com/en/tutorials/webaudio/intro/) for Chrome and Safari. The script can load *basic* sheet music data from an JSON file, parse it, and play it back dynamically in the browser. 

If you like this project, please show support to keep the it moving foreward!

###[Demonstration Page](http://montythibault.github.com/WebMusic/index.html)
__You will need a modern version of Chrome or Safari for this page to work!__

## Engine
Sounds are generated from .wav audio samples, found at [http://freewavesamples.com/](http://freewavesamples.com/). The script chooses the sample that is closest to the desired note, and then changes the playback rate to achieve the correct pitch. Note that this method will cause the given samples to change in duration. 

I am working on an SVG-based editor right now, but until that's done, you have to edit the `music.json` file directly. 

Modifiers can be added to notes to alter their sounds. At the moment, the only implemented modifiers are `staccato`, `dynamic`, and `letRing`. Several examples are located in `music.json`.
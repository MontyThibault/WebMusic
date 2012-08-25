# JavaScript Customizable Audio Playback
This is an experiment with the new [Web Audio API](http://www.html5rocks.com/en/tutorials/webaudio/intro/) for Chrome and Safari. The script can load *basic* sheet music data from an XML file, parse it, and play it back dynamically in the browser. 

The code and presentation for this project is messy, but it shows what Web Audio API is capable of. If you like it, please show motivation to keep the project moving foreward!

###[Demonstration Page](http://montythibault.github.com/music)
__You will need a modern version of Chrome or Safari for this page to work!__

## Engine
Sounds are generated from .wav audio samples, found at [http://freewavesamples.com/](http://freewavesamples.com/). The script chooses the sample that is closest to the desired note, and then changes the playback rate to achieve the correct pitch. Note that this method will cause the given samples to change in duration. 

There will be an SVG-based editor in the future, but you have to edit the example `music.xml` file at the moment.

The following are a few behaviors of the engine. Note that this is in very early stage in development and that the given behaviors may be neither a good idea nor will stick around in the future.

- The sounds of any previous notes will be cut off when a new note is played.
- In XML, the duration of the notes refer to the number of said notes that you can fit in a 4/4 bar. For example, 4 is a quarter note, 8 is an eighth note, 16 is a sixteenth note, et cetera.
- You can use note durations like `3` and `9` to create triplets.
- You can create chords by setting the note duration to `0`. This will override the default cut-off mechanic.

*Attempting to read the JavaScript may lead to brain tumors, seizures, confusion, and hallucinations. Read at your own risk.*
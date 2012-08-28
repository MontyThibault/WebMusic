# JSBuilder example

import time
time.clock()

# project name (from the root folder)
copyright = 'I love source code!'
max_js = 'max.js'
min_js = 'min.js'

files = [
	'misc/context.js',
	'misc/loaders.js',
	'misc/falloff.js',
	'core/pitch.js',
	'core/note.js',
	'core/instrument.js',
	'display/svg.js',
	'display/point.js',
	'display/panel.js',
	# 'display/vector2.js',
	'modifiers/dynamic.js',
	'modifiers/staccato.js',
	'tests.js',
	'main.js'
]

# execute the task
import JSBuilder
JSBuilder.compile(
    copyright,
    max_js,
    min_js,
    files
)

print('Completed in {0} seconds'.format(time.clock()))
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { noddityRenderer } from '../src/legacy.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const render = noddityRenderer({
	directory: join(__dirname, 'noddity'),
	domain: 'site.com',
})

const out1 = await render.fromString('very [[cool.md|file]] link', 'excellent.md')
console.log('----------- HTML1 -------------')
console.log(out1.html) // => <p>very <a href="https://site.com/#!/post/cool.md">file</a> link</p>

const out2 = await render.loadFile('example-file.md')
console.log('----------- HTML2 -------------')
console.log(out2.html) // => <p>Here is an <a href="picture.png" class="link-no-underline" target="_blank"><img src="picture.png" style="max-width:100%;"></a> and an <a href="https://site.com/#!/post/file.md">internal</a> link.</p>

const out3 = await render.loadFile('old-school.md')
console.log('----------- HTML3 -------------')
console.log(out3.html) // => <p>Notice how there are no triple dashes.\nBut it's still valid.</p>

const out4 = await render.loadPost('post', 'example-file.md')
console.log('----------- HTML4 -------------')
console.log(out4.html) // => <div class="main-wrapper"><h1>An Example</h1> <p>Here is an <a href="picture.png" class="link-no-underline" target="_blank"><img src="picture.png" style="max-width:100%;"></a> and an <a href="https://site.com/#!/post/file.md">internal</a> link.</p></div>

const metadata = await render.loadMetadata('old-school.md')
console.log('----------- METADATA4 -------------')
console.log(metadata) // => { title: 'An Old School Noddity File' }

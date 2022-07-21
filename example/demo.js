import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { createCustomRenderer } from './demo-renderer.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const NODDITY_DIR = join(__dirname, 'noddity')
const DOMAIN = 'site.com'

const render = createCustomRenderer(NODDITY_DIR, DOMAIN)

const out1 = await render.fromString('a [[cool.md|file]] link', 'yolo.md')
console.log('----------- HTML1 -------------')
console.log(out1.html) // => <p>a <a href="https://site.com/#!/post/cool.md">file</a> link</p>

const out2 = await render.fromLoader('example-file.md')
console.log('----------- HTML2 -------------')
console.log(out2.html) // => <p>Here is an <a href="picture.png" class="link-no-underline" target="_blank"><img src="picture.png" style="max-width:100%;"></a> and an <a href="https://site.com/#!/post/file.md">internal</a> link.</p>

const out3 = await render.fromLoader('old-school.md')
console.log('----------- HTML3 -------------')
console.log(out3.html) // => <p>Notice how there are no triple dashes.\nBut it's still valid.</p>

const out4 = await render.loadPost('post', 'example-file.md')
console.log('----------- HTML4 -------------')
console.log(out4.html) // => <div class="main-wrapper"><h1>An Example</h1> <p>Here is an <a href="picture.png" class="link-no-underline" target="_blank"><img src="picture.png" style="max-width:100%;"></a> and an <a href="https://site.com/#!/post/file.md">internal</a> link.</p></div>

const metadata = await render.loadMetadata('old-school.md')
console.log('----------- METADATA4 -------------')
console.log(metadata) // => { title: 'An Old School Noddity File' }

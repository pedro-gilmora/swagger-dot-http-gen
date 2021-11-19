#!/usr/bin/env node

/**
 * dot-http-swagger
 * Create DotHttp client from JSON swagger files
 *
 * @author Pedro Gil Mora <https://github.com/pedro-gilmora>
 */

import init from './utils/init.js';
import cli from './utils/cli.js';
import fs from 'fs';
import log from './utils/log.js';
import { processSwagger } from './engine.js';
import path from 'path';

const __dirname = path.resolve(path.dirname(''))

const input = cli.input;
const flags = cli.flags;
const { clear, debug } = flags;

(async () => {
	init({ clear });
	input.includes(`help`) && cli.showHelp(0);

	let {name = 'HttpClient', outDir = './output', fileName = 'service.ts', listDeprecated = false} = flags,
		url = input.find(e => /^https?:\/\//.test(e));

	if(url){
		const content = await processSwagger({url, name, listDeprecated}),
			folder = path.join(__dirname, outDir);
		if(!fs.existsSync(folder))
			fs.mkdirSync(folder)
		fs.writeFileSync(path.join(folder, fileName), content);
	}

	debug && log(flags);
})();

import welcome from 'cli-welcome';
import unhandled from 'cli-handle-unhandled';
import fs from 'fs';

const {description: _description, version: _version} = JSON.parse(fs.readFileSync('./package.json'))

export default ({ clear = true }) => {
	unhandled();
	welcome({
		title: `dot-http-swagger`,
		tagLine: `by Pedro Gil Mora`,
		description: _description,
		version: _version,
		bgColor: '#36BB09',
		color: '#000000',
		bold: true,
		clear
	});
};

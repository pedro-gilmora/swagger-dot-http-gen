import welcome from 'cli-welcome';
import unhandled from 'cli-handle-unhandled';
import pkg from '../info.cjs';

// const {version, description} = pgk ?? {};

console.log(pkg)
export default ({ clear = true }) => {
	unhandled();
	welcome({
		title: `dot-http-swagger`,
		tagLine: `by Pedro Gil Mora`,
		description: `${pkg.description}`,
		version: `${pkg.version}`,
		bgColor: '#36BB09',
		color: '#000000',
		bold: true,
		clear
	});
};
